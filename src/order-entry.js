import { escapeHtml } from './catalog-view.mjs';
import { boliviaDate, boliviaTime, bolivianMobile, formatBs, maxQuantity, pickup, pickupWeekday, unavailableItems } from './reservation-data.mjs';
import { cartItems, cartTotal, createReservation, readDemo, updateDemo } from './reservation-store.js';

class EntryError extends Error {}

export function initOrderEntry(onSaved) {
  const dialog = document.querySelector('#register-dialog');
  const find = selector => dialog.querySelector(selector);
  const form = find('[data-order-entry]');
  const { source, customerName, phone, pickupDate, pickupTime, product, quantity, notes } = form.elements;
  const submit = find('[data-entry-submit]');
  const lines = find('[data-entry-items]');
  const add = find('[data-entry-add]');
  const error = find('[data-entry-error]');
  const counter = () => source.value === 'counter';
  let catalog = [];
  let cart = {};
  let saving = false;

  function showError(message = '') {
    error.textContent = message;
    error.hidden = !message;
  }

  function renderAmounts(items = cartItems(cart, catalog)) {
    find('[data-entry-total]').textContent = formatBs(cartTotal(items));
  }

  function renderItems() {
    const items = cartItems(cart, catalog);
    lines.innerHTML = items.length
      ? `<ul class="order-entry-list">${items.map(({ product: item, quantity: units, subtotal }) => `
        <li data-entry-row="${escapeHtml(item.slug)}">
          <div><strong>${escapeHtml(item.name)}</strong><small>${formatBs(item.price)} por unidad</small></div>
          <input type="number" min="1" max="${maxQuantity}" inputmode="numeric" value="${units}" required
            aria-label="Cantidad de ${escapeHtml(item.name)}" data-entry-quantity>
          <span data-entry-subtotal>${formatBs(subtotal)}</span>
          <button class="text-link link-button" type="button" data-entry-remove
            aria-label="Quitar ${escapeHtml(item.name)}">Quitar</button>
        </li>`).join('')}</ul>`
      : '<p class="admin-meta">Agrega al menos un producto.</p>';
    renderAmounts(items);
  }

  function refreshChoices() {
    const selected = product.value;
    const weekday = pickupWeekday(pickupDate.value);
    const active = catalog.filter(item => item.active);
    const choices = active.map(item => {
      const allowed = counter() || !unavailableItems([{ product: item }], { weekday }).length;
      const option = new Option(`${item.name} · ${formatBs(item.price)}${allowed ? '' : ' · No disponible ese día'}`, item.slug);
      option.disabled = !allowed;
      return option;
    });
    product.replaceChildren(new Option('Elige un producto', ''), ...choices);
    if (choices.some(option => option.value === selected && !option.disabled)) product.value = selected;
    add.disabled = !choices.some(option => !option.disabled);
    const conflict = !counter() && unavailableItems(cartItems(cart, catalog), { weekday }).length > 0;
    find('[data-entry-help]').textContent = conflict
      ? 'Hay productos de la selección que no están disponibles para esa fecha. Quita esos productos o cambia el día.'
      : add.disabled ? 'No hay productos activos disponibles para este registro.' : '';
  }

  function syncType() {
    const sale = counter();
    const today = boliviaDate();
    find('[data-entry-customer]').hidden = sale;
    find('[data-entry-phone]').hidden = sale;
    customerName.disabled = sale;
    phone.disabled = sale;
    pickupDate.max = sale ? today : '';
    if (sale && pickupDate.value > today) pickupDate.value = today;
    find('[data-entry-date-label]').textContent = sale ? 'Fecha de venta' : 'Fecha de recojo';
    find('[data-entry-time-label]').textContent = sale ? 'Hora de venta' : 'Hora de recojo';
    submit.textContent = sale ? 'Guardar venta' : 'Guardar reserva';
    find('[data-entry-note]').textContent = sale
      ? 'La venta se registrará como entregada en esta demostración.'
      : 'La reserva se registrará como pendiente en esta demostración.';
    showError();
    refreshChoices();
  }

  function open(date) {
    try {
      catalog = readDemo().catalog;
    } catch {
      return false;
    }
    form.reset();
    cart = {};
    pickupDate.value = date || boliviaDate();
    pickupTime.value = boliviaTime();
    syncType();
    renderItems();
    dialog.showModal();
    source.focus();
    return true;
  }

  source.addEventListener('change', syncType);
  pickupDate.addEventListener('input', () => {
    showError();
    refreshChoices();
  });
  add.addEventListener('click', () => {
    showError();
    if (!product.value) {
      showError('Elige un producto de la lista.');
      product.focus();
      return;
    }
    const units = quantity.valueAsNumber;
    const next = units + (cart[product.value] ?? 0);
    if (!Number.isInteger(units) || units < 1 || next > maxQuantity) {
      showError(`Ingresa una cantidad de 1 a ${maxQuantity} unidades por producto.`);
      quantity.focus();
      return;
    }
    cart[product.value] = next;
    quantity.value = 1;
    renderItems();
    product.focus();
  });
  lines.addEventListener('click', event => {
    const button = event.target.closest('[data-entry-remove]');
    if (!button) return;
    delete cart[button.closest('[data-entry-row]').dataset.entryRow];
    showError();
    renderItems();
    refreshChoices();
    product.focus();
  });
  lines.addEventListener('input', event => {
    const field = event.target.closest('[data-entry-quantity]');
    if (!field || !field.validity.valid) return;
    const row = field.closest('[data-entry-row]');
    cart[row.dataset.entryRow] = field.valueAsNumber;
    const items = cartItems(cart, catalog);
    const item = items.find(({ product }) => product.slug === row.dataset.entryRow);
    row.querySelector('[data-entry-subtotal]').textContent = formatBs(item.subtotal);
    renderAmounts(items);
    showError();
  });
  dialog.addEventListener('cancel', event => {
    if (saving) event.preventDefault();
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (saving) return;
    const sale = counter();
    const date = pickupDate.value;
    const slot = pickupTime.value;
    const weekday = pickupWeekday(date);
    const name = sale ? 'Venta de mostrador' : customerName.value.trim();
    const contact = sale ? '' : phone.value.trim();
    const number = contact ? bolivianMobile(contact) : '';
    const description = notes.value.trim();
    const displayed = cartItems(cart, catalog);

    showError();
    if (!name) {
      showError('Escribe el nombre del cliente.');
      customerName.focus();
      return;
    }
    if (contact && !number) {
      showError('Escribe un celular boliviano de 8 dígitos o deja el campo vacío.');
      phone.focus();
      return;
    }
    if (weekday === undefined || (sale ? date > boliviaDate() : !pickup.weekdays[weekday]?.length)) {
      showError(sale ? 'Elige la fecha de una venta ya realizada.' : 'Elige una fecha habilitada para el recojo.');
      pickupDate.focus();
      return;
    }
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/u.test(slot) || (sale && date === boliviaDate() && slot > boliviaTime())) {
      showError(sale ? 'Escribe la hora en que se realizó la venta.' : 'Escribe una hora válida.');
      pickupTime.focus();
      return;
    }
    if (!displayed.length) {
      showError('Agrega al menos un producto.');
      product.focus();
      return;
    }
    if (!sale && unavailableItems(displayed, { weekday }).length) {
      showError('Ajusta los productos o la fecha para registrar el pedido.');
      return;
    }

    saving = true;
    submit.disabled = true;
    find('.admin-dialog-head button').disabled = true;
    try {
      const booking = await updateDemo(state => {
        const current = cartItems(cart, state.catalog);
        if (current.some(({ product }) => !product.active) || JSON.stringify(current) !== JSON.stringify(displayed)) {
          throw new EntryError('El catálogo cambió. Revisa los productos y vuelve a guardar.');
        }
        return createReservation(state, {
          customer: { name, phone: number },
          items: current,
          pickup: { date, slot },
          notes: description,
          source: sale ? 'counter' : 'whatsapp',
          status: sale ? 'entregado' : 'pendiente',
        });
      });
      dialog.close();
      onSaved(booking);
    } catch (failure) {
      if (failure instanceof EntryError) {
        try {
          catalog = readDemo().catalog;
          for (const slug of Object.keys(cart)) {
            if (!catalog.some(item => item.slug === slug && item.active)) delete cart[slug];
          }
          renderItems();
          refreshChoices();
        } catch {
          // Preserve the current selection if storage is temporarily unavailable.
        }
      }
      showError(failure instanceof EntryError ? failure.message : 'No se pudo guardar el registro. Vuelve a intentarlo.');
    } finally {
      saving = false;
      submit.disabled = false;
      find('.admin-dialog-head button').disabled = false;
    }
  });

  return { open };
}
