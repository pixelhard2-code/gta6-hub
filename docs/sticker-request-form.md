# Formulario de entrega después del pago

Página: `https://gta6-hub-coral.vercel.app/gracias`.

El comprador indica nombre, correo, teléfono, pack y número de operación. No necesita iniciar sesión. La página agradece la compra, explica la revisión manual y envía una solicitud por correo al comercio usando FormSubmit. No confirma un pago ni acredita stickers. Los perfiles y el ranking permanecen ocultos.

## Activación del correo receptor

1. En Vercel, abre el proyecto → Settings → Environment Variables.
2. Añade `STICKER_REQUEST_RECIPIENT` con el correo del comercio, sólo en Production. Nunca uses `NEXT_PUBLIC_`: la dirección receptora sólo la utiliza el servidor. Guarda y despliega de nuevo.
3. Antes de publicar la redirección de los pagos, el comercio debe hacer una prueba desde `/gracias`. Para activar el receptor usa datos de prueba propios: esta prueba es una solicitud, no una compra real. FormSubmit enviará un correo de activación. Abre ese correo y confirma el formulario. Revisa spam si no llega.
4. Repite la prueba después de activar el receptor. Comprueba que aparezca la referencia de solicitud y que recibas el correo con los cinco datos correctos. Si falla la activación o el servicio, la web conserva los campos y no muestra éxito.
5. Sólo después de comprobar la recepción, configura las URLs de retorno en los enlaces de Mercado Pago.

No hacen falta Firebase Admin, la API de Mercado Pago ni Resend para recibir estas solicitudes. Hasta configurar y verificar el correo, la recepción no está activa y la página ofrece un enlace al formulario anterior de Soporte. Ese formulario conserva su funcionamiento y sus requisitos de sesión y reglas de Firebase. No guardes la dirección ni claves privadas en el repositorio.

## URLs para el retorno de cada enlace

En la opción de redirección después del pago del enlace correspondiente, usa:

| Enlace de pago | Pack | URL de retorno |
| --- | --- | --- |
| https://mpago.la/2SARTNX | Básico · 1 sticker | https://gta6-hub-coral.vercel.app/gracias?paquete=basic |
| https://mpago.la/1J28NAx | Doble · 2 stickers | https://gta6-hub-coral.vercel.app/gracias?paquete=double |
| https://mpago.la/22A25HZ | Leyenda · 5 stickers | https://gta6-hub-coral.vercel.app/gracias?paquete=legend |

Si sólo puedes poner una URL común, usa `/gracias`: el comprador selecciona su pack en el formulario. El botón «Ya pagué: solicitar mis stickers» de Sorteos también abre la misma página con el pack preseleccionado.

Si Mercado Pago añade `payment_id` o `collection_id`, se muestra como sugerencia editable. Ningún parámetro de retorno, estado `approved` ni visita a la página se interpreta como prueba de pago.

## Revisar y entregar

Busca en tu correo asuntos `LeonidaCrew · Compra por revisar · LC-…`. El mensaje incluye nombre, correo de entrega, teléfono, pack, número de operación y referencia. Puedes responder al comprador desde ese mensaje.

1. Abre el número de operación en tu propia cuenta de Mercado Pago.
2. Comprueba que esté aprobado y coincidan comprador, importe bruto y moneda con el pack.
3. Comprueba que la operación no se haya entregado antes: puedes recibir solicitudes repetidas.
4. Envía el ZIP correcto al correo indicado. Anota operación, pack, comprador y fecha de envío en el registro manual. La entrega sigue siendo manual.

Los datos del formulario se procesan mediante FormSubmit y se entregan al correo del comercio; no se añaden a las colecciones públicas de Firebase. El formulario incluye autorización de contacto y enlace a la política del proveedor. No introduzcas datos de tarjetas ni contraseñas. Conserva tu registro de compras: el archivo del proveedor no sustituye tu registro permanente.

Documentación del proveedor: https://formsubmit.co/documentation · https://formsubmit.co/help
