# Artifex · Demo comercial

Demo comercial de la panadería artesanal Artifex, Cochabamba. Incluye portada, catálogo filtrable, fichas de producto, un flujo de reservas simulado y un panel administrativo.

## Ejecutar localmente

Abre una terminal en la carpeta del proyecto y ejecuta `npm run dev` con Node.js y npm. Visita [la demo local](http://127.0.0.1:4173/). El proyecto funciona sin instalar dependencias. Después de editar, ejecuta `npm run build` y recarga el navegador.

`npm run build` genera las once páginas y sus recursos en `dist/`. El resultado usa rutas relativas y puede alojarse en un subdirectorio de GitHub Pages.

## Contenido y recursos

- Los nombres, las descripciones de producto y la dirección publicada se basan en el [Instagram de Artifex](https://www.instagram.com/samuarte2/). Cada ficha enlaza a la publicación de referencia.
- La paleta y el estilo se basan en el [carrusel de identidad](https://www.instagram.com/p/DJMbf0gx_YL/). La marca tipográfica y el dibujo de pan de la demo son provisionales.
- Las fotos JPEG de `public/` se hicieron con ImageGen y son ilustrativas. Se solicitaron una hogaza en manos frente a un delantal verde, una hogaza rebanada con pasas y nueces, y una plancha de cuatro fotos de producto para baguette, integral, sésamo y ciabatta.
- Con Samuel queda por validar el menú, la categoría de cada pan, los precios, la disponibilidad, los días y horarios de recojo, el canal de reservas y los archivos originales autorizados.

El catálogo se edita en `src/catalog.mjs`. Las páginas y sus componentes compartidos están en `src/pages.mjs`.

## Probar una reserva

1. Desde el catálogo, agrega una baguette. Abre la ficha del pan de sésamo y agrega dos unidades. El carrito mostrará Bs 79,00.
2. Pulsa Continuar con la reserva y elige un viernes para comprobar el aviso. Usa la fecha sugerida y elige una hora de recojo.
3. Completa el nombre y un número ficticio con formato boliviano. Confirma y recarga la confirmación para verificar que el código y el resumen se conservan. Desde el carrito también puedes volver a tu última reserva.

Los días y las franjas se editan en `src/reservation-data.mjs`. Las fechas de recojo se calculan a partir del día siguiente en la zona `America/La_Paz`. Los precios y los días habilitados de cada pan se editan en `src/catalog.mjs`, donde `pickupDays` admite `'all'` o una lista de días de la semana de 0 (domingo) a 6 (sábado). El formulario comprueba el formato de los móviles bolivianos y admite el prefijo `+591`. [Plan de numeración de la ATT](https://w2.att.gob.bo/sites/default/files/archivos_listados_pdf/2025-09-18/29.%20APROBAR%20EL%20PLAN%20T%C3%89CNICO%20FUNDAMENTAL%20DE%20NUMERACI%C3%93N.pdf)

## Datos locales de la demo

La clave `artifex:demo:v1` de `localStorage` guarda el carrito y las reservas en un solo registro. Cada reserva tiene `id`, `code`, `customer` (nombre y teléfono), `items` (ID, nombre, cantidad, precio unitario y subtotal), `currency`, `total`, `pickup` (fecha ISO local y franja), `notes`, `createdAt` y `status` (`pendiente`). La confirmación guarda la reserva y vacía el carrito en la misma escritura. El borrador del formulario se conserva en `sessionStorage` durante la navegación de esa pestaña.

Las reservas se guardan en el navegador y se pierden al borrar los datos del sitio. Los precios y horarios son ilustrativos. Artifex no recibe las reservas de la demo.

## Administración de demostración

Abre [el panel local](http://127.0.0.1:4173/admin/) desde la misma dirección y el mismo navegador que usas para el catálogo. El icono de usuario del encabezado abre el panel. «Ver sitio público» te lleva de vuelta.

- **Inicio** muestra una agenda por fecha con los pedidos por recoger y los valores de las reservas y entregas por separado. Los importes son referenciales.
- **Pedidos** abre en **Operación**, con los pedidos de hoy y de fechas próximas. Si todos los pedidos son anteriores, abre en Todos. Puedes combinar período, estado y búsqueda por cliente, código o teléfono. **Historial** muestra los recojos de días anteriores y los pedidos entregados o cancelados, con filtros de rango y páginas de diez registros.
- **Producción** abre en la fecha con pedidos vigentes más próxima y suma los panes por día y desglosa lo pendiente, lo preparado y lo entregado. Pulsa el nombre de un pan para ver las reservas vigentes que lo incluyen.
- **Catálogo** permite buscar, filtrar, crear, editar, activar y desactivar productos. El botón Subir imagen muestra una vista previa temporal. Las fotos que ya tiene el catálogo se conservan.

### Probar el recorrido completo

1. Crea una reserva en la web pública, usando datos ficticios. Desde el icono de usuario, abre **Pedidos**, selecciona su fecha de recojo y busca el código.
2. Marca el pedido como preparado y después como entregado desde la lista. Encuéntralo en **Historial** y consulta su fecha en **Inicio** o **Producción**.
3. En **Catálogo**, cambia el precio del pan. Comprueba el nuevo precio en la web pública y el precio original en el detalle de la reserva.
4. En **Pedidos**, abre **Más** y cancela el pedido. Su registro se conserva y sus panes dejan de sumar a producción.

El sitio público y el panel usan la misma clave `artifex:demo:v1` de `localStorage`. Los pedidos previos se conservan y los ejemplos se agregan una sola vez. La demostración funciona por navegador, perfil y dirección, sin sincronización entre dispositivos. Los pedidos simulados muestran la acción de WhatsApp deshabilitada. El panel no es apto para gestionar pedidos reales.

«Restablecer demostración» pide confirmación y recupera el catálogo y los pedidos de ejemplo. La acción elimina las reservas creadas, el carrito y las modificaciones de esta dirección en el navegador.
