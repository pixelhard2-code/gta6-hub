import type { Firestore, Transaction } from "firebase-admin/firestore";
import { stickerCollection } from "./namespace";
import { formatStickerNumber, readEntryNumbers } from "./entry-numbers";

/** Read first; call commit only after every transaction read has finished. */
export async function planStickerEntries(database: Firestore, transaction: Transaction, input: {
  orderId: string; uid: string; paymentId: string; stickerIds: readonly string[];
  existingNumbers: unknown; action: "active" | "void"; now: number;
}) {
  const numbers = readEntryNumbers(input.existingNumbers, input.existingNumbers === undefined ? undefined : input.stickerIds.length);
  const entries = database.collection(stickerCollection("sticker_entries"));
  if (numbers.length) {
    const snapshots = await Promise.all(numbers.map((number) => transaction.get(entries.doc(formatStickerNumber(number)))));
    snapshots.forEach((snapshot, index) => {
      const data = snapshot.data();
      if (!data || data.orderId !== input.orderId || data.uid !== input.uid || data.paymentId !== input.paymentId
        || data.number !== numbers[index] || data.stickerId !== input.stickerIds[index]
        || !["active", "void"].includes(data.status) || (input.action === "active" && data.status !== "active")) throw new Error("invalid-entry-allocation");
    });
    return { numbers, commit() {
      if (input.action === "void") for (const snapshot of snapshots) {
        if (snapshot.data()!.status === "active") transaction.update(snapshot.ref, { status: "void", invalidatedAt: input.now, reason: "payment-reversed" });
      }
    } };
  }
  if (input.action === "void") return { numbers, commit() {} };
  const counterRef = database.collection(stickerCollection("sticker_entry_counters")).doc("current");
  const counter = await transaction.get(counterRef);
  const last = counter.exists ? counter.data()!.lastNumber : 0;
  if (!Number.isSafeInteger(last) || last < 0 || !Number.isSafeInteger(last + input.stickerIds.length)) throw new Error("invalid-entry-allocation");
  const allocated = input.stickerIds.map((_, index) => last + index + 1);
  const snapshots = await Promise.all(allocated.map((number) => transaction.get(entries.doc(formatStickerNumber(number)))));
  if (snapshots.some((snapshot) => snapshot.exists)) throw new Error("entry-number-collision");
  return { numbers: allocated, commit() {
    transaction.set(counterRef, { lastNumber: last + allocated.length, updatedAt: input.now });
    allocated.forEach((number, index) => transaction.create(snapshots[index].ref, {
      number, code: formatStickerNumber(number), orderId: input.orderId, uid: input.uid,
      paymentId: input.paymentId, stickerId: input.stickerIds[index], status: "active", createdAt: input.now,
    }));
  } };
}
