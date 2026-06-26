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
}
```

> [!IMPORTANT]
> **The plugin enables raw HTML site-wide.** To render the `<wa-*>` tags it
> generates, the plugin turns on markdown-it's `html: true` — a **global** option,
> so raw HTML becomes allowed in *all* your Markdown, not just markawesome
> components. This was always required for the plugin to work (you used to set it
> yourself); the plugin now owns it. **If you render untrusted Markdown through the
> same pipeline, sanitize the output downstream.** Details and how to override:
> [Raw HTML and the block rule](#raw-html-and-the-block-rule).

The plugin also installs a block rule for `<wa-*>` components so block-level
components render correctly — you don't need to configure either.

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

## Raw HTML and the block rule

The preprocessor turns the markawesome dialect into `<wa-*>` HTML, then
Eleventy's markdown-it renders the result. Two things have to be true for block
components (callouts, cards, details, accordions, tab panels, dialogs, popovers,
carousels) to render correctly, and **the plugin sets both up for you**:

1. **Raw HTML is enabled** (`html: true`). Without it markdown-it escapes the
   spliced tags and nothing upgrades.
2. **A block rule** recognises a block-level `<wa-*>` component as a pass-through
   HTML block. Without it, markdown-it — whose HTML-block detection only knows a
   fixed list of tag names, none of them `wa-*` — wraps each block component in a
   `<p>`. The browser then auto-closes that `<p>` *through* the custom element and
   ejects the component's body, so **the component renders empty** with its text
   dumped out beneath it. The rule prevents the `<p>`, so the body stays inside.

You don't call `amendLibrary` yourself; `addPlugin(webawesome)` installs both.

### Trade-off and security: this enables raw HTML site-wide

Enabling `html: true` is global to that markdown-it instance — raw HTML is now
allowed in **all** of your Markdown, not just markawesome components. This was
already required for the plugin to do anything; the plugin now just owns it
instead of asking you to.

**Security implication:** with raw HTML enabled, any HTML (including `<script>`)
present in your Markdown sources passes through to the output verbatim. This is
fine for trusted, author-controlled content (the normal case for a static site).
If any of the Markdown you render comes from **untrusted** sources, sanitize the
rendered HTML downstream, or render that content through a separate markdown-it
instance that keeps `html: false`.

To opt back out entirely, override it in a later `amendLibrary` call
(`eleventyConfig.amendLibrary('md', (md) => md.set({ html: false }))`) — but then
block components revert to rendering empty.

### Known limitations

- **Blank lines around blocks.** Separate a block component from surrounding
  prose with a blank line (standard Markdown HTML-block behaviour). A block glued
  directly to a *following* prose line with no blank line between may pull that
  line in.
- **Indentation.** Indenting component markup by ≥4 spaces (inside list items /
  blockquotes) makes markdown-it treat it as an indented code block.
- **Inline-then-inline on one line.** A single source line that *starts* with an
  inline `wa-*` component, *ends* with another inline `wa-*` component, and has
  Markdown *between* them (e.g. `$$$a **mid** $$$b`) can be treated as raw HTML,
  so the in-between Markdown won't render. Rare; split it across lines if you hit
  it.
- **Scope.** The rule keys on the `wa-` tag namespace, so it covers every `wa-*`
  component — including future ones — and touches no other HTML.

> **Note on nested components.** Earlier versions of the engine emitted a stray
> `<p>` around a *block* component nested inside another container's item body
> (e.g. a `:::` callout inside a `//////` accordion item), which this plugin's
> rule could not reach — so those nested components rendered empty. That is fixed
> at the source in `markawesome-js` (its internal Markdown conversion now matches
> the Ruby engine's Kramdown and no longer wraps nested components), so nested
> components render correctly with a current engine.

## Gotchas

- **Never returns `false`.** A preprocessor that returns `false` makes Eleventy
  *exclude the file from the build*. The opt-out path returns `undefined`
  (leave unchanged), never `false`.

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
