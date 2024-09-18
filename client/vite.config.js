import {defineConfig} from 'vite';
import fs from 'fs';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  envDir: '../',
  server: {
       https: {
         key: fs.readFileSync('/etc/letsencrypt/live/quickfire.online/privkey.pem'),
         cert: fs.readFileSync('/etc/letsencrypt/live/quickfire.online/fullchain.pem'),
       },
    proxy: {
      '/api': {
        target: 'http://quickfire.online:3002',
        changeOrigin: true,
        secure: true,
        ws: true,
      },
    },
    hmr: {
      clientPort: 443,
    },
  },
});
