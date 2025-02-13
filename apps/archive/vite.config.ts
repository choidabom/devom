import react from '@vitejs/plugin-react';
import type { PluginOption } from 'vite';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()] as PluginOption[],
    base: process.env.NODE_DEV === 'production' ? '/devom' : '/',
});
