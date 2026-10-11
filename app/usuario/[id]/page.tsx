"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { db } from "@/app/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useCurrentUserProfile } from "@/app/lib/useCurrentUserProfile";
import { readUserProfile, type UserProfile } from "@/app/lib/profiles";
import { ProfileActionError, setFollowState } from "@/app/lib/profile-actions";
import AuthModal from "@/app/components/AuthModal";

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
            <div className="flex flex-col gap-0.5">
              <span className="text-white font-semibold">{publicProfile.followers?.length || 0}</span>
              <span className="text-[#6c7083]">Seguidores</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-white font-semibold">{publicProfile.following?.length || 0}</span>
              <span className="text-[#6c7083]">Siguiendo</span>
            </div>
            <div className="flex flex-col gap-0.5 ml-4 border-l border-neutral-800 pl-8">
              <span className="text-pink-400 font-bold">Nivel {Math.floor((publicProfile.reputation || 0) / 100) + 1}</span>
              <span className="text-[#6c7083]">{publicProfile.reputation || 0} RP</span>
            </div>
          </div>
        </div>
      </div>
    </main>
    <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
