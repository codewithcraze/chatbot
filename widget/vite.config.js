import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5174,
    },
    build: {
        lib: {
            entry: 'src/main.jsx',
            name: 'ChatWidget',
            fileName: 'chatbot-widget',
            formats: ['iife'],
        },
        rollupOptions: {
            output: {
                inlineDynamicImports: true,
            },
        },
    },
});
