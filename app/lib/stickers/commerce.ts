import { createHash, createHmac, timingSafeEqual, randomUUID } from "node:crypto";
import type { Firestore } from "firebase-admin/firestore";
import { getStickerPackage, stickerCounts, totalStickers, validDeliveryEmail } from "./catalog";

export interface StickerOrder {
  uid: string;
  packageId: string;
  email: string;
  quantity: number;
  amount: number;
  currency: string;
  status: string;
  createdAt: number;
  paymentId?: string;
  checkoutUrl?: string;
}
export interface VerifiedPayment {
  id: number | string;
  external_reference?: string;
  status: string;
  transaction_amount: number;
  transaction_amount_refunded?: number;
  currency_id: string;
  collector_id: number | string;
  live_mode: boolean;
}

export function verifyMercadoPagoSignature(secret: string, id: string, requestId: string | null, signature: string | null) {
  if (!secret || !/^\d+$/.test(id) || !requestId || !signature || /[;\r\n]/.test(requestId)) return false;
  const parts = Object.fromEntries(signature.split(",").map((part) => part.trim().split("=")));
  if (!/^\d+$/.test(parts.ts || "") || !/^[a-f0-9]{64}$/i.test(parts.v1 || "")) return false;
  const expected = createHmac("sha256", secret).update(`id:${id};request-id:${requestId};ts:${parts.ts};`).digest();
  return timingSafeEqual(expected, Buffer.from(parts.v1, "hex"));
}

export async function createStickerOrder(database: Firestore, input: {
  uid: string; email: string; packageId: string; attemptId: string; amount: number; currency: string;
}) {
  const pack = getStickerPackage(input.packageId);
  if (!pack || !validDeliveryEmail(input.email) || !/^[a-f0-9-]{36}$/i.test(input.attemptId) || !Number.isFinite(input.amount) || input.amount <= 0) throw new Error("invalid-order");
  const id = "lc_" + createHash("sha256").update(`${input.uid}:${input.attemptId}`).digest("hex").slice(0, 32);
  const ref = database.collection("sticker_orders").doc(id);
  const order: StickerOrder = { uid: input.uid, email: input.email.trim().toLowerCase(), packageId: pack.id, quantity: pack.stickers, amount: input.amount, currency: input.currency, status: "pending", createdAt: Date.now() };
  const saved = await database.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (snapshot.exists) {
      const previous = snapshot.data() as StickerOrder;
      if (previous.uid !== input.uid || previous.packageId !== pack.id || previous.email !== order.email || previous.amount !== order.amount || previous.currency !== order.currency) throw new Error("conflicting-order");
      return previous;
    }
    transaction.create(ref, order);
    return order;
  });
  return { id, order: saved };
}

export async function prepareStickerCheckout(database: Firestore, orderId: string, create: (order: StickerOrder) => Promise<{ preferenceId: string; checkoutUrl: string }>) {
  const ref = database.collection("sticker_orders").doc(orderId);
  const leaseId = randomUUID();
  const saved = await database.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const data = snapshot.data();
    if (!data || data.status !== "pending") throw new Error("conflicting-order");
    if (data.checkoutUrl) return { order: data as StickerOrder, cached: String(data.checkoutUrl) };
    if (Number(data.checkoutLeaseUntil || 0) > Date.now()) throw new Error("checkout-busy");
    transaction.update(ref, { checkoutLeaseId: leaseId, checkoutLeaseUntil: Date.now() + 60000 });
    return { order: data as StickerOrder, cached: null };
  });
  if (saved.cached) return saved.cached;
  try {
    const preference = await create(saved.order);
    await database.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (snapshot.data()?.checkoutLeaseId !== leaseId) throw new Error("checkout-busy");
      transaction.update(ref, { ...preference, checkoutLeaseUntil: 0 });
    });
    return preference.checkoutUrl;
  } catch (error) {
    await database.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (snapshot.data()?.checkoutLeaseId === leaseId) transaction.update(ref, { checkoutLeaseUntil: 0 });
    });
    throw error;
  }
}

/** Only call with payment data fetched from Mercado Pago, never with webhook body data. */
export async function applyVerifiedPayment(database: Firestore, payment: VerifiedPayment, merchant: { collectorId: string; liveMode: boolean }) {
  if (!/^\d+$/.test(String(payment.id))) throw new Error("invalid-payment");
  if (!/^lc_[a-f0-9]{32}$/.test(payment.external_reference || "")) return { status: "ignored", orderId: null };
  const orderId = payment.external_reference!;
  const orderRef = database.collection("sticker_orders").doc(orderId);
  const paymentRef = database.collection("sticker_payments").doc(String(payment.id));
  return database.runTransaction(async (transaction) => {
    const orderSnap = await transaction.get(orderRef);
    if (!orderSnap.exists) throw new Error("unknown-order");
    const order = orderSnap.data() as StickerOrder;
    const pack = getStickerPackage(order.packageId);
    if (!pack || order.quantity !== pack.stickers) throw new Error("invalid-order");
    if (String(payment.collector_id) !== merchant.collectorId || payment.live_mode !== merchant.liveMode || payment.currency_id !== order.currency || !Number.isFinite(payment.transaction_amount) || Math.abs(payment.transaction_amount - order.amount) > 0.000001) throw new Error("payment-mismatch");

    const inventoryRef = database.collection("sticker_collections").doc(order.uid);
    const rankingRef = database.collection("sticker_leaderboard").doc(order.uid);
    const deliveryRef = database.collection("sticker_deliveries").doc(orderId);
    const [paymentSnap, inventorySnap, profileSnap, deliverySnap] = await Promise.all([
      transaction.get(paymentRef), transaction.get(inventoryRef), transaction.get(database.collection("users").doc(order.uid)), transaction.get(deliveryRef),
    ]);
    const previous = paymentSnap.data();
    if (previous && previous.orderId !== orderId) throw new Error("payment-already-assigned");
    const counts = stickerCounts(inventorySnap.data()?.counts);
    const reversed = ["refunded", "charged_back"].includes(payment.status) || Number(payment.transaction_amount_refunded || 0) > 0;
    const approved = payment.status === "approved" && !reversed;
    const wasCredited = previous?.credited === true;
    const now = Date.now();

    // A second payment for the same checkout needs a merchant review, not a silent extra credit.
    if (order.paymentId && order.paymentId !== String(payment.id)) {
      transaction.set(paymentRef, { orderId, uid: order.uid, status: "needs_review", credited: false, updatedAt: now });
      return { status: "needs_review", orderId };
    }
    if (approved && !wasCredited) {
      for (const id of pack.stickerIds) counts[id] += 1;
    } else if (reversed && wasCredited) {
      for (const id of pack.stickerIds) counts[id] = Math.max(0, counts[id] - 1);
    }
    const credited = approved || (wasCredited && !reversed);
    const status = reversed ? "refunded" : credited ? "approved" : payment.status;
    transaction.set(paymentRef, { orderId, uid: order.uid, status, credited, updatedAt: now });
    transaction.update(orderRef, { status, paymentId: String(payment.id), updatedAt: now });
    if (credited !== wasCredited) {
      const total = totalStickers(counts);
      transaction.set(inventoryRef, { uid: order.uid, counts, total, updatedAt: now });
      const profile = profileSnap.data();
      transaction.set(rankingRef, { uid: order.uid, total, displayName: String(profile?.displayName || "Jugador").slice(0, 50), photoURL: String(profile?.photoURL || ""), updatedAt: now });
    }
    if (approved && !deliverySnap.exists) {
      transaction.create(deliveryRef, { orderId, uid: order.uid, email: order.email, packageId: pack.id, quantity: pack.stickers, status: "pending", attempts: 0, createdAt: now });
    } else if (reversed && deliverySnap.exists && deliverySnap.data()?.status !== "sent") {
      transaction.update(deliveryRef, { status: "cancelled", updatedAt: now });
    }
    return { status, orderId };
  });
}

export async function deliverStickerOrder(database: Firestore, orderId: string, send: (job: { orderId: string; email: string; packageId: string; quantity: number }) => Promise<string>) {
  const jobRef = database.collection("sticker_deliveries").doc(orderId);
  const leaseId = randomUUID();
  const job = await database.runTransaction(async (transaction) => {
    const [snapshot, orderSnapshot] = await Promise.all([transaction.get(jobRef), transaction.get(database.collection("sticker_orders").doc(orderId))]);
    const data = snapshot.data();
    if (!data || orderSnapshot.data()?.status !== "approved" || ["sent", "cancelled"].includes(data.status) || Number(data.leaseUntil || 0) > Date.now()) return null;
    transaction.update(jobRef, { status: "sending", leaseId, leaseUntil: Date.now() + 60000, attempts: Number(data.attempts || 0) + 1 });
    return { orderId, email: String(data.email), packageId: String(data.packageId), quantity: Number(data.quantity) };
  });
  if (!job) return false;
  try {
    const emailId = await send(job);
    await jobRef.update({ status: "sent", emailId, sentAt: Date.now(), leaseUntil: 0 });
    return true;
  } catch (error) {
    await database.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(jobRef);
      if (snapshot.data()?.leaseId === leaseId && snapshot.data()?.status === "sending") transaction.update(jobRef, { status: "pending", leaseUntil: 0, lastError: "delivery-failed", updatedAt: Date.now() });
    });
    throw error;
  }
}
