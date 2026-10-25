import {defineConfig, loadEnv} from 'vite';

// The embed script: one classic (IIFE) file at dist/widget/vtn-widget.js, built after the site
// (`npm run build`), so <script src=".../widget/vtn-widget.js"> works on any page. The production
// API address comes from .env.production, as for the site.
export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    define: {
      'import.meta.env.VITE_GRAPHQL_URL': JSON.stringify(env.VITE_GRAPHQL_URL ?? ''),
    },
    // Only the script: the favicons in public/ belong to the site build.
    publicDir: false,
    build: {
      outDir: 'dist/widget',
      emptyOutDir: true,
      lib: {
        entry: 'src/widget/vtn-widget.ts',
        name: 'VtnWidget',
        formats: ['iife'],
        fileName: () => 'vtn-widget.js',
      },
      target: 'es2020',
      sourcemap: false,
      minify: true,
    },
  };
});
