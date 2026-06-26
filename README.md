# eleventy-plugin-webawesome

An [Eleventy](https://www.11ty.dev/) (11ty) plugin that transforms a terse
custom Markdown dialect into [Web Awesome](https://webawesome.com/) web
components. It is the thin glue around the
[`markawesome-js`](https://github.com/jannewaren/markawesome-js) engine — the
Node counterpart to the Ruby `markawesome` + `jekyll-webawesome` pair.

```md
:::info
Write a **callout** in Markdown.
:::
```

→ `<wa-callout variant="brand">…</wa-callout>` in your built pages.

## Requirements

- **Eleventy 3.0+** — the plugin uses the [preprocessor API](https://www.11ty.dev/docs/transforms-and-preprocessors/),
  which is an Eleventy 3.0 feature (hard floor).
- Node >= 18.

## Install

```bash
npm install eleventy-plugin-webawesome
```

## Usage

```js
// eleventy.config.js (Eleventy 3.x, ESM)
import webawesome from 'eleventy-plugin-webawesome';

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(webawesome, {
    extensions: 'md', // string | string[]; default "md"
    debug: false, // log each processed file's input path
    imageDialog: false, // false | true | { defaultWidth: "90vh" }
    calloutIcons: {}, // e.g. { brand: "lightbulb" } — applied globally
    shouldTransform: (data) => data.webawesome !== false, // optional opt-out
  });

  // The spliced <wa-*> HTML must survive markdown rendering, so make sure your
  // markdown library allows raw HTML:
  eleventyConfig.amendLibrary('md', (md) => md.set({ html: true }));
}
```

Then add the Web Awesome CDN kit `<script>` to your layout so the components
upgrade in the browser. See [`examples/`](./examples) for a complete site.

## Options

| Option | Type | Default | Notes |
| --- | --- | --- | --- |
| `extensions` | `string \| string[]` | `"md"` | File extensions the preprocessor runs on. |
| `debug` | `boolean` | `false` | Log each processed file's input path. |
| `imageDialog` | `boolean \| { defaultWidth?: string }` | `false` | Wrap standalone images in click-to-zoom dialogs. |
| `calloutIcons` | `Record<string, string>` | — | Callout icon overrides by variant. Applied **globally** to the engine at registration (last-write-wins), not per file. |
| `shouldTransform` | `(data) => boolean` | — | Return `false` to skip a file (e.g. `webawesome: false` front matter). |

### Migrating from `jekyll-webawesome`

| Jekyll | 11ty | Notes |
| --- | --- | --- |
| `debug` | `debug` | unchanged |
| `image_dialog` (`{enabled, default_width}`) | `imageDialog` (`true` \| `{defaultWidth}`) | renamed to camelCase |
| `callout_icons` | `calloutIcons` | renamed; applied globally via the engine |
| `transform_pages` / `transform_documents` | _dropped_ | use `extensions` scoping and/or `shouldTransform` / a `webawesome: false` front-matter flag |

## Gotchas

- **Never returns `false`.** A preprocessor that returns `false` makes Eleventy
  *exclude the file from the build*. The opt-out path returns `undefined`
  (leave unchanged), never `false`.
- **markdown-it HTML blocks.** Keep blank lines around block-level components.
  Indenting component markup by ≥4 spaces (inside list items / blockquotes) makes
  markdown-it treat it as a code block.
- **`html: true`.** Your markdown library must allow raw HTML so the generated
  `<wa-*>` tags pass through.

## Examples site

```bash
cd examples
npm install
npx @11ty/eleventy --serve
```

The example site mirrors the `jekyll-webawesome` examples (same Web Awesome CDN
kit and component spacing CSS) and exercises every supported component.

## License

MIT
