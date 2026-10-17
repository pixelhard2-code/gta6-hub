// Edit only this file to publish a verified count. No Firebase connection.
export const GIVEAWAY_MILESTONE = {
  enabled: true,
  // Total real stickers from approved purchases, excluding refunds and tests.
  // null keeps the goal visible without claiming any sales figure.
  confirmedStickers: null as number | null,
  // Required with a number: date of the verified count, e.g. "2026-10-17".
  updatedOn: null as string | null,
};
