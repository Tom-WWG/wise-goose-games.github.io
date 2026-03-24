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
      filter: (page) =>
        page !== 'https://wisegoosegames.com/steam-pulse/title-variants/',
      serialize(item) {
        // Remove build-time lastmod for all pages — inaccurate timestamps mislead crawlers
        // Steam Pulse reports get real dates via Article schema (H-3)
        delete item.lastmod;
        return item;
      }
    }),
  ],
});
