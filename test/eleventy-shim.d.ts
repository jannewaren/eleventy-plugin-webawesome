// Minimal ambient declaration for the bits of Eleventy's programmatic API the
// integration test uses. Eleventy doesn't ship its own type definitions.
declare module '@11ty/eleventy' {
  interface EleventyOptions {
    configPath?: string | false;
    config?: (eleventyConfig: unknown) => void;
    [key: string]: unknown;
  }
  interface EleventyJsonResult {
    inputPath: string;
    outputPath: string | false;
    url: string;
    content: string;
    rawInput?: string;
  }
  export default class Eleventy {
    constructor(input?: string, output?: string, options?: EleventyOptions);
    toJSON(): Promise<EleventyJsonResult[]>;
    write(): Promise<unknown>;
  }
}
