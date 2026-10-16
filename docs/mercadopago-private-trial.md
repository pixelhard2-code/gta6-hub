# Prueba privada de Checkout Pro

La ruta /prueba-pago permite probar el pack básico con la cuenta de LeonidaCrew
autorizada. No aparece en la navegación ni se indexa. El servidor verifica el correo
del token de Firebase y su verificación; un campo editable del perfil no otorga acceso.

## Variables privadas del servidor

Configurar en Vercel Production:

- MERCADOPAGO_MODE=test.
- STICKER_SALES_ENABLED=false.
- STICKER_TEST_ENABLED=true.
- STICKER_TEST_BUYER_EMAIL: correo verificado de la cuenta de LeonidaCrew del tester.
- Credenciales de Mercado Pago de la cuenta vendedora de prueba, su User ID y la
  firma Webhook de la aplicación; Firebase Admin y Resend deben estar configurados.

La palabra Production aquí identifica el entorno de Vercel que sirve el dominio
público; Mercado Pago permanece en modo de prueba. El webhook público no contiene
ningún secreto de bypass de Vercel.

## Aislamiento y confirmación

Los registros simulados usan las colecciones sticker_test_orders,
sticker_test_payments, sticker_test_collections, sticker_test_leaderboard,
sticker_test_deliveries y sticker_test_checkout_limits. Las reglas de producción
ya deniegan el acceso directo del navegador a estas rutas por defecto.

Los registros reales conservan sus nombres sticker_orders, sticker_payments, etc.
La identidad de Firebase puede ser la misma: sus compras, créditos, ranking, pagos
y trabajos de correo quedan separados. Los correos simulados lo indican y usan
otra clave de idempotencia. No cuentan para el sorteo real.

El enlace de Checkout Pro se toma de init_point, también para cuentas de prueba.
Se omite el correo real de entrega en payer durante la prueba: el comprador inicia
sesión en Mercado Pago con su cuenta compradora de prueba. El ZIP se entrega al
correo real guardado en la orden.

Mercado Pago vuelve a /compra?orden=... Esta página consulta una API autenticada:
no da un pago por aprobado basándose en la URL de retorno. Sólo el webhook firmado
que consulta y valida el pago en Mercado Pago acredita la compra y encola el ZIP.
Si falla el correo, la compra conserva el crédito una vez y admite reintentar el envío.

La colección de perfiles y el ranking permanecen ocultos, también en sus APIs públicas.
Los visitantes normales conservan los enlaces manuales existentes durante la prueba.

## Comprobación antes de habilitar ventas

1. Autenticar la cuenta autorizada en /prueba-pago y crear una compra.
2. Pagar con una cuenta compradora de prueba de Mercado Pago del mismo país y sus
   tarjetas de prueba; no usar una cuenta vendedora para comprar.
3. Comprobar en /compra que el pago se confirma desde el servidor y el correo se envía.
4. Verificar que el ZIP recibido incluye el PNG correcto.
5. Confirmar que repetir una notificación no duplica créditos o correos.

Para vender de verdad, desactivar STICKER_TEST_ENABLED, configurar el token, User ID
y Webhook productivos del vendedor real, poner MERCADOPAGO_MODE=production y activar
STICKER_SALES_ENABLED sólo al finalizar la verificación. Volver a desplegar.
Las colecciones de prueba no se convierten en saldos reales.
