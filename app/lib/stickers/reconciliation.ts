import { randomUUID } from "node:crypto";
import type { Firestore } from "firebase-admin/firestore";
import { applyVerifiedPayment, deliverStickerOrder, readBuyerStickerOrder, type StickerOrder, type VerifiedPayment } from "./commerce";
import { stickerCollection } from "./namespace";
import type { StickerEmailJob } from "./email-transport";
import { paymentFailureInfo } from "./payment-errors";
import type { VerifiedMerchant } from "./merchant";

/** A return URL is only a lookup hint. Only a payment fetched from the provider can grant stickers. */
export async function reconcileBuyerStickerOrder(database: Firestore, input: {
  uid: string; orderId: string; paymentId?: string; now?: number;
}, resolveMerchant: () => Promise<VerifiedMerchant>, provider: (path: string) => Promise<unknown>, send: (job: StickerEmailJob) => Promise<string>) {
  if (!/^lc_[a-f0-9]{32}$/.test(input.orderId) || (input.paymentId && !/^\d{1,32}$/.test(input.paymentId))) throw new Error("invalid-order");
  const ref = database.collection(stickerCollection("sticker_orders")).doc(input.orderId);
  const now = input.now ?? Date.now(), leaseId = randomUUID();
  const claim = await database.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const order = snapshot.data();
    if (!order || order.uid !== input.uid) return null;
    if (Number(order.syncLeaseUntil || 0) > now || Number(order.syncLastAttemptAt || 0) + 15000 > now) return { claimed: false, order: order as StickerOrder };
    transaction.update(ref, { syncLeaseId: leaseId, syncLeaseUntil: now + 60000, syncLastAttemptAt: now });
    return { claimed: true, order: order as StickerOrder };
  });
  if (!claim) return null;
  if (!claim.claimed) return readBuyerStickerOrder(database, input.uid, input.orderId);

  let failureCode = "";
  try {
    let payment: VerifiedPayment | null = null;
    const fetchPayment = async (id: string) => {
      if (!/^\d{1,32}$/.test(id)) throw new Error("payment-mismatch");
      const fetched = await provider(`/v1/payments/${id}`) as VerifiedPayment;
      if (String(fetched.id) !== id || fetched.external_reference !== input.orderId) return null;
      return fetched;
    };
    // Prefer the payment already bound by the server. A browser cannot replace it.
    const preferredId = claim.order.paymentId || input.paymentId;
    if (preferredId) payment = await fetchPayment(preferredId);
    if (!payment && !claim.order.paymentId) {
      const query = new URLSearchParams({ external_reference: input.orderId, sort: "date_created", criteria: "desc", limit: "10" });
      const search = await provider(`/v1/payments/search?${query}`) as { results?: VerifiedPayment[] };
      const candidates = (Array.isArray(search.results) ? search.results : [])
        .filter((item) => item.external_reference === input.orderId && /^\d{1,32}$/.test(String(item.id)))
        .sort((a, b) => Number(b.status === "approved") - Number(a.status === "approved"));
      if (candidates[0]) payment = await fetchPayment(String(candidates[0].id));
    }
    if (payment) {
      const merchant = await resolveMerchant();
      const applied = await applyVerifiedPayment(database, payment, merchant);
      if (applied.status === "approved" && applied.orderId === input.orderId) {
        try { await deliverStickerOrder(database, input.orderId, send); }
        catch { /* The approved purchase and durable delivery job remain available for retry. */ }
      }
    }
  } catch (error) {
    failureCode = paymentFailureInfo(error)?.code || "verification-failed";
    throw error;
  } finally {
    await database.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (snapshot.data()?.syncLeaseId === leaseId) transaction.update(ref, { syncLeaseUntil: 0, syncErrorCode: failureCode });
    });
  }
  return readBuyerStickerOrder(database, input.uid, input.orderId);
}
