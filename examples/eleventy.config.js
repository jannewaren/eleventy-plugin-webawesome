import webawesome from 'eleventy-plugin-webawesome';

export default function (eleventyConfig) {
  // The plugin under test: transform the markawesome Markdown dialect into Web
  // Awesome components. (The example pages are data-driven .njk, so the live
  // previews are pre-rendered in _data/examples.js via markawesome-js; the
  // plugin stays registered because it is the thing this site demonstrates.)
  eleventyConfig.addPlugin(webawesome, {
    debug: true,
    imageDialog: { defaultWidth: '90vh' },
  });

  // Copy the shared stylesheet, syntax theme, and demo media.
  eleventyConfig.addPassthroughCopy('assets');

  return {
    dir: {
      input: '.',
      output: '_site',
      includes: '_includes',
    },
    // Hosted under https://jannewaren.github.io/eleventy-plugin-webawesome/ on
    // GitHub Pages; `| url` in the templates prepends this to internal links.
    pathPrefix: '/eleventy-plugin-webawesome',
    // Category pages are .njk; there are no markdown bodies to run an engine over.
    markdownTemplateEngine: false,
  };
}
