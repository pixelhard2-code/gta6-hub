import { getStickerPackage, validDeliveryEmail } from "./catalog";
import { stickerZip } from "./files";
import { formatStickerNumber, readEntryNumbers } from "./entry-numbers";

export interface StickerEmailJob { orderId: string; email: string; packageId: string; quantity: number; entryNumbers?: number[] }

// Shared by the webhook and merchant reconciliation so retries keep the same payload.
export async function sendStickerEmailWithConfig(job: StickerEmailJob, config: { apiKey: string; from: string; appUrl: string; testMode?: boolean }, send: typeof fetch = fetch) {
  const pack = getStickerPackage(job.packageId);
  if (!pack || pack.stickers !== job.quantity || !validDeliveryEmail(job.email) || !/^lc_[a-f0-9]{32}$/.test(job.orderId)) throw new Error("invalid-order");
  if (!config.apiKey || !config.from || !config.appUrl) throw new Error("setup-required");
  const numbers = readEntryNumbers(job.entryNumbers, job.entryNumbers === undefined ? undefined : pack.stickers);
  const testMode = config.testMode === true;
  const zip = await stickerZip(pack.stickerIds, pack.stickers, numbers.length ? { numbers, testMode } : undefined);
  const receipt = new URL("/compra?orden=" + job.orderId, config.appUrl).href;
  const numbered = numbers.length ? (testMode ? "Números de prueba (sin participación real): " : "Números de tus stickers: ") + numbers.map((number) => formatStickerNumber(number, testMode)).join(", ") + ".\nTambién los encontrarás en MIS_NUMEROS.txt dentro del ZIP.\n\n" : "";
  const text = (testMode ? "PRUEBA: esta compra simulada no participa en el sorteo real.\n\n" : "") + "Gracias por tu compra en LeonidaCrew.\n\nAdjuntamos tus " + pack.stickers + " stickers digitales en PNG con fondo transparente.\n\n" + numbered + "Puedes consultar el estado de esta compra en " + receipt + "\n\n" + (testMode ? "" : "Cada sticker confirmado equivale a una participación en el sorteo promocional según sus bases. Los reembolsos y contracargos invalidan las participaciones de la compra.\n") + "Compra: " + job.orderId + "\n";
  const response = await send("https://api.resend.com/emails", {
    method: "POST", signal: AbortSignal.timeout(12000),
    headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json", "Idempotency-Key": (config.testMode ? "stickers-test-" : "stickers-") + job.orderId },
    body: JSON.stringify({ from: config.from, to: [job.email], subject: `Tus ${pack.stickers} stickers de LeonidaCrew`, text, attachments: [{ filename: `leonidacrew-${pack.id}.zip`, content: Buffer.from(zip).toString("base64") }] }),
  });
  const result = await response.json();
  if (!response.ok || typeof result.id !== "string") throw new Error("email-provider-failed");
  return result.id as string;
}
