# Meta de premios de la Crew

Sección opcional e independiente en `/sorteos`, debajo del premio y el formulario de compra. Usa CSS propio, no lee Firebase, no hace peticiones, no modifica pagos ni números de participación y no se actualiza con cada compra. El enlace «Elegir mis stickers» lleva al selector existente.

## Publicar el conteo manual

Editar solamente `app/components/giveaway-milestone/config.ts` en GitHub y guardar el cambio en `main`. Vercel lo publica con el siguiente despliegue.

- `enabled: true`: visible. `false`: oculta toda la sección sin dejar espacio.
- `demoStickers: null`: modo de conteo manual verificado, sin aviso de demostración. Para un experimento visual se puede introducir una cifra de prueba, por ejemplo `720`; en ese caso aparecerá **DEMOSTRACIÓN · DATOS SIMULADOS**.
- `confirmedStickers`: total acumulado real de stickers pagados, incluyendo compras online y ventas por WhatsApp que el organizador haya verificado. Excluir pruebas, reservas sin pago, devoluciones y contracargos; evitar contar dos veces una venta anotada por WhatsApp que también figure en Firebase. Cuenta stickers, no pedidos ni pesos recaudados. No reiniciar este valor al completar una meta.
- `updatedOn`: fecha del conteo verificado, en formato `AAAA-MM-DD`.
- `confirmedStickers: null` y `updatedOn: null`: fuera del modo de demostración, muestra el objetivo sin afirmar una cifra de ventas. El total real sigue pendiente hasta que el organizador publique un conteo verificado.

La cifra experimental de 720 se retiró al pasar al modo manual: no se trasladó al conteo de ventas confirmadas. Para publicar el avance, introducir el total comprobado en `confirmedStickers` y la fecha en `updatedOn`. La barra no importa las ventas de WhatsApp a Firestore ni les asigna números; esas ventas deben mantenerse registradas aparte para la participación en el sorteo.

Las cifras siguientes son ejemplos de funcionamiento, no ventas publicadas:

| Total real acumulado | Avance del tramo | Premios en el sorteo | Próximo objetivo |
| --- | --- | --- | --- |
| 910 | 910 / 1.000 | 1 PS5 + GTA VI | 1.000 |
| 1.000 | 0 / 1.000 | 2 PS5 + GTA VI | 2.000 |
| 1.350 | 350 / 1.000 | 2 PS5 + GTA VI | 2.000 |
| 2.000 | 0 / 1.000 | 3 PS5 + GTA VI | 3.000 |

La sección anuncia una promoción real: cada meta agrega una consola **y una copia de GTA VI**. El organizador debe poder cumplir esos premios y recoger esta mecánica en las bases. El contador no cambia las reglas ni el proceso que asigna números de participación.

## Quitarla o gestionar un error

Para apagarla, cambiar `enabled` a `false`. Para retirarla del código, quitar el import de `GiveawayMilestone` y la línea `<GiveawayMilestone />` de `app/sorteos/page.tsx`; después se puede borrar su carpeta. No depende de estilos globales ni comparte estado con el checkout.

Valores inválidos (negativos, decimales, texto o fecha imposible) ocultan el módulo. Un límite de errores de React aísla fallos de renderizado del componente en el navegador. Un error de sintaxis o una importación rota, como en cualquier módulo compilado, sigue requiriendo corregir el código y no se publica si falla el build.

Verificar los cruces de meta y la validación con `npm run test:giveaway-milestone`.
