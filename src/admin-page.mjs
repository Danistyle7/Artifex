import { layout, wordmark } from './pages.mjs';
import { categories } from './catalog.mjs';
import { pickup } from './reservation-data.mjs';
import { statuses } from './admin-data.mjs';

const sections = [['resumen', 'Inicio'], ['pedidos', 'Pedidos'], ['produccion', 'Producción'], ['productos', 'Catálogo']];
const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const dateInput = (id, label, attributes = '') => `<label class="admin-field" for="${id}" ${attributes}>${label}<input type="date" id="${id}"></label>`;
const categoryOptions = Object.entries(categories).map(([key, category]) => `<option value="${key}">${category.label}</option>`).join('');

export function adminPage() {
  const root = '../';
  return layout({
    root, page: 'admin', title: 'Administración de demostración · Artifex',
    description: 'Gestiona las reservas simuladas, la producción diaria y el catálogo de Artifex.',
    customHeader: `<header class="site-header"><div class="wrap admin-header">
      ${wordmark(root)}<span>Administración de demostración</span>
      <a class="button button-reserve" href="${root}">Ver sitio público</a>
    </div></header>`,
    content: `
      <div class="wrap admin-shell" data-admin>
        <aside class="admin-sidebar">
          <nav aria-label="Administración">
            ${sections.map(([id, label]) => `<a href="#${id}" data-section="${id}">${label}</a>`).join('')}
          </nav>
        </aside>
        <div class="admin-workspace">
          <noscript>Activa JavaScript para gestionar la demostración.</noscript>
          <p class="admin-message" role="status" data-message></p>
          <p class="reservation-error" role="alert" data-error hidden></p>
          <section data-panel="resumen" hidden>
            <div class="admin-lead"><div><h1>Inicio</h1><p class="admin-meta" data-day-description></p></div>
              ${dateInput('summary-date', 'Fecha del resumen')}</div>
            <div class="admin-metrics admin-metrics-status" data-metrics></div>
            <div class="admin-summary-values" data-value-metrics></div>
            <section class="admin-block admin-agenda" aria-labelledby="agenda-heading">
              <div class="admin-subhead"><h2 id="agenda-heading">Agenda de recojos</h2><a class="text-link" href="#pedidos">Ir a Pedidos</a></div>
              <p class="admin-meta">Pedidos pendientes y listos para recoger, agrupados por fecha.</p>
              <div data-agenda></div>
            </section>
          </section>
          <section data-panel="pedidos" hidden>
            <div class="admin-lead"><h1>Pedidos</h1></div>
            <div class="admin-order-tabs" role="group" aria-label="Vista de pedidos">
              <button class="button button-add" type="button" data-order-view="work" aria-pressed="true">Operación</button>
              <button class="button button-add" type="button" data-order-view="history" aria-pressed="false">Historial</button>
            </div>
            <p class="admin-meta" data-history-note hidden>Consulta recojos de días anteriores y pedidos entregados, no recogidos o cancelados.</p>
            <div class="admin-filters admin-order-filters">
              <label class="admin-field" for="order-search">Buscar cliente, código o teléfono<input type="search" id="order-search"></label>
              <label class="admin-field" for="order-period" data-period-field>Período<select id="order-period">
                <option value="upcoming">Hoy y próximos días</option>
                <option value="today">Hoy</option><option value="tomorrow">Mañana</option><option value="week">Próximos 7 días</option>
                <option value="date">Fecha específica</option><option value="range">Rango de fechas</option><option value="all">Todos</option>
              </select></label>
              <label class="admin-field" for="order-status">Estado<select id="order-status">
                <option value="">Todos los estados</option>
                ${Object.entries(statuses).map(([key, label]) => `<option value="${key}">${label}</option>`).join('')}
              </select></label>
              ${dateInput('order-date', 'Fecha de recojo', 'data-date-field hidden')}
              <div class="admin-date-range" data-range-fields hidden>
                ${dateInput('order-from', 'Desde')}${dateInput('order-to', 'Hasta')}
              </div>
              <button type="button" class="text-link link-button" data-clear-filters>Limpiar filtros</button>
            </div>
            <div class="admin-list-head">
              <p class="admin-meta" role="status" data-order-count></p>
              <button type="button" class="text-link link-button" data-clear-product hidden></button>
            </div>
            <div data-orders></div>
            <nav class="admin-pagination" aria-label="Páginas de pedidos" data-pagination hidden>
              <button type="button" class="button button-add" data-page-step="-1">Anterior</button>
              <span data-page-label></span>
              <button type="button" class="button button-add" data-page-step="1">Siguiente</button>
            </nav>
          </section>
          <section data-panel="produccion" hidden>
            <div class="admin-lead"><div><h1>Producción</h1><p class="admin-meta" data-production-description></p></div>${dateInput('production-date', 'Fecha de producción')}</div>
            <div class="admin-quick-dates" role="group" aria-label="Fechas rápidas de producción">
              <button type="button" class="button button-add" data-production-date="today">Hoy</button>
              <button type="button" class="button button-add" data-production-date="tomorrow">Mañana</button>
              <button type="button" class="button button-add" data-production-date="next">Próxima fecha con pedidos</button>
            </div>
            <div class="admin-metrics admin-metrics-compact" data-production-metrics></div>
            <section class="admin-block" aria-labelledby="production-heading">
              <div class="admin-subhead"><h2 id="production-heading">Unidades por producto</h2>
                <button type="button" class="text-link link-button" data-open-production-orders>Ver pedidos de esta fecha</button></div>
              <p class="admin-meta" data-production-key hidden></p>
              <div data-production></div>
            </section>
          </section>
          <section data-panel="productos" hidden>
            <div class="admin-lead"><h1>Catálogo</h1>
              <button class="button button-primary" type="button" data-new-product>Crear producto</button></div>
            <div class="admin-filters">
              <label class="admin-field" for="product-search">Buscar producto<input type="search" id="product-search"></label>
              <label class="admin-field" for="product-category">Categoría<select id="product-category">
                <option value="">Todas las categorías</option>${categoryOptions}
              </select></label>
              <label class="admin-field" for="product-status">Estado del producto<select id="product-status">
                <option value="">Todos los estados</option><option value="true">Activos</option><option value="false">Inactivos</option>
              </select></label>
            </div>
            <p class="admin-meta" role="status" data-product-count></p>
            <div data-admin-products></div>
          </section>
        </div>
        <footer class="admin-utilities">
          <p>Demostración sin autenticación. No apta para gestionar pedidos reales.</p>
          <button class="text-link link-button admin-reset" type="button" data-reset>Restablecer demostración</button>
        </footer>
      </div>
      <dialog class="admin-dialog" id="order-dialog" aria-labelledby="order-detail-title">
        <div class="admin-dialog-head">
          <div><p class="eyebrow" data-order-origin></p><h2 id="order-detail-title" data-order-code></h2></div>
          <form method="dialog"><button class="button button-add" type="submit" autofocus>Cerrar</button></form>
        </div>
        <div data-order-detail></div>
        <form data-order-state>
          <div class="admin-filters">
            <label class="admin-field" for="edit-status">Estado del pedido<select id="edit-status" name="status" aria-describedby="uncollected-help">
              ${Object.entries(statuses).map(([key, label]) => `<option value="${key}">${label}</option>`).join('')}
            </select></label>
            <button class="button button-primary" type="submit">Guardar estado</button>
          </div>
          <p class="admin-meta" id="uncollected-help" hidden>Puedes marcar «No recogido» cuando termine la hora de recojo.</p>
          <p class="admin-message" role="status" data-state-message></p>
          <p class="reservation-error" role="alert" data-state-error hidden></p>
        </form>
        <div class="admin-contact">
          <button class="button button-add" type="button" disabled>WhatsApp</button>
          <p class="admin-meta">El contacto está deshabilitado para los pedidos de demostración.</p>
        </div>
      </dialog>
      <dialog class="admin-dialog" id="product-dialog" aria-labelledby="product-editor-title">
        <div class="admin-dialog-head"><h2 id="product-editor-title"></h2>
          <button class="button button-add" type="button" data-close-product>Cerrar</button></div>
        <form data-product-form>
          <fieldset class="admin-editor-group"><legend>Información básica</legend>
            <div class="admin-editor">
              <label class="admin-field">Nombre<input name="name" maxlength="100" required></label>
              <label class="admin-field">Categoría<select name="category">${categoryOptions}</select></label>
              <label class="admin-field admin-span">Descripción<textarea name="description" rows="2" maxlength="500" required></textarea></label>
            </div>
          </fieldset>
          <fieldset class="admin-editor-group"><legend>Precio e imagen</legend>
            <div class="admin-editor">
              <label class="admin-field">Precio en Bs<input name="price" type="number" min="0" max="99999.99" step="0.01" inputmode="decimal" required></label>
              <div class="admin-field">
                <span>Imagen del producto</span>
                <div class="admin-image-picker">
                  <img alt="Vista previa del producto" data-image-preview hidden>
                  <button type="button" class="button button-add" data-pick-image>Subir imagen</button>
                </div>
                <input type="file" accept="image/*" aria-label="Elegir imagen del producto" data-image-file hidden>
                <small>Vista previa de demostración. La imagen elegida no se guarda.</small>
                <small data-image-status role="status"></small>
              </div>
            </div>
          </fieldset>
          <fieldset class="admin-editor-group admin-days"><legend>Disponibilidad</legend>
            <div class="admin-editor">
              <div>
                <div class="admin-pickup-options" role="group" aria-label="Días de disponibilidad">
                  <label><input name="pickupMode" type="radio" value="all" checked> Todos los días de recojo</label>
                  <label><input name="pickupMode" type="radio" value="specific"> Solo algunos días</label>
                </div>
                <div class="admin-day-choices" data-day-choices role="group" aria-label="Elige los días de recojo" hidden>
                  ${Object.entries(pickup.weekdays).filter(([, slots]) => slots.length).map(([day]) => `<label class="admin-day"><input name="days" type="checkbox" value="${day}"> ${dayNames[day]}</label>`).join('')}
                </div>
                <small class="admin-meta" data-pickup-label role="status"></small>
              </div>
              <label class="admin-field">Estado del producto<select name="active"><option value="true">Activo</option><option value="false">Inactivo</option></select></label>
            </div>
          </fieldset>
          <p class="reservation-error" role="alert" data-product-error hidden></p>
          <button class="button button-primary" type="submit">Guardar producto</button>
        </form>
      </dialog>
      <dialog class="admin-dialog admin-reset-dialog" id="action-dialog" aria-labelledby="action-title">
        <h2 id="action-title"></h2>
        <p data-action-description></p>
        <p class="reservation-error" role="alert" data-action-error hidden></p>
        <form class="actions" method="dialog">
          <button class="button button-add" value="back" autofocus>Volver</button>
          <button class="button button-primary" value="confirm" data-confirm-action></button>
        </form>
      </dialog>
      <dialog class="admin-dialog admin-reset-dialog" id="reset-dialog" aria-labelledby="reset-title">
        <h2 id="reset-title">Restablecer la demostración</h2>
        <p>Se eliminarán el carrito, las reservas creadas y los cambios locales del catálogo y de los estados. Se recuperarán el catálogo inicial y los pedidos de ejemplo.</p>
        <p class="reservation-error" role="alert" data-reset-error hidden></p>
        <form class="actions" method="dialog">
          <button class="button button-add" value="cancel" autofocus>Conservar datos</button>
          <button class="button button-primary" value="reset" data-confirm-reset>Restablecer datos</button>
        </form>
      </dialog>`,
  });
}
