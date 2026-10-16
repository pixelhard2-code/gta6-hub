export type StickerCollectionName =
  | "sticker_orders" | "sticker_payments" | "sticker_collections"
  | "sticker_leaderboard" | "sticker_deliveries" | "sticker_checkout_limits";

// Simulated purchases never grant real stickers or enter the real ranking.
export function stickerCollection(name: StickerCollectionName, mode = process.env.MERCADOPAGO_MODE) {
  return mode === "test" ? name.replace(/^sticker_/, "sticker_test_") : name;
}
