# Referidos privados

El comprador puede introducir un código opcional antes de ir a Mercado Pago. También se puede compartir `/sorteos?ref=juan` para rellenarlo; el comprador puede cambiarlo o borrarlo. No hay cookies, atribución permanente ni cambios en el precio o en las participaciones.

El código `juan` está registrado para «Juan». Los códigos se validan en el servidor y se guardan de forma inmutable al crear la orden. Los nombres y las comisiones enviados por el navegador no son aceptados. Para añadir, renombrar o desactivar colaboradores, editar `app/lib/stickers/referral-partners.ts` y publicar el cambio. Desactivarlos impide compras nuevas con el código, pero respeta las órdenes ya creadas.

## Dónde consultar las ventas

Entrar con la cuenta propietaria del proyecto en Firebase Console → `gta6-hub-8fcbe` → Firestore Database → Datos.

1. Abrir **`sticker_referral_totals`**, documento **`juan`**.
2. Consultar:
   - `approvedStickers`: stickers de compras aprobadas que siguen vigentes. Es el número de participaciones vendidas con ese código.
   - `approvedOrders`: número de compras aprobadas vigentes; una compra de 5 stickers cuenta como 1 orden y 5 stickers.
   - `approvedAmounts.CLP`: importe de esas compras, en pesos chilenos. Otras monedas se mantienen separadas.
3. Para revisar las operaciones una a una, abrir **`sticker_referral_sales`** y filtrar por `code == "juan"`. Cada documento utiliza como ID la orden original; se puede seguir ese ID hasta `sticker_orders` para verificar su pago.

Las colecciones aparecen al confirmarse la primera venta atribuida. Antes de esa venta no existe un documento de totales. El contador de la barra de demostración nunca crea ventas ni suma comisiones.

Los totales no son públicos: los clientes de Firebase, incluso autenticados en la web, tienen el acceso denegado por `firestore.rules`. Solo el servidor y las cuentas con permisos administrativos del proyecto pueden consultarlos. No hay un panel web ni una API pública para consultar referidos.

## Qué se cuenta

Solo se acredita después de verificar el pago real en Mercado Pago: vendedor, modo, moneda, importe y referencia de orden. El registro del referido, la numeración y el crédito de stickers se confirman en la misma transacción.

- Pendientes, rechazados, cancelados y órdenes sin código no suman.
- Webhooks duplicados y consultas de recibo repetidas no duplican ventas.
- Un segundo pago diferente para una misma orden se envía a revisión y no suma otra comisión automáticamente.
- Una devolución, incluso parcial, o un contracargo revierte toda la venta atribuida, igual que invalida sus participaciones. Una aprobación antigua no la reactiva.
- Los registros de prueba van a `sticker_test_referral_totals` y `sticker_test_referral_sales`, separados de los reales.
- Los pagos históricos y los antiguos enlaces directos no reciben un referido retroactivamente.

El sistema registra ventas para calcular la comisión después. No se ha fijado un porcentaje ni una tarifa y no realiza pagos a colaboradores. Antes de liquidar una comisión, verificar las ventas vigentes y las devoluciones en Mercado Pago.
