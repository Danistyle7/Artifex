import { layout } from './pages.mjs';

const root = '../';

export function reservationCheckout() {
  return layout({
    root, page: 'carrito', title: 'Reserva tus panes · Artifex',
    description: 'Elige tus panes y un horario de recojo en la demostración de Artifex.',
    content: `
      <section class="catalog-heading reservation-heading" aria-labelledby="reservation-title">
        <div class="wrap"><p class="eyebrow">Reserva de demostración</p><h1 id="reservation-title">Reserva tus panes</h1>
          <p>Revisa tu selección y elige cuándo recogerla. Los precios y los horarios son ilustrativos.</p></div>
      </section>
      <div class="wrap reservation" data-checkout>
        <noscript>Activa JavaScript para usar el carrito y simular una reserva.</noscript>
        <p class="reservation-error" data-storage-error role="alert" hidden></p>
        <section class="reservation-empty" data-empty hidden>
          <h2>Tu carrito está vacío</h2>
          <p>Encuentra tus próximos panes en el catálogo de Artifex.</p>
          <a class="button button-primary" href="../panes/">Explorar nuestros panes</a>
        </section>
        <div data-flow hidden>
          <ol class="reservation-progress" aria-label="Progreso de la reserva">
            <li data-step="cart" aria-current="step">1. Tus panes</li>
            <li data-step="form">2. Recojo y datos</li>
            <li>3. Confirmación</li>
          </ol>
          <div class="reservation-grid">
            <section aria-labelledby="cart-heading" data-cart-panel>
              <h2 id="cart-heading" tabindex="-1">Tus panes</h2>
              <div class="cart-items" data-cart-items></div>
              <div class="actions reservation-actions">
                <button class="button button-primary" type="button" data-continue>Continuar al recojo</button>
                <a class="text-link" href="../panes/">Seguir explorando panes</a>
              </div>
            </section>
            <section aria-labelledby="form-heading" data-form-panel hidden>
              <h2 id="form-heading" tabindex="-1">Recojo y datos</h2>
              <form class="reservation-form" novalidate>
                <fieldset>
                  <legend>Elige el recojo</legend>
                  <div class="reservation-fields">
                    <div class="reservation-field">
                      <label for="pickup-date">Fecha de recojo</label>
                      <select id="pickup-date" name="pickupDate" aria-describedby="error-pickup-date" required></select>
                      <small class="field-error" id="error-pickup-date"></small>
                    </div>
                    <div class="reservation-field">
                      <label for="pickup-slot">Franja de recojo</label>
                      <select id="pickup-slot" name="pickupSlot" aria-describedby="error-pickup-slot" required disabled></select>
                      <small class="field-error" id="error-pickup-slot"></small>
                    </div>
                  </div>
                  <div class="reservation-error" data-incompatible role="status" hidden>
                    <p data-incompatible-message></p>
                    <button class="text-link link-button" type="button" data-edit>Editar carrito</button>
                  </div>
                </fieldset>
                <fieldset>
                  <legend>Datos del cliente</legend>
                  <div class="reservation-fields">
                    <div class="reservation-field">
                      <label for="customer-name">Nombre</label>
                      <input id="customer-name" name="customerName" autocomplete="name" maxlength="100" aria-describedby="error-customer-name" required>
                      <small class="field-error" id="error-customer-name"></small>
                    </div>
                    <div class="reservation-field">
                      <label for="customer-phone">Número de WhatsApp</label>
                      <input id="customer-phone" name="phone" type="tel" autocomplete="tel" maxlength="24" aria-describedby="error-customer-phone" required>
                      <small class="field-error" id="error-customer-phone"></small>
                    </div>
                  </div>
                  <div class="reservation-field">
                    <label for="order-notes">Observaciones <span>(opcional)</span></label>
                    <textarea id="order-notes" name="notes" rows="3" maxlength="500"></textarea>
                  </div>
                </fieldset>
                <p class="demo-note">Los datos se guardan en este navegador para la demostración.</p>
                <div class="actions reservation-actions">
                  <button class="button button-primary" type="submit">Confirmar reserva</button>
                  <button class="text-link link-button" type="button" data-edit>Volver a tus panes</button>
                </div>
              </form>
            </section>
            <aside class="reservation-summary" aria-labelledby="summary-heading">
              <h2 id="summary-heading">Tu selección</h2>
              <dl><div><dt>Subtotal</dt><dd data-subtotal></dd></div><div><dt>Total referencial</dt><dd data-total></dd></div></dl>
            </aside>
          </div>
        </div>
        <a class="text-link last-reservation" data-last-reservation href="../reserva/" hidden>Ver mi última reserva</a>
      </div>`,
  });
}

export function reservationConfirmation() {
  return layout({
    root, page: 'confirmacion', title: 'Confirmación de reserva · Artifex',
    description: 'Consulta el resumen de tu reserva de demostración.',
    content: `
      <div class="wrap reservation confirmation" data-confirmation>
        <noscript>Activa JavaScript para consultar el resumen de tu reserva.</noscript>
        <section class="reservation-empty" data-missing hidden>
          <h1>Reserva no encontrada</h1>
          <p>Consulta la reserva desde el navegador donde la creaste.</p>
          <a class="button button-primary" href="../panes/">Volver al catálogo</a>
        </section>
        <div data-booking hidden>
          <section class="confirmation-lead" aria-labelledby="confirmation-title">
            <p class="eyebrow">Artifex · Reserva de demostración</p>
            <h1 id="confirmation-title">Reserva confirmada</h1>
            <p>Tu selección quedó guardada con el código <strong data-code></strong>.</p>
            <p class="demo-note">Demostración: esta reserva no ha sido enviada a Artifex.</p>
            <div class="actions reservation-actions">
              <a class="button button-primary" href="../panes/">Volver al catálogo</a>
              <a class="text-link" href="#resumen">Consultar el resumen</a>
            </div>
          </section>
          <section class="confirmation-summary" id="resumen" aria-labelledby="booking-heading" tabindex="-1">
            <h2 id="booking-heading">Resumen de la reserva</h2>
            <dl class="booking-data">
              <div><dt>Nombre</dt><dd data-customer></dd></div>
              <div><dt>Fecha de recojo</dt><dd data-pickup-date></dd></div>
              <div><dt>Franja de recojo</dt><dd data-pickup-slot></dd></div>
              <div data-note-row hidden><dt>Observaciones</dt><dd data-notes></dd></div>
            </dl>
            <ul class="booking-items" data-booking-items></ul>
            <p class="booking-total"><span>Total referencial</span> <strong data-booking-total></strong></p>
          </section>
        </div>
      </div>`,
  });
}
