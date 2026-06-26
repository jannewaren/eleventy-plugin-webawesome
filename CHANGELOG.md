# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/jannewaren/eleventy-plugin-webawesome/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/jannewaren/eleventy-plugin-webawesome/releases/tag/v0.1.0
