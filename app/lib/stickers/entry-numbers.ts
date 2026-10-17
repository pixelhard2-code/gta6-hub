export function readEntryNumbers(value: unknown, quantity?: number): number[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || (quantity !== undefined && value.length !== quantity) || value.length > 5
    || value.some((number) => !Number.isSafeInteger(number) || number < 1)
    || new Set(value).size !== value.length) throw new Error("invalid-entry-allocation");
  return [...value];
}

export function formatStickerNumber(number: number, testMode = false) {
  if (!Number.isSafeInteger(number) || number < 1) throw new Error("invalid-entry-allocation");
  return (testMode ? "PRUEBA-" : "") + String(number).padStart(6, "0");
}
