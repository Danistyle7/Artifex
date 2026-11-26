import { boliviaDate, boliviaTime, isCounterSale, pickup, pickupDates, pickupWeekday } from './reservation-data.mjs';

export const statuses = {
  pendiente: 'Pendiente',
  preparado: 'Preparado',
  entregado: 'Entregado',
  no_recogido: 'No recogido',
  cancelado: 'Cancelado',
};


export function canMarkUncollected(order, now = new Date()) {
  const today = boliviaDate(now);
  if (order.pickup.date !== today) return order.pickup.date < today;
  const end = order.pickup.slot.match(/(?:^|\s)((?:[01]\d|2[0-3]):[0-5]\d)$/u)?.[1];
  return Boolean(end && boliviaTime(now) >= end);
}

export const isClosedOrder = status => status === 'entregado' || status === 'no_recogido' || status === 'cancelado';
export const orderPageSize = 10;
export const panesIn = order => order.items.reduce((total, item) => total + item.quantity, 0);
export const ordersOn = (orders, date) => orders.filter(order => order.pickup.date === date);
export const normalizeSearch = text => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

export function shiftDate(date, days) {
  const calendar = new Date(`${date}T12:00:00Z`);
  calendar.setUTCDate(calendar.getUTCDate() + days);
  return calendar.toISOString().slice(0, 10);
}

export function sortedOrders(orders, newestFirst = false) {
  const direction = newestFirst ? -1 : 1;
  return [...orders].sort((left, right) =>
    direction * left.pickup.date.localeCompare(right.pickup.date) ||
    left.pickup.slot.localeCompare(right.pickup.slot) ||
    left.code.localeCompare(right.code));
}

export function filterOrders(orders, filters, today) {
  const { view, period, date, from, to, status, source, query, productId } = filters;
  const history = view === 'history';
  const search = normalizeSearch(query.trim());
  const phoneQuery = /^[\d+\s()-]+$/u.test(search) ? search.replace(/\D/gu, '') : '';
  let first = '';
  let last = '';
  if (history || period === 'range') {
    first = from;
    last = to;
  } else {
    if (!date) return [];
    first = last = date;
  }

  const within = day => (!first || day >= first) && (!last || day <= last);
  const matches = orders.filter(order => {
    const day = order.pickup.date;
    if (history && day >= today && !isClosedOrder(order.status)) return false;
    if (!within(day) && (productId || order.status !== 'entregado' || !within(deliveryDate(order)))) return false;
    if (status && status !== order.status) return false;
    if (source && source !== (order.source || 'demo')) return false;
    if (productId && (isCounterSale(order) || order.status === 'cancelado' || !order.items.some(item => item.productId === productId))) return false;
    const phone = (order.customer.phone || '').replace(/\D/gu, '');
    return !search || normalizeSearch(`${order.customer.name} ${order.code}`).includes(search) ||
      Boolean(phoneQuery && phone.includes(phoneQuery));
  });
  return sortedOrders(matches, history);
}

export function paginate(items, page, size = orderPageSize) {
  const pages = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(Math.max(1, page), pages);
  const start = (current - 1) * size;
  return { current, pages, start, items: items.slice(start, start + size) };
}

function sumValue(orders) {
  return orders.reduce((cents, order) => cents + Math.round(order.total * 100), 0) / 100;
}

export function summary(orders) {
  const active = orders.filter(order => order.status !== 'cancelado');
  const delivered = active.filter(order => order.status === 'entregado');
  return {
    orders: orders.length,
    pending: active.filter(order => order.status === 'pendiente').length,
    prepared: active.filter(order => order.status === 'preparado').length,
    delivered: delivered.length,
    uncollected: active.filter(order => order.status === 'no_recogido').length,
    cancelled: orders.length - active.length,
    quantity: active.reduce((total, order) => total + panesIn(order), 0),
    reservedValue: sumValue(active),

  };
}

export function deliveryDate(order) {
  if (order.deliveredOn) return order.deliveredOn;
  const updated = new Date(order.updatedAt ?? '');
  return Number.isNaN(updated.valueOf()) ? order.pickup.date : boliviaDate(updated);
}

export function salesOn(orders, date) {
  const sales = orders.filter(order => order.status === 'entregado' && deliveryDate(order) === date);
  const counter = sales.filter(isCounterSale);
  const products = new Map();
  for (const order of sales) {
    for (const item of order.items) {
      const row = products.get(item.productId) ?? { name: item.name, quantity: 0, cents: 0 };
      row.quantity += item.quantity;
      row.cents += Math.round(item.subtotal * 100);
      products.set(item.productId, row);
    }
  }
  return {

    units: sales.reduce((total, order) => total + panesIn(order), 0),
    value: sumValue(sales),
    counterValue: sumValue(counter),
    reservationValue: sumValue(sales.filter(order => !isCounterSale(order))),
    products: [...products.values()].sort((a, b) => a.name.localeCompare(b.name, 'es')),
  };
}

export function pickupAgenda(orders, today) {
  const days = new Map();
  for (const order of sortedOrders(orders)) {
    const date = order.pickup.date;
    if (date < today || (order.status !== 'pendiente' && order.status !== 'preparado')) continue;
    const day = days.get(date) ?? { date, orders: [], panes: 0 };
    day.orders.push(order);
    day.panes += panesIn(order);
    days.set(date, day);
  }
  return Array.from(days.values());
}

export function production(orders) {
  const active = orders.filter(order => order.status !== 'cancelado' && !isCounterSale(order));
  const products = new Map();
  for (const order of active) {
    for (const item of order.items) {
      const row = products.get(item.productId) ?? {
        id: item.productId, name: item.name, pendiente: 0, preparado: 0, entregado: 0, no_recogido: 0, total: 0,
      };
      row[order.status] += item.quantity;
      row.total += item.quantity;
      products.set(item.productId, row);
    }
  }
  const rows = [...products.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'));
  return {
    rows,
    orders: active.length,
    units: active.reduce((total, order) => total + panesIn(order), 0),
    products: rows.length,
    toPrepare: active.filter(order => order.status === 'pendiente').length,
    toDeliver: active.filter(order => !isClosedOrder(order.status)).length,
  };
}

export function exampleOrders(catalog, now = new Date()) {
  const [first, second] = pickupDates(now);
  if (!first) return [];
  const date = boliviaDate(now);
  const today = { date, slots: pickup.weekdays[pickupWeekday(date)] ?? first.slots };
  const examples = [
    ['ejemplo-01', 'Lucía R. · Ejemplo', 'pendiente', first, { baguette: 3 }],
    ['ejemplo-02', 'Mateo V. · Ejemplo', 'preparado', today, { baguette: 4 }],
    ['ejemplo-03', 'Elena M. · Ejemplo', 'entregado', today, { baguette: 2 }],
    ['ejemplo-04', 'Sofía A. · Ejemplo', 'cancelado', second ?? first, { baguette: 3 }],
  ];
  return examples.map(([id, name, status, date, quantities], index) => {
    const items = catalog.filter(product => quantities[product.slug]).map(product => {
      const quantity = quantities[product.slug];
      return {
        productId: product.slug, name: product.name, quantity, unitPrice: product.price,
        subtotal: Math.round(product.price * 100) * quantity / 100,
      };
    });
    return {
      id, code: `EJ-${id.slice(-2)}`, customer: { name, phone: '' }, items,
      currency: 'BOB', total: items.reduce((cents, item) => cents + Math.round(item.subtotal * 100), 0) / 100,
      pickup: { date: date.date, slot: date.slots[index % date.slots.length] },
      notes: '', createdAt: now.toISOString(), status, source: 'example',
    };
  });
}
