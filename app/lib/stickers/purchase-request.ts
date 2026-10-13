import { getStickerPackage, validDeliveryEmail } from "./catalog";

export interface PurchaseRequest {
  name: string;
  email: string;
  phone: string;
  packageId: string;
  paymentId: string;
  requestId: string;
  consent: true;
}

export function readPurchaseRequest(input: unknown): PurchaseRequest {
  if (!input || typeof input !== "object") throw new Error("invalid-request");
  const data = input as Record<string, unknown>;
  const name = typeof data.name === "string" ? data.name.trim() : "";
  const email = typeof data.email === "string" ? data.email.trim() : "";
  const phone = typeof data.phone === "string" ? data.phone.trim() : "";
  const paymentId = typeof data.paymentId === "string" ? data.paymentId.trim() : "";
  const requestId = typeof data.requestId === "string" ? data.requestId : "";
  if (name.length < 2 || name.length > 100 || /[\r\n\x00-\x1f]/.test(name)
    || !validDeliveryEmail(email) || /[\r\n]/.test(email)
    || phone.length > 30 || !/^\+?[\d ()-]+$/.test(phone) || !/^\d{8,15}$/.test(phone.replace(/\D/g, ""))
    || !/^[1-9]\d{0,29}$/.test(paymentId) || !getStickerPackage(data.packageId)
    || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(requestId)
    || data.consent !== true || Boolean(data.website)) throw new Error("invalid-request");
  return { name, email, phone, paymentId, requestId, packageId: data.packageId as string, consent: true };
}

// A submission is a delivery request, never evidence that a payment is approved.
export async function forwardPurchaseRequest(data: PurchaseRequest, recipient: string, origin: string, send: typeof fetch = fetch) {
  if (!validDeliveryEmail(recipient)) throw new Error("receiver-not-configured");
  const pack = getStickerPackage(data.packageId)!;
  const reference = `LC-${data.requestId.toUpperCase()}`;
  const response = await send(`https://formsubmit.co/ajax/${encodeURIComponent(recipient)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", Referer: `${new URL(origin).origin}/gracias` },
    signal: AbortSignal.timeout(15000),
    body: JSON.stringify({
      _subject: `LeonidaCrew · Compra por revisar · ${reference}`,
      _template: "table",
      email: data.email,
      name: data.name,
      telefono: data.phone,
      pack: `${pack.name} · ${pack.stickers} ${pack.stickers === 1 ? "sticker" : "stickers"}`,
      numero_operacion: data.paymentId,
      referencia_solicitud: reference,
      estado: "Pendiente de verificación manual en la cuenta del comercio",
      consentimiento: "Datos autorizados para verificar la compra y coordinar la entrega",
      instrucciones: "Comprueba esta operación, el comprador, el importe y la moneda en tu propia cuenta de Mercado Pago. Esta solicitud no acredita un pago. Después de verificarlo, envía el ZIP correspondiente al correo indicado. Comprueba que esta operación no haya sido entregada antes.",
    }),
  });
  const result = await response.json() as { success?: unknown; message?: unknown };
  if (!response.ok || (result.success !== true && result.success !== "true")) throw new Error("receiver-unavailable");
  return { reference, status: "pending-review" as const };
}
