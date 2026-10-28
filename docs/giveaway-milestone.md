# Meta de premios de la Crew

Sección opcional e independiente en `/sorteos`, debajo del premio y el formulario de compra. Usa CSS propio, no lee Firebase, no hace peticiones, no modifica pagos ni números de participación y no se actualiza con cada compra. El enlace «Elegir mis stickers» lleva al selector existente.

## Publicar el conteo manual

Editar solamente `app/components/giveaway-milestone/config.ts` en GitHub y guardar el cambio en `main`. Vercel lo publica con el siguiente despliegue.

- `enabled: true`: visible. `false`: oculta toda la sección sin dejar espacio.
- `demoStickers: 720`: experimento visual marcado permanentemente como **DEMOSTRACIÓN · DATOS SIMULADOS**. No representa ventas, no modifica los datos reales ni suma comisiones. Con 720 se ve un avance del 72% y faltan 280. Cambiar a `null` para volver al conteo verificado.
- `confirmedStickers`: total acumulado real de stickers de compras aprobadas, excluyendo pruebas, impagos, devoluciones y contracargos. Cuenta stickers, no pedidos ni pesos recaudados. No reiniciar este valor al completar una meta.
- `updatedOn`: fecha del conteo verificado, en formato `AAAA-MM-DD`.
- `confirmedStickers: null` y `updatedOn: null`: fuera del modo de demostración, muestra el objetivo sin afirmar una cifra de ventas. El total real sigue pendiente hasta que el organizador publique un conteo verificado.

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
