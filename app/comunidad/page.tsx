"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { db } from "@/app/lib/firebase";
import { type User } from "firebase/auth";
import { useCurrentUserProfile } from "@/app/lib/useCurrentUserProfile";
import { collection, addDoc, query, orderBy, limit, getDocs, doc, getDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove, onSnapshot, getCountFromServer, increment } from "firebase/firestore";
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
interface Post extends Reply {
  likedBy: string[];
  replyCount?: number;
  lastReplyAuthor?: string;
  lastReplyAt?: number;
}

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

function CommentSection({
  postId,
  postAuthorId,
  user,
  hasProfile,
  onLogin,
  onCountChange,
}: {
  postId: string;
  postAuthorId: string;
  user: User | null;
  hasProfile: boolean;
  onLogin: () => void;
  onCountChange?: (count: number, lastAuthor?: string, lastTime?: number) => void;
}) {
  const [comments, setComments] = useState<Reply[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [replyToDelete, setReplyToDelete] = useState<string | null>(null);
  const [isDeletingReply, setIsDeletingReply] = useState<string | null>(null);

  useEffect(() => {
    return onSnapshot(query(collection(db, "posts", postId, "comments"), orderBy("createdAt", "asc")), (snapshot) => {
      const loaded = snapshot.docs.map((item) => ({ ...item.data(), id: item.id }) as Reply);
      setComments(loaded);
      setLoading(false);
      const last = loaded[loaded.length - 1];
      onCountChange?.(loaded.length, last?.authorName, last?.createdAt);
    }, () => {
      setError("No pudimos cargar las respuestas. Inténtalo nuevamente.");
      setLoading(false);
    });
  }, [postId, onCountChange]);

  async function sendReply() {
    if (!newComment.trim() || !user || !hasProfile || isSending) return;
    setIsSending(true);
    setError("");
    try {
      const author = await authorData(user);
      const replyData = {
        ...author,
        content: newComment.trim(),
        createdAt: Date.now(),
      };
      await addDoc(collection(db, "posts", postId, "comments"), replyData);
      try {
        await updateDoc(doc(db, "posts", postId), {
          replyCount: increment(1),
          lastReplyAuthor: author.authorName,
          lastReplyAt: replyData.createdAt,
        });
      } catch {
        // Safe update fallback
      }
      setNewComment("");
    } catch {
      setError("Tu respuesta no se pudo publicar. Inténtalo nuevamente.");
    } finally {
      setIsSending(false);
    }
  }

  async function handleDeleteReply(replyId: string) {
    setIsDeletingReply(replyId);
    try {
      await deleteDoc(doc(db, "posts", postId, "comments", replyId));
      try {
        await updateDoc(doc(db, "posts", postId), {
          replyCount: increment(-1),
        });
      } catch {
        // Safe update fallback
      }
      setReplyToDelete(null);
    } catch {
      setError("No se pudo eliminar la respuesta. Inténtalo nuevamente.");
    } finally {
      setIsDeletingReply(null);
    }
  }

  return (
    <section className={styles.comments} aria-label="Respuestas">
      {/* Header de Respuestas */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-800/60">
        <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider font-mono flex items-center gap-2">
          <span>💬 Conversación</span>
          <span className="text-[10px] bg-[#34243b] text-pink-300 px-2 py-0.5 rounded-full font-bold">
            {comments.length}
          </span>
        </h4>
        <span className="text-[11px] text-neutral-400">
          {comments.length === 0 ? "Sin respuestas aún" : `${comments.length} ${comments.length === 1 ? "respuesta" : "respuestas"}`}
        </span>
      </div>

      {error && <p role="alert" className={styles.error}>{error}</p>}
      {loading ? (
        <p className={styles.panelNote}>Cargando respuestas…</p>
      ) : comments.length === 0 ? (
        <p className={styles.panelNote}>Abre la conversación. Sé el primero en responder a este post.</p>
      ) : null}

      {comments.map((reply) => (
        <div key={reply.id} className={styles.comment}>
          <Avatar name={reply.authorName} photo={reply.authorPhoto} />
          <div className={styles.commentBody}>
            <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
              <div className="flex items-center gap-2">
                <Link href={`/usuario/${reply.authorId}`} className="font-bold text-xs text-white hover:underline">
                  {reply.authorName}
                </Link>
                {reply.authorId === postAuthorId && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/40 font-mono">
                    Autor
                  </span>
                )}
                <time className="text-[10px] text-neutral-400 font-mono">
                  {timeAgo(reply.createdAt)}
                </time>
              </div>

              {user && user.uid === reply.authorId && (
                replyToDelete === reply.id ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] bg-red-950/40 border border-red-800/50 px-2 py-0.5 rounded">
                    <span className="text-red-300">¿Borrar?</span>
                    <button
                      type="button"
                      onClick={() => void handleDeleteReply(reply.id)}
                      disabled={isDeletingReply === reply.id}
                      className="text-red-400 font-bold hover:underline"
                    >
                      {isDeletingReply === reply.id ? "..." : "Sí"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setReplyToDelete(null)}
                      className="text-neutral-400 hover:text-white"
                    >
                      No
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setReplyToDelete(reply.id)}
                    className="text-[11px] text-neutral-500 hover:text-red-400 transition-colors inline-flex items-center gap-1"
                    title="Eliminar respuesta"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3 h-3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Borrar</span>
                  </button>
                )
              )}
            </div>
            <div className="text-xs text-neutral-200 leading-relaxed overflow-wrap-anywhere">
              {renderContent(reply.content)}
            </div>
          </div>
        </div>
      ))}

      {!user ? (
        <button className={styles.smallButton} onClick={onLogin}>
          Iniciar sesión para responder
        </button>
      ) : !hasProfile ? (
        <Link href="/perfil" className={styles.smallButton}>
          Completar mi perfil
        </Link>
      ) : (
        <form className={styles.replyForm} onSubmit={(event) => { event.preventDefault(); void sendReply(); }}>
          <label className={styles.srOnly} htmlFor={`reply-${postId}`}>Tu respuesta</label>
          <input
            id={`reply-${postId}`}
            value={newComment}
            onChange={(event) => setNewComment(event.target.value)}
            placeholder="Escribe una respuesta a la crew…"
            maxLength={2000}
            disabled={isSending}
          />
          <button className={styles.smallButton} disabled={!newComment.trim() || isSending}>
            {isSending ? "Enviando…" : "Responder ↗"}
          </button>
        </form>
      )}
    </section>
  );
}

export default function ComunidadPage() {
  const { user, profile, error: profileError } = useCurrentUserProfile();
  const hasProfile = Boolean(profile?.bio.trim());
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [activeCommentPost, setActiveCommentPost] = useState<string | null>(null);
  const [tab, setTab] = useState("all");
  const [error, setError] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [isDeletingPost, setIsDeletingPost] = useState<string | null>(null);
  const pendingLikes = useRef(new Set<string>());
  const [busyLikes, setBusyLikes] = useState<string[]>([]);
  const [replyStats, setReplyStats] = useState<Record<string, { count: number; lastAuthor?: string; lastTime?: number }>>({});

  async function fetchPosts() {
    try {
      const snapshot = await getDocs(query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(30)));
      const loadedPosts = snapshot.docs.map((item) => {
        const data = item.data();
        return { ...data, id: item.id, likedBy: Array.isArray(data.likedBy) ? data.likedBy : [] } as Post;
      });
      setPosts(loadedPosts);

      // Pre-fill stats from Firestore post documents
      const statsMap: Record<string, { count: number; lastAuthor?: string; lastTime?: number }> = {};
      loadedPosts.forEach((p) => {
        if (typeof p.replyCount === "number") {
          statsMap[p.id] = { count: p.replyCount, lastAuthor: p.lastReplyAuthor, lastTime: p.lastReplyAt };
        }
      });
      setReplyStats((prev) => ({ ...statsMap, ...prev }));

      // Asynchronously fetch counts for legacy posts that don't have replyCount set
      loadedPosts.forEach(async (p) => {
        if (typeof p.replyCount !== "number") {
          try {
            const countSnap = await getCountFromServer(collection(db, "posts", p.id, "comments"));
            const count = countSnap.data().count;
            setReplyStats((prev) => ({
              ...prev,
              [p.id]: { count, lastAuthor: prev[p.id]?.lastAuthor, lastTime: prev[p.id]?.lastTime },
            }));
          } catch {
            // Count fallback
          }
        }
      });
    } catch {
      setError("No pudimos cargar las publicaciones. Recarga la página para intentarlo nuevamente.");
    } finally {
      setLoadingPosts(false);
    }
  }
  useEffect(() => { void fetchPosts(); }, []);

  const handleReplyCountChange = (postId: string, count: number, lastAuthor?: string, lastTime?: number) => {
    setReplyStats((prev) => ({
      ...prev,
      [postId]: { count, lastAuthor, lastTime },
    }));
  };

  async function handleDeletePost(postId: string) {
    if (!user) return;
    setIsDeletingPost(postId);
    setError("");
    try {
      await deleteDoc(doc(db, "posts", postId));
      setPosts((previous) => previous.filter((item) => item.id !== postId));
      setPostToDelete(null);
    } catch {
      setError("No se pudo eliminar la publicación. Inténtalo nuevamente.");
    } finally {
      setIsDeletingPost(null);
    }
  }

  async function handlePublish() {
    if (!newPost.trim() || !user || !hasProfile || isPublishing) return;
    setIsPublishing(true);
    setError("");
    try {
      const data = {
        ...await authorData(user),
        content: newPost.trim(),
        createdAt: Date.now(),
        likedBy: [],
        replyCount: 0,
      };
      const post = await addDoc(collection(db, "posts"), data);
      setPosts((previous) => [{ ...data, id: post.id }, ...previous]);
      setReplyStats((prev) => ({ ...prev, [post.id]: { count: 0 } }));
      setNewPost("");
    } catch {
      setError("Tu publicación no se pudo guardar. Inténtalo nuevamente.");
    } finally {
      setIsPublishing(false);
    }
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
        <div className={styles.topline}><span>LeonidaCrew / Comunidad</span><Link href="/sorteos">Ver sorteo ↗</Link></div>
        <header className={styles.communityHeader}><div><p className={styles.eyebrow}>La crew de GTA VI</p><h1 className={styles.pageTitle}>Nos vemos en Vice City</h1><p className={styles.subtitle}>Teorías, clips y conversaciones mientras llega nuestra próxima gran partida.</p></div><span className={styles.communityMarker}>[ COMUNIDAD DE FANS ]</span></header>
        <div className={styles.mobilePromo}><div><strong>PS5 + GTA VI</strong><span>SORTEO · TICKETS DESDE $3 USD</span></div><Link href="/sorteos#tickets">Ver tickets ↗</Link></div>
        <div className={styles.communityGrid}>
          <section className={styles.feed} aria-label="Muro de la comunidad">
            <article className={styles.pinned}><span className={styles.pinMark} aria-hidden="true">↗</span><div><p className={styles.eyebrow}>LeonidaCrew / Destacado</p><h2>La próxima consola podría ser tuya</h2><p>Tenemos un sorteo de PS5 + GTA VI para la comunidad. Revisa los paquetes y sigue las novedades aquí. Y tú, ¿qué harías primero al llegar a Vice City?</p><Link href="/sorteos#tickets">Ver el sorteo y elegir tickets →</Link></div></article>
            <form className={styles.composer} onSubmit={(event) => { event.preventDefault(); void handlePublish(); }}>
              <div className={styles.composerTop}><Avatar name={profile?.displayName || user?.displayName || "G6"} photo={profile?.photoURL || user?.photoURL} /><label htmlFor="new-post" className={styles.srOnly}>Escribe tu publicación</label><textarea id="new-post" rows={3} maxLength={5000} value={newPost} onChange={(event) => setNewPost(event.target.value)} disabled={!user || !hasProfile || isPublishing} placeholder={!user ? "Tu crew está aquí. Inicia sesión y entra en la conversación." : !hasProfile ? "Completa tu perfil y presenta a tu personaje." : "¿Una teoría? ¿Un clip? ¿Tu primera misión en GTA VI?"} /></div>
              <div className={styles.composerBottom}><span>{newPost.length > 0 ? `${newPost.length} / 5000` : "Comparte también enlaces de YouTube."}</span>{!user ? <button type="button" className={styles.smallButton} onClick={() => setAuthOpen(true)}>Iniciar sesión</button> : !hasProfile ? <Link className={styles.smallButton} href="/perfil">Crear perfil</Link> : <button className={styles.smallButton} disabled={isPublishing || !newPost.trim()}>{isPublishing ? "Publicando…" : "Publicar ↗"}</button>}</div>
            </form>
            {(error || profileError) && <p role="alert" className={styles.error}>{error || profileError}</p>}
            <div className={styles.feedTools}><div className={styles.tabs} aria-label="Filtrar publicaciones">{[{ id: "all", label: "El muro" }, { id: "videos", label: "Videos" }, { id: "giveaway", label: "Sorteo" }].map((item) => <button key={item.id} type="button" className={tab === item.id ? styles.activeTab : ""} aria-pressed={tab === item.id} onClick={() => setTab(item.id)}>{item.label}</button>)}</div><span className={styles.feedCount}>{visiblePosts.length} posts</span></div>
            {loadingPosts ? (
              <div className="flex flex-col gap-4 py-2" role="status">
                <div className="h-32 rounded-2xl bg-[#141522] border border-neutral-800/60 animate-pulse p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-lg bg-neutral-800/80"></div>
                    <div className="w-28 h-4 rounded bg-neutral-800/80"></div>
                  </div>
                  <div className="w-3/4 h-3.5 rounded bg-neutral-800/60 mb-2"></div>
                  <div className="w-1/2 h-3 rounded bg-neutral-800/40"></div>
                </div>
                <div className="h-32 rounded-2xl bg-[#141522] border border-neutral-800/60 animate-pulse p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-lg bg-neutral-800/80"></div>
                    <div className="w-32 h-4 rounded bg-neutral-800/80"></div>
                  </div>
                  <div className="w-2/3 h-3.5 rounded bg-neutral-800/60"></div>
                </div>
              </div>
            ) : visiblePosts.length === 0 ? (
              <div className={styles.empty}>
                <span className="text-3xl block mb-2">🌴</span>
                <h3>{tab === "all" ? "La ciudad empieza contigo" : "Todavía no hay publicaciones aquí"}</h3>
                <p>{tab === "all" ? "Comparte tu primera teoría, un clip de YouTube o cuéntanos qué esperas de Vice City." : "Sé el primero en compartir un video o debate en esta categoría."}</p>
              </div>
            ) : visiblePosts.map((post) => {
              const liked = Boolean(user && post.likedBy.includes(user.uid));
              const postStats = replyStats[post.id];
              const replyCount = postStats?.count ?? post.replyCount ?? 0;
              const lastAuthor = postStats?.lastAuthor ?? post.lastReplyAuthor;
              const lastTime = postStats?.lastTime ?? post.lastReplyAt;
              const isDrawerOpen = activeCommentPost === post.id;

              return <article key={post.id} id={`post-${post.id}`} className={styles.post}>
                <div className={styles.postHeader}><Link href={`/usuario/${post.authorId}`} aria-label={`Perfil de ${post.authorName}`}><Avatar name={post.authorName} photo={post.authorPhoto} /></Link><div><Link href={`/usuario/${post.authorId}`}>{post.authorName}</Link><time dateTime={new Date(post.createdAt).toISOString()}>{timeAgo(post.createdAt)}</time></div></div>
                <div className={styles.postContent}>{renderContent(post.content)}</div>

                {replyCount > 0 && (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setActiveCommentPost(isDrawerOpen ? null : post.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setActiveCommentPost(isDrawerOpen ? null : post.id);
                      }
                    }}
                    className="mt-3 cursor-pointer group flex items-center justify-between text-xs bg-[#161722]/90 hover:bg-[#1c1e2b] border border-neutral-800/80 hover:border-pink-500/40 rounded-xl px-3.5 py-2.5 transition-all select-none"
                    title={isDrawerOpen ? "Ocultar respuestas" : "Desplegar conversación"}
                  >
                    <div className="flex items-center gap-2 flex-wrap text-neutral-300">
                      <span className="font-bold text-pink-400 font-mono flex items-center gap-1.5">
                        <span>💬</span>
                        <span>{replyCount} {replyCount === 1 ? "respuesta" : "respuestas"}</span>
                      </span>
                      {lastAuthor && (
                        <span className="text-neutral-400 text-[11px]">
                          · Última de <strong className="text-neutral-200 group-hover:text-pink-300 transition-colors">{lastAuthor}</strong>
                          {lastTime ? ` (${timeAgo(lastTime)})` : ""}
                        </span>
                      )}
                    </div>
                    <span className="text-pink-400 group-hover:translate-x-0.5 transition-transform text-[11px] font-bold font-mono ml-2 shrink-0">
                      {isDrawerOpen ? "Ocultar ▲" : "Ver respuestas ↗"}
                    </span>
                  </div>
                )}

                <div className={styles.postActions}>
                  <button
                    type="button"
                    className={liked ? styles.liked : ""}
                    aria-pressed={liked}
                    aria-label={`${liked ? "Quitar" : "Dar"} me gusta a la publicación de ${post.authorName}`}
                    disabled={busyLikes.includes(post.id)}
                    onClick={() => void handleLike(post)}
                  >
                    <svg viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
                    </svg>
                    <span>{liked ? "Te gusta" : "Me gusta"}</span>
                    {post.likedBy.length > 0 && (
                      <span className="text-[10px] bg-pink-500/20 text-pink-300 font-bold px-1.5 py-0.5 rounded-full ml-0.5 font-mono">
                        {post.likedBy.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    className={isDrawerOpen ? "text-pink-400 font-semibold" : ""}
                    aria-expanded={isDrawerOpen}
                    onClick={() => setActiveCommentPost(isDrawerOpen ? null : post.id)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                      <path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5Z" />
                    </svg>
                    <span>{replyCount > 0 ? `${replyCount} ${replyCount === 1 ? "respuesta" : "respuestas"}` : "Responder"}</span>
                    {replyCount > 0 && (
                      <span className="text-[10px] text-neutral-400 font-mono ml-0.5">
                        {isDrawerOpen ? "▲" : "▼"}
                      </span>
                    )}
                  </button>

                  {user && user.uid === post.authorId && (
                    postToDelete === post.id ? (
                      <div className="flex items-center gap-2 bg-red-950/40 border border-red-800/60 px-2.5 py-1 rounded-lg text-xs ml-auto">
                        <span className="text-red-200 text-[11px]">¿Eliminar publicación?</span>
                        <button
                          type="button"
                          onClick={() => void handleDeletePost(post.id)}
                          disabled={isDeletingPost === post.id}
                          className="text-red-400 hover:text-red-300 font-bold px-2 py-0.5 bg-red-900/40 rounded transition-colors text-[11px]"
                        >
                          {isDeletingPost === post.id ? "Borrando..." : "Sí"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPostToDelete(null)}
                          className="text-neutral-400 hover:text-white text-[11px]"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPostToDelete(post.id)}
                        className="text-neutral-500 hover:text-red-400 transition-colors ml-auto flex items-center gap-1.5 text-[11px]"
                        title="Eliminar publicación"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Eliminar</span>
                      </button>
                    )
                  )}
                </div>

                {isDrawerOpen && (
                  <CommentSection
                    postId={post.id}
                    postAuthorId={post.authorId}
                    user={user}
                    hasProfile={hasProfile}
                    onLogin={() => setAuthOpen(true)}
                    onCountChange={(count, author, time) => handleReplyCountChange(post.id, count, author, time)}
                  />
                )}
              </article>;
            })}
          </section>
          <aside className={styles.communityAside}><GiveawayCard /><div className={styles.asideNotes}><h3>Código de la crew</h3><p>Comparte teorías, respeta a los demás y avisa si tu publicación contiene spoilers.</p><Link href="/sorteos">Premio, paquetes y detalles del sorteo →</Link></div></aside>
        </div>
        <footer className={styles.footer}><span>LeonidaCrew · Una comunidad de fans. No afiliada a Rockstar Games.</span><Link href="/sorteos">PS5 + GTA VI / Ver sorteo ↗</Link></footer>
      </div>
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
