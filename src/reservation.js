import { cartChange } from './cart.js';
import { availabilityLabel, bolivianMobile, formatBs, formatPickupDate, maxQuantity, pickupDates, unavailableItems } from './reservation-data.mjs';
import { cartItems, cartTotal, createReservation, draftKey, readDemo, updateDemo } from './reservation-store.js';
import { escapeHtml } from './catalog-view.mjs';
import { downloadTicket } from './ticket-pdf.js';

function confirmationUrl(reservation) {
  const url = new URL('../reserva/', import.meta.url);
  url.searchParams.set('id', reservation.id);
  return url;
}

function replaceOptions(select, placeholder, options) {
  const previous = select.value;
  select.replaceChildren(new Option(placeholder, ''), ...options);
  if (options.some(option => option.value === previous)) select.value = previous;
}

function checkout(container) {
  const find = selector => container.querySelector(selector);
  const form = find('form');
  const date = form.elements.pickupDate;
  const slot = form.elements.pickupSlot;
  const submit = form.querySelector('[type="submit"]');
  const cartPanel = find('[data-cart-panel]');
  const formPanel = find('[data-form-panel]');
  const lines = find('[data-cart-items]');
  const incompatible = find('[data-incompatible]');
  const suggestion = find('[data-suggest-date]');
  const storageError = find('[data-storage-error]');
  const lastReservation = find('[data-last-reservation]');
  const requiredFields = [date, slot, form.elements.customerName, form.elements.phone];
  let items = [];
  let displayedCart = '';
  let dates = pickupDates();
  let submitting = false;
  let changingCart = false;

  function showStep(step, moveFocus = true) {
    cartPanel.hidden = step !== 'cart';
    formPanel.hidden = step !== 'form';
    container.querySelectorAll('[data-step]').forEach(node => {
      if (node.dataset.step === step) node.setAttribute('aria-current', 'step');
      else node.removeAttribute('aria-current');
    });
    if (moveFocus) (step === 'cart' ? cartPanel : formPanel).querySelector('h2').focus();
  }

  function showError(message = '') {
    storageError.textContent = message;
    storageError.hidden = !message;
  }

  function setError(field, message = '') {
    field.setAttribute('aria-invalid', String(Boolean(message)));
    document.getElementById(`error-${field.id}`).textContent = message;
  }

  function checkPickup() {
    const selected = dates.find(option => option.date === date.value);
    replaceOptions(slot, 'Elige una hora', (selected?.slots ?? []).map(hour => new Option(hour, hour)));
    slot.disabled = !selected;
    const conflicts = unavailableItems(items, selected);
    const inactive = conflicts.filter(({ product }) => !product.active);
    const compatibleDates = dates.filter(option => unavailableItems(items, option).length === 0);
    const compatible = compatibleDates.find(option => !selected || option.date >= selected.date) ?? compatibleDates.at(-1);
    const noCommonDate = items.length > 0 && !compatible;
    incompatible.hidden = !conflicts.length && !noCommonDate;
    const names = (inactive.length ? inactive : conflicts).map(({ product }) => product.name).join(', ');
    find('[data-incompatible-message]').textContent = inactive.length
      ? `${names}: disponibilidad cambiada. Retira del carrito los productos indicados para continuar.`
      : noCommonDate
        ? 'No hay una fecha próxima en la que estén disponibles todos los productos de tu carrito. Puedes editar tu carrito.'
        : conflicts.length ? `Para esta fecha faltaría: ${names}. Puedes elegir otro día o editar tu carrito.` : '';
    const alternative = conflicts.length && compatible && compatible.date !== selected?.date ? compatible : null;
    suggestion.hidden = !alternative;
    suggestion.dataset.date = alternative?.date ?? '';
    suggestion.textContent = alternative ? `Elegir ${alternative.label}` : '';
    submit.disabled = submitting || noCommonDate || conflicts.length > 0;
  }

  function showDateOptions() {
    replaceOptions(date, 'Elige una fecha', dates.map(option => {
      const label = unavailableItems(items, option).length ? `${option.label} · faltan productos` : option.label;
      return new Option(label, option.date);
    }));
    checkPickup();
  }

  function refreshDates() {
    dates = pickupDates();
    showDateOptions();
  }

  function saveDraft() {
    try {
      sessionStorage.setItem(draftKey, JSON.stringify(Object.fromEntries(new FormData(form))));
    } catch {
      // The current form keeps its values even if session storage is unavailable.
    }
  }

  function restoreDraft() {
    try {
      const draft = JSON.parse(sessionStorage.getItem(draftKey));
      if (!draft) return;
      for (const field of [date, form.elements.customerName, form.elements.phone, form.elements.notes]) {
        field.value = draft[field.name] ?? '';
      }
      checkPickup();
      slot.value = draft.pickupSlot ?? '';
    } catch {
      // A missing draft does not prevent using the form.
    }
  }

  function render() {
    try {
      const state = readDemo();
      items = cartItems(state.cart, state.catalog);
      displayedCart = JSON.stringify(items);
      const last = state.reservations.findLast(reservation => reservation?.id && (!reservation.source || reservation.source === 'demo'));
      lastReservation.hidden = !last?.id;
      if (last?.id) lastReservation.href = confirmationUrl(last).href;
    } catch {
      showError('No se puede leer el carrito. Habilita el almacenamiento local para usar la demo.');
      return;
    }

    find('[data-empty]').hidden = items.length > 0;
    find('[data-flow]').hidden = !items.length;
    if (!items.length) showStep('cart', false);
    lines.innerHTML = items.map(({ product, quantity, subtotal }) => `
      <article class="cart-item">
        <div>
          <h3>${escapeHtml(product.name)}</h3>
          <p>${formatBs(product.price)} por unidad</p>
          <p class="availability">${product.active ? `${escapeHtml(availabilityLabel(product))} · Demo` : 'Inactivo · retíralo para continuar'}</p>
        </div>
        <div class="cart-item-controls">
          <div class="quantity" role="group" aria-label="Cantidad de ${escapeHtml(product.name)}">
            <button type="button" data-slug="${product.slug}" data-change="minus" aria-label="Disminuir cantidad de ${escapeHtml(product.name)}"${quantity <= 1 ? ' disabled' : ''}>−</button>
            <span>${quantity}</span>
            <button type="button" data-slug="${product.slug}" data-change="plus" aria-label="Aumentar cantidad de ${escapeHtml(product.name)}"${quantity >= maxQuantity || !product.active ? ' disabled' : ''}>+</button>
          </div>
          <strong>${formatBs(subtotal)}</strong>
          <button class="text-link link-button" type="button" data-slug="${product.slug}" data-change="remove" aria-label="Eliminar ${escapeHtml(product.name)}">Eliminar</button>
        </div>
      </article>`).join('');

    const total = formatBs(cartTotal(items));
    find('[data-subtotal]').textContent = total;
    find('[data-total]').textContent = total;
    showDateOptions();
  }

  lines.addEventListener('click', async event => {
    const button = event.target.closest('[data-change]');
    if (!button || changingCart) return;
    const { slug, change } = button.dataset;
    changingCart = true;
    try {
      await updateDemo(({ cart, catalog }) => {
        if (!cart[slug]) return;
        if (change === 'remove') delete cart[slug];
        else if (change === 'plus') {
          if (catalog.some(product => product.slug === slug && product.active)) cart[slug] = Math.min(maxQuantity, cart[slug] + 1);
        }
        else cart[slug] = Math.max(1, cart[slug] - 1);
      });
      showError();
      document.dispatchEvent(new Event(cartChange));
      const replacement = lines.querySelector(`[data-slug="${slug}"][data-change="${change}"]:not(:disabled)`);
      const fallback = lines.querySelector(`[data-slug="${slug}"]:not(:disabled)`);
      (replacement ?? fallback ?? (items.length ? find('#cart-heading') : find('[data-empty] a'))).focus();
    } catch {
      showError('No se pudo actualizar el carrito. Vuelve a intentarlo.');
    } finally {
      changingCart = false;
    }
  });

  find('[data-continue]').addEventListener('click', () => {
    refreshDates();
    showStep('form');
  });
  container.querySelectorAll('[data-edit]').forEach(button => button.addEventListener('click', () => showStep('cart')));
  suggestion.addEventListener('click', () => {
    if (!suggestion.dataset.date) return;
    date.value = suggestion.dataset.date;
    date.dispatchEvent(new Event('change'));
    slot.focus();
  });
  date.addEventListener('change', () => {
    slot.value = '';
    setError(date);
    setError(slot);
    checkPickup();
    saveDraft();
  });
  form.addEventListener('input', event => {
    if (requiredFields.includes(event.target)) setError(event.target);
    saveDraft();
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submitting) return;
    showError();
    const selected = pickupDates().find(option => option.date === date.value);
    const selectedSlot = slot.value;
    const name = form.elements.customerName.value.trim();
    const phone = bolivianMobile(form.elements.phone.value);
    const notes = form.elements.notes.value.trim();
    const errors = [
      selected ? '' : 'Selecciona una fecha de recojo habilitada.',
      selected?.slots.includes(selectedSlot) ? '' : 'Elige una hora de recojo para esa fecha.',
      name ? '' : 'Ingresa tu nombre.',
      phone ? '' : 'Ingresa un celular boliviano de 8 dígitos. Puedes incluir +591.',
    ];
    requiredFields.forEach((field, index) => setError(field, errors[index]));
    const firstError = errors.findIndex(Boolean);
    if (firstError !== -1) {
      const invalid = requiredFields[firstError];
      (invalid.disabled ? date : invalid).focus();
      return;
    }

    const expectedCart = displayedCart;
    submitting = true;
    submit.disabled = true;
    try {
      const reservation = await updateDemo(state => {
        const current = cartItems(state.cart, state.catalog);
        if (JSON.stringify(current) !== expectedCart || !current.length) {
          throw new CheckoutError('Tu carrito cambió. Revísalo antes de confirmar.');
        }
        const currentDate = pickupDates().find(option => option.date === selected.date);
        if (!currentDate?.slots.includes(selectedSlot) || unavailableItems(current, currentDate).length) {
          throw new CheckoutError('La fecha o la hora ya no está disponible para tu selección. Elige otra opción.');
        }

        const booking = createReservation(state, {
          customer: { name, phone },
          items: current,
          pickup: { date: currentDate.date, slot: selectedSlot },
          notes,
        });
        state.cart = {};
        return booking;
      });

      try {
        sessionStorage.removeItem(draftKey);
      } catch {
        // The reservation is already saved.
      }
      window.location.replace(confirmationUrl(reservation).href);
    } catch (error) {
      submitting = false;
      showError(error instanceof CheckoutError
        ? error.message
        : 'No se pudo guardar la reserva. Tu carrito sigue disponible para reintentar.');
      render();
      refreshDates();
      storageError.tabIndex = -1;
      storageError.focus();
    }
  });

  document.addEventListener(cartChange, render);
  render();
  refreshDates();
  restoreDraft();
}

class CheckoutError extends Error {}

function confirmation(container) {
  const find = selector => container.querySelector(selector);
  const id = new URLSearchParams(window.location.search).get('id');
  let booking;
  try {
    booking = readDemo().reservations.find(reservation => reservation?.id === id);
  } catch {
    // Show the same recovery link when local storage is unavailable.
  }
  if (!booking) {
    find('[data-missing]').hidden = false;
    return;
  }

  find('[data-code]').textContent = booking.code;
  find('[data-customer]').textContent = booking.customer.name;
  find('[data-pickup-date]').textContent = formatPickupDate(booking.pickup.date);
  find('[data-pickup-slot]').textContent = booking.pickup.slot;
  find('[data-note-row]').hidden = !booking.notes;
  find('[data-notes]').textContent = booking.notes;
  find('[data-booking-total]').textContent = formatBs(booking.total);
  find('[data-booking-items]').replaceChildren(...booking.items.map(item => {
    const row = document.createElement('tr');
    for (const value of [item.name, item.quantity, formatBs(item.unitPrice), formatBs(item.subtotal)]) {
      const cell = row.insertCell();
      cell.textContent = value;
    }
    return row;
  }));
  document.title = `Constancia Artifex ${booking.code}`;
  find('[data-download-ticket]').addEventListener('click', () => {
    const error = find('[data-ticket-error]');
    error.hidden = true;
    try {
      downloadTicket(booking);
    } catch {
      error.hidden = false;
    }
  });
  find('[data-booking]').hidden = false;
  if (window.location.hash === '#resumen') document.querySelector('#resumen').scrollIntoView();
}

export function initReservation() {
  const cart = document.querySelector('[data-checkout]');
  const receipt = document.querySelector('[data-confirmation]');
  if (cart) checkout(cart);
  if (receipt) confirmation(receipt);
}
