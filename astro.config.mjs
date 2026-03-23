// astro.config.mjs
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://wisegoosegames.com',
  integrations: [
    react(),
    tailwind(),
    sitemap({
      filter: (page) => page !== 'https://wisegoosegames.com/privacy/' && page !== 'https://wisegoosegames.com/terms/',
      serialize(item) {
        if (!item.lastmod) {
          item.lastmod = new Date().toISOString()
        }
        return item;
      }
    }),
  ],
});
