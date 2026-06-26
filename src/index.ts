import type MarkdownIt from 'markdown-it';
import { process, configure, type ProcessOptions } from 'markawesome-js';
import { waBlocks } from './wa-block-rule.js';

/**
 * Image-dialog configuration. `true` enables with engine defaults; an object
 * can supply a `defaultWidth` (e.g. `"90vh"`).
 */
export type ImageDialogOption = boolean | { defaultWidth?: string };

export interface WebAwesomeOptions {
  /**
   * File extension(s) the preprocessor applies to. Default: `"md"`.
   */
  extensions?: string | string[];
  /**
   * Log each processed file's input path to the console.
   */
  debug?: boolean;
  /**
   * Wrap standalone images in click-to-zoom dialogs. Off by default.
   */
  imageDialog?: ImageDialogOption;
  /**
   * Callout icon overrides, keyed by variant. Applied globally to the engine at
   * registration time via `configure()` (last-write-wins; not per file).
   */
  calloutIcons?: Record<string, string>;
  /**
   * Optional opt-out hook. Return `false` to leave a file's content unchanged
   * (e.g. `(data) => data.webawesome !== false`).
   */
  shouldTransform?: (data: PreprocessorData) => boolean;
}

/** The `data` object Eleventy hands to a preprocessor. */
export interface PreprocessorData {
  page?: { inputPath?: string };
  [key: string]: unknown;
}

/** Minimal shape of the Eleventy config object we depend on. */
export interface EleventyConfigLike {
  addPreprocessor(
    name: string,
    extensions: string | string[],
    callback: (data: PreprocessorData, content: string) => string | undefined,
  ): void;
  /**
   * Mutate a template library after Eleventy builds it. Eleventy stacks these
   * callbacks on the live instance at engine init (before any rendering), so
   * the plugin's amendment composes with any the consumer registers.
   */
  amendLibrary(name: string, callback: (library: unknown) => void): void;
}

// Translate the plugin's imageDialog option into the engine's process option.
function normalizeImageDialog(option: ImageDialogOption): ProcessOptions['imageDialog'] {
  if (option === true) return true;
  if (typeof option === 'object' && option !== null) {
    return option.defaultWidth ? { defaultWidth: option.defaultWidth } : true;
  }
  return undefined;
}

/**
 * Eleventy plugin: transforms the markawesome Markdown dialect into Web Awesome
 * web components before Eleventy's markdown renderer runs.
 *
 * ```js
 * import webawesome from "eleventy-plugin-webawesome";
 * export default function (eleventyConfig) {
 *   eleventyConfig.addPlugin(webawesome, { imageDialog: { defaultWidth: "90vh" } });
 * }
 * ```
 */
export default function webawesome(
  eleventyConfig: EleventyConfigLike,
  options: WebAwesomeOptions = {},
): void {
  const extensions = options.extensions ?? 'md';

  // Callout icons are engine-global; push them once at registration time.
  if (options.calloutIcons) {
    configure({ calloutIcons: options.calloutIcons });
  }

  const processOptions: ProcessOptions = {};
  if (options.imageDialog) {
    const normalized = normalizeImageDialog(options.imageDialog);
    if (normalized) processOptions.imageDialog = normalized;
  }

  eleventyConfig.addPreprocessor('markawesome', extensions, (data, content) => {
    // Opt-out: returning `undefined` leaves the file unchanged. We must NEVER
    // return `false` — Eleventy treats a `false` return as "exclude this file
    // from the build".
    if (options.shouldTransform && !options.shouldTransform(data)) return undefined;

    if (options.debug) {
      console.log(`[webawesome] ${data.page?.inputPath ?? '(unknown input path)'}`);
    }

    return process(content, processOptions);
  });

  // Make markdown-it render block-level `<wa-*>` components correctly. Without
  // this, markdown-it wraps each block component in a `<p>`; the browser then
  // auto-closes that `<p>` through the custom element and ejects the body, so
  // the component renders empty. `waBlocks` registers a block rule that treats
  // `<wa-*>` components as pass-through HTML blocks and enables raw HTML
  // (`html: true`) — which the spliced tags require to survive at all.
  eleventyConfig.amendLibrary('md', (library) => {
    waBlocks(library as MarkdownIt);
  });
}
