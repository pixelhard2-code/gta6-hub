import { authenticatedBuyer, stickerAdmin, apiError, commerceConfig } from "@/app/lib/stickers/server";
import { readBuyerStickerOrder } from "@/app/lib/stickers/commerce";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
