import { categories, featured, products } from './catalog.mjs';
import { productCard, productDetail } from './catalog-view.mjs';

const instagram = 'https://www.instagram.com/samuarte2/';
const loaf = `<svg viewBox="0 0 62 26" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 17C3 12 13 8 27 5c15-3 29-3 31 2 2 4-8 11-24 14C18 24 6 22 4 17Z"/><path d="M15 9c0 4 3 7 7 8M25 6c0 4 3 7 7 8M35 4c0 4 3 7 7 8M45 3c0 3 2 6 6 7"/></svg>`;

export const wordmark = (root) => `
  <a class="brand" href="${root}" aria-label="Artifex, inicio">
    ${loaf}<span>Artifex</span>
  </a>`;

const header = (root, page) => `
  <header class="site-header">
    <div class="wrap header-inner">
      ${wordmark(root)}

      <nav class="site-nav" id="navigation" aria-label="Principal">
        <a href="${root}"${page === 'inicio' ? ' aria-current="page"' : ''}>Inicio</a>
        <a href="${root}panes/"${page === 'panes' ? ' aria-current="page"' : ''}>Nuestros panes</a>
        <a href="${root}#historia">Nuestra historia</a>
        <a href="${root}#contacto">Contacto</a>
      </nav>
      <div class="header-tools">
        <a class="button button-reserve cart-link" href="${root}reservar/"${page === 'carrito' ? ' aria-current="page"' : ''}>Carrito <span data-cart-count>0</span></a>
        <a class="admin-access" href="${root}admin/" aria-label="Administración, acceso de demo" title="Administración · Demo">
          <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="8" r="3.2"/><path d="M5 20v-1.5a4.5 4.5 0 0 1 4.5-4.5h5a4.5 4.5 0 0 1 4.5 4.5V20"/></svg>
        </a>
        <button class="menu-toggle" type="button" aria-controls="navigation" aria-expanded="false" hidden>Menú</button>
      </div>
    </div>
  </header>`;

const footer = (root) => `
  <footer class="site-footer" id="contacto">
    <div class="wrap">
      <div class="footer-content">
        <div>${wordmark(root)}<p class="footer-motto">Pan con alma</p></div>
        <div>
          <h2>Contacto</h2>
          <p>Emiliano Luján 531<br>Cochabamba, Bolivia</p>
          <a href="${instagram}">Instagram · @samuarte2</a>
        </div>
        <div>
          <h2>Reservas web</h2>
          <p>Elige tus panes y simula una reserva para recojo.</p>
          <a href="${root}reservar/">Ir al carrito</a>
        </div>
      </div>
      <div class="footer-end"><span>Demo comercial · Identidad gráfica provisional</span><a href="${root}admin/">Administración · acceso de demo</a><span>Desarrollado por StormType</span></div>
    </div>
  </footer>`;

export const layout = ({ root, page, title, description, content, customHeader }) => `<!doctype html>
<html lang="es-BO">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${description}">
  <meta name="theme-color" content="#17372d">
  <title>${title}</title>
  <link rel="stylesheet" href="${root}assets/site.css">
  ${customHeader ? `<link rel="stylesheet" href="${root}assets/admin.css">` : ''}
  <script type="module" src="${root}assets/${customHeader ? 'admin' : 'site'}.js"></script>
</head>
<body>
  <a class="skip" href="#contenido">Ir al contenido</a>
  ${customHeader || header(root, page)}
  <main id="contenido" tabindex="-1">${content}</main>
  ${customHeader ? '' : `${footer(root)}<p class="cart-feedback" id="cart-feedback" role="status"></p>`}
</body>
</html>
`;

function photo(root, assets, key, alt, { eager = false, label = false, fallback = '' } = {}) {
  const file = assets[key];
  return `<figure class="photo${file ? '' : ' photo-pending'}">
    ${file
      ? `<img src="${root}assets/${file}" alt="${alt}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`
      : `<div class="photo-note">Foto pendiente${fallback ? `<a href="${fallback}">Ver foto en Instagram</a>` : ''}</div>`}
    ${file && label ? '<figcaption>Imagen ilustrativa</figcaption>' : ''}
  </figure>`;
}

const descriptionNote = `Fotografías ilustrativas. Categorías, precios, días y horarios de referencia para la demo.`;

const localProductImage = (product, root, assets) => assets[product.image] ? `${root}assets/${assets[product.image]}` : '';

export function home(assets) {
  const root = './';
  const picks = featured.map(slug => products.find(product => product.slug === slug));
  const steps = [
    ['Elige tus panes', 'Explora los panes de cada hornada.'],
    ['Selecciona cuándo recogerlos', 'Elige uno de los horarios de recojo disponibles.'],
    ['Confirma tu reserva', 'Ten a mano el resumen de tus panes y del recojo.'],
  ];
  return layout({
    root, page: 'inicio', title: 'Artifex · Pan con alma',
    description: 'Panadería artesanal de fermentación natural en Cochabamba, Bolivia. Explora los panes de Artifex.',
    content: `
      <section class="hero" aria-labelledby="hero-title">
        <div class="hero-copy">
          <p class="eyebrow">Artifex · Panadería artesanal</p>
          <h1 id="hero-title">Pan con <em>alma</em></h1>
          <p>Panes de fermentación natural, elaborados con tiempo y dedicación en Cochabamba.</p>
          <div class="actions">
            <a class="button button-primary" href="./panes/">Explorar nuestros panes</a>
            <a class="text-link" href="#historia">Conocer la panadería</a>
          </div>
        </div>
        ${photo(root, assets, 'hero', 'Manos de un panadero sosteniendo una hogaza frente a un delantal verde', { eager: true, label: true })}
      </section>

      <section class="section wrap" aria-labelledby="featured-title">
        <div class="section-lead">
          <div><h2 id="featured-title">Nuestros panes</h2><p>Una selección de las elaboraciones de Artifex.</p></div>
          <a class="text-link" href="./panes/">Ver catálogo completo</a>
        </div>
        <div class="product-grid" data-public-products="featured">${picks.map(product => productCard(product, root, localProductImage(product, root, assets))).join('')}</div>
        <p class="demo-note">${descriptionNote}</p>
      </section>

      <section class="story" id="historia" aria-labelledby="story-title">
        <div class="story-mark" aria-hidden="true">${loaf}<span>Artifex</span></div>
        <div class="story-copy">
          <p class="eyebrow">Nuestra historia</p>
          <h2 id="story-title">El tiempo también es un ingrediente.</h2>
          <p>En Artifex, el pan empieza con buenos ingredientes y el tiempo de una fermentación natural. El cuidado del proceso se aprecia al cortar la hogaza, en la corteza que cruje y en la textura de la miga.</p>
          <a class="text-link" href="${instagram}">Conoce Artifex en Instagram</a>
        </div>
      </section>

      <section class="section wrap reserve" id="reservas" aria-labelledby="reserve-title">
        <h2 id="reserve-title">Cómo reservar</h2>
        <p class="reserve-intro">Prueba cómo sería reservar tus panes para recojo en Artifex.</p>
        <ol class="steps">${steps.map(([title, detail]) => `<li><h3>${title}</h3><p>${detail}</p></li>`).join('')}</ol>
        <a class="button button-primary" href="./panes/">Explorar nuestros panes</a>
      </section>`,
  });
}

export function catalog(assets) {
  const root = '../';
  return layout({
    root, page: 'panes', title: 'Nuestros panes · Artifex',
    description: 'Catálogo de Artifex con panes habituales y especiales de masa madre.',
    content: `
      <section class="catalog-heading" aria-labelledby="catalog-title">
        <div class="wrap"><p class="eyebrow">Panadería artesanal</p><h1 id="catalog-title">Nuestros panes</h1>
        <p>Explora las hogazas, baguettes y especialidades que Artifex ha compartido desde su obrador.</p></div>
      </section>
      <section class="section wrap catalog" aria-label="Catálogo de panes">
        <div class="filters" role="group" aria-label="Filtrar panes" hidden>
          <button type="button" data-filter="todos" aria-pressed="true">Todos los panes</button>
          ${Object.entries(categories).map(([key, category]) => `<button type="button" data-filter="${key}" aria-pressed="false">${category.label}</button>`).join('')}
        </div>
        <p class="demo-note catalog-note">${descriptionNote}</p>
        <p class="sr-only" role="status" id="filter-count"></p>
        <div class="product-grid" data-public-products="all">${products.map(product => productCard(product, root, localProductImage(product, root, assets))).join('')}</div>
      </section>`,
  });
}

export function detail(product, assets) {
  const root = '../../';
  return layout({
    root, page: 'detalle', title: product ? `${product.name} · Artifex` : 'Detalle del pan · Artifex',
    description: product?.description ?? 'Detalle de un pan de Artifex.',
    content: `<div class="wrap detail">
      <a class="text-link back" href="../">Volver a nuestros panes</a>
      <div data-public-product="${product?.slug ?? ''}">
        ${product ? productDetail(product, root, localProductImage(product, root, assets)) : '<noscript>Activa JavaScript para consultar este pan de la demo.</noscript>'}
      </div>
    </div>`,
  });
}
