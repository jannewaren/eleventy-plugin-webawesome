import type MarkdownIt from 'markdown-it';

// Type-only imports: nothing from markdown-it is bundled at runtime. tsup keeps
// markdown-it external, and the rule operates purely on the `StateBlock`
// instance Eleventy's markdown engine hands it. `StateBlock` isn't reachable as
// a named/namespace import through @types/markdown-it's `export =` re-export, so
// derive it from the public ruler API (the block-rule callback's first param).
type RuleBlock = Parameters<MarkdownIt['block']['ruler']['before']>[2];
type StateBlock = Parameters<RuleBlock>[0];

/**
 * markdown-it block rule that recognises a block-level `<wa-*>` component as a
 * pass-through HTML block, so markdown-it never wraps it in a `<p>`.
 *
 * Why this exists: markdown-it only treats a hard-coded list of tag names as
 * HTML blocks. `wa-*` isn't on it, and the markawesome engine emits the
 * component body right after the opening tag, so markdown-it's "tag alone on a
 * line" rule never fires either. markdown-it therefore wraps each block
 * component in a `<p>`. Because the component body is itself a block `<p>`, the
 * browser's HTML parser auto-closes the outer `<p>` *through* the custom
 * element (custom elements don't terminate "button scope"), ejecting the body
 * out of the component — it renders empty. Preventing the `<p>` (rather than
 * unwrapping it afterwards) is renderer-correct and robust to nesting.
 *
 * The rule is registered `before('html_block')` with
 * `alt: ['paragraph', 'reference', 'blockquote']` so it can interrupt a
 * paragraph (a block component glued to a preceding prose line with no blank
 * line in between would otherwise be absorbed and the bug would return).
 */
export function waBlockRule(
  state: StateBlock,
  startLine: number,
  endLine: number,
  silent: boolean,
): boolean {
  // markdown-it guarantees these line-indexed arrays cover [0, lineMax]; the
  // `!` asserts the always-in-bounds access under `noUncheckedIndexedAccess`.
  const pos = state.bMarks[startLine]! + state.tShift[startLine]!;
  const max = state.eMarks[startLine]!;

  // Guards mirror native html_block.
  // Indented >= 4 spaces → indented code block, not an HTML block.
  if (state.sCount[startLine]! - state.blkIndent >= 4) return false;
  // Raw HTML must be enabled. The plugin turns this on; keep it as a guard.
  if (!state.md.options.html) return false;
  // Must start with '<'.
  if (state.src.charCodeAt(pos) !== 0x3c /* < */) return false;

  // Fire only on an *opening* `<wa-NAME …>` tag. The `(?=[\s/>])` lookahead
  // stops `wa-tab` from matching `wa-tab-group`/`wa-tab-panel`, and
  // `wa-carousel` from `wa-carousel-item`.
  const firstLine = state.src.slice(pos, max);
  const open = /^<(wa-[a-z0-9-]+)(?=[\s/>])/.exec(firstLine);
  if (!open) return false;
  const tag = open[1];

  // Matches an opening, closing, or self-closing tag of *this* name only.
  // `(?=[\s/>])` after the name keeps `wa-tab` from matching `wa-tab-group`.
  // The lazy `[^>]*?` lets a trailing `/` fall into group 2 so self-closing
  // tags (`<wa-icon …/>`) are detected and counted as net-zero. Counting only
  // the same tag name means void `<img>` and child components like
  // `<wa-carousel-item>` never mis-balance the depth.
  const tagRe = new RegExp(`<(/?)${tag}(?=[\\s/>])[^>]*?(/?)>`, 'g');

  let depth = 0;
  let closeLine = -1;
  let trailing = '';

  for (let line = startLine; line < endLine; line++) {
    const lineStart = line === startLine ? pos : state.bMarks[line]!;
    const lineText = state.src.slice(lineStart, state.eMarks[line]!);
    tagRe.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = tagRe.exec(lineText)) !== null) {
      if (m[1] === '/') {
        depth--; // closing tag
      } else if (m[2] === '/') {
        // self-closing tag: opens and closes at once, net zero
      } else {
        depth++; // opening tag
      }
      if (depth === 0) {
        // Found the close that balances the opening. Remember what follows it
        // on this line, so the first-line inline bail below can inspect it.
        trailing = lineText.slice(m.index + m[0].length);
        closeLine = line;
        break;
      }
    }
    if (closeLine !== -1) break;
  }

  // Never closed / malformed → defer to the native rules (graceful).
  if (closeLine === -1) return false;

  // Inline bail: the element re-balanced on its *first* line and there is
  // non-whitespace content after its close. That's an inline component spliced
  // into prose (e.g. `<wa-icon …></wa-icon> This is **important**.`), which
  // must stay a paragraph so the surrounding markdown still renders.
  if (closeLine === startLine && /\S/.test(trailing)) return false;

  // It's a block component. In silent mode (interrupt probe) just report that
  // we can take this line; don't emit a token or advance.
  if (silent) return true;

  const nextLine = closeLine + 1;
  const token = state.push('html_block', '', 0);
  token.map = [startLine, nextLine];
  token.content = state.getLines(startLine, nextLine, state.blkIndent, true);
  state.line = nextLine;
  return true;
}

// Instances already amended this run. Guards against double-registration when
// Eleventy stacks `amendLibrary` callbacks or `addPlugin` runs more than once
// on the same markdown-it instance.
const amended = new WeakSet<MarkdownIt>();

/**
 * Install the wa-block rule on a markdown-it instance and enable raw HTML
 * (`html: true`) — the plugin is non-functional without it (the `<wa-*>` tags
 * get escaped and the rule no-ops). Idempotent per instance.
 */
export function waBlocks(md: MarkdownIt): void {
  if (amended.has(md)) return;
  amended.add(md);
  md.set({ html: true });
  md.block.ruler.before('html_block', 'wa_block', waBlockRule, {
    alt: ['paragraph', 'reference', 'blockquote'],
  });
}
