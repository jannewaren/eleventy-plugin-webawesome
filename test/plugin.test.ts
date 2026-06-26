import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import Eleventy from '@11ty/eleventy';
import markdownIt from 'markdown-it';
import webawesome, { type EleventyConfigLike, type PreprocessorData } from '../src/index.js';

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');

type FullConfig = EleventyConfigLike & {
  setLibrary: (name: string, lib: unknown) => void;
  addPlugin: (plugin: unknown, options?: unknown) => void;
};

interface RenderedFile {
  inputPath: string;
  content: string;
}

async function build(register: (cfg: FullConfig) => void): Promise<RenderedFile[]> {
  const elev = new Eleventy(fixturesDir, path.join(fixturesDir, '..', '_site'), {
    configPath: false,
    config: (eleventyConfig: unknown) => {
      const cfg = eleventyConfig as FullConfig;
      // Provide a vanilla markdown-it with raw HTML OFF — the plugin must turn
      // it on itself (via amendLibrary) for the spliced <wa-*> tags to survive.
      cfg.setLibrary('md', markdownIt());
      register(cfg);
    },
  });
  return (await elev.toJSON()) as RenderedFile[];
}

function byName(files: RenderedFile[], name: string): RenderedFile {
  const file = files.find((f) => f.inputPath.endsWith(name));
  if (!file) throw new Error(`fixture ${name} not found`);
  return file;
}

describe('eleventy-plugin-webawesome', () => {
  it('transforms components and preserves fenced code blocks', async () => {
    const files = await build((cfg) => {
      cfg.addPlugin(webawesome, {
        shouldTransform: (data: PreprocessorData) => data.webawesome !== false,
      });
    });
    const { content } = byName(files, 'basic.md');

    expect(content).toContain('<wa-callout variant="brand">');
    expect(content).toContain('<wa-icon slot="icon" name="circle-info" variant="solid">');
    expect(content).toContain('<wa-button variant="brand" size="large" href="https://example.com">');
    expect(content).toContain('<wa-tooltip');
    expect(content).toContain('<wa-accordion');

    // Block components keep their content *inside* them: markdown-it must not
    // wrap them in a <p> (the browser would otherwise eject the block body and
    // the component would render empty). Proven end-to-end through Eleventy's
    // own markdown-it, with the plugin enabling raw HTML on its own.
    expect(content).not.toMatch(/<p>\s*<wa-callout/);
    expect(content).toMatch(/<wa-callout variant="brand"><wa-icon[^>]*><\/wa-icon><p>/);
    expect(content).not.toMatch(/<p>\s*<wa-details/);
    expect(content).not.toContain('<p></span>'); // wa-details summary not ejected

    // Fenced code block survived (not turned into a callout) and rendered as code.
    expect(content).toContain('<pre');
    expect(content).toContain(':::info'); // literal text preserved inside the code block
  });

  it('respects shouldTransform opt-out (webawesome: false)', async () => {
    const files = await build((cfg) => {
      cfg.addPlugin(webawesome, {
        shouldTransform: (data: PreprocessorData) => data.webawesome !== false,
      });
    });
    const { content } = byName(files, 'optout.md');
    expect(content).not.toContain('<wa-callout');
    expect(content).toContain(':::info');
  });

  it('forwards imageDialog option to the engine', async () => {
    const files = await build((cfg) => {
      cfg.addPlugin(webawesome, { imageDialog: { defaultWidth: '90vh' } });
    });
    const { content } = byName(files, 'image.md');
    expect(content).toContain('<wa-dialog');
    expect(content).toContain("style='--width: 90vh'");
    expect(content).toContain('data-dialog=');
  });

  it('does not wrap images in dialogs when imageDialog is off', async () => {
    const files = await build((cfg) => {
      cfg.addPlugin(webawesome, {});
    });
    const { content } = byName(files, 'image.md');
    expect(content).not.toContain('<wa-dialog');
    expect(content).toContain('<img src="cat.jpg"');
  });
});
