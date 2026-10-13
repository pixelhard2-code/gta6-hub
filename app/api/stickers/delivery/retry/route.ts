import { timingSafeEqual } from "node:crypto";
import { stickerAdmin } from "@/app/lib/stickers/server";
import { deliverStickerOrder } from "@/app/lib/stickers/commerce";
import { sendStickerEmail } from "@/app/lib/stickers/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const supplied = request.headers.get("authorization") || "";
  if (!secret || supplied.length !== `Bearer ${secret}`.length || !timingSafeEqual(Buffer.from(supplied), Buffer.from(`Bearer ${secret}`))) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { db } = stickerAdmin();
  const [pending, expired] = await Promise.all([db.collection("sticker_deliveries").where("status", "==", "pending").limit(5).get(), db.collection("sticker_deliveries").where("status", "==", "sending").limit(5).get()]);
  let sent = 0;
  for (const job of [...pending.docs, ...expired.docs]) {
    try { if (await deliverStickerOrder(db, job.id, sendStickerEmail)) sent++; } catch { /* durable job stays pending */ }
  }
  return Response.json({ sent });
}
