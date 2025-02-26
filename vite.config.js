import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';

export default defineConfig(({ command }) => {
    if (command === "serve") {
        return {
            root: "examples",
            server: {
                open: "/audio-input.html",
                //   port: 3000, 
            },
        }
    }
    else {
        return {
            build: {
                lib: {
                    entry: 'src/index.js',
                    name: 'SpecT',
                    formats: ['es', 'cjs', 'umd'],
                    fileName: (format) => {
                        if (format === 'cjs') return 'index.cjs';
                        return `index.${format}.js`
                    },
                },
                minify: 'esbuild',
            },
            plugins: [glsl()]
        }
    }


});