export const STICKERS = [
  { id: "vice-palm", name: "Palmeras de Vice", file: "vice-palm.png", preview: "/stickers/vice-palm.svg" },
  { id: "night-ride", name: "Night Ride", file: "night-ride.png", preview: "/stickers/night-ride.svg" },
  { id: "sunset-crew", name: "Sunset Crew", file: "sunset-crew.png", preview: "/stickers/sunset-crew.svg" },
  { id: "ocean-drive", name: "Ocean Drive", file: "ocean-drive.png", preview: "/stickers/ocean-drive.svg" },
  { id: "crew-badge", name: "Insignia de la Crew", file: "crew-badge.png", preview: "/stickers/crew-badge.svg" },
] as const;

export const STICKER_PACKAGES = [
  { id: "basic", name: "Pack Básico", stickers: 1, price: 3, unitPrice: "$3.00 c/u", badge: "", highlight: false, paymentUrl: "https://mpago.la/2SARTNX", stickerIds: ["vice-palm"] },
  { id: "double", name: "Pack Doble", stickers: 2, price: 5, unitPrice: "$2.50 c/u", badge: "Popular · Ahorras $1", highlight: false, paymentUrl: "https://mpago.la/1J28NAx", stickerIds: ["vice-palm", "night-ride"] },
  { id: "legend", name: "Pack Leyenda Vice City", stickers: 5, price: 10, unitPrice: "$2.00 c/u", badge: "Mejor Valor · 33% Ahorro", highlight: true, paymentUrl: "https://mpago.la/22A25HZ", stickerIds: STICKERS.map((sticker) => sticker.id) },
] as const;

export function getStickerPackage(id: unknown) {
  return STICKER_PACKAGES.find((pack) => pack.id === id);
}

export function stickerCounts(data: unknown): Record<string, number> {
  const input = data && typeof data === "object" ? data as Record<string, unknown> : {};
  return Object.fromEntries(STICKERS.map(({ id }) => [id, Number.isSafeInteger(input[id]) && Number(input[id]) > 0 ? Number(input[id]) : 0]));
}

export function totalStickers(counts: Record<string, number>) {
  return STICKERS.reduce((total, sticker) => total + (counts[sticker.id] || 0), 0);
}

export function validDeliveryEmail(value: unknown): value is string {
  return typeof value === "string" && value.length <= 254 && /^[^\s@<>;,]+@[^\s@<>;,]+\.[^\s@<>;,]+$/.test(value);
}
