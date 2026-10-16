"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useCurrentUserProfile } from "@/app/lib/useCurrentUserProfile";
import { getStickerPackage, validDeliveryEmail } from "@/app/lib/stickers/catalog";
import { STICKER_SOCIAL_VISIBLE } from "@/app/lib/stickers/visibility";
import AuthModal from "./AuthModal";
import hub from "./Hub.module.css";
import styles from "./StickerCollection.module.css";

export default function StickerCheckout({ packageId, testOnly = false }: { packageId: string; testOnly?: boolean }) {
  const pack = getStickerPackage(packageId)!;
  const { user } = useCurrentUserProfile();
  const [email, setEmail] = useState("");
  const [automatic, setAutomatic] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [quote, setQuote] = useState<{ amount: number; currency: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [statusVersion, setStatusVersion] = useState(0);
  const attemptId = useRef("");
  const pending = useRef(false);
  useEffect(() => { setEmail(user?.email || ""); attemptId.current = ""; }, [user?.uid, user?.email]);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    attemptId.current = ""; setError(""); setLoadingStatus(true); setAutomatic(false);
    (async () => {
      const token = user ? await user.getIdToken(true) : null;
      const response = await fetch("/api/stickers/checkout", { signal: controller.signal, cache: "no-store", headers: token ? { Authorization: "Bearer " + token } : {} });
      if (!response.ok) throw new Error("checkout-status");
      const result = await response.json();
      if (active) {
        const available = Boolean(result.automatic) && (!testOnly || result.testMode === true);
        setAutomatic(available); setTestMode(Boolean(result.testMode));
        setQuote(result.quotes.find((item: { id: string }) => item.id === packageId) || null);
        if (testOnly && user && !available) {
          const messages: Record<string, string> = {
            "setup-required": "La configuración de la prueba aún no está completa en el servidor. No necesitas cambiar tu cuenta.",
            "firebase-admin-sdk": "El servidor no pudo cargar la conexión con Firebase. Debemos corregir el despliegue.",
            "firebase-admin-json": "La credencial de Firebase guardada en Vercel no contiene un JSON válido. Debemos corregir la configuración del servidor.",
            "firebase-admin-credential": "El servidor no pudo inicializar la credencial de Firebase. Debemos revisar su configuración en Vercel.",
            "firebase-project-mismatch": "La credencial del servidor pertenece a otro proyecto de Firebase. Debemos corregirla en Vercel.",
            "firebase-admin-permission": "La cuenta de servicio no tiene permiso para validar usuarios en Firebase.",
            "firebase-auth-unavailable": "Firebase no pudo completar la validación del servidor. Esto no depende del correo con el que ingresaste.",
            "email-unverified": "Firebase aún no confirma tu correo. Vuelve a iniciar sesión usando Continuar con Google.",
            "session-invalid": "El servidor no pudo validar tu sesión. Cierra sesión y vuelve a ingresar usando Continuar con Google.",
            "sign-in-required": "Inicia sesión para acceder a la prueba.",
          };
          setError(messages[result.access] || "La prueba está desactivada en este momento.");
        }
      }
    })().catch(() => { if (active) { setAutomatic(false); if (testOnly) setError("No pudimos verificar el acceso a la prueba."); } }).finally(() => { if (active) setLoadingStatus(false); });
    return () => { active = false; controller.abort(); };
  }, [packageId, user, testOnly, statusVersion]);
  async function checkout() {
    if (pending.current) return;
    if (!user) { setAuthOpen(true); return; }
    if (!validDeliveryEmail(email)) { setError("Escribe un correo válido para recibir tus stickers."); return; }
    pending.current = true; setBusy(true); setError("");
    if (!attemptId.current) attemptId.current = crypto.randomUUID();
    try {
      const response = await fetch("/api/stickers/checkout", { method: "POST", headers: { Authorization: `Bearer ${await user.getIdToken()}`, "Content-Type": "application/json" }, body: JSON.stringify({ packageId, email, attemptId: attemptId.current, expectedMode: testOnly ? "test" : undefined }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "No pudimos abrir el pago. Inténtalo nuevamente.");
      window.location.assign(result.url);
    } catch (problem) { setError(problem instanceof Error ? problem.message : "No pudimos abrir el pago."); }
    finally { pending.current = false; setBusy(false); }
  }
  return <div>
    {(testOnly || testMode) && <p className={hub.panelNote}><strong>Modo de prueba.</strong> Puedes ingresar a LeonidaCrew con cualquier cuenta. Para pagar, usa la cuenta compradora y las tarjetas de prueba de Mercado Pago. Los stickers simulados no participan en el sorteo real.</p>}
    {testOnly && user && <p className={hub.panelNote}>Sesión de LeonidaCrew: <strong>{user.email || "Esta cuenta no comparte su correo"}</strong></p>}
    {automatic && <label className={styles.checkoutEmail} htmlFor="sticker-delivery-email">Correo para recibir los stickers<input id="sticker-delivery-email" type="email" autoComplete="email" value={email} maxLength={254} disabled={busy} onChange={(event) => { setEmail(event.target.value); attemptId.current = ""; }} />{quote && <span>{testMode ? "Total simulado" : "Total a pagar"}: {new Intl.NumberFormat("es-CL", { style: "currency", currency: quote.currency }).format(quote.amount)} {quote.currency}</span>}</label>}
    {automatic ? <button className={hub.primaryButton} onClick={() => void checkout()} disabled={busy}><span>{busy ? "Preparando pago…" : testMode ? "Probar Mercado Pago" : `Comprar ${pack.stickers} ${pack.stickers === 1 ? "sticker" : "stickers"}`}</span><span aria-hidden="true">↗</span></button> : testOnly ? <button className={hub.primaryButton} type="button" disabled={Boolean(user) || loadingStatus} onClick={() => setAuthOpen(true)}>{loadingStatus ? "Verificando prueba…" : user ? "Prueba no habilitada" : "Iniciar sesión para probar"}</button> : <a href={pack.paymentUrl} target="_blank" rel="noopener noreferrer" className={hub.primaryButton}><span>Confirmar selección ({pack.stickers} {pack.stickers === 1 ? "sticker" : "stickers"})</span><span aria-hidden="true">↗</span></a>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {testOnly && user && !automatic && <button className={styles.button} type="button" disabled={loadingStatus} onClick={() => setStatusVersion((value) => value + 1)}>Volver a verificar acceso</button>}
    {(!testOnly || automatic) && <p className={hub.panelNote}>{automatic ? STICKER_SOCIAL_VISIBLE ? "Paga en Mercado Pago. Tras confirmar tu pago, los stickers se acreditarán en tu perfil y se enviarán al correo indicado." : "Paga en Mercado Pago. Tras confirmar tu pago, los stickers se enviarán al correo indicado." : STICKER_SOCIAL_VISIBLE ? "Este enlace abre el pago en Mercado Pago. La entrega y la acreditación en el perfil requieren validar el comprobante mientras se activa la entrega automática." : "Este enlace abre el pago en Mercado Pago. Después de pagar, registra tu compra para validar la operación y recibir tus stickers por correo."}</p>}
    {!automatic && !testOnly && <Link className={styles.direct} href={`/gracias?paquete=${pack.id}`}>Ya pagué: solicitar mis stickers →</Link>}
    {authOpen && createPortal(<AuthModal isOpen onClose={() => setAuthOpen(false)} />, document.body)}
  </div>;
}
