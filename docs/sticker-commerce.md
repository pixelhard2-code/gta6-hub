# Activar la tienda de stickers de LeonidaCrew

El código ya incluye los tres packs, cinco diseños originales en PNG transparente, colección privada con descarga, colección pública sin correo ni datos de pago, ranking de compras confirmadas y entrega por correo. **La automatización no está activada hasta configurar los servicios.** Las credenciales públicas del login de Firebase no sustituyen las credenciales privadas del servidor.

## Dos formas de pago

Para los primeros días sin API, usa el [procedimiento manual](./sticker-manual.md): envío desde tu correo y acreditación privada con Firebase, sin token de Mercado Pago ni Resend.

Los enlaces indicados están conectados al botón del pack correspondiente:

| Pack | Referencia | Enlace directo |
| --- | --- | --- |
| 1 sticker | 3 USD | https://mpago.la/2SARTNX |
| 2 stickers | 5 USD | https://mpago.la/1J28NAx |
| 5 stickers | 10 USD | https://mpago.la/22A25HZ |

Mercado Pago indica que los enlaces creados desde su panel no admiten notificaciones de pago: https://www.mercadopago.cl/developers/es/docs/checkout-pro-preferences/additional-content/notifications/additional-info . Por eso, **esos enlaces no acreditan ni envían stickers automáticamente**. La página muestra esa condición y un acceso a Soporte para compartir el comprobante. No se suman stickers por hacer clic ni por regresar del pago.

Para la entrega automática se usa Checkout Pro por API. El servidor crea una preferencia individual con `external_reference` igual a la orden y conserva el usuario y el correo de entrega. Es el mismo servicio Mercado Pago, pero el enlace del checkout se genera para cada compra. Los tres enlaces originales permanecen como opción mientras la automatización esté desactivada.

## Configuración en Vercel

1. En Firebase, en el mismo proyecto de la web, abre Configuración del proyecto → Cuentas de servicio. Configura `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL` y `FIREBASE_ADMIN_PRIVATE_KEY` en Vercel. Como alternativa, usa `FIREBASE_ADMIN_SERVICE_ACCOUNT` con el JSON completo. Estas variables son privadas; nunca llevan el prefijo `NEXT_PUBLIC_` y no se deben enviar por chat ni guardar en GitHub.
2. En Mercado Pago Developers configura una aplicación de Checkout Pro que use preferencias y notificaciones `payment`. Añade `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET` y `MERCADOPAGO_COLLECTOR_ID` (ID de tu cuenta vendedora). El servidor verifica el vendedor antes de crear el checkout.
3. Configura la notificación HTTPS del evento **Pagos / payment** a `https://gta6-hub-coral.vercel.app/api/stickers/webhook`. No se aceptan IPN sin firma ni eventos `order` de otra integración. El endpoint verifica `x-signature`, vuelve a consultar `/v1/payments/{id}` y comprueba estado, vendedor, importe, moneda, entorno y referencia.
4. Introduce `MERCADOPAGO_CURRENCY` y los importes reales en `MERCADOPAGO_PACK_BASIC_AMOUNT`, `MERCADOPAGO_PACK_DOUBLE_AMOUNT`, `MERCADOPAGO_PACK_LEGEND_AMOUNT`. Una cuenta chilena normalmente cobra en CLP: no escribas `3` pensando que representa 3 USD. Los precios USD de la página son de referencia; el checkout integrado muestra el total real antes de abrir Mercado Pago. Comprueba también los importes y la moneda de tus enlaces directos en tu propia cuenta.
5. En Resend verifica un dominio de envío y configura `RESEND_API_KEY` y `STICKER_EMAIL_FROM`, por ejemplo `LeonidaCrew <compras@tu-dominio-verificado.cl>`. No uses el remitente de prueba para enviar a todos los clientes. Cada compra recibe un ZIP con sus PNG y puede volver a descargarlos desde su perfil.
6. Configura `APP_URL` con el dominio real HTTPS e instala las reglas de acceso indicadas abajo. En un despliegue de prueba con su propio proyecto Firebase, activa `STICKER_SALES_ENABLED=true` y prueba una compra con credenciales de prueba (`MERCADOPAGO_MODE=test`). El login público y Firebase Admin deben usar ese mismo proyecto de prueba. Así las operaciones simuladas no aparecen en las colecciones ni el ranking de producción. Nunca mezcles tokens de prueba y producción.
7. Tras verificar firma, pago aprobado, entrega y descarga, cambia `MERCADOPAGO_MODE=production`, pon `STICKER_SALES_ENABLED=true` y vuelve a desplegar. Con la automatización activa, el botón crea un checkout identificado por usuario y correo en lugar de abrir un enlace genérico.

El ejemplo completo de nombres de variables está en [sticker-env.example](./sticker-env.example). Las bases, fechas y condiciones del sorteo deben estar publicadas antes de promocionar las ventas.

## Reglas de Firebase: paso necesario

La fuente completa de producción es el archivo firestore.rules de la raíz.
Publica su contenido completo siguiendo [estas instrucciones](./firestore-security.md),
después de desplegar el código compatible de la comunidad. No basta agregar los
bloques siguientes bajo la regla global abierta: esa regla debe reemplazarse.

Las colecciones que empiezan por `sticker_` son **privadas y sólo el servidor Admin debe escribir o leer directamente**. La web accede por endpoints que verifican el token de Firebase; la colección pública y el ranking eliminan el correo y los datos de pago.

Incorpora estas restricciones a las reglas reales de tu proyecto, conservando las reglas de usuarios, publicaciones, respuestas y soporte:

```text
match /sticker_orders/{id} { allow read, write: if false; }
match /sticker_payments/{id} { allow read, write: if false; }
match /sticker_collections/{id} { allow read, write: if false; }
match /sticker_leaderboard/{id} { allow read, write: if false; }
match /sticker_deliveries/{id} { allow read, write: if false; }
match /sticker_checkout_limits/{id} { allow read, write: if false; }
```

Si tienes un `match /{document=**}` con acceso amplio, debes excluir estas colecciones de ese permiso: en Firestore los permisos se combinan con OR y un permiso global prevalece sobre las restricciones específicas. **No publiques `tests/firestore.rules`: son sólo fixtures locales.** No es posible proteger datos de compra sólo ocultando los botones del cliente. Estas reglas no se han desplegado desde GitHub; deben configurarse en el proyecto Firebase antes de activar ventas automáticas.

## Compras, colección y ranking

`sticker_orders` conserva usuario, correo, pack, precio y moneda antes del pago. `sticker_payments` evita duplicar la misma transacción. En una única transacción de Firestore se actualizan la colección, el ranking, el estado de compra y la cola de correo. La cola conserva los fallos y permite reintentar sin sumar stickers otra vez.

El pack Básico entrega Palmeras de Vice. El Doble entrega Palmeras de Vice y Night Ride. El Leyenda entrega los cinco diseños. Comprar varias veces suma copias: dos packs Básicos son dos stickers y dos participaciones, aunque el diseño sea el mismo. El ranking cuenta copias confirmadas, no reputación ni seguidores. Los saldos antiguos de `users.tickets` no se convierten en compras de stickers sin un pago comprobado.

Un reembolso o contracargo retira el pack del saldo y ranking. Los reembolsos parciales suspenden el pack completo hasta una revisión del comercio; no se inventa una cantidad parcial. Un segundo pago para una misma orden se registra como `needs_review` para resolver una posible compra duplicada. La devolución de dinero se realiza en Mercado Pago, no desde este código.

## Entrega y reintentos

El webhook intenta enviar el correo tras aprobarse el pago. Un fallo deja un trabajo pendiente en `sticker_deliveries`. El comprador puede usar «Reintentar envío» o descargar su colección; el envío permanece limitado al correo guardado en la orden.

Para reintentos operativos configura `CRON_SECRET` y programa un GET a `/api/stickers/delivery/retry` con el encabezado `Authorization: Bearer <CRON_SECRET>`, usando un scheduler del servidor. No pongas ese secreto en una URL pública. No se ha creado un cron de Vercel automáticamente; el endpoint ya está preparado. Resend conserva sus claves de idempotencia durante 24 horas; el estado persistido `sent` evita reenvíos normales posteriores. Un timeout con resultado desconocido después de esas 24 horas puede requerir revisar el registro de Resend antes de reintentar.

## Validar una compra de los enlaces directos

Recibe desde Soporte el número de operación, la cuenta del comprador, el pack y el correo de entrega. Comprueba quién compró antes de atribuir una operación a un usuario: **el enlace genérico no permite deducir el UID de Firebase**. Con credenciales privadas configuradas en `.env.local` puedes ejecutar la herramienta de comercio:

```bash
node scripts/reconcile-direct-sticker-payment.mjs NUMERO_DE_OPERACION UID_DE_FIREBASE basic CORREO_DE_ENTREGA
```

Los packs admitidos son `basic`, `double`, `legend`. La herramienta consulta el pago real, exige que esté aprobado, verifica vendedor, moneda y precio configurado, registra una referencia única por pago y usa la misma acreditación y envío del checkout automático. Sólo un administrador con las credenciales privadas debe ejecutarla. No se proporciona una API pública para atribuir pagos ajenos.

## Comprobación local

```bash
npx --yes --package=firebase-tools@14.17.0 firebase emulators:exec --only firestore --project demo-gta6hub-follow --config tests/firebase.json 'npm run test:stickers && npm run test:profiles'
npx tsc --noEmit
npm run build
```

Las pruebas usan el emulador y remitentes simulados; no cobran ni envían correos a clientes. Las reglas reales, las credenciales y la entrega de una compra real requieren verificación en los servicios del comercio.
