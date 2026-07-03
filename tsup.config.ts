import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.tsx'],
  format: ['esm'],
  outDir: 'dist',
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  target: 'es2020',
  platform: 'browser',
  external: ['react', 'react-dom', 'react-dom/client']
});
