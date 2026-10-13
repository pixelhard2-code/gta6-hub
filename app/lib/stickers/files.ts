import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { STICKERS } from "./catalog";

export async function stickerZip(ids: readonly string[], quantity: number) {
  const selected = STICKERS.filter((sticker) => ids.includes(sticker.id));
  if (!selected.length || selected.length !== new Set(ids).size) throw new Error("invalid-stickers");
  const files: Record<string, Uint8Array> = {};
  for (const sticker of selected) files[sticker.file] = new Uint8Array(await readFile(join(process.cwd(), "assets", "stickers", sticker.file)));
  files["LEEME.txt"] = strToU8(`LeonidaCrew - Stickers digitales\n\nPNG de 1200 x 1200 px con fondo transparente.\nStickers acreditados en esta compra o colección: ${quantity}.\nCada sticker de una compra confirmada equivale a una participación en el sorteo promocional, según sus bases.\n\nPara uso personal. No implica afiliación con Rockstar Games ni Sony.\n`);
  return zipSync(files, { level: 6, mtime: new Date("2026-10-13T00:00:00Z") });
}
