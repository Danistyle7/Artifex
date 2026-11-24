export const pickup = {
  timeZone: 'America/La_Paz',
  daysAhead: 14,
  weekdays: {
    5: ['09:00 a 11:00', '16:00 a 18:00'],
    6: ['08:30 a 10:30', '10:30 a 12:30'],
  },
};

export const maxQuantity = 99;

export function newDemoId() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();

  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

const dateInBolivia = new Intl.DateTimeFormat('en-CA', {
  timeZone: pickup.timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
});
const dateLabel = new Intl.DateTimeFormat('es-BO', {
  timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
});
const amount = new Intl.NumberFormat('es-BO', {
  minimumFractionDigits: 2, maximumFractionDigits: 2,
});
const weekdayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

export function boliviaDate(now = new Date()) {
  const parts = Object.fromEntries(dateInBolivia.formatToParts(now).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function pickupDates(now = new Date()) {
  const day = new Date(`${boliviaDate(now)}T12:00:00Z`);
  const options = [];
  for (let offset = 0; offset < pickup.daysAhead; offset += 1) {
    day.setUTCDate(day.getUTCDate() + 1);
    const weekday = day.getUTCDay();
    const slots = pickup.weekdays[weekday];
    if (slots?.length) {
      const date = day.toISOString().slice(0, 10);
      options.push({ date, weekday, slots, label: formatPickupDate(date) });
    }
  }
  return options;
}

export function formatPickupDate(date) {
  return dateLabel.format(new Date(`${date}T12:00:00Z`));
}

export function availabilityLabel(product) {
  if (product.pickupDays === 'all') return 'Todos los días de recojo';
  return product.pickupDays.map(day => weekdayNames[day]).join(' y ');
}

export function unavailableItems(items, date) {
  return items.filter(({ product }) => !product.active || (date && product.pickupDays !== 'all' && !product.pickupDays.includes(date.weekday)));
}

export function bolivianMobile(value) {
  const digits = value.replace(/[\s()-]/gu, '');
  const match = digits.match(/^(?:\+?591)?([67]\d{7})$/u);
  return match ? `+591${match[1]}` : '';
}

export function formatBs(value) {
  return `Bs ${amount.format(value)}`;
}
