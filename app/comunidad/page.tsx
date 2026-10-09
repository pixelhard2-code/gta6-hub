"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { auth, db } from "@/app/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { collection, addDoc, query, orderBy, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from "firebase/firestore";
import AuthModal from "@/app/components/AuthModal";
import GiveawayCard from "@/app/components/GiveawayCard";
import styles from "@/app/components/Hub.module.css";

interface Reply {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  content: string;
  createdAt: number;
}
interface Post extends Reply { likedBy: string[] }

function Avatar({ name, photo }: { name: string; photo?: string | null }) {
  const [failedPhoto, setFailedPhoto] = useState<string | null>(null);
  return <span className={styles.avatar}>{photo && photo !== failedPhoto ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={photo} alt={name} width={36} height={36} loading="lazy" onError={() => setFailedPhoto(photo)} />
  ) : name.slice(0, 2).toUpperCase()}</span>;
}

function renderContent(text: string) {
  return text.split(/(https?:\/\/[^\s]+)/g).map((part, index) => {
    if (!/^https?:\/\//i.test(part)) return <span key={index}>{part}</span>;
    let url: URL;
    try { url = new URL(part); } catch { return <span key={index}>{part}</span>; }
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    const videoId = host === "youtu.be" ? url.pathname.slice(1) : ["youtube.com", "m.youtube.com"].includes(host) ? url.searchParams.get("v") || url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1] : null;
    if (videoId && /^[\w-]{11}$/.test(videoId)) {
      return <div key={index} className={styles.video}><iframe loading="lazy" src={`https://www.youtube-nocookie.com/embed/${videoId}`} title="Video compartido en la comunidad" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>;
    }
    return <a key={index} href={url.href} target="_blank" rel="noopener noreferrer">{part}</a>;
  });
}

function timeAgo(timestamp: number) {
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return "hace un momento";
  if (seconds < 3600) return `hace ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)} h`;
  return new Date(timestamp).toLocaleDateString("es", { day: "numeric", month: "short" });
}

async function authorData(user: User) {
  const snapshot = await getDoc(doc(db, "users", user.uid));
  const data = snapshot.data();
  return {
    authorId: user.uid,
    authorName: data?.displayName || user.displayName || "Usuario",
    authorPhoto: data?.photoURL || user.photoURL || "",
  };
}

function CommentSection({ postId, user, hasProfile, onLogin }: { postId: string; user: User | null; hasProfile: boolean; onLogin: () => void }) {
  const [comments, setComments] = useState<Reply[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    return onSnapshot(query(collection(db, "posts", postId, "comments"), orderBy("createdAt", "asc")), (snapshot) => {
      setComments(snapshot.docs.map((item) => ({ ...item.data(), id: item.id }) as Reply));
      setLoading(false);
    }, () => { setError("No pudimos cargar las respuestas. Inténtalo nuevamente."); setLoading(false); });
  }, [postId]);

  async function sendReply() {
    if (!newComment.trim() || !user || !hasProfile || isSending) return;
    setIsSending(true);
    setError("");
    try {
      await addDoc(collection(db, "posts", postId, "comments"), { ...await authorData(user), content: newComment.trim(), createdAt: Date.now() });
      setNewComment("");
    } catch { setError("Tu respuesta no se pudo publicar. Inténtalo nuevamente."); }
    finally { setIsSending(false); }
  }

  return <section className={styles.comments} aria-label="Respuestas">
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {loading ? <p className={styles.panelNote}>Cargando respuestas…</p> : comments.length === 0 && <p className={styles.panelNote}>Abre la conversación. Todavía no hay respuestas.</p>}
    {comments.map((reply) => <div key={reply.id} className={styles.comment}>
      <Avatar name={reply.authorName} photo={reply.authorPhoto} />
      <div className={styles.commentBody}><Link href={`/usuario/${reply.authorId}`}>{reply.authorName}</Link><p>{reply.content}</p></div>
    </div>)}
    {!user ? <button className={styles.smallButton} onClick={onLogin}>Iniciar sesión para responder</button> : !hasProfile ? <Link href="/perfil" className={styles.smallButton}>Completar mi perfil</Link> : (
      <form className={styles.replyForm} onSubmit={(event) => { event.preventDefault(); void sendReply(); }}>
        <label className={styles.srOnly} htmlFor={`reply-${postId}`}>Tu respuesta</label>
        <input id={`reply-${postId}`} value={newComment} onChange={(event) => setNewComment(event.target.value)} placeholder="Escribe una respuesta…" maxLength={2000} disabled={isSending} />
        <button className={styles.smallButton} disabled={!newComment.trim() || isSending}>{isSending ? "Enviando…" : "Responder"}</button>
      </form>
    )}
  </section>;
}

export default function ComunidadPage() {
  const [user, setUser] = useState<User | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [activeCommentPost, setActiveCommentPost] = useState<string | null>(null);
  const [tab, setTab] = useState("all");
  const [error, setError] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const pendingLikes = useRef(new Set<string>());
  const [busyLikes, setBusyLikes] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    let version = 0;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      const currentVersion = ++version;
      setUser(currentUser);
      setHasProfile(false);
      if (!currentUser) return;
      try {
        const profile = await getDoc(doc(db, "users", currentUser.uid));
        if (active && currentVersion === version) setHasProfile(Boolean(profile.exists() && profile.data().bio));
      } catch { if (active && currentVersion === version) setError("No pudimos cargar tu perfil. Vuelve a intentarlo."); }
    });
    return () => { active = false; unsubscribe(); };
  }, []);

  async function fetchPosts() {
    try {
      const snapshot = await getDocs(query(collection(db, "posts"), orderBy("createdAt", "desc")));
      setPosts(snapshot.docs.map((item) => {
        const data = item.data();
        return { ...data, id: item.id, likedBy: Array.isArray(data.likedBy) ? data.likedBy : [] } as Post;
      }));
    } catch { setError("No pudimos cargar las publicaciones. Recarga la página para intentarlo nuevamente."); }
    finally { setLoadingPosts(false); }
  }
  useEffect(() => { void fetchPosts(); }, []);

  async function handlePublish() {
    if (!newPost.trim() || !user || !hasProfile || isPublishing) return;
    setIsPublishing(true);
    setError("");
    try {
      const data = { ...await authorData(user), content: newPost.trim(), createdAt: Date.now(), likedBy: [] };
      const post = await addDoc(collection(db, "posts"), data);
      setPosts((previous) => [{ ...data, id: post.id }, ...previous]);
      setNewPost("");
    } catch { setError("Tu publicación no se pudo guardar. Inténtalo nuevamente."); }
    finally { setIsPublishing(false); }
  }

  async function handleLike(post: Post) {
    if (!user) { setAuthOpen(true); return; }
    if (pendingLikes.current.has(post.id)) return;
    const uid = user.uid;
    const hadLiked = post.likedBy.includes(uid);
    pendingLikes.current.add(post.id);
    setBusyLikes((previous) => [...previous, post.id]);
    const applyLike = (items: Post[], liked: boolean) => items.map((item) => item.id !== post.id ? item : { ...item, likedBy: liked ? Array.from(new Set([...item.likedBy, uid])) : item.likedBy.filter((id) => id !== uid) });
    setPosts((previous) => applyLike(previous, !hadLiked));
    try { await updateDoc(doc(db, "posts", post.id), { likedBy: hadLiked ? arrayRemove(uid) : arrayUnion(uid) }); }
    catch { setPosts((previous) => applyLike(previous, hadLiked)); setError("No pudimos guardar tu me gusta. Inténtalo nuevamente."); }
    finally { pendingLikes.current.delete(post.id); setBusyLikes((previous) => previous.filter((id) => id !== post.id)); }
  }

  const visiblePosts = posts.filter((post) => tab === "all" || (tab === "videos" ? /https?:\/\/(?:www\.|m\.)?(?:youtube\.com|youtu\.be)\//i.test(post.content) : /sorteo|ticket|ps5|premio/i.test(post.content)));

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.topline}><span>GTA6HUB / Comunidad</span><Link href="/sorteos">Ver sorteo ↗</Link></div>
        <header className={styles.communityHeader}><div><p className={styles.eyebrow}>La crew de GTA VI</p><h1 className={styles.pageTitle}>Nos vemos en Vice City.</h1><p className={styles.subtitle}>Teorías, clips y conversaciones mientras llega nuestra próxima gran partida.</p></div><span className={styles.communityMarker}>[ COMUNIDAD DE FANS ]</span></header>
        <div className={styles.mobilePromo}><div><strong>PS5 + GTA VI</strong><span>SORTEO · TICKETS DESDE $3 USD</span></div><Link href="/sorteos#tickets">Ver tickets ↗</Link></div>
        <div className={styles.communityGrid}>
          <section className={styles.feed} aria-label="Muro de la comunidad">
            <article className={styles.pinned}><span className={styles.pinMark} aria-hidden="true">↗</span><div><p className={styles.eyebrow}>GTA6HUB / Destacado</p><h2>La próxima consola podría ser tuya.</h2><p>Tenemos un sorteo de PS5 + GTA VI para la comunidad. Revisa los paquetes y sigue las novedades aquí. Y tú, ¿qué harías primero al llegar a Vice City?</p><Link href="/sorteos#tickets">Ver el sorteo y elegir tickets →</Link></div></article>
            <form className={styles.composer} onSubmit={(event) => { event.preventDefault(); void handlePublish(); }}>
              <div className={styles.composerTop}><Avatar name={user?.displayName || "G6"} photo={user?.photoURL} /><label htmlFor="new-post" className={styles.srOnly}>Escribe tu publicación</label><textarea id="new-post" rows={3} maxLength={5000} value={newPost} onChange={(event) => setNewPost(event.target.value)} disabled={!user || !hasProfile || isPublishing} placeholder={!user ? "Tu crew está aquí. Inicia sesión y entra en la conversación." : !hasProfile ? "Completa tu perfil y presenta a tu personaje." : "¿Una teoría? ¿Un clip? ¿Tu primera misión en GTA VI?"} /></div>
              <div className={styles.composerBottom}><span>{newPost.length > 0 ? `${newPost.length} / 5000` : "Comparte también enlaces de YouTube."}</span>{!user ? <button type="button" className={styles.smallButton} onClick={() => setAuthOpen(true)}>Iniciar sesión</button> : !hasProfile ? <Link className={styles.smallButton} href="/perfil">Crear perfil</Link> : <button className={styles.smallButton} disabled={isPublishing || !newPost.trim()}>{isPublishing ? "Publicando…" : "Publicar ↗"}</button>}</div>
            </form>
            {error && <p role="alert" className={styles.error}>{error}</p>}
            <div className={styles.feedTools}><div className={styles.tabs} aria-label="Filtrar publicaciones">{[{ id: "all", label: "El muro" }, { id: "videos", label: "Videos" }, { id: "giveaway", label: "Sorteo" }].map((item) => <button key={item.id} type="button" className={tab === item.id ? styles.activeTab : ""} aria-pressed={tab === item.id} onClick={() => setTab(item.id)}>{item.label}</button>)}</div><span className={styles.feedCount}>{visiblePosts.length} posts</span></div>
            {loadingPosts ? <div role="status" className={styles.empty}><p>Cargando la comunidad…</p></div> : visiblePosts.length === 0 ? <div className={styles.empty}><h3>{tab === "all" ? "La ciudad empieza contigo." : "Todavía no hay publicaciones aquí."}</h3><p>{tab === "all" ? "Comparte tu primera teoría o cuéntanos qué esperas de GTA VI." : "Abre la conversación con un video o una pregunta sobre el sorteo."}</p></div> : visiblePosts.map((post) => {
              const liked = Boolean(user && post.likedBy.includes(user.uid));
              return <article key={post.id} id={`post-${post.id}`} className={styles.post}>
                <div className={styles.postHeader}><Link href={`/usuario/${post.authorId}`} aria-label={`Perfil de ${post.authorName}`}><Avatar name={post.authorName} photo={post.authorPhoto} /></Link><div><Link href={`/usuario/${post.authorId}`}>{post.authorName}</Link><time dateTime={new Date(post.createdAt).toISOString()}>{timeAgo(post.createdAt)}</time></div></div>
                <div className={styles.postContent}>{renderContent(post.content)}</div>
                <div className={styles.postActions}>
                  <button type="button" className={liked ? styles.liked : ""} aria-pressed={liked} aria-label={`${liked ? "Quitar" : "Dar"} me gusta a la publicación de ${post.authorName}`} disabled={busyLikes.includes(post.id)} onClick={() => void handleLike(post)}><svg viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" /></svg>{post.likedBy.length || "Me gusta"}</button>
                  <button type="button" aria-expanded={activeCommentPost === post.id} onClick={() => setActiveCommentPost(activeCommentPost === post.id ? null : post.id)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5Z" /></svg>Responder</button>
                </div>
                {activeCommentPost === post.id && <CommentSection postId={post.id} user={user} hasProfile={hasProfile} onLogin={() => setAuthOpen(true)} />}
              </article>;
            })}
          </section>
          <aside className={styles.communityAside}><GiveawayCard /><div className={styles.asideNotes}><h3>Código de la crew</h3><p>Comparte teorías, respeta a los demás y avisa si tu publicación contiene spoilers.</p><Link href="/sorteos">Premio, paquetes y detalles del sorteo →</Link></div></aside>
        </div>
        <footer className={styles.footer}><span>GTA6HUB · Una comunidad de fans. No afiliada a Rockstar Games.</span><Link href="/sorteos">PS5 + GTA VI / Ver sorteo ↗</Link></footer>
      </div>
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
