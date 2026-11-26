import { categories } from './catalog.mjs';
import { escapeHtml, imageAddress } from './catalog-view.mjs';
import { availabilityLabel, boliviaDate, formatBs, formatPickupDate, isCounterSale, newDemoId, orderSources } from './reservation-data.mjs';
import { draftKey, initialCatalog, readDemo, storageKey, updateDemo } from './reservation-store.js';
import { canMarkUncollected, deliveryDate, exampleOrders, filterOrders, isClosedOrder, normalizeSearch, ordersOn, paginate, panesIn, pickupAgenda, production, salesOn, shiftDate, sortedOrders, statuses, summary } from './admin-data.mjs';
import { initOrderEntry } from './order-entry.js';
import { downloadTicket } from './ticket-pdf.js';

const find = selector => document.querySelector(selector);
const all = selector => [...document.querySelectorAll(selector)];
const root = new URL('../', import.meta.url).href;
const summaryDate = find('#summary-date');
const productionDate = find('#production-date');
const orderDate = find('#order-date');
const period = find('#order-period');
const fromDate = find('#order-from');
const toDate = find('#order-to');
const orderStatus = find('#order-status');
const orderSource = find('#order-source');
const search = find('#order-search');
const productSearch = find('#product-search');
const productCategory = find('#product-category');
const productStatus = find('#product-status');
const orderDialog = find('#order-dialog');
const productDialog = find('#product-dialog');
const resetDialog = find('#reset-dialog');
const actionDialog = find('#action-dialog');
const productForm = find('[data-product-form]');
const stateForm = find('[data-order-state]');
const dayFields = all('[data-product-form] [name="days"]');
const imageFile = find('[data-image-file]');
const imagePreview = find('[data-image-preview]');
let imageObjectUrl;
const nextStatus = { pendiente: 'preparado', preparado: 'entregado' };
const quickLabel = { preparado: 'Marcar preparado', entregado: 'Marcar entregado' };
let state;
let selectedDate = boliviaDate();
let selectedOrder;
let selectedProduct;
let activePanel;
let ordersView = 'work';
let page = 1;
let relatedProduct;
let pendingAction;
let writing = false;
let messageTimer;

function message(text = '') {
  const status = find('[data-message]');
  status.textContent = text;
  clearTimeout(messageTimer);
  if (text) messageTimer = setTimeout(() => { status.textContent = ''; }, 5200);
}

function showError(selector, text = '') {
  const element = find(selector);
  element.textContent = text;
  element.hidden = !text;
}

const badge = status => `<span class="admin-badge" data-status="${escapeHtml(status)}">${escapeHtml(statuses[status] ?? status)}</span>`;
const orderButton = id => `<button class="text-link link-button" type="button" data-order-id="${escapeHtml(id)}">Ver detalle</button>`;
const empty = (title, text, action = '') => `<div class="admin-empty"><strong>${title}</strong><p>${text}</p>${action}</div>`;

function metrics(cards) {
  return cards.map(([label, value]) => `<div class="admin-metric"><p>${label}</p><strong>${value}</strong></div>`).join('');
}

function table(label, headings, rows) {
  return `<table class="admin-table" aria-label="${label}">
    <thead><tr>${headings.map(heading => `<th scope="col">${heading}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(row => `<tr>${row.map((cell, index) => `<td data-label="${headings[index]}"><div class="admin-cell">${cell}</div></td>`).join('')}</tr>`).join('')}</tbody>
  </table>`;
}

function timingLabel(date, today) {
  if (date === today) return 'Hoy';
  if (date === shiftDate(today, 1)) return 'Mañana';
  return date > today ? 'Programado' : '';
}

const describeDate = (date, today) => `${date === today ? 'Hoy · ' : ''}${formatPickupDate(date)}`;

const sourceLabel = order => orderSources[order.source] ?? orderSources.demo;

function orderPreview(orders) {
  return `<ul class="admin-upcoming">${orders.slice(0, 3).map(order => `<li>
    <div><strong>${escapeHtml(order.customer.name)}</strong><small>${escapeHtml(order.code)} · ${escapeHtml(order.pickup.slot)} · ${panesIn(order)} u. · ${sourceLabel(order)}</small></div>
    <div class="admin-upcoming-action">${badge(order.status)}${orderButton(order.id)}</div>
  </li>`).join('')}</ul>`;
}

function renderSummary() {
  const today = boliviaDate();
  const orders = state.reservations;
  const scheduled = ordersOn(orders, selectedDate);
  const values = summary(scheduled.filter(order => !isCounterSale(order)));
  const daily = sortedOrders(orders.filter(order => order.pickup.date === selectedDate ||
    (order.status === 'entregado' && deliveryDate(order) === selectedDate)));
  const sales = salesOn(orders, selectedDate);
  find('[data-day-description]').textContent = describeDate(selectedDate, today);
  find('[data-metrics]').innerHTML = metrics([
    ['Reservas', values.orders], ['Por preparar', values.pending], ['Listos para recoger', values.prepared], ['Unidades reservadas', values.quantity],
  ]);
  find('[data-value-metrics]').innerHTML = `<dl class="admin-summary-details">
    <div><dt>Entregados</dt><dd>${values.delivered}</dd></div>
    <div><dt>No recogidos</dt><dd>${values.uncollected}</dd></div>
    <div><dt>Cancelados</dt><dd>${values.cancelled}</dd></div>
    <div><dt>Valor de reservas sin cancelar</dt><dd>${formatBs(values.reservedValue)}</dd></div>
  </dl>`;

  find('[data-sales-metrics]').innerHTML = metrics([
    ['Unidades vendidas', sales.units], ['Reservas entregadas', formatBs(sales.reservationValue)],
    ['Ventas de mostrador', formatBs(sales.counterValue)], ['Valor total de ventas', formatBs(sales.value)],
  ]);
  const soldProducts = find('[data-sold-products]');
  soldProducts.hidden = !sales.products.length;
  find('[data-sales-products]').innerHTML = sales.products.length
    ? table('Productos vendidos', ['Producto', 'Unidades', 'Importe'], sales.products.map(product => [
      escapeHtml(product.name), product.quantity, formatBs(product.cents / 100),
    ])) : '';

  const groups = [
    ['Por atender', daily.filter(order => !isClosedOrder(order.status)), ''],
    ['Entregados', daily.filter(order => order.status === 'entregado'), 'entregado'],
    ['No recogidos o cancelados', daily.filter(order => order.status === 'no_recogido' || order.status === 'cancelado'), ''],
  ];
  find('[data-day-orders]').disabled = !daily.length;
  find('[data-daily-orders]').innerHTML = daily.length
    ? groups.filter(([, records]) => records.length).map(([label, records, status]) => `
      <section class="daily-orders-group">
        <div class="admin-subhead"><h3>${label} · ${records.length}</h3>
          ${records.length > 3 ? `<button class="text-link link-button" type="button" data-view-orders="${selectedDate}" data-related-status="${status}">Ver lista completa</button>` : ''}
        </div>
        ${orderPreview(records)}
      </section>`).join('')
    : empty('Sin movimientos para esta fecha', 'Consulta otro día o registra un pedido o una venta.');
  const agenda = pickupAgenda(orders, shiftDate(today, 1)).filter(day => day.date !== selectedDate).slice(0, 4);
  find('[data-agenda]').innerHTML = agenda.length
    ? `<div class="agenda-list">${agenda.map(({ date, orders, panes }) => `<article class="agenda-day">
      <header class="agenda-day-header">
        <div><h3><time datetime="${date}">${escapeHtml(describeDate(date, today))}</time></h3>
          <p>${orders.length} ${orders.length === 1 ? 'pedido' : 'pedidos'} por recoger · ${panes} ${panes === 1 ? 'unidad' : 'unidades'}</p></div>
        <div class="admin-row-actions">
          <button class="text-link link-button" type="button" data-view-orders="${date}">Ver pedidos</button>
          <button class="text-link link-button" type="button" data-view-production="${date}">Ver producción</button>
        </div>
      </header>
      ${orderPreview(orders)}
    </article>`).join('')}</div>`
    : empty('Sin recojos por atender', 'Cuando haya pedidos pendientes o listos para recoger, aparecerán aquí.');
}

function orderActions(order) {
  const id = escapeHtml(order.id);
  const primary = nextStatus[order.status];
  return `<div class="admin-row-actions">
    ${primary ? `<button type="button" class="button button-primary admin-quick-action" data-order-change="${id}" data-target-status="${primary}">${quickLabel[primary]}</button>` : orderButton(order.id)}
    <details class="admin-order-menu">
      <summary aria-label="Más opciones de ${escapeHtml(order.code)}">Más</summary>
      <div>${primary ? orderButton(order.id) : ''}
        <button type="button" class="text-link link-button" data-order-edit="${id}">Cambiar estado</button>
        ${primary && canMarkUncollected(order) ? `<button type="button" class="text-link link-button" data-order-change="${id}" data-target-status="no_recogido">Marcar no recogido</button>` : ''}
        ${order.status !== 'cancelado' ? `<button type="button" class="text-link link-button admin-danger" data-order-change="${id}" data-target-status="cancelado">Cancelar ${isCounterSale(order) ? 'venta' : 'pedido'}</button>` : ''}
      </div>
    </details>
  </div>`;
}

function renderOrders() {
  const history = ordersView === 'history';
  const showRange = history || period.value === 'range';
  find('[data-history-note]').hidden = !history;
  find('[data-period-field]').hidden = history;
  find('[data-date-field]').hidden = history || showRange;
  find('[data-range-fields]').hidden = !showRange;
  find('[data-order-today]').hidden = history;
  const dateDescription = find('[data-order-date-description]');
  dateDescription.hidden = history || showRange || !orderDate.value;
  dateDescription.textContent = orderDate.value ? describeDate(orderDate.value, boliviaDate()) : '';
  for (const button of all('[data-order-view]')) button.setAttribute('aria-pressed', String(button.dataset.orderView === ordersView));
  const productButton = find('[data-clear-product]');
  productButton.hidden = !relatedProduct;
  productButton.textContent = relatedProduct ? `Quitar filtro de ${relatedProduct.name}` : '';

  const rangeError = showRange && fromDate.value && toDate.value && fromDate.value > toDate.value;
  const today = boliviaDate();
  const orders = rangeError ? [] : filterOrders(state.reservations, {
    view: ordersView, period: period.value, date: orderDate.value, from: fromDate.value, to: toDate.value,
    status: orderStatus.value, source: orderSource.value, query: search.value, productId: relatedProduct?.id,
  }, today);
  const results = paginate(orders, page);
  page = results.current;
  find('[data-order-count]').textContent = orders.length > results.items.length
    ? `${results.start + 1}–${results.start + results.items.length} de ${orders.length} registros`
    : `${orders.length} ${orders.length === 1 ? 'registro' : 'registros'}`;
  const pagination = find('[data-pagination]');
  pagination.hidden = results.pages < 2;
  find('[data-page-label]').textContent = `Página ${page} de ${results.pages}`;
  find('[data-page-step="-1"]').disabled = page === 1;
  find('[data-page-step="1"]').disabled = page === results.pages;
  find('[data-orders]').innerHTML = results.items.length
    ? table('Listado de pedidos y ventas', ['Registro', 'Cliente u origen', 'Fecha y hora', 'Estado', 'Acciones'], results.items.map(order => {
      const date = escapeHtml(formatPickupDate(order.pickup.date));
      const timing = timingLabel(order.pickup.date, today);
      const delivered = order.status === 'entregado' && deliveryDate(order) !== order.pickup.date
        ? `<small>Entrega: ${escapeHtml(formatPickupDate(deliveryDate(order)))}</small>` : '';
      return [
        `<strong>${escapeHtml(order.code)}</strong><small>${panesIn(order)} u. · ${formatBs(order.total)}</small>`,
        `<strong>${escapeHtml(order.customer.name)}</strong><small>${sourceLabel(order)}${order.customer.phone ? ` · ${escapeHtml(order.customer.phone)}` : ''}</small>`,
        `<strong>${date}</strong><small>${escapeHtml(order.pickup.slot)}${timing ? ` · ${timing}` : ''}</small>${delivered}`,
        badge(order.status), orderActions(order),
      ];
    }))
    : rangeError
      ? empty('Revisa el rango de fechas', 'La fecha inicial debe ser anterior o igual a la final.')
      : empty('Sin registros para esta consulta', 'Cambia la fecha o los filtros para buscar otros pedidos y ventas.');
}

function renderProduction() {
  const today = boliviaDate();
  find('[data-production-description]').textContent = describeDate(selectedDate, today);

  const plan = production(ordersOn(state.reservations, selectedDate));
  find('[data-production-metrics]').innerHTML = metrics([
    ['Reservas', plan.orders], ['Unidades reservadas', plan.units], ['Pedidos por preparar', plan.toPrepare], ['Pedidos por entregar', plan.toDeliver],
  ]);
  const key = find('[data-production-key]');
  key.hidden = plan.rows.length === 0;
  key.textContent = `${plan.products} ${plan.products === 1 ? 'producto' : 'productos'}. El total reservado incluye los no recogidos y excluye los cancelados.`;
  find('[data-production]').innerHTML = plan.rows.length
    ? table('Producción por producto', ['Producto', 'Reservado', 'Por preparar', 'Listo para entregar', 'Entregado', 'No recogido'], plan.rows.map(row => [
      `<button type="button" class="text-link link-button" data-view-orders="${selectedDate}" data-related-id="${escapeHtml(row.id)}" data-related-name="${escapeHtml(row.name)}">${escapeHtml(row.name)}</button>`,
      row.total, row.pendiente, row.preparado, row.entregado, row.no_recogido,
    ]))
    : empty('Sin producción para esta fecha', 'Selecciona otra fecha para consultar sus reservas.');
}

function renderProducts() {
  const query = normalizeSearch(productSearch.value.trim());
  const products = state.catalog.filter(product =>
    (!query || normalizeSearch(product.name).includes(query)) &&
    (!productCategory.value || product.category === productCategory.value) &&
    (!productStatus.value || String(product.active) === productStatus.value));
  find('[data-product-count]').textContent = `${products.length} ${products.length === 1 ? 'producto' : 'productos'}`;
  find('[data-admin-products]').innerHTML = products.length
    ? table('Catálogo', ['Producto', 'Categoría', 'Precio', 'Disponibilidad', 'Estado', 'Acciones'], products.map(product => {
      const image = imageAddress(product.imageUrl, root);
      const id = escapeHtml(product.slug);
      return [
        `<div class="admin-product-name"><span class="admin-thumb">${image ? `<img src="${escapeHtml(image)}" alt="" loading="lazy">` : ''}</span><strong>${escapeHtml(product.name)}</strong></div>`,
        escapeHtml(categories[product.category].label), formatBs(product.price), escapeHtml(availabilityLabel(product)),
        `<span class="admin-badge" data-status="${product.active ? 'preparado' : 'cancelado'}">${product.active ? 'Activo' : 'Inactivo'}</span>`,
        `<div class="admin-row-actions"><button type="button" class="text-link link-button" data-product-id="${id}">Editar</button>
          <button type="button" class="text-link link-button" data-product-toggle="${id}">${product.active ? 'Desactivar' : 'Activar'}</button></div>`,
      ];
    }))
    : empty('Sin productos para estos filtros', 'Prueba con otra búsqueda, categoría o estado.');
}

const renderers = { resumen: renderSummary, pedidos: renderOrders, produccion: renderProduction, productos: renderProducts };

function render() {
  if (state) renderers[activePanel]();
}

function refresh() {
  try {
    state = readDemo();
    showError('[data-error]');
  } catch {
    state = undefined;
    showError('[data-error]', 'Habilita el almacenamiento local para gestionar la demostración.');
  }
  render();
}

function setDate(date) {
  selectedDate = date || boliviaDate();
  summaryDate.value = selectedDate;
  productionDate.value = selectedDate;
  render();
}

function heading() {
  return find(`[data-panel="${activePanel}"] h1`);
}

function showPanel(moveFocus = false) {
  const requested = location.hash.slice(1);
  activePanel = Object.hasOwn(renderers, requested) ? requested : 'resumen';
  for (const panel of all('[data-panel]')) panel.hidden = panel.dataset.panel !== activePanel;
  for (const link of all('[data-section]')) {
    if (link.dataset.section === activePanel) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  render();
  if (moveFocus) {
    heading().tabIndex = -1;
    heading().focus();
  }
}

function navigate(section) {
  if (location.hash === `#${section}`) showPanel(true);
  else location.hash = section;
}

function showInitialDates() {
  const today = boliviaDate();
  period.value = 'date';
  orderDate.value = today;
  setDate(today);
}

function clearOrderFilters() {
  for (const field of [fromDate, toDate, orderStatus, orderSource, search]) field.value = '';
  period.value = 'date';
  orderDate.value = selectedDate;
  page = 1;
  relatedProduct = undefined;
}

function openOrders(date, product, status = '') {
  ordersView = 'work';
  clearOrderFilters();
  orderDate.value = date;
  orderStatus.value = status;
  relatedProduct = product;
  navigate('pedidos');
}

function showOrder(order) {
  selectedOrder = order.id;
  find('[data-order-code]').textContent = order.code;
  const sale = isCounterSale(order);
  find('[data-order-origin]').textContent = sale ? 'Venta de mostrador' : `Reserva · ${sourceLabel(order)}`;
  find('[data-order-contact]').hidden = sale;
  showError('[data-order-ticket-error]');
  const statusField = stateForm.elements.status;
  const waitingForPickup = !sale && order.status !== 'no_recogido' && !canMarkUncollected(order);
  for (const option of statusField.options) {
    const invalidSaleStatus = sale && option.value !== 'entregado' && option.value !== 'cancelado';
    option.hidden = invalidSaleStatus;
    option.disabled = invalidSaleStatus || (option.value === 'no_recogido' && waitingForPickup);
  }
  statusField.value = order.status;
  find('#uncollected-help').hidden = !waitingForPickup;
  const delivered = !sale && order.status === 'entregado' && deliveryDate(order) !== order.pickup.date
    ? `<div><dt>Fecha de entrega</dt><dd>${escapeHtml(formatPickupDate(deliveryDate(order)))}</dd></div>` : '';
  find('[data-order-detail]').innerHTML = `
    <dl class="booking-data">
      ${sale ? '' : `<div><dt>Cliente</dt><dd>${escapeHtml(order.customer.name)}</dd></div>
      <div><dt>Teléfono</dt><dd>${escapeHtml(order.customer.phone || 'Sin contacto')}</dd></div>`}
      <div><dt>${sale ? 'Fecha de venta' : 'Recojo'}</dt><dd>${escapeHtml(formatPickupDate(order.pickup.date))} · ${escapeHtml(order.pickup.slot)}</dd></div>
      ${delivered}
      <div><dt>Estado actual</dt><dd>${badge(order.status)}</dd></div>
      <div><dt>Observaciones</dt><dd>${escapeHtml(order.notes || 'Sin observaciones')}</dd></div>
    </dl>
    ${table(sale ? 'Productos vendidos' : 'Productos reservados', ['Producto', 'Unidades', 'Precio unitario', 'Subtotal'], order.items.map(item => [
      escapeHtml(item.name), item.quantity, formatBs(item.unitPrice), formatBs(item.subtotal),
    ]))}
    <p class="booking-total"><span>${sale ? 'Total de la venta' : 'Total al reservar'}</span><strong>${formatBs(order.total)}</strong></p>`;
}

function chosenDays() {
  return productForm.elements.pickupMode.value === 'all'
    ? 'all'
    : dayFields.filter(input => input.checked).map(input => Number(input.value));
}

function syncDays() {
  const days = chosenDays();
  find('[data-day-choices]').hidden = days === 'all';
  dayFields.forEach(input => { input.disabled = days === 'all'; });
  find('[data-pickup-label]').textContent = days === 'all'
    ? 'Disponible cada día en que haya recojos.'
    : days.length ? `Disponible: ${availabilityLabel({ pickupDays: days })}.` : 'Selecciona al menos un día.';
}

function showImage(url) {
  imagePreview.hidden = !url;
  if (url) imagePreview.src = url;
  else imagePreview.removeAttribute('src');
}

function clearImagePreview() {
  if (imageObjectUrl) URL.revokeObjectURL(imageObjectUrl);
  imageObjectUrl = undefined;
  imageFile.value = '';
  showImage('');
  find('[data-image-status]').textContent = '';
}

function showProduct(product) {
  selectedProduct = product?.slug;
  productForm.reset();
  clearImagePreview();
  showImage(imageAddress(product?.imageUrl, root));
  find('#product-editor-title').textContent = product ? 'Editar producto' : 'Crear producto';
  showError('[data-product-error]');
  if (product) {
    for (const field of ['name', 'description', 'price', 'category', 'active']) {
      productForm.elements.namedItem(field).value = product[field];
    }
    productForm.elements.pickupMode.value = product.pickupDays === 'all' ? 'all' : 'specific';
    if (Array.isArray(product.pickupDays)) {
      dayFields.forEach(input => { input.checked = product.pickupDays.includes(Number(input.value)); });
    }
  }
  syncDays();
  productDialog.showModal();
}

function focusResult(attribute, id) {
  const panel = find(`[data-panel="${activePanel}"]`);
  const control = [...panel.querySelectorAll(`[${attribute}]`)].find(button => button.getAttribute(attribute) === id);
  heading().tabIndex = -1;
  (control || heading()).focus({ preventScroll: true });
}

function confirmAction(action, title, description, label) {
  pendingAction = action;
  find('#action-title').textContent = title;
  find('[data-action-description]').textContent = description;
  find('[data-confirm-action]').textContent = label;
  showError('[data-action-error]');
  actionDialog.showModal();
}

function proposeOrder(id, target, control) {
  const order = state?.reservations.find(item => item.id === id);
  if (!order || !Object.hasOwn(statuses, target)) return;
  if (isCounterSale(order) && target !== 'entregado' && target !== 'cancelado') return;
  if (order.status === target) {
    find('[data-state-message]').textContent = 'El pedido ya tiene este estado.';
    return;
  }
  const action = { type: 'order', id, previous: order.status, target, control };
  if (target === 'cancelado') {
    const subject = isCounterSale(order) ? 'venta' : 'pedido';
    const report = isCounterSale(order) ? 'el total de ventas' : 'producción';
    confirmAction(action, `¿Cancelar ${subject}?`, `${order.code} quedará en el historial y sus unidades dejarán de contar en ${report}.`, 'Confirmar cancelación');
  } else if (target === 'no_recogido') {
    if (!canMarkUncollected(order)) {
      showError(orderDialog.open ? '[data-state-error]' : '[data-error]', 'La hora de recojo aún no ha terminado.');
      return;
    }
    confirmAction(action, '¿Marcar como no recogido?', `${order.code} dejará de estar pendiente de entrega y seguirá contando en el total reservado de ese día.`, 'Confirmar como no recogido');
  } else if (isClosedOrder(order.status)) {
    confirmAction(action, '¿Cambiar el estado?', `${order.code} pasará de ${statuses[order.status]} a ${statuses[target]}.`, 'Confirmar cambio');
  } else {
    applyAction(action);
  }
}

function proposeProduct(id, control) {
  const product = state?.catalog.find(item => item.slug === id);
  if (!product) return;
  const action = { type: 'product', id, previous: product.active, target: !product.active, control };
  if (product.active) {
    confirmAction(action, '¿Desactivar producto?', `${product.name} se retirará del catálogo para nuevas reservas. Los pedidos anteriores se conservarán.`, 'Desactivar producto');
  } else {
    applyAction(action);
  }
}

async function applyAction({ type, id, previous, target, control }) {
  if (writing) return;
  writing = true;
  const confirm = find('[data-confirm-action]');
  const inDialog = actionDialog.open;
  const manual = type === 'order' && orderDialog.open && selectedOrder === id;
  const errorSelector = inDialog ? '[data-action-error]' : manual ? '[data-state-error]' : '[data-error]';
  const activeControl = inDialog ? confirm : control;
  if (activeControl) activeControl.disabled = true;
  showError(errorSelector);
  try {
    const updated = await updateDemo(data => {
      if (type === 'order') {
        const order = data.reservations.find(item => item.id === id);
        if (!order || order.status !== previous || (target === 'no_recogido' && !canMarkUncollected(order))) return null;
        if (target === 'entregado') {
          order.deliveredOn = isCounterSale(order) ? order.pickup.date : order.deliveredOn ?? boliviaDate();
        } else if (target === 'pendiente' || target === 'preparado') {
          delete order.deliveredOn;
        }
        order.status = target;
        order.updatedAt = new Date().toISOString();
        return order;
      }
      const product = data.catalog.find(item => item.slug === id);
      if (!product || product.active !== previous) return null;
      product.active = target;
      return product;
    });
    if (!updated) {
      refresh();
      showError(errorSelector, 'El registro cambió. Cierra esta acción y vuelve a seleccionarlo.');
      return;
    }
    refresh();
    if (inDialog) actionDialog.close();
    if (manual && orderDialog.open) {
      showOrder(updated);
      find('[data-state-message]').textContent = `Estado actualizado a ${statuses[target]}.`;
    } else {
      const status = type === 'order' ? `${updated.code} · ${statuses[target]}.` : `Producto ${target ? 'activado' : 'desactivado'}.`;
      message(status);
      if (!orderDialog.open) focusResult(type === 'order' ? 'data-order-change' : 'data-product-toggle', id);
    }
  } catch {
    showError(errorSelector, 'No se pudo guardar el cambio. Vuelve a intentarlo.');
  } finally {
    writing = false;
    if (activeControl) activeControl.disabled = false;
  }
}

const actionButtons = '[data-order-id], [data-order-edit], [data-order-change], [data-product-id], [data-new-product], [data-product-toggle], [data-view-orders], [data-view-production]';
document.addEventListener('click', event => {
  const button = event.target.closest(actionButtons);
  for (const menu of all('.admin-order-menu[open]')) {
    if (button || !menu.contains(event.target)) menu.open = false;
  }
  if (!button || !state || writing) return;
  message();
  const fields = button.dataset;
  if (fields.viewOrders) {
    const product = fields.relatedId ? { id: fields.relatedId, name: fields.relatedName } : undefined;
    openOrders(fields.viewOrders, product, fields.relatedStatus);
  } else if (fields.viewProduction) {
    setDate(fields.viewProduction);
    navigate('produccion');
  } else if (fields.orderChange) {
    proposeOrder(fields.orderChange, fields.targetStatus, button);
  } else if (fields.orderId || fields.orderEdit) {
    const order = state.reservations.find(item => item.id === (fields.orderId || fields.orderEdit));
    if (!order) return;
    find('[data-state-message]').textContent = '';
    showError('[data-state-error]');
    showOrder(order);
    orderDialog.showModal();
    if (fields.orderEdit) stateForm.elements.status.focus();
  } else if (fields.productToggle) {
    proposeProduct(fields.productToggle, button);
  } else {
    showProduct(state.catalog.find(item => item.slug === fields.productId));
  }
});

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  const menu = find('.admin-order-menu[open]');
  if (!menu || !menu.contains(document.activeElement)) return;
  menu.open = false;
  menu.querySelector('summary').focus();
});
document.addEventListener('error', event => {
  if (event.target instanceof HTMLImageElement && event.target.closest('.admin-thumb')) event.target.hidden = true;
}, true);

orderDialog.addEventListener('close', () => {
  const candidates = all('[data-order-id], [data-order-change]');
  const opener = candidates.find(button =>
    (button.dataset.orderId === selectedOrder || button.dataset.orderChange === selectedOrder) &&
    button.getClientRects().length > 0);
  heading().tabIndex = -1;
  (opener || heading()).focus({ preventScroll: true });
});
productDialog.addEventListener('close', () => {
  const editor = all('[data-product-id]').find(button => button.dataset.productId === selectedProduct);
  (editor || find('[data-new-product]')).focus({ preventScroll: true });
});
actionDialog.addEventListener('close', () => {
  pendingAction = undefined;
});
find('[data-confirm-action]').addEventListener('click', event => {
  event.preventDefault();
  if (pendingAction) applyAction(pendingAction);
});
stateForm.addEventListener('submit', event => {
  event.preventDefault();
  if (writing) return;
  showError('[data-state-error]');
  proposeOrder(selectedOrder, stateForm.elements.status.value, event.submitter);
});

for (const field of [summaryDate, productionDate]) field.addEventListener('change', () => setDate(field.value));
for (const field of [orderDate, fromDate, toDate, orderSource, orderStatus, search]) field.addEventListener('input', () => {
  page = 1;
  render();
});
period.addEventListener('change', () => {
  if (period.value === 'range') fromDate.value = toDate.value = orderDate.value || selectedDate;
  page = 1;
  render();
});
find('[data-order-today]').addEventListener('click', () => {
  period.value = 'date';
  orderDate.value = boliviaDate();
  page = 1;
  render();
  orderDate.focus();
});
find('[data-day-orders]').addEventListener('click', () => openOrders(selectedDate));
for (const field of [productSearch, productCategory, productStatus]) field.addEventListener('input', render);
for (const button of all('[data-order-view]')) button.addEventListener('click', () => {
  if (ordersView === button.dataset.orderView) return;
  ordersView = button.dataset.orderView;
  fromDate.value = toDate.value = '';
  period.value = 'date';
  relatedProduct = undefined;
  page = 1;
  render();
});
for (const button of all('[data-page-step]')) button.addEventListener('click', () => {
  page += Number(button.dataset.pageStep);
  render();
  const count = find('[data-order-count]');
  count.tabIndex = -1;
  count.focus();
});
find('[data-clear-filters]').addEventListener('click', () => {
  clearOrderFilters();
  render();
});
find('[data-clear-product]').addEventListener('click', () => {
  relatedProduct = undefined;
  page = 1;
  render();
});
for (const button of all('[data-production-date]')) button.addEventListener('click', () => {
  const today = boliviaDate();
  setDate(button.dataset.productionDate === 'today' ? today : shiftDate(today, 1));
});
find('[data-open-production-orders]').addEventListener('click', () => openOrders(selectedDate));
window.addEventListener('hashchange', () => {
  message();
  showPanel(true);
});
window.addEventListener('pageshow', refresh);
window.addEventListener('storage', event => {
  if (event.key !== storageKey && event.key !== null) return;
  const priorStatus = state?.reservations.find(item => item.id === selectedOrder)?.status;
  refresh();
  if (!orderDialog.open) return;
  const order = state?.reservations.find(item => item.id === selectedOrder);
  if (!order) orderDialog.close();
  else if (order.status !== priorStatus) showOrder(order);
});

const entry = initOrderEntry(order => {
  refresh();
  openOrders(order.pickup.date);
  message(`${isCounterSale(order) ? 'Venta registrada' : 'Reserva registrada'} · ${order.code}`);
});
find('[data-register-order]').addEventListener('click', () => {
  const date = ordersView === 'work' && period.value === 'date' ? orderDate.value : boliviaDate();
  if (!entry.open(date)) showError('[data-error]', 'Habilita el almacenamiento local para guardar el registro.');
});
find('[data-order-ticket]').addEventListener('click', () => {
  const order = state?.reservations.find(item => item.id === selectedOrder);
  if (!order) return;
  showError('[data-order-ticket-error]');
  try {
    downloadTicket(order);
  } catch {
    showError('[data-order-ticket-error]', 'No se pudo descargar el ticket. Vuelve a intentarlo.');
  }
});
find('[data-close-product]').addEventListener('click', () => productDialog.close());
for (const input of all('[data-product-form] [name="pickupMode"], [data-product-form] [name="days"]')) {
  input.addEventListener('change', syncDays);
}
find('[data-pick-image]').addEventListener('click', () => imageFile.click());
imageFile.addEventListener('change', () => {
  const file = imageFile.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    find('[data-image-status]').textContent = 'Elige un archivo de imagen.';
    return;
  }
  if (imageObjectUrl) URL.revokeObjectURL(imageObjectUrl);
  imageObjectUrl = URL.createObjectURL(file);
  showImage(imageObjectUrl);
  find('[data-image-status]').textContent = `Vista previa de ${file.name}.`;
});
imagePreview.addEventListener('error', () => {
  imagePreview.hidden = true;
  if (imageObjectUrl) find('[data-image-status]').textContent = 'Esta imagen no se puede previsualizar.';
});
productDialog.addEventListener('close', clearImagePreview);
productForm.addEventListener('submit', async event => {
  event.preventDefault();
  const button = event.submitter;
  if (button.disabled) return;
  const fields = new FormData(productForm);
  const name = fields.get('name').trim();
  const description = fields.get('description').trim();
  const price = productForm.elements.price.valueAsNumber;
  const category = fields.get('category');
  const pickupDays = chosenDays();
  let error = '';
  if (!name || !description) error = 'Escribe el nombre y la descripción del producto.';
  else if (!Number.isFinite(price) || price < 0 || !Object.hasOwn(categories, category)) error = 'Revisa el precio y la categoría.';
  else if (!pickupDays.length) error = 'Selecciona al menos un día de recojo.';
  showError('[data-product-error]', error);
  if (error) return;

  button.disabled = true;
  const slug = selectedProduct;
  try {
    await updateDemo(data => {
      const values = { name, description, price, category, pickupDays, active: fields.get('active') === 'true' };
      if (slug) {
        const product = data.catalog.find(item => item.slug === slug);
        if (!product) throw new Error('Producto inexistente');
        Object.assign(product, values);
      } else {
        data.catalog.push({ slug: `pan-${newDemoId()}`, imageUrl: '', ...values });
      }
    });
    refresh();
    productDialog.close();
    message(slug ? 'Producto actualizado.' : 'Producto creado.');
  } catch {
    showError('[data-product-error]', 'No se pudo guardar el producto. Vuelve a intentarlo.');
  } finally {
    button.disabled = false;
  }
});

find('[data-reset]').addEventListener('click', () => {
  showError('[data-reset-error]');
  resetDialog.showModal();
});
find('[data-confirm-reset]').addEventListener('click', async event => {
  event.preventDefault();
  const button = event.currentTarget;
  if (button.disabled) return;
  button.disabled = true;
  try {
    await updateDemo(data => {
      data.cart = {};
      data.catalog = initialCatalog();
      data.reservations = exampleOrders(data.catalog);
      data.examplesInitialized = true;
    });
    try { sessionStorage.removeItem(draftKey); } catch { /* The demo has already been reset. */ }
    clearOrderFilters();
    ordersView = 'work';
    for (const field of [productSearch, productCategory, productStatus]) field.value = '';
    refresh();
    showInitialDates();
    resetDialog.close();
    message('Demostración restablecida.');
  } catch {
    showError('[data-reset-error]', 'No se pudo restablecer la demostración.');
  } finally {
    button.disabled = false;
  }
});

showPanel();
try {
  state = readDemo();
  if (!state.examplesInitialized) {
    await updateDemo(data => {
      if (data.examplesInitialized) return;
      data.reservations.push(...exampleOrders(initialCatalog()));
      data.examplesInitialized = true;
    });
    state = readDemo();
  }
  showInitialDates();
} catch {
  showError('[data-error]', 'No se pudo cargar la demostración. Revisa el almacenamiento local.');
}
