# Prueba de Checkout Pro

La ruta /prueba-pago permite probar el pack básico con cualquier cuenta de LeonidaCrew
autenticada con un correo verificado. No aparece en la navegación ni se indexa.
El servidor valida el token de Firebase; no existe una lista de correos autorizados.

## Variables privadas del servidor

Configurar en Vercel Production:

- MERCADOPAGO_MODE=test.
- STICKER_SALES_ENABLED=false.
- STICKER_TEST_ENABLED=true.
- NODE_OPTIONS=--experimental-require-module (Node 24 en Vercel).
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

1. Iniciar sesión con cualquier cuenta con correo verificado en /prueba-pago y crear una compra.
2. Pagar con una cuenta compradora de prueba de Mercado Pago del mismo país y sus
   tarjetas de prueba; no usar una cuenta vendedora para comprar.
3. Comprobar en /compra que el pago se confirma desde el servidor y el correo se envía.
4. Verificar que el ZIP recibido incluye el PNG correcto.
5. Confirmar que repetir una notificación no duplica créditos o correos.

Para vender de verdad, desactivar STICKER_TEST_ENABLED, configurar el token, User ID
y Webhook productivos del vendedor real, poner MERCADOPAGO_MODE=production y activar
STICKER_SALES_ENABLED sólo al finalizar la verificación. Volver a desplegar.
Las colecciones de prueba no se convierten en saldos reales.

## Compatibilidad de Firebase Admin en Vercel

Firebase Admin 14 utiliza jwks-rsa 4 y jose 6. En Node 24, Vercel desactiva por
defecto require(ESM), por lo que firebase-admin/auth falla con ERR_REQUIRE_ESM.
Configurar NODE_OPTIONS=--experimental-require-module y volver a desplegar aplica
la [opción documentada por Vercel](https://vercel.com/docs/functions/runtimes/node-js/advanced-node-configuration#experimental-node.js-require-of-es-module), sin cambiar las versiones de las dependencias.
El [problema original está registrado en Firebase](https://github.com/firebase/firebase-admin-node/issues/3181).
La prueba real del SDK y el control de sesiones se ejecutan con
`node --test tests/sticker-auth.test.mjs`; no utilizan credenciales ni usuarios reales.
