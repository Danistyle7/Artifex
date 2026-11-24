import { maxQuantity } from './reservation-data.mjs';
import { readDemo, storageKey, updateDemo } from './reservation-store.js';

export const cartChange = 'artifex:cart-change';

export function initCart() {
  const count = document.querySelector('[data-cart-count]');
  const feedback = document.querySelector('#cart-feedback');
  const floating = document.querySelector('[data-floating-cart]');
  const floatingCount = floating?.querySelector('[data-floating-cart-count]');
  let feedbackTimer;

  function refreshCount() {
    let total = 0;
    try {
      total = Object.values(readDemo().cart).reduce((sum, quantity) => sum + quantity, 0);
    } catch {
      // Browsing remains possible if the browser blocks storage.
    }
    count.textContent = total;
    if (floating) {
      floating.hidden = total === 0;
      floatingCount.textContent = `${total} ${total === 1 ? 'producto' : 'productos'}`;
      document.body.classList.toggle('has-floating-cart', total > 0);
    }
  }

  function announce(message) {
    feedback.textContent = message;
    clearTimeout(feedbackTimer);
    feedbackTimer = setTimeout(() => { feedback.textContent = ''; }, 3000);
  }

  async function add(slug, quantity, button) {
    if (button.disabled || !Number.isInteger(quantity) || quantity < 1 || quantity > maxQuantity) return;

    button.disabled = true;
    try {
      const result = await updateDemo(({ cart, catalog }) => {
        const product = catalog.find(item => item.slug === slug && item.active);
        if (!product) return { message: 'Este producto ya no está disponible para reservar.' };
        const next = (cart[slug] ?? 0) + quantity;
        if (next > maxQuantity) return { message: `Puedes agregar hasta ${maxQuantity} unidades por producto.` };
        cart[slug] = next;
        return { added: true, message: `${product.name}: ${quantity} al carrito.` };
      });
      document.dispatchEvent(new Event(cartChange));
      announce(result.message);
      if (result.added) {
        button.textContent = 'Agregado';
        setTimeout(() => {
          button.textContent = 'Agregar';
          button.disabled = false;
        }, 450);
        return;
      }
    } catch {
      announce('El navegador no pudo guardar el carrito. Revisa el almacenamiento local.');
    }
    button.disabled = false;
  }

  document.querySelectorAll('[data-add], [data-add-form]').forEach(element => {
    element.hidden = false;
  });
  document.addEventListener('click', event => {
    const button = event.target.closest('button[data-add]');
    if (button) add(button.dataset.add, 1, button);
  });
  document.addEventListener('submit', event => {
    const form = event.target;
    if (!form.matches('[data-add-form]')) return;
    event.preventDefault();
    add(form.dataset.addForm, form.elements.quantity.valueAsNumber, form.querySelector('button'));
  });

  document.addEventListener(cartChange, refreshCount);
  window.addEventListener('pageshow', () => document.dispatchEvent(new Event(cartChange)));
  window.addEventListener('storage', event => {
    if (event.key === storageKey || event.key === null) document.dispatchEvent(new Event(cartChange));
  });
  refreshCount();
}
