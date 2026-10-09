"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { auth, db } from "@/app/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, addDoc, query, orderBy, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from "firebase/firestore";

// Estructura del Post
interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  content: string;
  createdAt: number;
  likedBy: string[]; // <-- Arreglado: Array para guardar quién dio like
}

// ------------------------------------------------------------------
// COMPONENTE PARA LOS COMENTARIOS (RESPUESTAS)
// ------------------------------------------------------------------
function CommentSection({ postId, user, hasProfile }: { postId: string, user: User | null, hasProfile: boolean }) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    // Escuchar comentarios en tiempo real desde Firestore
    const q = query(collection(db, "posts", postId, "comments"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setComments(fetched);
    });
    return () => unsubscribe();
  }, [postId]);

  const handleSendReply = async () => {
    if (!newComment.trim()) return;
    if (!user) return alert("Inicia sesión para comentar.");
    if (!hasProfile) return alert("Completa tu perfil para comentar.");

    setIsSending(true);
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();

      await addDoc(collection(db, "posts", postId, "comments"), {
        authorId: user.uid,
        authorName: userData?.displayName || user.displayName || "Usuario",
        authorPhoto: userData?.photoURL || user.photoURL || "",
        content: newComment.trim(),
        createdAt: Date.now()
      });
      setNewComment("");
    } catch (error) {
      console.error("Error al responder:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-neutral-800/50 flex flex-col gap-4 bg-[#16171e] -mx-5 -mb-5 p-5 rounded-b-2xl">
      {/* Lista de comentarios */}
      <div className="flex flex-col gap-3">
        {comments.length === 0 && <p className="text-xs text-[#6c7083]">No hay respuestas aún. ¡Sé el primero!</p>}
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <img src={comment.authorPhoto || "https://via.placeholder.com/30"} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-neutral-700" />
            <div className="bg-[#1a1b26] p-3 rounded-2xl rounded-tl-none w-full border border-neutral-800">
              <Link href={`/usuario/${comment.authorId}`} className="text-[13px] font-bold text-white hover:underline block mb-1">
                {comment.authorName}
              </Link>
              <p className="text-[14px] text-neutral-300">{comment.content}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Input para nuevo comentario */}
      <div className="flex gap-3 items-center mt-2">
        <input 
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Escribe una respuesta..."
          className="flex-grow bg-[#1a1b26] border border-neutral-800 text-sm text-white rounded-full px-4 py-2 focus:outline-none focus:border-cyan-500"
        />
        <button 
          onClick={handleSendReply}
          disabled={!newComment.trim() || isSending}
          className="bg-cyan-600 hover:bg-cyan-500 text-white rounded-full p-2 disabled:opacity-50 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// PÁGINA PRINCIPAL DE COMUNIDAD
// ------------------------------------------------------------------
export default function ComunidadPage() {
  const [user, setUser] = useState<User | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(true);
  
  // Estado para saber qué post tiene la caja de comentarios abierta
  const [activeCommentPost, setActiveCommentPost] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists() && userSnap.data().bio) {
          setHasProfile(true);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchPosts = async () => {
    try {
      const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const fetchedPosts: Post[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedPosts.push({ id: doc.id, likedBy: [], ...data } as Post);
      });
      setPosts(fetchedPosts);
    } catch (error) {
      console.error("Error cargando publicaciones:", error);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  const handlePublish = async () => {
    if (!newPost.trim() || !user) return;
    if (!hasProfile) return alert("Debes completar tu perfil para publicar.");

    setIsPublishing(true);
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();

      await addDoc(collection(db, "posts"), {
        authorId: user.uid,
        authorName: userData?.displayName || user.displayName || "Usuario",
        authorPhoto: userData?.photoURL || user.photoURL || "",
        content: newPost.trim(),
        createdAt: Date.now(),
        likedBy: [], // Array vacío de likes al crear
      });
      
      setNewPost("");
      fetchPosts();
    } catch (error) {
      console.error("Error al publicar:", error);
    } finally {
      setIsPublishing(false);
    }
  };

  // NUEVO: Función para dar "Me gusta"
  const handleLike = async (postId: string, likedBy: string[]) => {
    if (!user) return alert("Debes iniciar sesión para dar me gusta.");
    
    const postRef = doc(db, "posts", postId);
    const hasLiked = likedBy.includes(user.uid);

    // 1. Actualización visual instantánea
    setPosts(posts.map(p => {
      if (p.id === postId) {
        return { ...p, likedBy: hasLiked ? p.likedBy.filter(id => id !== user.uid) : [...(p.likedBy || []), user.uid] };
      }
      return p;
    }));

    // 2. Actualización en Firebase
    try {
      await updateDoc(postRef, {
        likedBy: hasLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
    } catch (error) {
      console.error("Error al actualizar like:", error);
    }
  };

  // NUEVO: Magia para detectar links y videos de YouTube
  const renderContent = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        const ytMatch = part.match(ytRegex);
        if (ytMatch && ytMatch[1]) {
          // Es YouTube! Retornamos el reproductor de video
          return (
            <div key={index} className="w-full aspect-video mt-3 mb-3 rounded-xl overflow-hidden border border-neutral-800 shadow-lg">
              <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${ytMatch[1]}`} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
            </div>
          );
        }
        // Es un link normal (Twitch, Kick, etc)
        return (
          <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="text-cyan-400 font-medium hover:underline hover:text-cyan-300 break-all">
            {part}
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const timeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return "hace un momento";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `hace ${hours} h`;
    return `hace ${Math.floor(hours / 24)} días`;
  };

  return (
    <main className="w-full max-w-4xl mx-auto p-4 md:p-8 flex flex-col gap-6 relative z-10 font-sans">
      
      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl">💬</span>
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Comunidad</h1>
      </div>
      
      <div className="bg-[#121319] border border-neutral-800 rounded-2xl p-4 shadow-lg flex gap-4">
        <div className="w-12 h-12 rounded-full bg-[#1e2029] flex-shrink-0 overflow-hidden border border-neutral-700">
          {user?.photoURL ? <img src={user.photoURL} alt="Tú" className="w-full h-full object-cover"/> : <span className="flex items-center justify-center h-full text-xl">😎</span>}
        </div>
        <div className="flex-grow flex flex-col gap-3">
          <textarea 
            rows={3}
            placeholder={user ? "¿Qué estás pensando? Pega un enlace de YouTube para compartir un video..." : "Inicia sesión para participar en la comunidad."}
            disabled={!user}
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            className="w-full bg-transparent text-white placeholder-[#6c7083] focus:outline-none resize-none text-[15px]"
          />
          <div className="flex justify-end pt-2 border-t border-neutral-800/50">
            <button onClick={handlePublish} disabled={isPublishing || !newPost.trim() || !user} className="px-6 py-2 rounded-full bg-pink-600 hover:bg-pink-500 text-white font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {isPublishing ? "Publicando..." : "Publicar"}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 mt-4">
        {loadingPosts ? (
          <div className="text-center text-[#6c7083] py-10">Cargando la comunidad...</div>
        ) : posts.length > 0 ? (
          posts.map((post) => {
            const isLiked = user && (post.likedBy || []).includes(user.uid);
            const likeCount = (post.likedBy || []).length;
            
            return (
              <div key={post.id} className="bg-[#121319] border border-neutral-800 rounded-2xl p-5 shadow-lg transition-colors hover:border-neutral-700">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Link href={`/usuario/${post.authorId}`}>
                      <img src={post.authorPhoto || "https://via.placeholder.com/40"} alt={post.authorName} className="w-10 h-10 rounded-full object-cover border border-neutral-700 hover:opacity-80" />
                    </Link>
                    <div className="flex flex-col">
                      <Link href={`/usuario/${post.authorId}`} className="text-[15px] font-bold text-white hover:underline">{post.authorName}</Link>
                      <span className="text-[12px] text-[#6c7083]">{timeAgo(post.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Contenido Renderizado Mágicamente */}
                <p className="text-white text-[15px] leading-relaxed mb-4 whitespace-pre-wrap">
                  {renderContent(post.content)}
                </p>

                {/* Botones de Interacción (Like, Responder) */}
                <div className="flex items-center gap-6 pt-3 border-t border-neutral-800/50">
                  <button 
                    onClick={() => handleLike(post.id, post.likedBy || [])}
                    className={`flex items-center gap-2 transition-colors group text-sm font-semibold ${isLiked ? 'text-pink-500' : 'text-[#6c7083] hover:text-pink-500'}`}
                  >
                    <div className={`p-1.5 rounded-full ${isLiked ? 'bg-pink-500/10' : 'group-hover:bg-pink-500/10'}`}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                    </div>
                    <span>{likeCount > 0 ? likeCount : 'Me gusta'}</span>
                  </button>
                  
                  <button 
                    onClick={() => setActiveCommentPost(activeCommentPost === post.id ? null : post.id)}
                    className="flex items-center gap-2 text-[#6c7083] font-semibold hover:text-cyan-400 transition-colors group text-sm"
                  >
                    <div className="p-1.5 rounded-full group-hover:bg-cyan-400/10">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                    </div>
                    <span>Responder</span>
                  </button>
                </div>

                {/* Mostrar Comentarios si este post está activo */}
                {activeCommentPost === post.id && (
                  <CommentSection postId={post.id} user={user} hasProfile={hasProfile} />
                )}

              </div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-[#121319] border border-neutral-800 rounded-2xl">
            <span className="text-4xl block mb-3">👻</span>
            <h3 className="text-white font-bold text-lg">La ciudad está muy tranquila...</h3>
          </div>
        )}
      </div>

    </main>
  );
}