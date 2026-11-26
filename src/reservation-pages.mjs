import { layout } from './pages.mjs';

const root = '../';

export function reservationCheckout() {
  return layout({
    root, page: 'carrito', title: 'Reserva tus productos · Artifex',
    description: 'Elige tus productos y un horario de recojo en la demostración de Artifex.',
    content: `
      <section class="catalog-heading reservation-heading" aria-labelledby="reservation-title">
        <div class="wrap"><p class="eyebrow">Reserva de demostración</p><h1 id="reservation-title">Reserva tus productos</h1>
          <p>Revisa tu selección y elige cuándo recogerla. Los precios y los horarios son ilustrativos.</p></div>
      </section>
      <div class="wrap reservation" data-checkout>
        <noscript>Activa JavaScript para usar el carrito y simular una reserva.</noscript>
        <p class="reservation-error" data-storage-error role="alert" hidden></p>
        <section class="reservation-empty" data-empty hidden>
          <h2>Tu carrito está vacío</h2>
          <p>Explora los productos de Artifex y elige qué reservar.</p>
          <a class="button button-primary" href="../panes/">Explorar productos</a>
        </section>
        <div data-flow hidden>
          <ol class="reservation-progress" aria-label="Progreso de la reserva">
            <li data-step="cart" aria-current="step">1. Tu carrito</li>
            <li data-step="form">2. Completa tu reserva</li>
            <li>3. Confirmación</li>
          </ol>
          <div class="reservation-grid">
            <section aria-labelledby="cart-heading" data-cart-panel>
              <h2 id="cart-heading" tabindex="-1">Tu carrito</h2>
              <div class="cart-items" data-cart-items></div>
              <div class="actions reservation-actions">
                <button class="button button-primary" type="button" data-continue>Continuar con la reserva</button>
                <a class="text-link" href="../panes/">Seguir explorando</a>
              </div>
            </section>
            <section aria-labelledby="form-heading" data-form-panel hidden>
              <h2 id="form-heading" tabindex="-1">Completa tu reserva</h2>
              <form class="reservation-form" novalidate>
                <fieldset>
                  <legend>¿Cuándo recogerás tu pedido?</legend>
                  <p class="reservation-pickup-note" id="pickup-note">Algunos productos solo están disponibles ciertos días. Si una fecha no coincide con tu carrito, te sugerimos otra cuando esté disponible.</p>
                  <div class="reservation-fields">
                    <div class="reservation-field">
                      <label for="pickup-date">Fecha de recojo</label>
                      <select id="pickup-date" name="pickupDate" aria-describedby="pickup-note error-pickup-date" required></select>
                      <small class="field-error" id="error-pickup-date"></small>
                    </div>
                    <div class="reservation-field">
                      <label for="pickup-slot">Hora de recojo</label>
                      <select id="pickup-slot" name="pickupSlot" aria-describedby="error-pickup-slot" required disabled></select>
                      <small class="field-error" id="error-pickup-slot"></small>
                    </div>
                  </div>
                  <div class="reservation-error" data-incompatible role="status" hidden>
                    <p data-incompatible-message></p>
                    <div class="pickup-actions">
                      <button class="button button-add" type="button" data-suggest-date hidden></button>
                      <button class="text-link link-button" type="button" data-edit>Editar carrito</button>
                    </div>
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
                  <button class="text-link link-button" type="button" data-edit>Volver al carrito</button>
                </div>
              </form>
            </section>
            <aside class="reservation-summary" aria-labelledby="summary-heading">
              <h2 id="summary-heading">Tu selección</h2>
              <dl><div><dt>Subtotal</dt><dd data-subtotal></dd></div><div><dt>Total referencial</dt><dd data-total></dd></div></dl>
              <p class="pickup-payment">Pago presencial en la panadería al recoger tu pedido.</p>
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
            <p class="eyebrow">Artifex · Demostración</p>
            <h1 id="confirmation-title">Reserva guardada</h1>
            <p>Descarga tu ticket para tener a mano el código y los datos de recojo.</p>
            <div class="actions reservation-actions">
              <button class="button button-primary" type="button" data-download-ticket>Descargar ticket PDF</button>
              <a class="text-link" href="../panes/">Volver al catálogo</a>
            </div>
            <p class="reservation-error" role="alert" data-ticket-error hidden>No se pudo descargar el ticket. Vuelve a intentarlo.</p>
          </section>
          <section class="confirmation-summary receipt" id="resumen" aria-labelledby="booking-heading" tabindex="-1">
            <div class="receipt-heading">
              <div><p class="receipt-brand">Artifex</p><h2 id="booking-heading">Constancia de reserva</h2></div>
              <p class="receipt-code"><span>Código</span><strong data-code></strong></p>
            </div>
            <p class="receipt-demo">Demostración: esta reserva es simulada y no ha sido enviada a Artifex.</p>
            <dl class="booking-data">
              <div><dt>Nombre</dt><dd data-customer></dd></div>
              <div><dt>Fecha de recojo</dt><dd data-pickup-date></dd></div>
              <div><dt>Hora de recojo</dt><dd data-pickup-slot></dd></div>
              <div><dt>Pago</dt><dd>Presencial en la panadería al recoger.</dd></div>
              <div data-note-row hidden><dt>Observaciones</dt><dd data-notes></dd></div>
            </dl>
            <table class="receipt-items">
              <caption class="sr-only">Productos de la reserva</caption>
              <thead><tr><th scope="col">Producto</th><th scope="col">Cant.</th><th scope="col">Unitario</th><th scope="col">Subtotal</th></tr></thead>
              <tbody data-booking-items></tbody>
            </table>
            <p class="booking-total"><span>Total referencial</span> <strong data-booking-total></strong></p>
            <p class="receipt-footnote">Documento informativo sin validez fiscal ni de pago.</p>
          </section>
        </div>
      </div>`,
  });
}
