// astro.config.mjs
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  site: 'https://wisegoosegames.com',
  integrations: [
    react(),
    tailwind(),
    mdx(),
    sitemap({
      filter: (page) =>
        page !== 'https://wisegoosegames.com/steam-pulse/title-variants/' &&
        page !== 'https://wisegoosegames.com/privacy/' &&
        page !== 'https://wisegoosegames.com/terms/',
      serialize(item) {
        if (item.url.includes('/steam-pulse/week-')) {
          const weekStr = item.url.match(/week-(\d+)/)?.[1];
          if (weekStr) {
            const filePath = path.resolve(`./src/content/steam-pulse/week-${weekStr}.md`);
            if (fs.existsSync(filePath)) {
              const content = fs.readFileSync(filePath, 'utf-8');
              const dateMatch = content.match(/date:\s*['"]?(.*?)['"]?\r?\n/);
              if (dateMatch) item.lastmod = new Date(dateMatch[1]).toISOString();
            }
          }
        } else if (item.url.includes('/devlog/') && item.url !== 'https://wisegoosegames.com/devlog/') {
          const slugMatch = item.url.match(/\/devlog\/([^\/]+)\/$/);
          if (slugMatch) {
            const slug = slugMatch[1];
            let filePath = path.resolve(`./src/content/devlog/${slug}.md`);
            if (!fs.existsSync(filePath)) filePath = path.resolve(`./src/content/devlog/${slug}.mdx`);
            if (fs.existsSync(filePath)) {
              const content = fs.readFileSync(filePath, 'utf-8');
              const dateMatch = content.match(/date:\s*['"]?(.*?)['"]?\r?\n/);
              if (dateMatch) item.lastmod = new Date(dateMatch[1]).toISOString();
            }
          }
        }
        return item;
      }
    }),
  ],
});
