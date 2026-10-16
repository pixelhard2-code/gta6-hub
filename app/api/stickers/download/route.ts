import { stickerCollection } from "@/app/lib/stickers/namespace";
import { authenticatedBuyer, stickerAdmin, apiError } from "@/app/lib/stickers/server";
import { stickerCounts, totalStickers, STICKERS } from "@/app/lib/stickers/catalog";
import { stickerZip } from "@/app/lib/stickers/files";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const buyer = await authenticatedBuyer(request);
    const snapshot = await stickerAdmin().db.collection(stickerCollection("sticker_collections")).doc(buyer.uid).get();
    const counts = stickerCounts(snapshot.data()?.counts);
    if (!totalStickers(counts)) return Response.json({ error: "empty-collection" }, { status: 403 });
    const zip = await stickerZip(STICKERS.filter((item) => counts[item.id] > 0).map((item) => item.id), totalStickers(counts));
    const bytes = new Uint8Array(zip.length); bytes.set(zip);
    return new Response(bytes.buffer, { headers: { "Content-Type": "application/zip", "Content-Disposition": 'attachment; filename="leonidacrew-stickers.zip"', "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}
