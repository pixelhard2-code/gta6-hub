// Server-side registry. Add or disable partners here; never accept a client-supplied name or commission.
export const REFERRAL_PARTNERS: Record<string, { name: string; active: boolean }> = {
  juan: { name: "Juan", active: true },
};
