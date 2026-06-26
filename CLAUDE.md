# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A thin Eleventy 3.x plugin that registers a **preprocessor** named `markawesome` plus a markdown-it **block rule** for `<wa-*>` components. The actual Markdown→Web-Awesome transformation happens in the external [`markawesome-js`](https://www.npmjs.com/package/markawesome-js) engine — this package is just the glue that wires that engine into Eleventy's build. Two source files: `src/index.ts` (the plugin) and `src/wa-block-rule.ts` (the block rule). Almost all *syntax* changes belong in `markawesome-js`, not here; the block rule is a markdown-it integration detail specific to Eleventy.

It is the Node counterpart to the Ruby `markawesome` + `jekyll-webawesome` pair (the README has a Jekyll→11ty migration table).

## The markawesome ecosystem — keep the syntax in sync

The Markawesome-flavoured Markdown syntax spans **five repositories that must
stay in lockstep**:

| Repo | Role | Stack | Registry |
|------|------|-------|----------|
| `markawesome` | **Authors** the syntax (engine) | Ruby | RubyGems |
| `markawesome-js` | **Authors** the syntax (engine) | TypeScript / Node | npm |
| `jekyll-webawesome` | **Uses** it (Jekyll integration) | Ruby | RubyGems |
| `eleventy-plugin-webawesome` | **Uses** it (Eleventy integration) | Node | npm |
| `markawesome-vscode` | **Produces** it (snippets/completions/validation) | TypeScript | VS Code Marketplace |

**This repo's role:** **uses** the syntax — it consumes the `markawesome-js` engine
and defines no syntax of its own. Syntax changes belong in the engines, not here.

**Sync rule:** any change to the Markawesome Markdown syntax must land in **both
engines** (`markawesome` *and* `markawesome-js`) so the Ruby and Node worlds accept
identical input, **and** in `markawesome-vscode` so the editor emits it. The VS Code
extension is shared across both worlds, so it may only produce syntax that **both**
engines support. Confirm the engines still agree via `markawesome-js`'s
`test/parity-corpus.test.ts` plus the Ruby specs in `markawesome/spec/`.

## Commands

```bash
npm run build        # tsup → dist/ (dual ESM + CJS + .d.ts)
npm run dev          # tsup --watch
npm run typecheck    # tsc --noEmit
npm test             # vitest run (integration tests)
npm run test:watch   # vitest
npm run lint         # eslint .
npm run format       # prettier --write .
npm run check        # typecheck + lint + test + build (also runs on prepublish)
```

Run a single test by name: `npx vitest run -t "respects shouldTransform opt-out"`.

The example site (`examples/`) consumes the plugin via `file:..`, so build the root package first, then `cd examples && npm install && npx @11ty/eleventy --serve`.

## Architecture

`webawesome(eleventyConfig, options)` (the default export in `src/index.ts`) does three things at registration time:

1. If `calloutIcons` is set, calls the engine's `configure()` **once, globally**. This is process-global last-write-wins state in `markawesome-js`, not per-file — registering the plugin twice with different icons will clobber.
2. Normalizes the `imageDialog` option (`true | { defaultWidth }`) into the engine's `ProcessOptions` via `normalizeImageDialog`.
3. Registers one preprocessor that calls `process(content, processOptions)` from `markawesome-js` on each matching file.
4. Calls `eleventyConfig.amendLibrary('md', …)` to run `waBlocks(md)`, which enables raw HTML (`html: true`) and registers the `wa_block` block rule.

### The wa-block rule (`src/wa-block-rule.ts`)

markdown-it only treats a hard-coded list of tag names as HTML blocks; `wa-*` isn't on it, and the engine emits component content right after the opening tag, so markdown-it's "tag alone on a line" rule never fires either. markdown-it therefore wraps each block component in a `<p>`. Because the body is itself a block `<p>`, the browser's HTML parser auto-closes the outer `<p>` *through* the custom element (custom elements don't terminate "button scope"), **ejecting the body out of the component** — it renders empty. `waBlockRule` is registered `before('html_block')` with `alt: ['paragraph', 'reference', 'blockquote']` (mandatory — without it a block glued to a preceding prose line is absorbed and the bug returns). It fires on an opening `<wa-NAME …>` tag, consumes the whole component by counting the balance of that **same tag name only** (so nested children like `<wa-carousel-item>` and void `<img>` don't mis-balance), and emits one pass-through `html_block` token. It bails (stays a paragraph) when the element re-balances on its first line with non-whitespace after the close — an inline component spliced into prose. This is an Eleventy-only markdown-it concern; it is **not** a syntax change and needs no mirroring to the other repos. markdown-it is a **type-only** import (kept external; the rule runs on the instance Eleventy provides).

**Nested components (fixed at the engine):** a *block* component nested inside another container's item body (e.g. a callout inside a `//////` accordion item) used to render empty under Eleventy because `process()` itself emitted a `<p>` around the nested component — markawesome-js's internal markdown-it wrapped it, whereas the Ruby engine's internal Kramdown did not. That `<p>` is inside the pass-through block this rule hands to markdown-it verbatim, so this rule (correctly) doesn't touch it — post-hoc `<p>`-unwrapping was rejected as fragile. The real fix lives in **markawesome-js** (`src/wa-block-rule.ts`), which now applies the same rule to its *internal* renderer so nested components are byte-identical to Ruby. With a current engine, top-level *and* nested block components match Jekyll exactly (verified against the live `:8080` vs `:4000` examples sites).

### Critical invariant: never return `false` from the preprocessor

Eleventy treats a `false` return from a preprocessor as "**exclude this file from the build**". The `shouldTransform` opt-out path therefore returns `undefined` (leave content unchanged), never `false`. Preserve this whenever editing the preprocessor callback.

### Options flow into two different engine APIs

- `calloutIcons` → `configure()` — global, applied once at registration.
- `imageDialog` → `process()` `ProcessOptions` — passed per file on every run.

Keep that distinction in mind; they are not interchangeable.

## Tests

`test/plugin.test.ts` are **integration** tests: they instantiate Eleventy programmatically (`new Eleventy(...).toJSON()`) over the Markdown fixtures in `test/fixtures/` and assert on the rendered `<wa-*>` HTML. `test/wa-block-rule.test.ts` are fast/hermetic **unit** tests of the block rule against a bare markdown-it (no Eleventy, no engine), feeding the intermediate HTML shapes the engine emits.

- The integration test deliberately provides a vanilla `setLibrary('md', markdownIt())` with raw HTML **off**, to prove the plugin turns it on itself (via `amendLibrary` → `waBlocks`). Consumers no longer need to enable `html: true` manually — the plugin owns it.
- Eleventy ships no types, so `test/eleventy-shim.d.ts` provides a minimal ambient module declaration for the programmatic API used here.
- Fixtures exercise the markawesome dialect: `:::variant` callouts, `%%%` buttons, `(((term >>> definition)))` glossary tooltips, `//////` accordions, and a fenced code block that must survive untransformed.

## Build / packaging

- `tsup` emits both ESM (`dist/index.js`) and CJS (`dist/index.cjs`) plus `.d.ts`, targeting node18.
- `markawesome-js` and `@11ty/eleventy` are kept **external** in `tsup.config.ts` so the consumer resolves a single copy of the engine (its internal markdown-it stays encapsulated). Don't bundle them.

## Releases are tagged to match the published version

Every version published to npm gets a matching **GitHub Release**, so the repo's
releases line up 1:1 with what's installable:

1. Tag the released commit `vX.Y.Z` — the same version as `package.json`.
2. Push the commit and the tag.
3. `gh release create vX.Y.Z` with notes drawn from `CHANGELOG.md`.

The GitHub Release tag **must equal** the version published to npm. When a syntax
change requires a new `markawesome-js`, bump the `markawesome-js` dependency range
here and release this plugin after the engine.
