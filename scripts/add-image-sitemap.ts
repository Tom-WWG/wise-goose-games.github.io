import fs from 'fs';
import path from 'path';
import { games } from '../src/data/games.ts'; // tsx resolves this seamlessly

const distDir = path.resolve('./dist');
const sitemapPath = path.join(distDir, 'sitemap-0.xml');

if (!fs.existsSync(sitemapPath)) {
  console.log('Sitemap not found, skipping image sitemap injection.');
  process.exit(0);
}

let sitemap = fs.readFileSync(sitemapPath, 'utf8');

// CR-M1a: Verify xmlns:image exists
if (!sitemap.includes('xmlns:image=')) {
  sitemap = sitemap.replace('<urlset ', '<urlset xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" ');
}

// CR-M1b: Extract data dynamically
const game = games.find(g => g.id === "pathways-poltergeists");
if (!game) {
  console.log('Game not found in data, skipping.');
  process.exit(0);
}

const gameUrl = `https://wisegoosegames.com/games/${game.id}/`;
const screenshots = game.steamAssets?.screenshots || [];
const alts = game.steamAssets?.screenshotAlts || [];

let imageXml = '';
for (let i = 0; i < screenshots.length; i++) {
  const url = screenshots[i].startsWith('http') ? screenshots[i] : `https://wisegoosegames.com${screenshots[i]}`;
  const alt = alts[i] || game.title;
  imageXml += `\n    <image:image>\n      <image:loc>${url}</image:loc>\n      <image:caption>${alt}</image:caption>\n    </image:image>`;
}

const urlRegex = new RegExp(`(<loc>${gameUrl}</loc>[\\s\\S]*?)(</url>)`);
if (sitemap.match(urlRegex)) {
  sitemap = sitemap.replace(urlRegex, `$1${imageXml}\n  $2`);
  fs.writeFileSync(sitemapPath, sitemap);
  console.log('Successfully injected image sitemap entries dynamically from games.ts.');
} else {
  console.log('Game URL not found in sitemap, could not inject images.');
}
