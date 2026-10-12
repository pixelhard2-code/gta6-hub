"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { auth, googleProvider, db } from "@/app/lib/firebase";
import { signInWithPopup, signOut } from "firebase/auth";
import { collection, getDocs, query, limit, orderBy, doc, deleteDoc } from "firebase/firestore";
import { readUserProfile, type UserProfile } from "@/app/lib/profiles";
import { useCurrentUserProfile } from "@/app/lib/useCurrentUserProfile";
import { ProfileActionError, saveUserProfile } from "@/app/lib/profile-actions";
import { PROFILE_AVATARS } from "@/app/lib/avatars";
import ProfileAvatarPicker from "@/app/components/ProfileAvatarPicker";
import UserListModal from "@/app/components/UserListModal";

export default function PerfilPage() {
  const { user, profile: profileData, loading, error: profileError } = useCurrentUserProfile();
  const [recommended, setRecommended] = useState<UserProfile[]>([]);
  
  // Modales
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [modalType, setModalType] = useState<"followers" | "following" | null>(null);

  // Publicaciones del usuario
  const [userPosts, setUserPosts] = useState<{ id: string; content: string; createdAt: number; likedBy: string[] }[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [isDeletingPost, setIsDeletingPost] = useState<string | null>(null);
  
  const [newUsername, setNewUsername] = useState("");
  const [newBio, setNewBio] = useState("");
  const [newPhoto, setNewPhoto] = useState<string>(PROFILE_AVATARS[0].src);
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [notice, setNotice] = useState("");
  const pendingSave = useRef(false);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setShowSetupModal(false);
      setShowEditModal(false);
      return;
    }
    if (!profileData && !profileError) {
      setNewUsername((user.displayName || "Jugador").slice(0, 15));
      setNewBio("");
      setNewPhoto(user.photoURL || PROFILE_AVATARS[0].src);
      setEditError("");
      setShowSetupModal(true);
    }
  }, [user, profileData, loading, profileError]);

  useEffect(() => {
    let active = true;
    const fetchRecommended = async () => {
      try {
        const snapshot = await getDocs(query(collection(db, "users"), limit(6)));
        if (active) setRecommended(snapshot.docs.map((item) => readUserProfile(item.id, item.data()))
          .filter((item) => item.uid !== user?.uid && item.bio.trim()).slice(0, 5));
      } catch { if (active) setRecommended([]); }
    };
    void fetchRecommended();
    return () => { active = false; };
  }, [user?.uid]);

  useEffect(() => {
    if (!user) {
      setUserPosts([]);
      setLoadingPosts(false);
      return;
    }
    let active = true;
    setLoadingPosts(true);
    const fetchMyPosts = async () => {
      try {
        const snapshot = await getDocs(query(collection(db, "posts"), orderBy("createdAt", "desc")));
        if (active) {
          const myDocs = snapshot.docs
            .filter((docItem) => docItem.data().authorId === user.uid)
            .map((docItem) => {
              const d = docItem.data();
              return {
                id: docItem.id,
                content: typeof d.content === "string" ? d.content : "",
                createdAt: typeof d.createdAt === "number" ? d.createdAt : Date.now(),
                likedBy: Array.isArray(d.likedBy) ? d.likedBy : [],
              };
            });
          setUserPosts(myDocs);
        }
      } catch {
        if (active) setUserPosts([]);
      } finally {
        if (active) setLoadingPosts(false);
      }
    };
    void fetchMyPosts();
    return () => { active = false; };
  }, [user?.uid]);

  const handleGoogleLogin = async () => {
    setNotice("");
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error en login:", error);
      setNotice("No pudimos iniciar sesión. Inténtalo nuevamente.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error al salir:", error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!user) return;
    setIsDeletingPost(postId);
    try {
      await deleteDoc(doc(db, "posts", postId));
      setUserPosts((prev) => prev.filter((p) => p.id !== postId));
      setPostToDelete(null);
      setNotice("Publicación eliminada correctamente.");
    } catch {
      setNotice("No se pudo eliminar la publicación. Inténtalo nuevamente.");
    } finally {
      setIsDeletingPost(null);
    }
  };

  const saveProfile = async () => {
    if (!user || pendingSave.current) return;
    setEditError("");
    if (newUsername.trim().length < 3) {
      setEditError("El nombre debe tener entre 3 y 15 caracteres.");
      return;
    }

    pendingSave.current = true;
    setIsSaving(true);
    try {
      await saveUserProfile(db, user, { displayName: newUsername, bio: newBio, photoURL: newPhoto });
      setShowSetupModal(false);
      setShowEditModal(false);
      setNotice("Perfil guardado.");
    } catch (error) {
      setEditError(error instanceof ProfileActionError && error.code === "invalid-name"
        ? "El nombre debe tener entre 3 y 15 caracteres."
        : "No se pudo guardar tu perfil. Revisa tu conexión e inténtalo nuevamente.");
    } finally {
      pendingSave.current = false;
      setIsSaving(false);
    }
  };

  const openEditor = () => {
    if (!user) { void handleGoogleLogin(); return; }
    if (loading || profileError) return;
    setNewUsername(profileData?.displayName || (user.displayName || "Jugador").slice(0, 15));
    setNewBio(profileData?.bio || "");
    setNewPhoto(profileData?.photoURL || user.photoURL || PROFILE_AVATARS[0].src);
    setEditError("");
    setShowEditModal(true);
  };

  const closeEditor = () => {
    if (pendingSave.current) return;
    setShowEditModal(false);
    if (showSetupModal) { setShowSetupModal(false); void handleLogout(); }
  };

  return (
    <main className="w-full max-w-6xl mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-6 relative z-10 font-sans">
      
      {/* Modales de Edición (Ocultos por defecto) */}
      {user && (showSetupModal || showEditModal) && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div ref={editorRef} role="dialog" aria-modal="true" aria-labelledby="profile-editor-title" className="bg-[#121319] border border-neutral-800 rounded-2xl p-6 w-full max-w-md max-h-[90dvh] overflow-y-auto shadow-2xl" onKeyDown={(event) => {
            if (event.key === "Escape") closeEditor();
            if (event.key === "Tab") {
              const fields = Array.from(editorRef.current?.querySelectorAll<HTMLElement>('input:not(:disabled),textarea:not(:disabled),button:not(:disabled)') || [])
                .filter((field) => !(field instanceof HTMLInputElement) || field.type !== "radio" || field.checked);
              if (!fields?.length) return;
              const first = fields[0], last = fields[fields.length - 1];
              if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
              else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
            }
          }}>
            <h2 id="profile-editor-title" className="text-xl font-bold text-white mb-4">
              {showSetupModal ? "Actualiza tu perfil (Requerido)" : "Editar perfil"}
            </h2>
            <form onSubmit={(event) => { event.preventDefault(); void saveProfile(); }}>
            <fieldset disabled={isSaving} className="border-0 p-0 m-0 min-w-0">
            <ProfileAvatarPicker value={newPhoto} onChange={setNewPhoto} currentPhoto={profileData?.photoURL} googlePhoto={user.photoURL} />
            <div className="mb-4">
              <label htmlFor="profile-username" className="text-xs text-neutral-400 mb-1 block">Nombre de usuario</label>
              <input id="profile-username" autoFocus type="text" maxLength={15} value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="w-full bg-[#1a1b26] border border-neutral-700 rounded-lg p-3 text-white focus:outline-none focus:border-pink-500" />
            </div>
            <div className="mb-6">
              <label htmlFor="profile-bio" className="text-xs text-neutral-400 mb-1 block">Biografía (Obligatoria para seguir a otros)</label>
              <textarea id="profile-bio" rows={3} maxLength={500} value={newBio} onChange={(e) => setNewBio(e.target.value)} className="w-full bg-[#1a1b26] border border-neutral-700 rounded-lg p-3 text-white focus:outline-none focus:border-pink-500 resize-none" />
            </div>
            {editError && <p role="alert" className="text-sm text-[#f3b5a7] mb-4">{editError}</p>}
            <div className="flex justify-end gap-3">
              <button type="button" onClick={closeEditor} className="px-4 py-2 rounded-lg bg-[#1a1b26] text-white">Cancelar</button>
              <button type="submit" disabled={isSaving} className="px-6 py-2 rounded-lg bg-[#f3b5a7] hover:bg-[#f8cbc2] text-[#241820] font-bold disabled:opacity-50">
                {isSaving ? "Guardando..." : "Guardar"}
              </button>
            </div>
            </fieldset>
            </form>
          </div>
        </div>, document.body
      )}

      {/* Columna Izquierda: Tu Perfil */}
      <div className="w-full lg:w-2/3 flex flex-col gap-6">
        <div className="bg-[#121319] border border-neutral-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="h-40 md:h-48 w-full bg-gradient-to-r from-[#1a1b26] to-[#241b2d] relative border-b border-neutral-800/50">
             <div className="absolute inset-0 bg-[radial-gradient(#ffffff10_1px,transparent_1px)] [background-size:20px_20px]"></div>
          </div>

          <div className="px-6 pb-6 relative">
            <div className="flex justify-between items-end -mt-12 md:-mt-16 mb-4">
              <div className="w-24 h-24 md:w-32 md:h-32 bg-[#1e2029] rounded-full flex items-center justify-center text-5xl shadow-xl overflow-hidden relative z-10 border-4 border-[#121319]">
                {profileData?.photoURL ? <img src={profileData.photoURL} alt="Avatar" className="w-full h-full object-cover" /> : "😎"}
              </div>
              <div className="flex items-center gap-3 mb-2">
                <button onClick={openEditor} disabled={loading || Boolean(profileError)} className="px-4 py-2 rounded-xl bg-[#1b1c26] hover:bg-[#252633] text-[15px] font-semibold text-white transition-colors h-10 disabled:opacity-50">
                  Editar perfil
                </button>
              </div>
            </div>

            <h1 className="text-[26px] font-bold text-white mb-1 tracking-tight">
              {loading ? "Cargando..." : (profileData?.displayName || "Jugador Invitado")}
            </h1>
            {profileData?.bio && <p className="text-sm text-neutral-400 mb-4">{profileData.bio}</p>}
            {profileError && <p role="alert" className="text-sm text-[#f3b5a7] mb-4">{profileError}</p>}
            {notice && <p role="status" className="text-sm text-[#ecacc9] mb-4">{notice}</p>}
            
            <div className="flex gap-8 text-[15px] font-medium mt-4">
              <button
                type="button"
                onClick={() => setModalType("followers")}
                className="flex flex-col gap-0.5 text-left group cursor-pointer focus:outline-none"
                title="Ver lista de seguidores"
              >
                <span className="text-white font-semibold group-hover:text-pink-300 transition-colors">{profileData?.followers?.length || 0}</span>
                <span className="text-neutral-400 group-hover:underline">Seguidores</span>
              </button>
              <button
                type="button"
                onClick={() => setModalType("following")}
                className="flex flex-col gap-0.5 text-left group cursor-pointer focus:outline-none"
                title="Ver lista de seguidos"
              >
                <span className="text-white font-semibold group-hover:text-pink-300 transition-colors">{profileData?.following?.length || 0}</span>
                <span className="text-neutral-400 group-hover:underline">Siguiendo</span>
              </button>
              <div className="flex flex-col gap-0.5 ml-4 border-l border-neutral-800 pl-8">
                <span className="text-pink-400 font-bold">{profileData?.tickets || 0}</span>
                <span className="text-neutral-400">Tickets Sorteo PS5</span>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="bg-[#121319] border border-neutral-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[15px] font-semibold text-white">Estadísticas de Actividad</h2>
            <span className="text-[13px] font-semibold px-2.5 py-1 rounded-md bg-[#1b1c26] text-neutral-300">Nivel {profileData?.reputation ? Math.floor(profileData.reputation / 100) + 1 : 1}</span>
          </div>
          <p className="text-[13px] text-neutral-400 mb-1">Reputación Total (RP)</p>
          <h3 className="text-[32px] font-bold text-white tracking-tight">{profileData?.reputation || 0}</h3>
        </div>

        {/* Mis Publicaciones en el Muro */}
        <div className="bg-[#121319] border border-neutral-800 rounded-2xl p-6 shadow-lg flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-neutral-800/60 pb-3">
            <h2 className="text-[15px] font-semibold text-white flex items-center gap-2">
              <span>Mis Publicaciones</span>
              <span className="text-xs bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-full font-mono">
                {userPosts.length}
              </span>
            </h2>
            <Link
              href="/comunidad#new-post"
              className="text-xs text-pink-400 hover:text-pink-300 font-semibold"
            >
              Nuevo post +
            </Link>
          </div>

          {loadingPosts ? (
            <p className="text-xs text-neutral-500 py-3">Cargando publicaciones...</p>
          ) : userPosts.length === 0 ? (
            <div className="py-6 text-center flex flex-col items-center gap-2">
              <span className="text-2xl">📝</span>
              <p className="text-sm font-semibold text-neutral-300">Aún no has publicado en el muro</p>
              <p className="text-xs text-neutral-500 max-w-sm">
                Comparte tus teorías sobre GTA VI, clips de YouTube o habla sobre el sorteo de la PS5 con la crew.
              </p>
              <Link
                href="/comunidad#new-post"
                className="mt-2 px-4 py-2 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/30 text-xs font-bold transition-colors"
              >
                Publicar en la comunidad ↗
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {userPosts.map((post) => (
                <div
                  key={post.id}
                  className="p-3.5 rounded-xl bg-[#161720] border border-neutral-800/80 flex flex-col gap-2 hover:border-neutral-700 transition-colors"
                >
                  <p className="text-xs text-neutral-200 line-clamp-2 leading-relaxed">
                    {post.content}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1 border-t border-neutral-800/50">
                    <span className="font-mono">
                      {new Date(post.createdAt).toLocaleDateString("es", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-pink-400">
                        ♥ {post.likedBy.length}
                      </span>
                      <Link
                        href={`/comunidad#post-${post.id}`}
                        className="text-pink-300 hover:underline font-semibold"
                      >
                        Ver conversación ↗
                      </Link>
                      {postToDelete === post.id ? (
                        <span className="inline-flex items-center gap-1.5 bg-red-950/40 border border-red-800/50 px-2 py-0.5 rounded text-[10px]">
                          <span className="text-red-300">¿Borrar?</span>
                          <button
                            type="button"
                            onClick={() => void handleDeletePost(post.id)}
                            disabled={isDeletingPost === post.id}
                            className="text-red-400 font-bold hover:underline"
                          >
                            {isDeletingPost === post.id ? "..." : "Sí"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setPostToDelete(null)}
                            className="text-neutral-400 hover:text-white"
                          >
                            No
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPostToDelete(post.id)}
                          className="text-neutral-500 hover:text-red-400 transition-colors inline-flex items-center gap-1"
                          title="Eliminar publicación"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3 h-3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Borrar</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Columna Derecha: Configuración y Sugerencias */}
      <div className="w-full lg:w-1/3 flex flex-col gap-6">
        <div className="bg-[#121319] border border-neutral-800 rounded-2xl flex flex-col overflow-hidden shadow-lg">
          <div className="p-4 border-b border-neutral-800/50 flex justify-between items-center">
            <h2 className="font-semibold text-[15px] text-white">Cuenta</h2>
          </div>
          <div className="p-4 flex flex-col gap-3">
            <div onClick={!user ? handleGoogleLogin : undefined} className={`flex items-center justify-between p-3 rounded-xl border ${user ? 'bg-green-900/10 border-green-900/50' : 'bg-[#16171e] border-neutral-800 cursor-pointer'}`}>
              <div className="flex items-center gap-3 w-full">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${user ? 'bg-green-500/20' : 'bg-red-500/10'}`}>
                  <span className={user ? 'text-green-500 font-bold' : 'text-red-500 text-lg'}>{user ? '✓' : 'G'}</span>
                </div>
                <div className="overflow-hidden w-full">
                  <p className="text-[12px] text-neutral-400 mb-0.5">{user ? 'Conectado como' : 'Vincular correo'}</p>
                  <p className="text-[14px] font-semibold text-white leading-none truncate">{user ? user.email : 'Google'}</p>
                </div>
              </div>
            </div>
            {user && (
              <button onClick={handleLogout} className="w-full py-2.5 rounded-xl bg-[#2a1c24] hover:bg-[#35212c] text-[#ef4444] font-semibold text-[14px] transition-colors mt-2">
                Cerrar sesión
              </button>
            )}
          </div>
        </div>

        {/* NUEVO: Usuarios Recomendados */}
        <div className="bg-[#121319] border border-neutral-800 rounded-2xl flex flex-col overflow-hidden shadow-lg">
          <div className="p-4 border-b border-neutral-800/50">
            <h2 className="font-semibold text-[15px] text-white">A quién seguir</h2>
          </div>
          <div className="p-4 flex flex-col gap-4">
            {recommended.length > 0 ? (
              recommended.map((recUser) => (
                <div key={recUser.uid} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={recUser.photoURL || PROFILE_AVATARS[0].src} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-neutral-700" />
                    <div className="flex flex-col">
                      <Link href={`/usuario/${recUser.uid}`} className="text-[14px] font-bold text-white hover:underline">
                        {recUser.displayName}
                      </Link>
                      <span className="text-[12px] text-neutral-400 truncate max-w-[120px]">{recUser.bio}</span>
                    </div>
                  </div>
                  <Link href={`/usuario/${recUser.uid}`} className="px-3 py-1.5 rounded-lg bg-[#1b1c26] hover:bg-white hover:text-black text-[12px] font-bold text-white transition-all">
                    Ver
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-[13px] text-neutral-400 text-center py-4">No hay usuarios disponibles aún.</p>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Lista de Usuarios (Seguidores / Siguiendo) */}
      <UserListModal
        isOpen={modalType !== null}
        onClose={() => setModalType(null)}
        title={modalType === "followers" ? "Seguidores" : "Siguiendo"}
        userIds={modalType === "followers" ? (profileData?.followers || []) : (profileData?.following || [])}
      />
    </main>
  );
}
