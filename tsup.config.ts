import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  target: 'node18',
  // markawesome-js is a regular dependency; keep it external so the consumer
  // resolves a single copy (its internal markdown-it stays encapsulated).
  external: ['markawesome-js', '@11ty/eleventy'],
});
