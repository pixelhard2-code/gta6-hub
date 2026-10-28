export const STICKERS_PER_PRIZE = 1_000;

export type MilestoneState = {
  confirmedStickers: number | null;
  updatedOn: string | null;
  demo: boolean;
  displayedStickers: number | null;
  prizes: number;
  nextPrizes: number;
  progress: number;
  remaining: number;
  nextGoal: number;
};

// Invalid settings hide this optional section instead of breaking the page.
export function readMilestone(value: unknown): MilestoneState | null {
  if (!value || typeof value !== "object") return null;
  const config = value as Record<string, unknown>;
  if (config.enabled !== true) return null;
  const demo = config.demoStickers !== null && config.demoStickers !== undefined;
  const total = demo ? config.demoStickers : config.confirmedStickers;
  if (total !== null && (
    typeof total !== "number" || !Number.isSafeInteger(total) || total < 0 ||
    total > Number.MAX_SAFE_INTEGER - STICKERS_PER_PRIZE
  )) return null;

  let updatedOn: string | null = null;
  if (total !== null && !demo) {
    if (typeof config.updatedOn !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(config.updatedOn)) return null;
    const timestamp = Date.parse(`${config.updatedOn}T00:00:00.000Z`);
    if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== config.updatedOn) return null;
    updatedOn = config.updatedOn;
  }

  const completed = Math.floor((total ?? 0) / STICKERS_PER_PRIZE);
  const progress = (total ?? 0) % STICKERS_PER_PRIZE;
  return {
    confirmedStickers: demo ? null : total,
    updatedOn,
    demo,
    displayedStickers: total,
    prizes: 1 + completed,
    nextPrizes: 2 + completed,
    progress,
    remaining: STICKERS_PER_PRIZE - progress,
    nextGoal: (completed + 1) * STICKERS_PER_PRIZE,
  };
}
