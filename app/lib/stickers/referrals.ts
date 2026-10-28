import type { Firestore, Transaction } from "firebase-admin/firestore";
import { stickerCollection } from "./namespace";
import { readReferralCode } from "./referral-code";
import { REFERRAL_PARTNERS } from "./referral-partners";

export function activeReferral(value: unknown) {
  const code = readReferralCode(value);
  if (!code) return null;
  const partner = Object.prototype.hasOwnProperty.call(REFERRAL_PARTNERS, code) ? REFERRAL_PARTNERS[code] : null;
  if (!partner?.active) throw new Error("invalid-referral");
  return { code, name: partner.name };
}

type ReferralSale = {
  orderId: string; paymentId: string; code: string; name: string;
  quantity: number; amount: number; currency: string; credited: boolean; now: number;
};

// Read first, then commit together with the order, payment and sticker allocation.
// Per-order records make retries and concurrent webhooks idempotent.
export async function planReferralSale(database: Firestore, transaction: Transaction, input: ReferralSale) {
  if (readReferralCode(input.code) !== input.code || !input.code || !/^[A-Z]{3}$/.test(input.currency) ||
      !Number.isSafeInteger(input.quantity) || input.quantity < 1 || !Number.isFinite(input.amount) || input.amount <= 0) throw new Error("invalid-referral-allocation");
  const saleRef = database.collection(stickerCollection("sticker_referral_sales")).doc(input.orderId);
  const totalsRef = database.collection(stickerCollection("sticker_referral_totals")).doc(input.code);
  const [saleSnap, totalsSnap] = await Promise.all([transaction.get(saleRef), transaction.get(totalsRef)]);
  const previous = saleSnap.data(), totals = totalsSnap.data();
  if (previous && (previous.orderId !== input.orderId || previous.paymentId !== input.paymentId || previous.code !== input.code || previous.quantity !== input.quantity || previous.amount !== input.amount || previous.currency !== input.currency || typeof previous.credited !== "boolean")) throw new Error("invalid-referral-allocation");
  const wasCredited = previous?.credited === true;
  if ((!previous && !input.credited) || (previous && wasCredited === input.credited)) return { commit() {} };
  // Once reversed, an old approved snapshot cannot restore a commissionable sale.
  if (previous?.status === "reversed" && input.credited) throw new Error("invalid-referral-allocation");
  const direction = input.credited ? 1 : -1;
  const approvedOrders = (totals?.approvedOrders ?? 0) + direction;
  const approvedStickers = (totals?.approvedStickers ?? 0) + direction * input.quantity;
  const amounts = totals?.approvedAmounts ?? {};
  if (!amounts || typeof amounts !== "object" || Array.isArray(amounts)) throw new Error("invalid-referral-allocation");
  const beforeAmount = Object.prototype.hasOwnProperty.call(amounts, input.currency) ? amounts[input.currency] : 0;
  const amount = Math.round((beforeAmount + direction * input.amount) * 100) / 100;
  if ((totals && totals.code !== input.code) || !Number.isSafeInteger(approvedOrders) || approvedOrders < 0 || !Number.isSafeInteger(approvedStickers) || approvedStickers < 0 || typeof beforeAmount !== "number" || !Number.isFinite(amount) || amount < 0) throw new Error("invalid-referral-allocation");
  return { commit() {
    transaction.set(saleRef, {
      orderId: input.orderId, paymentId: input.paymentId, code: input.code, name: input.name,
      quantity: input.quantity, amount: input.amount, currency: input.currency,
      credited: input.credited, status: input.credited ? "approved" : "reversed",
      createdAt: previous?.createdAt ?? input.now, updatedAt: input.now,
    });
    transaction.set(totalsRef, {
      code: input.code, name: input.name, approvedOrders, approvedStickers,
      approvedAmounts: { ...amounts, [input.currency]: amount }, updatedAt: input.now,
    });
  } };
}
