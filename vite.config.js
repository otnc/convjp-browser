import { defineConfig } from 'vite';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import polyfillNode from 'rollup-plugin-polyfill-node';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.js',
      name: 'convjp',
      formats: [
        'es',
        'cjs',
        'umd',
      ],
      fileName: (format) => `main.${format}.js`,
    },
    rollupOptions: {
      plugins: [
        polyfillNode(),
        nodeResolve({ browser: true, preferBuiltins: false }),
        commonjs({
          include: /node_modules/,
          transformMixedEsModules: true,
          requireReturnsDefault: "default",
        }),
      ],
    },
    commonjsOptions: {
      include: /node_modules/
    },
  },
});
