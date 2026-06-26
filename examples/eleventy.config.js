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

  // The spliced <wa-*> HTML must survive markdown rendering.
  eleventyConfig.amendLibrary('md', (md) => md.set({ html: true }));

  // Copy image + download assets referenced by index.md.
  eleventyConfig.addPassthroughCopy('*.png');
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
