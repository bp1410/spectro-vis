import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';

export default defineConfig({
    build: {
        lib: {
            entry: 'src/index.js', 
            name: 'SpecT',
            formats: ['es', 'cjs', 'umd'],
            fileName: (format) => `index.${format}.js`,
        },
        minify: 'esbuild',
    },
    plugins: [glsl()]
});