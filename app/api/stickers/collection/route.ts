import { stickerCollection } from "@/app/lib/stickers/namespace";
import { adminConfigured, authenticatedBuyer, stickerAdmin, apiError } from "@/app/lib/stickers/server";
import { stickerCounts, totalStickers } from "@/app/lib/stickers/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!adminConfigured()) return Response.json({ configured: false, total: 0, counts: {}, orders: [] }, { headers: { "Cache-Control": "no-store" } });
  try {
    const buyer = await authenticatedBuyer(request);
    const { db } = stickerAdmin();
    const [collection, purchases] = await Promise.all([
      db.collection(stickerCollection("sticker_collections")).doc(buyer.uid).get(),
      db.collection(stickerCollection("sticker_orders")).where("uid", "==", buyer.uid).get(),
    ]);
    const counts = stickerCounts(collection.data()?.counts);
    const orders = await Promise.all(purchases.docs.sort((a, b) => Number(b.data().createdAt) - Number(a.data().createdAt)).slice(0, 15).map(async (item) => {
      const data = item.data();
      const delivery = await db.collection(stickerCollection("sticker_deliveries")).doc(item.id).get();
      return { id: item.id, quantity: data.quantity, packageId: data.packageId, status: data.status, createdAt: data.createdAt, email: data.email, delivery: delivery.data()?.status || "awaiting-payment" };
    }));
    return Response.json({ configured: true, counts, total: totalStickers(counts), orders }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}
