import { featured } from './catalog.mjs';
import { imageAddress, productCard, productDetail } from './catalog-view.mjs';
import { cartChange } from './cart.js';
import { initialCatalog, readDemo } from './reservation-store.js';

export function initPublicCatalog() {
  const grid = document.querySelector('[data-public-products]');
  const detail = document.querySelector('[data-public-product]');
  if (!grid && !detail) return;

  const root = new URL('../', import.meta.url).href;
  let fingerprint = detail?.dataset.publicProduct === '' ? '' : JSON.stringify(initialCatalog());
  const image = product => imageAddress(product.imageUrl, root);

  function render() {
    let catalog;
    try {
      catalog = readDemo().catalog;
    } catch {
      catalog = initialCatalog();
    }
    const next = JSON.stringify(catalog);
    if (fingerprint === next) return;
    fingerprint = next;

    if (grid) {
      const active = catalog.filter(product => product.active);
      let selection = grid.dataset.publicProducts === 'featured'
        ? featured.map(slug => active.find(product => product.slug === slug)).filter(Boolean)
        : active;
      if (!selection.length && active.length) selection = active.slice(0, 3);
      grid.innerHTML = selection.length
        ? selection.map(product => productCard(product, root, image(product), true)).join('')
        : '<p>Por ahora no hay productos disponibles para nuevas reservas.</p>';
      grid.dispatchEvent(new Event('artifex:products-rendered', { bubbles: true }));
    }

    if (detail) {
      const slug = detail.dataset.publicProduct || new URLSearchParams(location.search).get('id');
      const product = catalog.find(item => item.slug === slug && item.active);
      detail.innerHTML = productDetail(product, root, product ? image(product) : '', true);
      document.title = product ? `${product.name} · Artifex` : 'Producto no disponible · Artifex';
    }
  }

  document.addEventListener('error', event => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement) || !image.closest('.product-photo')) return;
    image.hidden = true;
    const photo = image.closest('.product-photo');
    photo.classList.add('photo-pending');
    photo.querySelector('.photo-note').hidden = false;
    photo.querySelector('figcaption')?.remove();
  }, true);
  document.addEventListener(cartChange, render);
  render();
}
