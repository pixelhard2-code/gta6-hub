import { authenticatedBuyer, stickerAdmin, apiError } from "@/app/lib/stickers/server";
import { deliverStickerOrder } from "@/app/lib/stickers/commerce";
import { sendStickerEmail } from "@/app/lib/stickers/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const buyer = await authenticatedBuyer(request);
    const { orderId } = await request.json();
    if (typeof orderId !== "string" || !/^lc_[a-f0-9]{32}$/.test(orderId)) throw new Error("invalid-order");
    const { db } = stickerAdmin();
    const order = await db.collection("sticker_orders").doc(orderId).get();
    if (order.data()?.uid !== buyer.uid || order.data()?.status !== "approved") return Response.json({ error: "not-your-order" }, { status: 403 });
    const sent = await deliverStickerOrder(db, orderId, sendStickerEmail);
    return Response.json({ sent });
  } catch (error) { return apiError(error); }
}
