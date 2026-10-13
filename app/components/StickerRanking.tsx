"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./StickerCollection.module.css";

interface Leader { uid: string; rank: number; name: string; total: number }
export default function StickerRanking() {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    let busy = false;
    async function load() {
      if (busy || !active) return; busy = true;
      try {
        const response = await fetch("/api/stickers/ranking", { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("ranking-failed");
        const result = await response.json();
        if (active) { setLeaders(result.leaders); setError(""); }
      } catch { if (active && !controller.signal.aborted) setError("No pudimos cargar el ranking. Inténtalo más tarde."); }
      finally { busy = false; if (active) setLoading(false); }
    }
    void load();
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void load(); }, 60000);
    return () => { active = false; controller.abort(); window.clearInterval(timer); };
  }, []);
  return <section className={styles.card} aria-label="Ranking de stickers">
    <div className={styles.head}><div><h2>Ranking de stickers de la crew</h2><p className={styles.note}>Los diez coleccionistas con más stickers de compras confirmadas. Cada sticker equivale a una participación en el sorteo.</p></div><Link href="/sorteos#tickets" className={`${styles.button} ${styles.secondary}`}>Ver stickers ↗</Link></div>
    {loading ? <p role="status" className={styles.note}>Cargando el ranking…</p> : error ? <p role="alert" className={styles.error}>{error}</p> : !leaders.length ? <p className={styles.note}>El ranking comienza con las primeras compras confirmadas de stickers. Tu colección se actualizará al validar tu pago.</p> : <ol className={styles.leaders}>{leaders.map((leader) => <li key={leader.uid} className={styles.leader}><span className={styles.position}>#{leader.rank}</span><Link href={`/usuario/${leader.uid}`}>{leader.name}</Link><strong>{leader.total} <span className={styles.note}>stickers</span></strong></li>)}</ol>}
  </section>;
}
