"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useCurrentUserProfile } from "@/app/lib/useCurrentUserProfile";
import { getStickerPackage, validDeliveryEmail } from "@/app/lib/stickers/catalog";
import AuthModal from "./AuthModal";
import hub from "./Hub.module.css";
import styles from "./StickerCollection.module.css";

export default function StickerCheckout({ packageId }: { packageId: string }) {
  const pack = getStickerPackage(packageId)!;
  const { user } = useCurrentUserProfile();
  const [email, setEmail] = useState("");
  const [automatic, setAutomatic] = useState(false);
  const [quote, setQuote] = useState<{ amount: number; currency: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const attemptId = useRef("");
  const pending = useRef(false);
  useEffect(() => { setEmail(user?.email || ""); attemptId.current = ""; }, [user?.uid, user?.email]);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    attemptId.current = ""; setError("");
    fetch("/api/stickers/checkout", { signal: controller.signal, cache: "no-store" }).then(async (response) => {
      if (!response.ok) throw new Error("checkout-status");
      const result = await response.json();
      if (active) { setAutomatic(Boolean(result.automatic)); setQuote(result.quotes.find((item: { id: string }) => item.id === packageId) || null); }
    }).catch(() => { if (active) setAutomatic(false); });
    return () => { active = false; controller.abort(); };
  }, [packageId]);
  async function checkout() {
    if (pending.current) return;
    if (!user) { setAuthOpen(true); return; }
    if (!validDeliveryEmail(email)) { setError("Escribe un correo válido para recibir tus stickers."); return; }
    pending.current = true; setBusy(true); setError("");
    if (!attemptId.current) attemptId.current = crypto.randomUUID();
    try {
      const response = await fetch("/api/stickers/checkout", { method: "POST", headers: { Authorization: `Bearer ${await user.getIdToken()}`, "Content-Type": "application/json" }, body: JSON.stringify({ packageId, email, attemptId: attemptId.current }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "No pudimos abrir el pago. Inténtalo nuevamente.");
      window.location.assign(result.url);
    } catch (problem) { setError(problem instanceof Error ? problem.message : "No pudimos abrir el pago."); }
    finally { pending.current = false; setBusy(false); }
  }
  return <div>
    {automatic && <label className={styles.checkoutEmail} htmlFor="sticker-delivery-email">Correo para recibir los stickers<input id="sticker-delivery-email" type="email" autoComplete="email" value={email} maxLength={254} disabled={busy} onChange={(event) => { setEmail(event.target.value); attemptId.current = ""; }} />{quote && <span>Total a pagar: {new Intl.NumberFormat("es-CL", { style: "currency", currency: quote.currency }).format(quote.amount)} {quote.currency}</span>}</label>}
    {automatic ? <button className={hub.primaryButton} onClick={() => void checkout()} disabled={busy}><span>{busy ? "Preparando pago…" : `Comprar ${pack.stickers} ${pack.stickers === 1 ? "sticker" : "stickers"}`}</span><span aria-hidden="true">↗</span></button> : <a href={pack.paymentUrl} target="_blank" rel="noopener noreferrer" className={hub.primaryButton}><span>Confirmar selección ({pack.stickers} {pack.stickers === 1 ? "sticker" : "stickers"})</span><span aria-hidden="true">↗</span></a>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <p className={hub.panelNote}>{automatic ? "Paga en Mercado Pago. Tras confirmar tu pago, los stickers se acreditarán en tu perfil y se enviarán al correo indicado." : "Este enlace abre el pago en Mercado Pago. La entrega y la acreditación en el perfil requieren validar el comprobante mientras se activa la entrega automática."}</p>
    {!automatic && <Link className={styles.direct} href="/soporte">Compartir comprobante con Soporte →</Link>}
    {authOpen && createPortal(<AuthModal isOpen onClose={() => setAuthOpen(false)} />, document.body)}
  </div>;
}
