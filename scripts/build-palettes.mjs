// Colour-only copies of the existing homepage, including its shared picker.
// Keep index.html untouched; regenerate these copies whenever it changes.
import { readFile, writeFile, rm } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const source = await readFile(new URL('index.html', root), 'utf8');
const variants = [
  { key: 'bosco', colour: '#0d241f' },
  { key: 'originale', colour: '#101923' },
  { key: 'blu-rosso', colour: '#101923' },
  { key: 'nero', colour: '#0b090a' }
];
for (const { key, colour } of variants) {
  const html = source
    .replace(/<html lang="it"(?: data-palette="[^"]*")?>/, `<html lang="it" data-palette="${key}">`)
    .replace(/<meta name="theme-color" content="[^"]*">/, `<meta name="theme-color" content="${colour}">`);
  // Shared palette assets already live in index's head. Never insert them twice.
  // A saved preference has priority; otherwise each preview uses its own preset.
  if (html.slice(html.indexOf('<body')) !== source.slice(source.indexOf('<body'))) throw new Error('A palette must not change the homepage content.');
  await writeFile(new URL(`home-${key}.html`, root), html);
  console.log(`Generated home-${key}.html`);
}
// These two colour studies were explicitly replaced, not additional options.
for (const old of ['home-prugna.html', 'home-carta.html']) await rm(new URL(old, root), { force: true });
