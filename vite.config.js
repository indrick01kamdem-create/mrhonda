import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { cpSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

function copyAssetFolder() {
  return {
    name: 'copy-asset-folder',
    closeBundle() {
      const source = resolve('asset');
      if (existsSync(source)) {
        cpSync(source, resolve('dist/asset'), { recursive: true });
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), copyAssetFolder()],
});
