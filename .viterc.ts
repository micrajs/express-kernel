import {defineConfig} from '@micra/vite-config/library';

export default defineConfig({
  build: {
    rollupOptions: {
      external: [
        '@micra/core',
        '@micra/error',
        '@remix-run/web-fetch',
        '@remix-run/web-file',
        'abort-controller',
        'cls-hooked',
        'express',
      ],
    },
  },
});
