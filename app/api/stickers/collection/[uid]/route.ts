import { stickerCollection } from "@/app/lib/stickers/namespace";
import { STICKER_SOCIAL_VISIBLE } from "@/app/lib/stickers/visibility";
import { adminConfigured, stickerAdmin, apiError } from "@/app/lib/stickers/server";
import { stickerCounts, totalStickers } from "@/app/lib/stickers/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ uid: string }> }) {
  const { uid } = await context.params;
  if (!/^[\w-]{1,128}$/.test(uid)) return Response.json({ error: "invalid-user" }, { status: 400 });
  if (!STICKER_SOCIAL_VISIBLE || process.env.MERCADOPAGO_MODE === "test" || !adminConfigured()) return Response.json({ configured: false, total: 0, counts: {} }, { headers: { "Cache-Control": "no-store" } });
  try {
    const collection = await stickerAdmin().db.collection(stickerCollection("sticker_collections")).doc(uid).get();
    const counts = stickerCounts(collection.data()?.counts);
    return Response.json({ configured: true, total: totalStickers(counts), counts }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}
