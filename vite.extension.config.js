import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  publicDir: false, 
  
  // 💡 CRITICAL: Map Node environment variables for browser execution
  define: {
    'process.env.NODE_ENV': JSON.stringify('development'),
  },
  
  build: {
    outDir: path.resolve(__dirname, 'extensions/designlab/assets'),
    emptyOutDir: false, 
    lib: {
      entry: path.resolve(__dirname, 'src-storefront/main.jsx'),
      formats: ['iife'], 
      name: 'DesignLabFrontend',
      fileName: () => 'design-lab-frontend.js',
    },
    rollupOptions: {
      output: {
        assetFileNames: 'design-lab-frontend.[ext]',
      },
    },
  },
});