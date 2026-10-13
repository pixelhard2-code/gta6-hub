import "server-only";
import { sendStickerEmailWithConfig, type StickerEmailJob } from "./email-transport";
import { appUrl } from "./server";

export async function sendStickerEmail(job: StickerEmailJob) {
  return sendStickerEmailWithConfig(job, { apiKey: process.env.RESEND_API_KEY || "", from: process.env.STICKER_EMAIL_FROM || "", appUrl: appUrl() });
}
