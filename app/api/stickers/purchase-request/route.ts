import { forwardPurchaseRequest, readPurchaseRequest } from "@/app/lib/stickers/purchase-request";
import { validDeliveryEmail } from "@/app/lib/stickers/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const recent = new Map<string, { count: number; resetAt: number }>();
const headers = { "Cache-Control": "no-store" };

export async function GET() {
  return Response.json({ available: validDeliveryEmail(process.env.STICKER_REQUEST_RECIPIENT) }, { headers });
}

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  if (request.headers.get("origin") !== origin) return Response.json({ message: "Envía la solicitud desde el formulario de LeonidaCrew." }, { status: 403, headers });
  if (!request.headers.get("content-type")?.startsWith("application/json")) return Response.json({ message: "Formato de solicitud inválido." }, { status: 400, headers });
  if (Number(request.headers.get("content-length")) > 8192) return Response.json({ message: "La solicitud es demasiado grande." }, { status: 413, headers });
  try {
    const body = await request.text();
    if (body.length > 8192) return Response.json({ message: "La solicitud es demasiado grande." }, { status: 413, headers });
    let input: unknown;
    try { input = JSON.parse(body); } catch { throw new Error("invalid-request"); }
    const data = readPurchaseRequest(input);
    if (!validDeliveryEmail(process.env.STICKER_REQUEST_RECIPIENT)) throw new Error("receiver-not-configured");
    // Best-effort per-instance throttling; FormSubmit also applies its own spam filters.
    const now = Date.now();
    for (const [key, value] of recent) if (value.resetAt <= now) recent.delete(key);
    const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const entry = recent.get(key);
    if (entry && entry.count >= 5) return Response.json({ message: "Has enviado varias solicitudes. Espera unos minutos antes de intentarlo otra vez." }, { status: 429, headers });
    if (recent.size >= 5000) return Response.json({ message: "Hay muchas solicitudes en este momento. Inténtalo en unos minutos." }, { status: 429, headers });
    recent.set(key, { count: (entry?.count || 0) + 1, resetAt: entry?.resetAt || now + 10 * 60 * 1000 });
    const result = await forwardPurchaseRequest(data, process.env.STICKER_REQUEST_RECIPIENT!, origin);
    return Response.json(result, { status: 201, headers });
  } catch (error) {
    const invalid = error instanceof Error && error.message === "invalid-request";
    return Response.json({ message: invalid ? "Revisa tu nombre, correo, teléfono, pack, número de operación y autorización de contacto." : "No pudimos enviar la solicitud. Conserva tu comprobante y vuelve a intentarlo; tus datos siguen en el formulario." }, { status: invalid ? 400 : 503, headers });
  }
}
