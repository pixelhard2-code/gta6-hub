"use client";
import { useState } from "react";
import Link from "next/link";
import type { User } from "firebase/auth";
import { STICKERS } from "@/app/lib/stickers/catalog";
import type { useStickerCollection } from "@/app/lib/stickers/useCollection";
import styles from "./StickerCollection.module.css";

export default function StickerCollection({ collection, user, preview = false }: { collection?: ReturnType<typeof useStickerCollection>; user?: User | null; preview?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const data = collection?.data;
  async function download() {
    if (!user || busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/stickers/download", { method: "POST", headers: { Authorization: `Bearer ${await user.getIdToken()}` } });
      if (!response.ok) throw new Error("download-failed");
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = "leonidacrew-stickers.zip"; anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { setError("No se pudo descargar tu colección. Vuelve a intentarlo."); }
    finally { setBusy(false); }
  }
  async function retryEmail(orderId: string) {
    if (!user || busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/stickers/delivery", { method: "POST", headers: { Authorization: `Bearer ${await user.getIdToken()}`, "Content-Type": "application/json" }, body: JSON.stringify({ orderId }) });
      if (!response.ok) throw new Error("email-failed");
      collection?.refresh();
    } catch { setError("Tu envío sigue pendiente. Puedes descargar los stickers desde tu colección."); }
    finally { setBusy(false); }
  }
  const status: Record<string, string> = { pending: "Pendiente de pago", approved: "Compra confirmada", refunded: "Reembolso / revisión", rejected: "Pago rechazado", in_process: "Pago en revisión", cancelled: "Cancelada", needs_review: "En revisión" };
  return <section className={styles.card} aria-label={preview ? "Diseños de los stickers" : "Colección de stickers"}>
    <div className={styles.head}><div><h2>{preview ? "Los stickers de la crew" : user ? "Mis stickers" : "Colección de stickers"}</h2><p className={styles.note}>{preview ? "Diseños originales en PNG de 1200 × 1200 px, con fondo transparente. El pack Básico incluye Palmeras de Vice; el Doble suma Night Ride y el Leyenda incluye los cinco." : "Cada copia de un sticker comprado y confirmado equivale a una participación en el sorteo promocional."}</p></div>{!preview && <span className={styles.total}>{collection?.loading ? "Cargando…" : collection?.error ? "—" : `${data?.total || 0} stickers`}</span>}</div>
    {(error || collection?.error) && <p role="alert" className={styles.error}>{error || collection?.error}</p>}
    <div className={styles.grid}>{STICKERS.map((sticker) => {
      const copies = data?.counts[sticker.id] || 0;
      return <div key={sticker.id} className={`${styles.sticker} ${!preview && !copies ? styles.locked : ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={sticker.preview} alt={sticker.name} width={240} height={240} loading="lazy" />
        <strong>{sticker.name}</strong><span>{preview ? "PNG transparente" : copies ? `${copies} ${copies === 1 ? "copia" : "copias"}` : "Por adquirir"}</span>
      </div>;
    })}</div>
    {!preview && <div className={styles.actions}>{user && Boolean(data?.total) && <button className={styles.button} disabled={busy} onClick={() => void download()}>{busy ? "Preparando…" : "Descargar mis stickers ↓"}</button>}<Link href="/sorteos#tickets" className={`${styles.button} ${styles.secondary}`}>Ver packs de stickers ↗</Link>{collection?.error && <button className={`${styles.button} ${styles.secondary}`} onClick={collection.refresh}>Actualizar colección</button>}</div>}
    {!preview && !data?.total && <p className={styles.note}>{user ? "Tus stickers aparecerán aquí cuando se confirme tu compra. Si pagaste con un enlace directo, comparte el comprobante desde Soporte para validar la entrega." : "La colección muestra las compras confirmadas de este jugador."}</p>}
    {user && Boolean(data?.orders.length) && <div className={styles.orders}><h3>Mis compras</h3>{data!.orders.map((order) => <div className={styles.order} key={order.id}>
      <div><strong>{order.quantity} stickers</strong><small>{new Date(order.createdAt).toLocaleDateString("es-CL")} · {order.id.slice(-8)}</small><small>{order.email}</small></div>
      <div><span className={styles.status}>{status[order.status] || "Pago pendiente"}</span>{order.status === "approved" && <small>{order.delivery === "sent" ? "Correo enviado" : "Envío de correo pendiente"}</small>}{order.status === "approved" && order.delivery !== "sent" && <button disabled={busy} className={`${styles.button} ${styles.secondary}`} onClick={() => void retryEmail(order.id)}>Reintentar envío</button>}</div>
    </div>)}</div>}
  </section>;
}
