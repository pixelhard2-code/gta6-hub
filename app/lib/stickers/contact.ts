export interface BuyerContact { firstName: string; lastName: string; phone: string }

export function readBuyerContact(value: unknown): BuyerContact {
  const input = value as Partial<BuyerContact> | null;
  const name = (text: unknown) => typeof text === "string" ? text.trim().normalize("NFC").replace(/\s+/gu, " ") : "";
  const firstName = name(input?.firstName), lastName = name(input?.lastName);
  const validName = (text: string) => /^[\p{L}\p{M}][\p{L}\p{M} .’'-]{0,79}$/u.test(text);
  const rawPhone = typeof input?.phone === "string" ? input.phone.trim() : "";
  if (!validName(firstName) || !validName(lastName) || !/^\+?[\d ().-]{8,30}$/.test(rawPhone)) throw new Error("invalid-contact");
  const digits = rawPhone.replace(/\D/g, "");
  const phone = rawPhone.startsWith("+") || digits.startsWith("56") ? "+" + digits : digits.length === 9 ? "+56" + digits : "";
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) throw new Error("invalid-contact");
  return { firstName, lastName, phone };
}
