import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // GitHub Pages project site path: https://<user>.github.io/gibko-notes/
  base: '/gibko-notes/',
  plugins: [react(), tailwindcss()],
});
