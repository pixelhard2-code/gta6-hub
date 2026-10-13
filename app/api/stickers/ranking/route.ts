import { adminConfigured, stickerAdmin, apiError } from "@/app/lib/stickers/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!adminConfigured()) return Response.json({ configured: false, leaders: [] });
  try {
    const { db } = stickerAdmin();
    const snapshot = await db.collection("sticker_leaderboard").orderBy("total", "desc").limit(10).get();
    const leaders = await Promise.all(snapshot.docs.filter((item) => item.data().total > 0).map(async (item, index) => {
      const profile = await db.collection("users").doc(item.id).get();
      return { uid: item.id, rank: index + 1, total: item.data().total, name: String(profile.data()?.displayName || item.data().displayName || "Jugador"), photo: String(profile.data()?.photoURL || item.data().photoURL || "") };
    }));
    return Response.json({ configured: true, leaders }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}
