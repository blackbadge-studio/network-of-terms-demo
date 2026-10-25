import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
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
