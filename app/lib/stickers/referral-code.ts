// Shared syntax only. The trusted list of partners stays on the server.
export function readReferralCode(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") throw new Error("invalid-referral");
  const code = value.trim().toLowerCase();
  if (!code) return null;
  if (!/^[a-z0-9][a-z0-9_-]{2,31}$/.test(code)) throw new Error("invalid-referral");
  return code;
}
