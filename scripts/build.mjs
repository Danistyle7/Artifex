import { copyFile, mkdir, readdir, writeFile } from 'node:fs/promises';
import { products } from '../src/catalog.mjs';
import { adminPage } from '../src/admin-page.mjs';
import { catalog, detail, home } from '../src/pages.mjs';
import { reservationCheckout, reservationConfirmation } from '../src/reservation-pages.mjs';

const dist = new URL('../dist/', import.meta.url);
const publicAssets = new URL('../public/', import.meta.url);
const outputAssets = new URL('assets/', dist);
await mkdir(outputAssets, { recursive: true });

const files = await readdir(publicAssets);
const images = files.filter(name => /\.(jpg|webp)$/u.test(name));
const assets = Object.fromEntries(images.map(name => [name.replace(/\.(jpg|webp)$/u, ''), name]));
await Promise.all([
  ...images.map(name => copyFile(new URL(name, publicAssets), new URL(name, outputAssets))),
  ...['site.css', 'site.js', 'catalog.mjs', 'cart.js', 'reservation.js', 'reservation-data.mjs', 'reservation-store.js', 'ticket-pdf.js', 'catalog-view.mjs', 'public-catalog.js', 'admin.js', 'order-entry.js', 'admin-data.mjs', 'admin.css'].map(name => copyFile(new URL(`../src/${name}`, import.meta.url), new URL(name, outputAssets))),
]);

const pages = [
  ['', home(assets)], ['panes/', catalog(assets)],
  ['reservar/', reservationCheckout()], ['reserva/', reservationConfirmation()],
  ['admin/', adminPage()], ['panes/detalle/', detail(null, assets)],
];
for (const product of products) {
  pages.push([`panes/${product.slug}/`, detail(product, assets)]);
}

for (const [route, html] of pages) {
  const directory = new URL(route, dist);
  await mkdir(directory, { recursive: true });
  await writeFile(new URL('index.html', directory), html);
}
await writeFile(new URL('.nojekyll', dist), '');
console.log(`Artifex · ${pages.length} páginas estáticas en dist/`);
