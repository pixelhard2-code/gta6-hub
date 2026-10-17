"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useCurrentUserProfile } from "@/app/lib/useCurrentUserProfile";
import AuthModal from "./AuthModal";
import styles from "./Hub.module.css";
import { formatStickerNumber } from "@/app/lib/stickers/entry-numbers";

interface Purchase {
  id: string; quantity: number; email: string; amount: number; currency: string;
  status: string; delivery: string; testMode: boolean; deliveryError?: boolean;
  verificationError?: { code: string; message: string } | null;
  entryNumbers?: number[];
}

export default function PurchaseStatus() {
  const { user, loading } = useCurrentUserProfile();
  const [orderId, setOrderId] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [record, setPurchase] = useState<(Purchase & { buyerUid: string }) | null>(null);
  const purchase = user && record?.buyerUid === user.uid && record.id === orderId ? record : null;
  const [error, setError] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("orden") || "";
    const paymentHint = params.get("payment_id") || params.get("collection_id") || "";
    if (/^\d{1,32}$/.test(paymentHint)) setPaymentId(paymentHint);
    if (/^lc_[a-f0-9]{32}$/.test(id)) setOrderId(id);
    else setError("El enlace de compra no es válido.");
  }, []);
  useEffect(() => {
    if (!user || !orderId) return;
    const controller = new AbortController();
    let active = true, running = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;
    setError("");
    const load = async () => {
      if (running || !active) return;
      running = true;
      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/stickers/order/" + orderId, { headers: { Authorization: "Bearer " + token }, cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error(response.status === 404 ? "No encontramos esta compra en tu cuenta." : "No pudimos consultar la compra.");
        let result = await response.json() as Purchase;
        let syncError = "";
        if (!["refunded", "charged_back"].includes(result.status) && !(result.status === "approved" && result.delivery === "sent" && result.entryNumbers?.length === result.quantity)) {
          try {
            const sync = await fetch("/api/stickers/order/" + orderId, {
              method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
              body: JSON.stringify({ ...(paymentId ? { paymentId } : {}) }), signal: controller.signal,
            });
            const synchronized = await sync.json().catch(() => null);
            if (!sync.ok) throw new Error(typeof synchronized?.message === "string" ? synchronized.message : `No pudimos consultar la confirmación (HTTP ${sync.status}).`);
            if (!synchronized || synchronized.id !== orderId) throw new Error("No pudimos leer la respuesta de confirmación de esta compra.");
            result = synchronized as Purchase;
          } catch (problem) {
            if (controller.signal.aborted) return;
            syncError = problem instanceof Error ? problem.message : "No pudimos actualizar la confirmación en este momento.";
          }
        }
        if (!active) return;
        setPurchase({ ...result, buyerUid: user.uid }); setError(syncError || result.verificationError?.message || "");
        if (++attempts < 30 && !["refunded", "charged_back", "rejected", "cancelled", "canceled"].includes(result.status) && !(result.status === "approved" && result.delivery === "sent")) timer = setTimeout(() => void load(), 5000);
      } catch (problem) {
        if (active && !controller.signal.aborted) setError(problem instanceof Error ? problem.message : "No pudimos consultar la compra.");
      } finally { running = false; }
    };
    void load();
    return () => { active = false; controller.abort(); if (timer) clearTimeout(timer); };
  }, [user, orderId, paymentId, revision]);
  async function retryDelivery() {
    if (!user || busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/stickers/delivery", { method: "POST", headers: { Authorization: "Bearer " + await user.getIdToken(), "Content-Type": "application/json" }, body: JSON.stringify({ orderId }) });
      if (!response.ok) throw new Error("No pudimos reintentar el envío. Inténtalo nuevamente en unos minutos.");
      setRevision(value => value + 1);
    } catch (problem) { setError(problem instanceof Error ? problem.message : "No pudimos reintentar el envío."); }
    finally { setBusy(false); }
  }
  return <section className="mt-8 max-w-2xl rounded-2xl border border-pink-500/20 bg-[#14141c] p-6" aria-live="polite">
    {loading && <p>Cargando tu cuenta…</p>}
    {!loading && !user && <><p>Inicia sesión con la cuenta que realizó la compra para consultar su estado.</p><button type="button" className={styles.primaryButton} onClick={() => setAuthOpen(true)}>Iniciar sesión</button></>}
    {user && orderId && !purchase && !error && <p>Consultando la confirmación del pago…</p>}
    {purchase && <>
      {purchase.testMode && <p className={styles.eyebrow}>Compra simulada / No participa en el sorteo real</p>}
      <h2 className="mb-3 text-xl font-bold">{purchase.status === "approved" ? "Pago confirmado" : ["refunded", "charged_back"].includes(purchase.status) ? "Compra reembolsada" : ["rejected", "cancelled", "canceled"].includes(purchase.status) ? "El pago no fue aprobado" : "Esperando confirmación de Mercado Pago"}</h2>
      <p>{purchase.quantity} {purchase.quantity === 1 ? "sticker digital" : "stickers digitales"} · {new Intl.NumberFormat("es-CL", { style: "currency", currency: purchase.currency }).format(purchase.amount)} {purchase.currency}</p>
      {purchase.status === "approved" && <p className="mt-3">{purchase.delivery === "sent" ? "Enviamos el ZIP de tus stickers a " : "Estamos preparando el envío de tus stickers a "}<strong>{purchase.email}</strong>.{purchase.delivery === "sent" && " Revisa también la carpeta de spam."}</p>}
      {Boolean(purchase.entryNumbers?.length) && <div className="mt-4"><p className="font-semibold">{purchase.testMode ? "Números de prueba" : "Números de tus stickers"}</p><p className="mt-2 break-words font-mono">{purchase.entryNumbers!.map((number) => formatStickerNumber(number, purchase.testMode)).join(" · ")}</p>{["refunded", "charged_back"].includes(purchase.status) && <p className="mt-2">Estos números están anulados y no participan en el sorteo.</p>}</div>}
      {purchase.status === "approved" && purchase.deliveryError && <p role="alert" className="mt-3">Tu pago está confirmado. El envío del correo falló; puedes reintentarlo sin volver a comprar.</p>}
      {purchase.status === "approved" && purchase.delivery !== "sent" && <button type="button" className={styles.primaryButton} disabled={busy} onClick={() => void retryDelivery()}>{busy ? "Reintentando…" : "Reintentar envío"}</button>}
      {!["approved", "refunded", "charged_back", "rejected", "cancelled", "canceled"].includes(purchase.status) && <p className="mt-3">La página se actualiza mientras Mercado Pago confirma el resultado. Volver del checkout por sí solo no confirma el pago.</p>}
    </>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {user && orderId && <button type="button" className={styles.smallButton} onClick={() => setRevision(value => value + 1)}>Actualizar estado</button>}
    <p className="mt-5"><Link href="/sorteos">Volver a stickers →</Link></p>
    {authOpen && createPortal(<AuthModal isOpen onClose={() => setAuthOpen(false)} />, document.body)}
  </section>;
}
