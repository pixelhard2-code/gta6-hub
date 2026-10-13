export const dynamic = "force-dynamic";

// This unsigned legacy callback cannot prove a purchase. Only verified payments
// processed by /api/stickers/webhook may credit the new collection.
export async function POST() {
  return Response.json({ error: "legacy-payment-endpoint-disabled" }, { status: 410 });
}
