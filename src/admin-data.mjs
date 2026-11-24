import { pickupDates } from './reservation-data.mjs';

export const statuses = {
  pendiente: 'Pendiente',
  preparado: 'Preparado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

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
  const { view, period, date, from, to, status, query, productId } = filters;
  const history = view === 'history';
  const search = normalizeSearch(query.trim());
  const phoneQuery = /^[\d+\s()-]+$/u.test(search) ? search.replace(/\D/gu, '') : '';
  let first = '';
  let last = '';
  if (history || period === 'range') {
    first = from;
    last = to;
  } else if (period === 'today' || period === 'tomorrow') {
    first = last = period === 'today' ? today : shiftDate(today, 1);
  } else if (period === 'week') {
    first = today;
    last = shiftDate(today, 6);
  } else if (period === 'date') {
    if (!date) return [];
    first = last = date;
  }

  return sortedOrders(orders.filter(order => {
    const day = order.pickup.date;
    const closed = order.status === 'entregado' || order.status === 'cancelado';
    if (history && day >= today && !closed) return false;
    if ((first && day < first) || (last && day > last) || (status && status !== order.status)) return false;
    if (productId && (order.status === 'cancelado' || !order.items.some(item => item.productId === productId))) return false;
    const phone = (order.customer.phone || '').replace(/\D/gu, '');
    return !search || normalizeSearch(`${order.customer.name} ${order.code}`).includes(search) ||
      Boolean(phoneQuery && phone.includes(phoneQuery));
  }), history);
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
    cancelled: orders.length - active.length,
    quantity: active.reduce((total, order) => total + panesIn(order), 0),
    reservedValue: sumValue(active),
    deliveredValue: sumValue(delivered),
  };
}

export function futureDays(orders, today) {
  const days = new Map();
  for (const order of orders) {
    const date = order.pickup.date;
    if (date <= today || order.status === 'cancelado') continue;
    const day = days.get(date) ?? { date, orders: 0, panes: 0 };
    day.orders += 1;
    day.panes += panesIn(order);
    days.set(date, day);
  }
  return Array.from(days.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export function production(orders) {
  const active = orders.filter(order => order.status !== 'cancelado');
  const products = new Map();
  for (const order of active) {
    for (const item of order.items) {
      const row = products.get(item.productId) ?? { id: item.productId, name: item.name, pendiente: 0, preparado: 0, entregado: 0 };
      row[order.status] += item.quantity;
      products.set(item.productId, row);
    }
  }
  const rows = [...products.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'));
  return {
    rows,
    orders: active.length,
    units: active.reduce((total, order) => total + panesIn(order), 0),
    products: rows.length,
    toDeliver: active.filter(order => order.status !== 'entregado').length,
  };
}

export function exampleOrders(catalog, now = new Date()) {
  const [first, second] = pickupDates(now);
  if (!first) return [];
  const examples = [
    ['ejemplo-01', 'Lucía R. · Ejemplo', 'pendiente', first, { baguette: 3, integral: 2 }],
    ['ejemplo-02', 'Mateo V. · Ejemplo', 'preparado', first, { ciabatta: 4 }],
    ['ejemplo-03', 'Elena M. · Ejemplo', 'entregado', first, { baguette: 2 }],
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
