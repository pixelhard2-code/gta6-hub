import { createHash } from "node:crypto";
import type { Firestore } from "firebase-admin/firestore";
import { getStickerPackage, stickerCounts, totalStickers, validDeliveryEmail } from "./catalog";

/** Private merchant tool only: check the real payment in the seller dashboard first. */
export async function creditDashboardReviewedPurchase(database: Firestore, input: {
  paymentId: string; uid: string; packageId: string; email: string;
  amount: number; currency: string; reviewer: string; confirmedInDashboard: boolean;
}) {
  const pack = getStickerPackage(input.packageId);
  if (input.confirmedInDashboard !== true || !pack || !/^[1-9]\d*$/.test(input.paymentId) || !/^[\w-]{1,128}$/.test(input.uid) || !validDeliveryEmail(input.email) || !Number.isFinite(input.amount) || input.amount <= 0 || !["CLP", "USD"].includes(input.currency) || (input.currency === "CLP" && !Number.isInteger(input.amount)) || !input.reviewer.trim() || input.reviewer.length > 80) throw new Error("manual-review-required");
  const id = "lc_" + createHash("sha256").update(`direct:${input.paymentId}`).digest("hex").slice(0,32);
  const email = input.email.toLowerCase();
  const orderRef = database.collection("sticker_orders").doc(id);
  const paymentRef = database.collection("sticker_payments").doc(input.paymentId);
  const inventoryRef = database.collection("sticker_collections").doc(input.uid);
  const rankingRef = database.collection("sticker_leaderboard").doc(input.uid);
  const deliveryRef = database.collection("sticker_deliveries").doc(id);
  return database.runTransaction(async transaction => {
    const [orderSnap, paymentSnap, inventorySnap, profileSnap] = await Promise.all([
      transaction.get(orderRef), transaction.get(paymentRef), transaction.get(inventoryRef), transaction.get(database.collection("users").doc(input.uid)),
    ]);
    const existing = orderSnap.data(), payment = paymentSnap.data();
    if (payment && payment.orderId !== id) throw new Error("payment-already-assigned");
    if (existing && (existing.uid !== input.uid || existing.email !== email || existing.packageId !== pack.id || existing.amount !== input.amount || existing.currency !== input.currency)) throw new Error("payment-already-assigned");
    if (existing?.status === "refunded" || payment?.status === "refunded") throw new Error("refunded-payment");
    if (payment?.credited) return { orderId: id, repeated: true };
    const counts = stickerCounts(inventorySnap.data()?.counts);
    for (const stickerId of pack.stickerIds) counts[stickerId] += 1;
    const total = totalStickers(counts), now = Date.now(), profile = profileSnap.data();
    const review = { source: "merchant-dashboard-review", reviewedBy: input.reviewer.trim(), reviewedAt: now };
    transaction.set(orderRef, { uid: input.uid, email, packageId: pack.id, quantity: pack.stickers, amount: input.amount, currency: input.currency, status: "approved", paymentId: input.paymentId, createdAt: existing?.createdAt || now, updatedAt: now, ...review });
    transaction.set(paymentRef, { orderId: id, uid: input.uid, status: "approved", credited: true, updatedAt: now, ...review });
    transaction.set(inventoryRef, { uid: input.uid, counts, total, updatedAt: now });
    transaction.set(rankingRef, { uid: input.uid, total, displayName: String(profile?.displayName || "Jugador").slice(0,50), photoURL: String(profile?.photoURL || ""), updatedAt: now });
    transaction.set(deliveryRef, { orderId: id, uid: input.uid, email, packageId: pack.id, quantity: pack.stickers, method: "manual", status: "manual-pending", createdAt: now });
    return { orderId: id, repeated: false };
  });
}

/** Call after the merchant has sent the actual email from their mailbox. */
export async function markManualStickerEmailSent(database: Firestore, orderId: string) {
  if (!/^lc_[a-f0-9]{32}$/.test(orderId)) throw new Error("invalid-order");
  return database.runTransaction(async transaction => {
    const jobRef = database.collection("sticker_deliveries").doc(orderId);
    const [job, order] = await Promise.all([transaction.get(jobRef), transaction.get(database.collection("sticker_orders").doc(orderId))]);
    if (job.data()?.method !== "manual" || order.data()?.status !== "approved") throw new Error("not-manual-delivery");
    if (job.data()?.status === "sent") return false;
    if (job.data()?.status !== "manual-pending") throw new Error("invalid-delivery-status");
    transaction.update(jobRef, { status: "sent", sentAt: Date.now() });
    return true;
  });
}
