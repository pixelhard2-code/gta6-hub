import { commerceConfig, mercadoPago, stickerAdmin } from "@/app/lib/stickers/server";
import { applyVerifiedPayment, deliverStickerOrder, verifyMercadoPagoSignature, type VerifiedPayment } from "@/app/lib/stickers/commerce";
import { sendStickerEmail } from "@/app/lib/stickers/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const config = commerceConfig();
  if (!config.ready) return Response.json({ error: "setup-required" }, { status: 503 });
  const url = new URL(request.url);
  const id = url.searchParams.get("data.id") || "";
  if (!verifyMercadoPagoSignature(process.env.MERCADOPAGO_WEBHOOK_SECRET || "", id, request.headers.get("x-request-id"), request.headers.get("x-signature"))) return Response.json({ error: "invalid-signature" }, { status: 401 });
  try {
    const event = await request.json();
    if (event.type !== "payment" || String(event.data?.id) !== id) return Response.json({ status: "ignored" });
    const payment = await mercadoPago(`/v1/payments/${id}`) as VerifiedPayment;
    if (String(payment.id) !== id) throw new Error("payment-mismatch");
    const { db } = stickerAdmin();
    const result = await applyVerifiedPayment(db, payment, { collectorId: config.collectorId, liveMode: config.liveMode });
    if (result.status === "approved" && result.orderId) await deliverStickerOrder(db, result.orderId, sendStickerEmail);
    return Response.json({ status: result.status });
  } catch {
    // A failed email remains queued and Mercado Pago can retry safely.
    return Response.json({ error: "processing-failed" }, { status: 500 });
  }
}
