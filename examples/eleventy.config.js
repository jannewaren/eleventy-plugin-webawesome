import webawesome from 'eleventy-plugin-webawesome';
import syntaxHighlight from '@11ty/eleventy-plugin-syntaxhighlight';

export default function (eleventyConfig) {
  // Highlight fenced code blocks (the markawesome syntax examples).
  eleventyConfig.addPlugin(syntaxHighlight);

  // The plugin: transform the markawesome Markdown dialect into Web Awesome
  // components before Eleventy's markdown renderer runs.
  eleventyConfig.addPlugin(webawesome, {
    debug: true,
    imageDialog: { defaultWidth: '90vh' },
  });

  // No need to enable raw HTML here — the plugin turns on `html: true` and
  // installs a block rule so the spliced <wa-*> components render correctly.

  // Copy image, video + download assets referenced by index.md.
  eleventyConfig.addPassthroughCopy('*.png');
  eleventyConfig.addPassthroughCopy('*.mp4');
  eleventyConfig.addPassthroughCopy('*.jpg');
  eleventyConfig.addPassthroughCopy('downloads');

  return {
    dir: {
      input: '.',
      output: '_site',
      includes: '_includes',
    },
    // Don't run a template engine over the markdown bodies — the content is the
    // markawesome dialect, processed by the preprocessor, not Nunjucks/Liquid.
    markdownTemplateEngine: false,
  };
}
