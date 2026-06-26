# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A thin Eleventy 3.x plugin that registers a single **preprocessor** named `markawesome`. The actual Markdown→Web-Awesome transformation happens in the external [`markawesome-js`](https://www.npmjs.com/package/markawesome-js) engine — this package is just the glue that wires that engine into Eleventy's build. There is essentially one source file (`src/index.ts`); almost all behavior changes belong in `markawesome-js`, not here.

It is the Node counterpart to the Ruby `markawesome` + `jekyll-webawesome` pair (the README has a Jekyll→11ty migration table).

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

### Critical invariant: never return `false` from the preprocessor

Eleventy treats a `false` return from a preprocessor as "**exclude this file from the build**". The `shouldTransform` opt-out path therefore returns `undefined` (leave content unchanged), never `false`. Preserve this whenever editing the preprocessor callback.

### Options flow into two different engine APIs

- `calloutIcons` → `configure()` — global, applied once at registration.
- `imageDialog` → `process()` `ProcessOptions` — passed per file on every run.

Keep that distinction in mind; they are not interchangeable.

## Tests

`test/plugin.test.ts` are **integration** tests: they instantiate Eleventy programmatically (`new Eleventy(...).toJSON()`) over the Markdown fixtures in `test/fixtures/` and assert on the rendered `<wa-*>` HTML. They are not unit tests of `src/index.ts` in isolation.

- `setLibrary('md', markdownIt({ html: true }))` is required in the test config — the spliced `<wa-*>` tags only survive if markdown-it allows raw HTML. Consumers must do the equivalent (`amendLibrary('md', md => md.set({ html: true }))`); this is a documented gotcha, not optional.
- Eleventy ships no types, so `test/eleventy-shim.d.ts` provides a minimal ambient module declaration for the programmatic API used here.
- Fixtures exercise the markawesome dialect: `:::variant` callouts, `%%%` buttons, `(((term >>> definition)))` glossary tooltips, `//////` accordions, and a fenced code block that must survive untransformed.

## Build / packaging

- `tsup` emits both ESM (`dist/index.js`) and CJS (`dist/index.cjs`) plus `.d.ts`, targeting node18.
- `markawesome-js` and `@11ty/eleventy` are kept **external** in `tsup.config.ts` so the consumer resolves a single copy of the engine (its internal markdown-it stays encapsulated). Don't bundle them.
