import { products } from './catalog.mjs';
import { maxQuantity } from './reservation-data.mjs';

export const storageKey = 'artifex:demo:v1';
export const draftKey = `${storageKey}:draft`;

export function initialCatalog() {
  return products.map(product => ({
    ...product,
    pickupDays: Array.isArray(product.pickupDays) ? [...product.pickupDays] : product.pickupDays,
    imageUrl: `assets/${product.image}.jpg`,
    active: true,
  }));
}

export function readDemo() {
  const raw = localStorage.getItem(storageKey);
  let saved;
  try {
    saved = JSON.parse(raw);
  } catch {
    saved = null;
  }

  const catalog = Array.isArray(saved?.catalog) ? saved.catalog : initialCatalog();
  const cart = Object.fromEntries(catalog.flatMap(({ slug }) => {
    const quantity = saved?.cart?.[slug];
    return Number.isInteger(quantity) && quantity > 0 && quantity <= maxQuantity ? [[slug, quantity]] : [];
  }));
  return {
    cart,
    catalog,
    reservations: Array.isArray(saved?.reservations) ? saved.reservations : [],
    examplesInitialized: saved?.examplesInitialized === true,
  };
}

export function cartItems(cart, catalog) {
  return catalog.filter(product => cart[product.slug]).map(product => {
    const quantity = cart[product.slug];
    return { product, quantity, subtotal: Math.round(product.price * 100) * quantity / 100 };
  });
}

export function cartTotal(items) {
  return items.reduce((cents, item) => cents + Math.round(item.subtotal * 100), 0) / 100;
}

export async function updateDemo(update) {
  const commit = () => {
    const state = readDemo();
    const result = update(state);
    localStorage.setItem(storageKey, JSON.stringify(state));
    return result;
  };

  return navigator.locks ? navigator.locks.request(storageKey, commit) : commit();
}
