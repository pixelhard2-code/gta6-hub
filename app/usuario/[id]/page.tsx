"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { db } from "@/app/lib/firebase";
import { doc, onSnapshot, collection, getDocs, query, orderBy } from "firebase/firestore";
import { useCurrentUserProfile } from "@/app/lib/useCurrentUserProfile";
import { readUserProfile, type UserProfile } from "@/app/lib/profiles";
import { ProfileActionError, setFollowState } from "@/app/lib/profile-actions";
import AuthModal from "@/app/components/AuthModal";
import UserListModal from "@/app/components/UserListModal";

export default function PerfilPublico() {
  const { id: profileId } = useParams<{ id: string }>();
  const { user: currentUser, profile: currentUserProfile, loading: loadingSession, error: sessionError } = useCurrentUserProfile();
  const [publicProfile, setPublicProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [followError, setFollowError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [modalType, setModalType] = useState<"followers" | "following" | null>(null);
  const [userPosts, setUserPosts] = useState<{ id: string; content: string; createdAt: number; likedBy: string[]; replyCount?: number }[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const pendingFollow = useRef(false);

  const isOwnProfile = currentUser?.uid === profileId;
  // Either side recognizes legacy relationships left by an interrupted old write.
  const isFollowing = Boolean(currentUser && (
    currentUserProfile?.following.includes(profileId) || publicProfile?.followers.includes(currentUser.uid)
  ));

  useEffect(() => {
    let active = true;
    setLoading(true);
    setPublicProfile(null);
    setLoadError("");
    setFollowError("");
    setNeedsProfile(false);
    const unsubscribe = onSnapshot(doc(db, "users", profileId), (snapshot) => {
      if (!active) return;
      setPublicProfile(snapshot.exists() ? readUserProfile(snapshot.id, snapshot.data()) : null);
      setLoading(false);
    }, () => {
      if (!active) return;
      setLoadError("No pudimos cargar este perfil. Recarga la página para volver a intentarlo.");
      setLoading(false);
    });
    return () => { active = false; unsubscribe(); };
  }, [profileId]);

  useEffect(() => {
    let active = true;
    setLoadingPosts(true);
    const fetchUserPosts = async () => {
      try {
        const snap = await getDocs(query(collection(db, "posts"), orderBy("createdAt", "desc")));
        if (active) {
          const list = snap.docs
            .filter((item) => item.data().authorId === profileId)
            .map((item) => {
              const d = item.data();
              return {
                id: item.id,
                content: typeof d.content === "string" ? d.content : "",
                createdAt: typeof d.createdAt === "number" ? d.createdAt : Date.now(),
                likedBy: Array.isArray(d.likedBy) ? d.likedBy : [],
                replyCount: typeof d.replyCount === "number" ? d.replyCount : 0,
              };
            });
          setUserPosts(list);
        }
      } catch {
        if (active) setUserPosts([]);
      } finally {
        if (active) setLoadingPosts(false);
      }
    };
    void fetchUserPosts();
    return () => { active = false; };
  }, [profileId]);

  const handleFollow = async () => {
    if (pendingFollow.current || loadingSession || !publicProfile || sessionError) return;
    setFollowError("");
    setNeedsProfile(false);
    if (!currentUser) {
      setAuthOpen(true);
      return;
    }
    if (isOwnProfile) return;
    if (!currentUserProfile || (!isFollowing && !currentUserProfile.bio.trim())) {
      setFollowError("Completa tu biografía antes de seguir a otros jugadores.");
      setNeedsProfile(true);
      return;
    }
    pendingFollow.current = true;
    setIsProcessing(true);
    try {
      await setFollowState(db, currentUser.uid, profileId, !isFollowing);
    } catch (error) {
      if (error instanceof ProfileActionError && ["incomplete-profile", "missing-profile"].includes(error.code)) {
        setFollowError("Completa tu perfil antes de seguir a otros jugadores.");
        setNeedsProfile(true);
      } else {
        setFollowError("No se pudo guardar el cambio. Revisa tu conexión e inténtalo nuevamente.");
      }
    } finally {
      pendingFollow.current = false;
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="text-white text-center mt-20">Buscando usuario...</div>;
  if (loadError) return <p role="alert" className="text-white text-center mt-20">{loadError}</p>;
  if (!publicProfile) return <div className="text-white text-center mt-20">Usuario no encontrado.</div>;

  return (
    <>
    <main className="w-full max-w-4xl mx-auto p-4 md:p-8 flex flex-col gap-6 relative z-10 font-sans">
      <div className="bg-[#121319] border border-neutral-800 rounded-2xl overflow-hidden shadow-lg w-full">
        {/* Banner */}
        <div className="h-40 md:h-48 w-full bg-gradient-to-r from-[#241b2d] to-[#1a1b26] relative border-b border-neutral-800/50">
           <div className="absolute inset-0 bg-[radial-gradient(#ffffff10_1px,transparent_1px)] [background-size:20px_20px]"></div>
        </div>

        <div className="px-6 pb-6 relative">
          <div className="flex justify-between items-end -mt-12 md:-mt-16 mb-4">
            
            <div className="w-24 h-24 md:w-32 md:h-32 bg-[#1e2029] rounded-full flex items-center justify-center text-5xl shadow-xl overflow-hidden relative z-10 border-4 border-[#121319]">
              {publicProfile.photoURL ? <img src={publicProfile.photoURL} alt="Avatar" className="w-full h-full object-cover" /> : "😎"}
            </div>

            {/* Botón de Seguir */}
            <div className="flex items-center gap-3 mb-2">
              {isOwnProfile ? <Link href="/perfil" className="px-4 py-2 rounded-xl border border-neutral-600 text-white text-sm font-semibold">Editar mi perfil</Link> : (
              <button 
                onClick={handleFollow}
                disabled={isProcessing || loadingSession || Boolean(sessionError)}
                aria-pressed={isFollowing}
                aria-busy={isProcessing}
                className={`px-4 md:px-6 py-2 rounded-xl text-[14px] font-bold transition-all min-h-10 disabled:opacity-50 disabled:cursor-wait ${
                  isFollowing 
                  ? "bg-transparent border border-neutral-600 text-white hover:border-red-500 hover:text-red-500" 
                  : "bg-[#f3b5a7] text-[#241820] hover:bg-[#f8cbc2]"
                }`}
              >
                {isProcessing ? "Guardando…" : loadingSession ? "Cargando…" : isFollowing ? "Dejar de seguir" : "Seguir"}
              </button>
              )}
            </div>
          </div>

          <h1 className="text-[26px] font-bold text-white mb-1 tracking-tight">
            {publicProfile.displayName}
          </h1>
          <p className="text-sm text-neutral-400 mb-4">{publicProfile.bio}</p>
          {(followError || sessionError) && <div role="alert" className="text-sm text-[#f3b5a7] mb-4"><p>{followError || sessionError}</p>{needsProfile && <Link href="/perfil" className="underline inline-block mt-2">Completar mi perfil →</Link>}</div>}
          
          <div className="flex gap-8 text-[15px] font-medium mt-4">
            <button
              type="button"
              onClick={() => setModalType("followers")}
              className="flex flex-col gap-0.5 text-left group cursor-pointer focus:outline-none"
              title="Ver seguidores"
            >
              <span className="text-white font-semibold group-hover:text-pink-300 transition-colors">{publicProfile.followers?.length || 0}</span>
              <span className="text-neutral-400 group-hover:underline">Seguidores</span>
            </button>
            <button
              type="button"
              onClick={() => setModalType("following")}
              className="flex flex-col gap-0.5 text-left group cursor-pointer focus:outline-none"
              title="Ver seguidos"
            >
              <span className="text-white font-semibold group-hover:text-pink-300 transition-colors">{publicProfile.following?.length || 0}</span>
              <span className="text-neutral-400 group-hover:underline">Siguiendo</span>
            </button>
            <div className="flex flex-col gap-0.5 ml-4 border-l border-neutral-800 pl-8">
              <span className="text-pink-400 font-bold">Nivel {Math.floor((publicProfile.reputation || 0) / 100) + 1}</span>
              <span className="text-neutral-400">{publicProfile.reputation || 0} RP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Publicaciones del Usuario en la Comunidad */}
      <div className="bg-[#121319] border border-neutral-800 rounded-2xl p-6 shadow-lg flex flex-col gap-4 w-full">
        <div className="flex items-center justify-between border-b border-neutral-800/60 pb-3">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <span>Publicaciones en el Muro</span>
            <span className="text-xs bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-full font-mono">
              {userPosts.length}
            </span>
          </h2>
          <Link
            href="/comunidad"
            className="text-xs text-pink-400 hover:text-pink-300 font-semibold"
          >
            Ir a la comunidad ↗
          </Link>
        </div>

        {loadingPosts ? (
          <p className="text-xs text-neutral-500 py-3">Cargando publicaciones del jugador...</p>
        ) : userPosts.length === 0 ? (
          <div className="py-8 text-center flex flex-col items-center gap-2">
            <span className="text-2xl">🌴</span>
            <p className="text-sm font-semibold text-neutral-300">Este jugador aún no tiene publicaciones</p>
            <p className="text-xs text-neutral-500 max-w-sm">
              Cuando {publicProfile.displayName} publique teorías o mensajes en el muro, aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {userPosts.map((post) => (
              <div
                key={post.id}
                className="p-4 rounded-xl bg-[#161720] border border-neutral-800/80 flex flex-col gap-2.5 hover:border-neutral-700 transition-colors"
              >
                <p className="text-xs md:text-sm text-neutral-200 line-clamp-3 leading-relaxed">
                  {post.content}
                </p>
                <div className="flex items-center justify-between text-xs text-neutral-500 pt-2 border-t border-neutral-800/50">
                  <span className="font-mono text-[11px]">
                    {new Date(post.createdAt).toLocaleDateString("es", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-pink-400 font-mono" title={`${post.likedBy.length} me gusta`}>
                      ♥ {post.likedBy.length}
                    </span>
                    {typeof post.replyCount === "number" && post.replyCount > 0 && (
                      <span className="flex items-center gap-1 text-neutral-300 font-mono text-[11px]" title={`${post.replyCount} respuestas`}>
                        💬 {post.replyCount}
                      </span>
                    )}
                    <Link
                      href={`/comunidad#post-${post.id}`}
                      className="text-pink-300 hover:underline font-semibold"
                    >
                      Ver en el muro ↗
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>

    {/* Modal de Seguidores y Siguiendo */}
    <UserListModal
      isOpen={modalType !== null}
      onClose={() => setModalType(null)}
      title={modalType === "followers" ? `Seguidores de ${publicProfile.displayName}` : `Jugadores que sigue ${publicProfile.displayName}`}
      userIds={modalType === "followers" ? (publicProfile.followers || []) : (publicProfile.following || [])}
    />

    <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
