import { describe, it, expect } from 'vitest';
import MarkdownIt from 'markdown-it';
import { waBlockRule } from '../src/wa-block-rule.js';

// Unit tests for the markdown-it block rule, in isolation from Eleventy and the
// markawesome-js engine. We feed the *intermediate* HTML the engine emits (the
// shapes are taken verbatim from real `process()` output) and assert markdown-it
// renders it without the paragraph wrap that empties block components.
//
// `alt: ['paragraph', …]` is mandatory — without it the rule cannot interrupt a
// paragraph and a block component glued to a preceding prose line is absorbed.
function md(): MarkdownIt {
  const inst = new MarkdownIt({ html: true });
  inst.block.ruler.before('html_block', 'wa_block', waBlockRule, {
    alt: ['paragraph', 'reference', 'blockquote'],
  });
  return inst;
}

describe('waBlockRule', () => {
  it('does not wrap a block callout in a paragraph', () => {
    const input = [
      '<wa-callout variant="brand"><wa-icon slot="icon" name="circle-info"></wa-icon><p>Body <strong>x</strong>.</p>',
      '</wa-callout>',
    ].join('\n');
    const out = md().render(input);

    // The bug: markdown-it wraps the component in <p>, the browser then ejects
    // the body. The fix prevents the wrap entirely.
    expect(out).not.toMatch(/<p>\s*<wa-callout/);
    expect(out).toContain(
      '<wa-callout variant="brand"><wa-icon slot="icon" name="circle-info"></wa-icon><p>Body <strong>x</strong>.</p>',
    );
  });

  it('keeps a multi-line wa-details intact (regression: emptied details)', () => {
    // Three-line shape straight from the engine: the summary's inner <p>, a
    // continuation line that starts with </span><p>…, then the close tag.
    const input = [
      "<wa-details appearance='outlined' icon-placement='end'><span slot='summary'><p>Click to expand</p>",
      '</span><p>Detailed <strong>content</strong>.</p>',
      '</wa-details>',
    ].join('\n');
    const out = md().render(input);

    expect(out).not.toMatch(/<p>\s*<wa-details/); // not wrapped
    expect(out).not.toContain('<p></span>'); // body not ejected
    expect(out).toContain("<span slot='summary'><p>Click to expand</p>");
    expect(out).toContain('<p>Detailed <strong>content</strong>.</p>');
    expect(out).toContain('</wa-details>');
  });

  it('leaves an inline component spliced into prose as a paragraph', () => {
    const out = md().render('<wa-icon name="star"></wa-icon> This is **important**.');
    // Stays a paragraph so the surrounding markdown still renders.
    expect(out).toMatch(/^<p><wa-icon name="star"><\/wa-icon> This is <strong>important<\/strong>\.<\/p>/);
  });

  it('preserves markdown between two inline components on one line', () => {
    const out = md().render(
      '<wa-icon name="star"></wa-icon> Rate **5/5** <wa-icon name="star"></wa-icon>',
    );
    expect(out).toContain('<strong>5/5</strong>');
    expect(out).toMatch(/^<p><wa-icon/); // still a paragraph
  });

  it('interrupts a paragraph: prose then a block with no blank line', () => {
    const input = [
      'Some intro prose here.',
      '<wa-callout variant="brand"><wa-icon slot="icon" name="x"></wa-icon><p>Body.</p>',
      '</wa-callout>',
    ].join('\n');
    const out = md().render(input);

    // The prose becomes its own paragraph and the callout is NOT absorbed.
    expect(out).toContain('<p>Some intro prose here.</p>');
    expect(out).not.toMatch(/<p>[^<]*<wa-callout/);
    expect(out).toContain('<p>Body.</p>');
    expect(out).toContain('</wa-callout>');
  });

  it('counts only the same tag name so nested children do not mis-balance', () => {
    // wa-carousel wraps wa-carousel-item children; only wa-carousel depth counts.
    const input = [
      '<wa-carousel><wa-carousel-item><p><img src="a.png" alt="A" /></p>',
      '</wa-carousel-item><wa-carousel-item><p><img src="b.png" alt="B" /></p>',
      '</wa-carousel-item></wa-carousel>',
    ].join('\n');
    const out = md().render(input);

    expect(out).not.toMatch(/<p>\s*<wa-carousel/);
    expect(out).toContain('<wa-carousel><wa-carousel-item>');
    expect(out).toContain('</wa-carousel-item></wa-carousel>');
  });

  it('no-ops when raw HTML is disabled (html: false)', () => {
    const inst = new MarkdownIt({ html: false });
    inst.block.ruler.before('html_block', 'wa_block', waBlockRule, {
      alt: ['paragraph', 'reference', 'blockquote'],
    });
    const out = inst.render('<wa-callout variant="brand"><p>Body.</p>\n</wa-callout>');
    // The guard defers to native handling, which escapes the tags.
    expect(out).toContain('&lt;wa-callout');
  });
});
