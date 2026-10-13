# Vender y entregar stickers manualmente mientras se habilita Mercado Pago por API

Los tres enlaces actuales sirven para abrir el pago. La entrega se puede hacer desde tu correo habitual, sin Resend ni la API de Mercado Pago. El correo que Mercado Pago envíe como comprobante no entrega por sí solo los archivos de LeonidaCrew.

La colección de los perfiles, el contador de stickers y el ranking comunitario están ocultos temporalmente con `STICKER_SOCIAL_VISIBLE = false` en `app/lib/stickers/visibility.ts`. Las compras se siguen registrando y acumulando. Configurar Firebase Admin no muestra esas secciones: cuando se decida publicarlas, cambia el indicador a `true` y despliega la web. Mientras estén ocultas, la entrega al comprador se realiza por correo.

## Flujo del comprador

1. Elige un pack y paga con su enlace de Mercado Pago.
2. Abre la página de agradecimiento desde el retorno del pago o «Ya pagué: solicitar mis stickers» en Sorteos.
3. Indica nombre, correo de entrega, teléfono, pack y número de operación. No necesita iniciar sesión.
4. Envía el formulario. Cuando el correo receptor esté configurado y activado, la solicitud llega al comercio por correo. Esta solicitud no acredita stickers ni confirma un pago por sí sola.

Consulta [sticker-request-form.md](./sticker-request-form.md) para activar la recepción por correo y configurar las tres URLs de retorno. Las solicitudes anteriores guardadas en `support_tickets` permanecen en Firebase.

## Qué hace el comercio

1. Revisa los correos con asunto `LeonidaCrew · Compra por revisar`. Incluyen los datos de entrega y el número de operación. Las solicitudes anteriores se pueden seguir revisando en `support_tickets` en Firestore.
2. Abre la operación en tu propia cuenta de Mercado Pago y comprueba el pago aprobado, el comprador, el importe bruto y la moneda del pack. Comprueba que el número no esté ya registrado. Una captura del comprador por sí sola no es confirmación.
3. Verifica a quién pertenece la compra y el correo de entrega. Si vas a asociarla a una cuenta de LeonidaCrew, identifica al usuario correcto: el formulario no exige una cuenta ni entrega un UID autenticado. No adivines un UID por el nombre visible.
4. Si el comprador tiene cuenta y Firebase Admin está configurado, puedes acreditar la compra con la herramienta privada descrita abajo. Si no, registra la operación y entrega el ZIP por correo sin modificar perfiles.
5. Desde tu correo habitual, envía el ZIP del pack al correo indicado. Incluye número de operación, cantidad de stickers y la equivalencia con participaciones. Conserva el mensaje enviado.
6. Marca el envío únicamente después de enviarlo. Cuando se habilite la visibilidad de la colección y Firebase Admin esté configurado en la web, el comprador podrá ver y descargar sus compras registradas desde el perfil.

| Pack | Referencia | Archivo para adjuntar |
| --- | --- | --- |
| Básico | 1 sticker / 3 USD | leonidacrew-pack-1-sticker.zip |
| Doble | 2 stickers / 5 USD | leonidacrew-pack-2-stickers.zip |
| Leyenda | 5 stickers / 10 USD | leonidacrew-pack-5-stickers.zip |

## Registrar sin la API de Mercado Pago

La herramienta usa **sólo Firebase Admin**. No llama a Mercado Pago ni envía correos. La comprobación del pago la realiza el comercio en su cuenta y queda identificada como `merchant-dashboard-review`. No se crean pagos ficticios para el webhook.

Configura las credenciales privadas del mismo proyecto Firebase en `.env.local` para la herramienta y en Vercel para que el perfil y ranking puedan leer la colección. Usa `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY`, o `FIREBASE_ADMIN_SERVICE_ACCOUNT`. No necesitas activar `STICKER_SALES_ENABLED` ni configurar Mercado Pago o Resend para este modo. Las claves no deben guardarse en GitHub ni enviarse por chat.

```bash
node scripts/manual-sticker-purchase.mjs NUMERO_OPERACION UID_FIREBASE basic CORREO_ENTREGA IMPORTE_BRUTO CLP NOMBRE_REVISOR --confirmed-in-dashboard
```

Packs admitidos: `basic`, `double`, `legend`. Introduce el importe bruto real de esa operación y su moneda, no el saldo neto después de comisiones ni una conversión inventada de USD. El flag exige que ya hayas revisado el pago en tu cuenta. La herramienta valida que el usuario exista, suma las copias en una transacción, actualiza el ranking y devuelve un ID `lc_...`. Una operación repetida no vuelve a sumar; una operación atribuida a otro usuario o pack se rechaza.

Después de enviar el correo manualmente:

```bash
node scripts/manual-sticker-purchase.mjs --email-sent ID_LC_DEVUELTO
```

Si aún no configuras Firebase Admin, puedes entregar los ZIP por correo y llevar el registro en la planilla del kit. **El perfil y ranking no se actualizarán hasta registrar esas compras y configurar Firebase Admin en Vercel.** No modifiques `users.tickets`: la nueva colección usa el registro de stickers.

## Datos de Soporte y reglas

Conserva las restricciones de las colecciones `sticker_*` de [sticker-commerce.md](./sticker-commerce.md). Las solicitudes de Soporte contienen correos y datos de compra: restringe las lecturas de `support_tickets` a quien corresponda; la consola del comercio no depende del acceso público. Para las compras, permite crear sólo con sesión iniciada y `request.resource.data.userId == request.auth.uid`, estado `open` y `paymentVerification == 'pending-merchant-review'`. Mantén la creación de consultas generales de acuerdo con tus reglas existentes. Elimina permisos globales que permitan leer o modificar solicitudes ajenas. Estas reglas del proyecto Firebase deben configurarse antes de recolectar datos reales de compra.

## Cuando actives la API

Conserva el número de operación original. La acreditación manual y la reconciliación posterior por API utilizan el mismo registro, así que no se suman participaciones dos veces. Los correos marcados como manuales quedan fuera de la cola automática. Los reembolsos de los enlaces genéricos también requieren seguimiento en la cuenta del comercio mientras no haya integración automática.

En la web los pasos siguen siendo: compra de stickers, validación, colección y participaciones.
