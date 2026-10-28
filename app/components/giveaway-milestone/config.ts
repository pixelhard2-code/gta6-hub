// Edit only this file to publish a verified count. No Firebase connection.
export const GIVEAWAY_MILESTONE = {
  enabled: true,
  // Visual experiment only: always labeled as simulated. Set null to show real data.
  demoStickers: null as number | null,
  // Verified total of paid online and WhatsApp sales, excluding refunds and tests.
  // null keeps the goal visible without claiming any sales figure.
  confirmedStickers: null as number | null,
  // Required with a number: date of the verified count, e.g. "2026-10-28".
  updatedOn: null as string | null,
};
