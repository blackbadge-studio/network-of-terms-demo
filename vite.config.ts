import {defineConfig, Plugin} from 'vite';
import vue from '@vitejs/plugin-vue';
import {createReadStream, existsSync} from 'node:fs';
import {join, normalize} from 'node:path';

/** Dev only: serves dev-stubs/tests/* at /tests/* (CORS) so the simulator's acceptance tab can be developed before the API ships them. */
const testsStub = (): Plugin => ({
  name: 'vtn-tests-stub',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const url = (req.url ?? '').split('?')[0];
      if (!url.startsWith('/tests/')) {
        return next();
      }
      const file = normalize(join(process.cwd(), 'dev-stubs', url));
      if (!file.startsWith(join(process.cwd(), 'dev-stubs')) || !existsSync(file)) {
        return next();
      }
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', file.endsWith('.mjs') ? 'text/javascript' : 'application/json');
      createReadStream(file).pipe(res);
    });
  },
});

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    testsStub(),
    vue({
      template: {
        compilerOptions: {
          // <vtn-search> is our own web component (src/widget), not a Vue component.
          isCustomElement: tag => tag.startsWith('vtn-'),
        },
      },
    }),
  ],
});
