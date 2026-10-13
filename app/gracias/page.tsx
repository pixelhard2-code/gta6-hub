"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getStickerPackage, STICKER_PACKAGES } from "@/app/lib/stickers/catalog";
import hub from "@/app/components/Hub.module.css";
import styles from "./page.module.css";

export default function GraciasPage() {
  const [packageId, setPackageId] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [available, setAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [reference, setReference] = useState("");
  const requestId = useRef("");
  const pending = useRef(false);
  const pack = getStickerPackage(packageId);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const selected = getStickerPackage(params.get("paquete"));
    if (selected) setPackageId(selected.id);
    const operation = params.get("payment_id") || params.get("collection_id") || "";
    if (/^[1-9]\d{0,29}$/.test(operation)) setPaymentId(operation);
    const controller = new AbortController();
    fetch("/api/stickers/purchase-request", { cache: "no-store", signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error(); return response.json(); })
      .then(data => setAvailable(data.available === true))
      .catch(() => { if (!controller.signal.aborted) setAvailable(false); });
    return () => controller.abort();
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current || available !== true) return;
    const fields = new FormData(event.currentTarget);
    if (!requestId.current) requestId.current = crypto.randomUUID();
    pending.current = true;
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/stickers/purchase-request", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: fields.get("name"), email: fields.get("email"), phone: fields.get("phone"), packageId, paymentId, consent: fields.get("consent") === "on", website: fields.get("website"), requestId: requestId.current }),
      });
      const result = await response.json();
      if (!response.ok || typeof result.reference !== "string" || result.status !== "pending-review") throw new Error(result.message || "No pudimos enviar tus datos. Vuelve a intentarlo.");
      setReference(result.reference);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "No pudimos enviar tus datos. Conservamos el formulario para que vuelvas a intentarlo.");
    } finally { pending.current = false; setSending(false); }
  }

  return <div className={hub.page}><div className={`${hub.shell} ${styles.shell}`}>
    <div className={hub.topline}><span>LeonidaCrew / Entrega de stickers</span><Link href="/sorteos">Ver los packs ↗</Link></div>
    <div className={styles.layout}>
      <header className={styles.intro}>
        <p className={hub.eyebrow}>Tu pack de la crew</p>
        <h1 className={hub.pageTitle}>Gracias por comprar nuestros <span className={styles.accent}>stickers.</span></h1>
        <p className={hub.subtitle}>Déjanos tus datos para revisar la compra y enviarte tus stickers por correo a la brevedad.</p>
        <div className={styles.art} aria-hidden="true"><img src="/stickers/vice-palm.svg" alt="" /><img src="/stickers/night-ride.svg" alt="" /></div>
        <ol className={styles.steps}><li><span>01</span> Indica tus datos y la operación.</li><li><span>02</span> Revisamos el pago en Mercado Pago.</li><li><span>03</span> Recibes tu pack en el correo indicado.</li></ol>
        <p className={styles.note}>El envío se realiza después de comprobar que el pago está aprobado. Cada sticker confirmado equivale a una participación en el sorteo promocional, según sus bases.</p>
      </header>

      <section className={styles.card} aria-labelledby="delivery-title">
        {reference ? <div role="status" className={styles.success}>
          <span className={styles.check} aria-hidden="true">✓</span><h2 id="delivery-title">Recibimos tu solicitud</h2>
          <p>Revisaremos la operación y, una vez confirmado el pago, enviaremos tus stickers al correo que indicaste.</p>
          <p className={styles.reference}>Referencia: <strong>{reference}</strong></p>
          <p className={styles.note}>Conserva tu comprobante y esta referencia. Revisa también la carpeta de spam. Enviar el formulario no confirma por sí solo el pago.</p>
          <Link className={styles.button} href="/comunidad">Volver a la comunidad ↗</Link>
        </div> : <>
          <h2 id="delivery-title">¿Dónde enviamos tu pack?</h2><p className={styles.note}>Completa los datos de la persona que realizó la compra.</p>
          {available === false && <p role="status" className={styles.notice}>La recepción por este formulario todavía no está disponible. Conserva tu comprobante. Si necesitas ayuda, <Link href={`/soporte?motivo=sticker-payment${pack ? `&paquete=${pack.id}` : ""}`} className={styles.help}>contacta con Soporte</Link>.</p>}
          <form onSubmit={submit} className={styles.form}>
            <label className={styles.field} htmlFor="buyer-name">Nombre completo<input id="buyer-name" name="name" autoComplete="name" required minLength={2} maxLength={100} placeholder="Tu nombre y apellido" disabled={sending} /></label>
            <label className={styles.field} htmlFor="buyer-email">Correo para recibir los stickers<input id="buyer-email" name="email" type="email" autoComplete="email" required maxLength={254} placeholder="tu-correo@ejemplo.com" disabled={sending} /></label>
            <label className={styles.field} htmlFor="buyer-phone">Número de teléfono<input id="buyer-phone" name="phone" type="tel" autoComplete="tel" required maxLength={30} placeholder="+56 9 1234 5678" disabled={sending} /></label>
            <label className={styles.field} htmlFor="buyer-pack">Pack que compraste<select id="buyer-pack" name="packageId" required value={packageId} onChange={event => setPackageId(event.target.value)} disabled={sending}><option value="" disabled>Selecciona tu pack</option>{STICKER_PACKAGES.map(item => <option key={item.id} value={item.id}>{item.name} · {item.stickers} {item.stickers === 1 ? "sticker" : "stickers"}</option>)}</select></label>
            <label className={styles.field} htmlFor="buyer-operation">Número de operación de Mercado Pago<input id="buyer-operation" name="paymentId" type="text" inputMode="numeric" pattern="[1-9][0-9]{0,29}" required maxLength={30} value={paymentId} onChange={event => setPaymentId(event.target.value)} placeholder="Revisa tu comprobante de pago" disabled={sending} /><span className={styles.hint}>Está en el detalle del pago. Revísalo aunque aparezca completado.</span></label>
            <div className={styles.honeypot} aria-hidden="true"><label htmlFor="buyer-website">Sitio web<input id="buyer-website" name="website" tabIndex={-1} autoComplete="off" /></label></div>
            <label className={styles.consent}><input name="consent" type="checkbox" required disabled={sending} /><span>Autorizo el uso de estos datos para verificar mi compra y coordinar la entrega. El formulario se procesa con <a href="https://formsubmit.co/privacy.pdf" target="_blank" rel="noopener noreferrer">FormSubmit</a>.</span></label>
            {error && <p role="alert" className={styles.notice}>{error}</p>}
            <button className={styles.button} type="submit" disabled={sending || available !== true}>{sending ? "Enviando tus datos…" : available === null ? "Preparando formulario…" : `Solicitar envío${pack ? ` de ${pack.stickers} ${pack.stickers === 1 ? "sticker" : "stickers"}` : " de mis stickers"} →`}</button>
            <p className={styles.note}>No vuelvas a pagar para completar este formulario. Nunca te pediremos contraseñas ni datos de tu tarjeta.</p>
          </form>
        </>}
      </section>
    </div>
  </div></div>;
}
