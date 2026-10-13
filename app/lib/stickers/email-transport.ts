import { getStickerPackage, validDeliveryEmail } from "./catalog";
import { stickerZip } from "./files";

export interface StickerEmailJob { orderId: string; email: string; packageId: string; quantity: number }

// Shared by the webhook and merchant reconciliation so retries keep the same payload.
export async function sendStickerEmailWithConfig(job: StickerEmailJob, config: { apiKey: string; from: string; appUrl: string }, send: typeof fetch = fetch) {
  const pack = getStickerPackage(job.packageId);
  if (!pack || pack.stickers !== job.quantity || !validDeliveryEmail(job.email) || !/^lc_[a-f0-9]{32}$/.test(job.orderId)) throw new Error("invalid-order");
  if (!config.apiKey || !config.from || !config.appUrl) throw new Error("setup-required");
  const zip = await stickerZip(pack.stickerIds, pack.stickers);
  const profile = `${new URL(config.appUrl).origin}/perfil`;
  const text = `Gracias por tu compra en LeonidaCrew.\n\nAdjuntamos tus ${pack.stickers} stickers digitales en PNG con fondo transparente. Ya puedes verlos en tu colección: ${profile}\n\nCada sticker confirmado equivale a una participación en el sorteo promocional según sus bases.\nCompra: ${job.orderId}\n`;
  const response = await send("https://api.resend.com/emails", {
    method: "POST", signal: AbortSignal.timeout(12000),
    headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json", "Idempotency-Key": `stickers-${job.orderId}` },
    body: JSON.stringify({ from: config.from, to: [job.email], subject: `Tus ${pack.stickers} stickers de LeonidaCrew`, text, attachments: [{ filename: `leonidacrew-${pack.id}.zip`, content: Buffer.from(zip).toString("base64") }] }),
  });
  const result = await response.json();
  if (!response.ok || typeof result.id !== "string") throw new Error("email-provider-failed");
  return result.id as string;
}
