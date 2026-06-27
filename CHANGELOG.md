# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Example site's new `## Tree` section exercises markawesome-js's new `tree` transformer — a `<wa-tree>` / `<wa-tree-item>` hierarchy rendered from a nested Markdown bullet list (the `||||||` fence). Two cases: a ZIP-contents tree (`open` + folder/file icons) and a deeply nested Peppol BIS 3.0 invoice element structure (proving colon-bearing labels like `cbc:ID` render verbatim). Requires the unreleased `markawesome-js`; local verification needs the workspace `markawesome-js` linked (e.g. `npm link` / a `file:` dep) since nothing is published yet.

## [0.2.0] - 2026-06-26

### Added

- Video and video playlist embedding, via markawesome-js's new `video` transformer. A `;;;` fence wraps a single `<wa-video>` and a `;;;;;;` container wraps bare `;;;` items into a `<wa-video-playlist>` (block alternatives `:::wa-video` / `:::wa-video-playlist`). The body's first markdown link supplies the video `title`/`src` and the first image supplies the `poster`; tokens cover `controls:none|standard|full`, `preload:auto|metadata|none`, and the `autoplay`/`autoplay-muted`/`autoplay-on-visible`/`loop`/`muted` flags. The playlist's `controls` preset is forwarded to every child. Both components are Web Awesome **Pro** (experimental).
- Example site's new `## Video` section exercises a single video (`controls:full` + poster), a `controls:standard` variant with `autoplay-muted`/`loop`, the `:::wa-video` alternative, a two-item `;;;;;;` playlist, and a `:::wa-video-playlist` alternative — all driven by a compressed 720p H.264 `test_video.mp4` + JPEG poster (passed through via new `*.mp4`/`*.jpg` `addPassthroughCopy` rules). Validated live in the browser against the examples kit (Pro): the `<wa-video>`/`<wa-video-playlist>` elements upgrade, `getVideoElement()` returns the native `<video>`, `src`/`poster`/`controls` reflect, the poster overlay and controls render, and the playlist shows its item sidebar (titled "Part 1"/"Part 2") with `controls` forwarded to each child.
- Declarative timestamps, via markawesome-js's new `date` transformer. The inline `[[[ <date> <tokens> ]]]` form renders an absolute, locale-formatted date (`<wa-format-date>`); a leading `relative` token renders a "3 days ago"-style phrase (`<wa-relative-time>`). A block alternative (`:::wa-format-date` / `:::wa-relative-time` … `:::`) is also accepted. The date value is baked into the Markdown at build time; the browser formats it via `Intl.DateTimeFormat` / `Intl.RelativeTimeFormat` with no JavaScript wiring or data fetching.
  - `style:`/`time:` presets (`short|medium|long|full`), granular overrides (`weekday`, `month`, `day`, `hour`, … plus `hour-format`, `time-zone-name`, `time-zone`), and `lang:`/`locale:` are supported; a bare date defaults to `style:long`. Relative timestamps take `format:`, `numeric:`, and a `sync` flag for live ticking. Omitting the date renders the viewer's current time.
- Example site's new `## Dates / Timestamps` section exercises the presets, a datetime with `time:` + `hour-format:24`, French/German locales, a granular override, relative times (incl. `format:short` and live `sync`), both block forms, and a no-date "current time" stamp. Validated live in the browser against the examples kit (WA 3.9.0): the components upgrade and render real formatted text in their shadow DOM — e.g. `style:full` → "Friday, June 26, 2026", `lang:fr` → "vendredi 26 juin 2026", `lang:de` → "Freitag, 26. Juni 2026", `hour-format:24` → "Jun 26, 2026, 17:30", relative → "last week" / "4 wk. ago" / live "1 hour ago", and a no-date `time:medium` → the current "12:48:14 PM".
  - Like `<wa-icon>`, both components render generated text into shadow DOM with no light-DOM fallback — with Web Awesome's JS disabled they show nothing.
- Aligned placements + `skidding` for popovers and tooltips, and a per-tab `disabled` flag, via markawesome-js's expanded `popover`/`tooltip`/`tabs` transformers. `<wa-popover>`/`<wa-tooltip>` now accept all twelve Web Awesome placements (the four primary plus the eight aligned variants `top-start`, `bottom-end`, …) and a `skidding:N` token that offsets the floating element *along* its target (negative values allowed), complementing the existing `distance:N` (offset *away*). A leading `disabled` token on a `+++ ` tab item header (e.g. `+++ disabled Coming soon`) renders the tab but prevents selection, mirroring the accordion item flags.
- Example site adds cases for each: an "Aligned Placement and Skidding" subsection in both `## Popovers` and `## Tooltips`, and a "Disabled Tab" subsection in `## Tab Groups`. Validated live in the browser against the examples kit (WA 3.9.0): the components upgrade and the attributes reflect and take effect in the live DOM — `placement="bottom-end"` anchors the popover to its trigger's end edge; toggling `skidding` from 0 to 12 shifts the rendered popup exactly 12px along the trigger axis; the tooltip parses a negative `skidding="-4"`; and `<wa-tab disabled>` renders `aria-disabled="true"` with `tabindex="-1"` and stays non-activatable on click (a normal tab still activates, the disabled one is ignored).

### Changed

- Updated `markawesome-js` dependency to `^0.2.0` (the new `video`/`date`
  transformers and the nested block-component `<p>` fix come from there).
- The plugin now enables raw HTML (`html: true`) on Eleventy's markdown-it and
  installs a block rule for `<wa-*>` components on its own — you no longer need to
  add `eleventyConfig.amendLibrary('md', (md) => md.set({ html: true }))`
  yourself; **drop that line**. Trade-off, stated plainly: enabling `html: true`
  is global to that markdown-it instance, so raw HTML is now allowed in **all** of
  the site's Markdown (this was already required for the plugin to do anything —
  the plugin just owns it now). If you render untrusted Markdown through the same
  pipeline, sanitize downstream, or override `html` in a later `amendLibrary`
  call.

### Fixed

- Block-level components — callouts, cards, details, accordions, tab panels,
  dialogs, popovers, and carousels — rendered as **empty boxes** with their text
  spilled out beneath them. markdown-it wrapped each block `<wa-*>` in a `<p>`,
  and the browser then auto-closed that `<p>` *through* the custom element,
  ejecting the component's body. A new markdown-it block rule recognises block
  `<wa-*>` components as pass-through HTML blocks, so the body stays inside the
  component. Inline components (button/tag/badge/tooltip labels) were never
  affected and still render. **Top-level** block components now match the
  Jekyll/Kramdown build. A *block* component **nested inside another container's
  item body** (e.g. a callout inside an accordion item) was wrapped in a `<p>` by
  the markawesome-js engine itself, before Eleventy's markdown-it runs — that is
  fixed at the source in `markawesome-js` (its internal Markdown conversion now
  matches the Ruby engine's Kramdown), so nested components also render correctly
  with a current engine.

### Security

- **The plugin now enables raw HTML (`html: true`) globally on Eleventy's
  markdown-it.** This is required to render the generated `<wa-*>` tags, and it was
  already the documented setup step before this release — but it is now applied
  automatically, so be aware: raw HTML (including `<script>`) in **any** of your
  Markdown sources now passes through to the output. This is safe for trusted,
  author-controlled content (the typical static-site case). If you render
  untrusted Markdown through the same pipeline, sanitize the output downstream or
  route that content through a separate `html: false` markdown-it instance. You can
  override the option in a later `amendLibrary` call, at the cost of block
  components rendering empty again.

> _Dev note:_ this consumes the **unreleased** markawesome-js engine via a local
> link; the published `markawesome-js` dependency bump is deferred to the
> coordinated release.

## [0.1.0] - 2026-06-26

Initial release.

### Added

- An Eleventy 3.x plugin that registers a `markawesome` preprocessor delegating
  to the [`markawesome-js`](https://www.npmjs.com/package/markawesome-js) engine.
- Options: `extensions`, `debug`, `imageDialog`, `calloutIcons`,
  `shouldTransform`.
- `imageDialog` normalization (`true` | `{ defaultWidth }`) forwarded to the
  engine; `calloutIcons` pushed globally via `configure()` at registration.
- Opt-out via `shouldTransform` returning `false` (the preprocessor returns
  `undefined`, never `false`, so files are never accidentally excluded).
- Example Eleventy site mirroring the `jekyll-webawesome` examples (same Web
  Awesome CDN kit, component-spacing CSS, and a full component showcase).
- Integration tests that run Eleventy programmatically over fixture pages and
  assert the rendered `<wa-*>` output, code-block survival, opt-out, and
  `imageDialog` behaviour.

### Requirements

- `@11ty/eleventy` `>=3.0.0` (peer dependency; preprocessors are an Eleventy 3.0
  feature).
- `markawesome-js` `^0.1.0` (regular dependency).

[Unreleased]: https://github.com/jannewaren/eleventy-plugin-webawesome/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/jannewaren/eleventy-plugin-webawesome/releases/tag/v0.2.0
[0.1.0]: https://github.com/jannewaren/eleventy-plugin-webawesome/releases/tag/v0.1.0
