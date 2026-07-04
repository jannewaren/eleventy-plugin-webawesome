// Enriches the shared examples.yaml dataset for the Eleventy demo site. This
// mirrors jekyll-webawesome's _plugins/webawesome_examples.rb: for every
// example it precomputes two HTML strings.
//
//   * codeHtml     — the raw markawesome snippet, Prism-highlighted only. It
//                    never touches process(), so the sigils show verbatim.
//                    (Prism has no markawesome grammar, so the custom sigils
//                    fall through as plain text — exactly what we want.)
//   * renderedHtml — the snippet run through the SAME two passes a real page
//                    gets: process() (splices in the component HTML) then
//                    renderMarkdown() (markawesome-js's own markdown-it, tuned
//                    to match Kramdown and carrying the waBlockRule + html:true
//                    the plugin relies on). Skipping this second pass — or
//                    substituting a vanilla markdown-it — makes nested block
//                    <wa-*> components render empty.
//
// Eleventy does NOT auto-parse _data/*.yaml, so we read and parse the shared
// file explicitly. Same bytes, same path as the Jekyll site consumes.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import Prism from 'prismjs';
import 'prismjs/components/prism-markdown.js';
import { process, renderMarkdown } from 'markawesome-js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const data = yaml.load(fs.readFileSync(path.join(dir, 'examples.yaml'), 'utf8'));

// Match the demo's eleventy.config.js imageDialog options so previews render
// exactly like live pages.
const processOptions = { imageDialog: { defaultWidth: '90vh' } };

const highlight = (code) =>
  `<pre class="language-markdown"><code class="language-markdown">` +
  `${Prism.highlight(code, Prism.languages.markdown, 'markdown')}</code></pre>`;
const render = (md) => renderMarkdown(process(md, processOptions));
const renderInline = (md) =>
  render(md)
    .trim()
    .replace(/^<p>/, '')
    .replace(/<\/p>$/, '');

for (const category of data.categories) {
  category.summary = summaryOf(category.intro);
  if (category.intro) category.introHtml = render(category.intro);
  for (const ex of category.examples) {
    if (ex.heading) continue;
    ex.codeHtml = highlight(ex.code);
    ex.renderedHtml = render(ex.code);
    if (ex.description) ex.descriptionHtml = renderInline(ex.description);
  }
}

function summaryOf(intro) {
  if (!intro) return '';
  const sentence = intro.trim().split(/(?<=\.)\s/)[0] ?? '';
  return sentence.replace(/[`*]/g, '');
}

export default data;
