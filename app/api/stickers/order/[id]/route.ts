import { authenticatedBuyer, stickerAdmin, apiError, commerceConfig, mercadoPago, verifiedStickerMerchant } from "@/app/lib/stickers/server";
import { readBuyerStickerOrder } from "@/app/lib/stickers/commerce";
import { reconcileBuyerStickerOrder } from "@/app/lib/stickers/reconciliation";
import { sendStickerEmail } from "@/app/lib/stickers/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const buyer = await authenticatedBuyer(request);
    const { id } = await context.params;
    const { db } = stickerAdmin();
    const data = await readBuyerStickerOrder(db, buyer.uid, id);
    if (!data) return Response.json({ error: "not-found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
    return Response.json({ ...data, testMode: !commerceConfig().liveMode }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const buyer = await authenticatedBuyer(request);
    if (!buyer.email_verified) throw new Error("unauthorized");
    const config = commerceConfig();
    if (!config.ready) throw new Error("setup-required");
    const { id } = await context.params;
    const body = await request.json().catch(() => { throw new Error("invalid-order"); });
    if (!body || typeof body !== "object" || Array.isArray(body) || (body.paymentId !== undefined && typeof body.paymentId !== "string")) throw new Error("invalid-order");
    const { db } = stickerAdmin();
    const data = await reconcileBuyerStickerOrder(db, { uid: buyer.uid, orderId: id, paymentId: body.paymentId }, () => verifiedStickerMerchant(config), mercadoPago, sendStickerEmail);
    if (!data) return Response.json({ error: "not-found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
    return Response.json({ ...data, testMode: !config.liveMode }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}
