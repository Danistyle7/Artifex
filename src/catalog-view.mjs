import { categories, products } from './catalog.mjs';
import { availabilityLabel, formatBs, maxQuantity } from './reservation-data.mjs';

const originalSlugs = new Set(products.map(({ slug }) => slug));
const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/gu, character => entities[character]);

export function productHref(root, slug) {
  return originalSlugs.has(slug)
    ? `${root}panes/${slug}/`
    : `${root}panes/detalle/?id=${encodeURIComponent(slug)}`;
}

export function imageAddress(value, root) {
  if (!value || value.length > 500) return '';
  try {
    const base = new URL(root);
    const image = new URL(value, base);
    const local = image.origin === base.origin && ['http:', 'https:'].includes(image.protocol);
    return !image.username && !image.password && (local || image.protocol === 'https:') ? image.href : '';
  } catch {
    return '';
  }
}

function productPhoto(product, image, detail) {
  const label = !product.imageUrl || product.imageUrl.startsWith('assets/') ? '<figcaption>Imagen ilustrativa</figcaption>' : '';
  return `<figure class="photo product-photo${image ? '' : ' photo-pending'}">
    <div class="photo-note"${image ? ' hidden' : ''}>Imagen no disponible</div>
    ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(product.alt || product.name)}" ${detail ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">` : ''}
    ${image && detail ? label : ''}
  </figure>`;
}

export function productCard(product, root, image, interactive = false) {
  const name = escapeHtml(product.name);
  return `<article class="product-card" data-category="${escapeHtml(product.category)}">
    ${productPhoto(product, image, false)}
    <div class="product-copy">
      <p class="availability">${escapeHtml(availabilityLabel(product))} · Demo</p>
      <h3>${name}</h3>
      <p class="product-description">${escapeHtml(product.description)}</p>
      <div class="product-meta">
        <p class="price"><strong>${formatBs(product.price)}</strong> <small>referencial</small></p>
        <a class="text-link" href="${productHref(root, product.slug)}" aria-label="Ver detalles de ${name}">Ver detalles</a>
      </div>
      <button class="button button-add" type="button" data-add="${escapeHtml(product.slug)}" aria-label="Agregar ${name} al carrito"${interactive ? '' : ' hidden'}>Agregar</button>
    </div>
  </article>`;
}

export function productDetail(product, root, image, interactive = false) {
  if (!product || product.active === false) {
    return `<section class="reservation-empty"><h1>Producto no disponible</h1>
      <p>Este producto ya no está disponible para nuevas reservas.</p>
      <a class="button button-primary" href="${root}panes/">Explorar otros productos</a></section>`;
  }

  const name = escapeHtml(product.name);
  return `<article class="detail-grid">
    ${productPhoto(product, image, true)}
    <div class="detail-copy">
      <p class="eyebrow">${categories[product.category].label} · Demo</p>
      <h1>${name}</h1>
      <p class="detail-description">${escapeHtml(product.description)}</p>
      <p class="price"><strong>${formatBs(product.price)}</strong> <small>precio referencial</small></p>
      <p class="availability">${escapeHtml(availabilityLabel(product))} · Demo</p>
      <form class="add-form" data-add-form="${escapeHtml(product.slug)}"${interactive ? '' : ' hidden'}>
        <label for="quantity">Cantidad</label>
        <div class="actions"><input id="quantity" name="quantity" type="number" min="1" max="${maxQuantity}" value="1" inputmode="numeric" required>
          <button class="button button-primary" type="submit" aria-label="Agregar ${name} al carrito">Agregar</button></div>
      </form>
      ${product.source ? `<a class="text-link" href="${escapeHtml(product.source)}">Ver publicación original</a>` : ''}
    </div>
  </article>`;
}
