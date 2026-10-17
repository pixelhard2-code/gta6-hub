# Números de stickers y datos de contacto

El checkout integrado exige nombre, apellido, teléfono y correo antes de crear el enlace de Mercado Pago. El servidor valida y normaliza los datos, y los guarda en `sticker_orders/{orden}`: `buyerContact.firstName`, `buyerContact.lastName`, `buyerContact.phone` y `email`. No los copia al perfil público, al ranking ni a los metadatos de Mercado Pago. Un intento de compra no puede cambiar sus datos una vez creado; un cambio en el formulario inicia otro intento.

Los números se asignan solamente después de verificar un pago aprobado con Mercado Pago. Una transacción de Firestore actualiza la compra, los saldos, los números y la cola de correo. El contador `sticker_entry_counters/current.lastNumber` aumenta por la cantidad del pack. No debe modificarse ni reiniciarse manualmente.

Cada documento de `sticker_entries` se identifica con el número formateado, por ejemplo `000001`. Conserva `number`, `code`, `orderId`, `uid`, `paymentId`, `stickerId`, `status` y fecha. No duplica teléfonos ni nombres: esos datos se consultan en la orden referenciada. El formato usa al menos seis dígitos y admite continuar después de `999999`.

## Consultar una participación sin panel en la web

1. En la consola privada de Firebase, abre Firestore → `sticker_entries`.
2. Busca el documento del número, con seis dígitos como mínimo (`000057` para el 57).
3. Comprueba que `status` sea `active` y conserva el `orderId`.
4. Abre `sticker_orders/{orderId}` para consultar correo, nombre, apellido y teléfono. La compra debe seguir aprobada.

Para el sorteo se debe usar la lista de números `active` de compras aprobadas. No basta sortear cualquier entero entre 1 y el último contador: puede haber números anulados. Un reembolso, reembolso parcial o contracargo marca los números de esa compra como `void`, conserva su titular y nunca los asigna a otra persona. Una notificación antigua de aprobación no los reactiva. Un segundo pago para una orden ya pagada queda para revisión, sin generar otro pack ni números adicionales.

## Entrega y privacidad

El correo incluye los números y el ZIP contiene `MIS_NUMEROS.txt`. El comprobante `/compra?orden=…` los muestra sólo al dueño autenticado. Las colecciones de perfiles y el ranking siguen ocultos. No se ha añadido un panel de administración ni una API pública para buscar participantes o datos de contacto.

Las reglas de producción ya deniegan el acceso directo desde el navegador a todas las colecciones de compras y a las colecciones nuevas mediante su regla final. Sólo Firebase Admin en el servidor y los usuarios autorizados de la consola de Firebase deben acceder a ellas. No publiques las reglas permisivas de los fixtures de pruebas.

Los números de prueba usan `sticker_test_entries` y `sticker_test_entry_counters`, y en correos y comprobantes se distinguen como `PRUEBA-000001`. No participan en el sorteo real ni consumen números de producción.

Las órdenes anteriores sin datos de contacto conservan sus datos originales; no se inventan nombres o teléfonos. Una orden aprobada anterior sin numeración puede recibirla al volver a verificarse con Mercado Pago, sin sumar stickers ni reenviar un correo ya marcado como enviado. Sus números podrán consultarse en el comprobante. Los enlaces genéricos anteriores requieren revisión manual: para registrar datos y entregar números automáticamente, las nuevas compras deben iniciarse desde el checkout de la página.
