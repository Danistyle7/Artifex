import { initCart } from './cart.js';
import { initReservation } from './reservation.js';
import { initPublicCatalog } from './public-catalog.js';

const toggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
const mobile = window.matchMedia('(max-width: 52rem)');

function closeMenu() {
  toggle.setAttribute('aria-expanded', 'false');
  navigation.classList.remove('is-open');
}

toggle.hidden = false;
navigation.classList.add('is-enhanced');
toggle.addEventListener('click', () => {
  const expanded = toggle.getAttribute('aria-expanded') === 'true';
  toggle.setAttribute('aria-expanded', String(!expanded));
  navigation.classList.toggle('is-open', !expanded);
  if (!expanded) navigation.querySelector('a').focus();
});
navigation.addEventListener('click', (event) => {
  if (event.target.closest('a')) closeMenu();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    toggle.focus();
  }
});
mobile.addEventListener('change', closeMenu);

const filters = document.querySelector('.filters');
if (filters) {
  const buttons = Array.from(filters.querySelectorAll('[data-filter]'));
  const status = document.querySelector('#filter-count');
  const emptyCategory = document.querySelector('[data-category-empty]');

  function applyFilter() {
    const category = filters.querySelector('[aria-pressed="true"]').dataset.filter;
    let count = 0;
    document.querySelectorAll('.product-card').forEach(card => {
      card.hidden = category !== 'todos' && card.dataset.category !== category;
      if (!card.hidden) count += 1;
    });
    status.textContent = count === 1 ? '1 producto mostrado' : `${count} productos mostrados`;
    emptyCategory.hidden = category === 'todos' || count > 0;
  }

  filters.hidden = false;
  filters.addEventListener('click', event => {
    const selected = event.target.closest('[data-filter]');
    if (!selected) return;
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button === selected)));
    applyFilter();
  });
  document.querySelector('[data-show-all-products]').addEventListener('click', () => {
    const showAll = filters.querySelector('[data-filter="todos"]');
    showAll.click();
    showAll.focus();
  });
  document.addEventListener('artifex:products-rendered', applyFilter);
  applyFilter();
}

initCart();
initPublicCatalog();
initReservation();
