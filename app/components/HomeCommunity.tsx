"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import styles from "./Home.module.css";

interface PreviewPost { id: string; author: string; content: string; createdAt: number | null }

function previewText(content: string) {
  const text = content.replace(/https?:\/\/[^\s]+/g, (url) => /https?:\/\/(?:www\.|m\.)?(?:youtube\.com|youtu\.be)\//i.test(url) ? "▶ Video compartido" : "↗ Enlace compartido");
  return text.length > 170 ? `${text.slice(0, 170)}…` : text;
}

export default function HomeCommunity() {
  const [posts, setPosts] = useState<PreviewPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => onSnapshot(query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(3)), (snapshot) => {
    setPosts(snapshot.docs.map((post) => {
      const data = post.data();
      return { id: post.id, author: typeof data.authorName === "string" ? data.authorName : "Miembro de la comunidad", content: typeof data.content === "string" ? data.content : "", createdAt: typeof data.createdAt === "number" && Number.isFinite(data.createdAt) ? data.createdAt : null };
    }));
    setLoading(false);
    setUnavailable(false);
  }, () => { setLoading(false); setUnavailable(true); }), []);

  if (loading) return <div className={styles.messageGrid} aria-busy="true" aria-label="Cargando mensajes recientes">{[1, 2, 3].map((item) => <div key={item} className={styles.messagePlaceholder}><span /><span /><span /></div>)}</div>;
  if (unavailable || posts.length === 0) return <div className={styles.communityEmpty}><p>{unavailable ? "La conversación continúa en el muro de la comunidad." : "Tu mensaje puede abrir la conversación. ¿Qué harás primero en GTA VI?"}</p><Link href="/comunidad">Entrar a la comunidad ↗</Link></div>;

  return <div className={styles.messageGrid}>{posts.map((post) => <Link href={`/comunidad#post-${post.id}`} key={post.id} className={styles.messageCard}>
    <div className={styles.messageHeader}><span className={styles.messageAvatar} aria-hidden="true">{post.author.slice(0, 2).toUpperCase()}</span><div><strong>{post.author}</strong><span>{post.createdAt !== null ? new Date(post.createdAt).toLocaleDateString("es-CL", { day: "numeric", month: "short" }) : "En el muro"}</span></div><span className={styles.messageArrow} aria-hidden="true">↗</span></div>
    <p>{previewText(post.content)}</p><span className={styles.messageLink}>Ver conversación</span>
  </Link>)}</div>;
}
