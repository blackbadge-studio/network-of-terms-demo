import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
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
