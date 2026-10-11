"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { auth, googleProvider, db } from "@/app/lib/firebase";
import { signInWithPopup, signOut } from "firebase/auth";
import { collection, getDocs, query, limit } from "firebase/firestore";
import { readUserProfile, type UserProfile } from "@/app/lib/profiles";
import { useCurrentUserProfile } from "@/app/lib/useCurrentUserProfile";
import { ProfileActionError, saveUserProfile } from "@/app/lib/profile-actions";
import { PROFILE_AVATARS } from "@/app/lib/avatars";
import ProfileAvatarPicker from "@/app/components/ProfileAvatarPicker";

export default function PerfilPage() {
  const { user, profile: profileData, loading, error: profileError } = useCurrentUserProfile();
  const [recommended, setRecommended] = useState<UserProfile[]>([]);
  
  // Modales
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
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
              <div className="flex flex-col gap-0.5">
                <span className="text-white font-semibold">{profileData?.followers?.length || 0}</span>
                <span className="text-[#6c7083]">Seguidores</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-white font-semibold">{profileData?.following?.length || 0}</span>
                <span className="text-[#6c7083]">Siguiendo</span>
              </div>
              <div className="flex flex-col gap-0.5 ml-4 border-l border-neutral-800 pl-8">
                <span className="text-pink-400 font-bold">{profileData?.tickets || 0}</span>
                <span className="text-[#6c7083]">Tickets de Rifa</span>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="bg-[#121319] border border-neutral-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[15px] font-semibold text-white">Estadísticas de Actividad</h2>
            <span className="text-[13px] font-semibold px-2.5 py-1 rounded-md bg-[#1b1c26] text-[#6c7083]">Nivel {profileData?.reputation ? Math.floor(profileData.reputation / 100) + 1 : 1}</span>
          </div>
          <p className="text-[13px] text-[#6c7083] mb-1">Reputación Total (RP)</p>
          <h3 className="text-[32px] font-bold text-white tracking-tight">{profileData?.reputation || 0}</h3>
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
                  <p className="text-[12px] text-[#6c7083] mb-0.5">{user ? 'Conectado como' : 'Vincular correo'}</p>
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
                    <img src={recUser.photoURL || PROFILE_AVATARS[0].src} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-neutral-700" />
                    <div className="flex flex-col">
                      <Link href={`/usuario/${recUser.uid}`} className="text-[14px] font-bold text-white hover:underline">
                        {recUser.displayName}
                      </Link>
                      <span className="text-[12px] text-[#6c7083] truncate max-w-[120px]">{recUser.bio}</span>
                    </div>
                  </div>
                  <Link href={`/usuario/${recUser.uid}`} className="px-3 py-1.5 rounded-lg bg-[#1b1c26] hover:bg-white hover:text-black text-[12px] font-bold text-white transition-all">
                    Ver
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-[13px] text-[#6c7083] text-center py-4">No hay usuarios disponibles aún.</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
