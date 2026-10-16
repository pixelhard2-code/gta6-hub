# Reglas de Firestore de LeonidaCrew

La fuente de producción es firestore.rules, en la raíz del repositorio.
Las reglas abiertas con vencimiento el 6 de noviembre de 2026 deben reemplazarse
completamente: agregar un bloque restrictivo debajo de un permiso global no lo revoca.

## Publicación

1. Abrir el proyecto Firebase gta6-hub-8fcbe → Firestore Database → Reglas.
2. Conservar una copia de las reglas anteriores.
3. Reemplazar todo el editor por el contenido completo de firestore.rules.
4. Pulsar Publicar.

Guardar archivos en GitHub o desplegar Next.js en Vercel no publica las reglas de
Firebase. No publicar tests/firestore.rules: esa fixture permisiva sólo sirve
para pruebas locales de lógica.

## Accesos

- Las páginas públicas conservan la lectura de perfiles, posts y comentarios.
- Cada usuario crea y edita su perfil; no modifica reputación, saldo ni seguidores
  ajenos. Seguir/dejar de seguir verifica los dos lados de la transacción, admite
  solicitudes repetidas y normaliza duplicados de relaciones antiguas.
- Las publicaciones exigen una cuenta con biografía; sólo su autor puede borrarlas.
  Los likes sólo añaden o retiran el UID de quien realiza la solicitud.
- Las respuestas y su contador se crean/eliminan en el mismo lote atómico. El autor
  de la respuesta o de la publicación puede eliminarlas. No se admite inventar
  el contador ni cambiar el texto o la identidad de otra persona.
- Soporte acepta consultas anónimas y autenticadas, como el formulario actual.
  Los comprobantes exigen sesión y quedan pendientes de revisión. Sólo el dueño
  autenticado puede leer su solicitud desde un cliente; la gestión administrativa
  se realiza en Firebase Console o mediante el servidor.
- Todas las colecciones de stickers y cualquier ruta sin permiso explícito quedan
  cerradas al SDK del navegador, incluso para compradores autenticados. Firebase
  Admin conserva los accesos del servidor mediante IAM.

Los documentos users siguen siendo públicos por el modelo existente de la web,
incluidos sus campos antiguos. Estas reglas no migran esos campos ni agregan una
bandeja de moderación o protección contra spam. Los correos y datos de pago nuevos
se guardan exclusivamente en compras privadas o soporte.

## Pruebas aisladas

    npx --yes --package=firebase-tools@14.17.0 firebase emulators:exec --only firestore --project demo-gta6hub-rules --config firebase.rules-test.json 'npm run test:rules'

Las pruebas usan identidades simuladas y Firebase Admin contra el emulador local:
no acceden al proyecto real, no cobran ni envían correos.

Publicar las reglas después de que el nuevo código de respuestas esté desplegado
en Vercel. Las pestañas antiguas deben recargarse para usar las transacciones nuevas.
La colección de stickers y el ranking siguen ocultos por su bandera existente.
