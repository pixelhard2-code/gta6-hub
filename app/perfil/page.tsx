"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { auth, googleProvider, db } from "@/app/lib/firebase";
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc, collection, getDocs, query, limit, where } from "firebase/firestore";

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  bio: string;
  reputation: number;
  tickets: number;
  followers: string[]; // <-- Nuevo: Lista de IDs que te siguen
  following: string[]; // <-- Nuevo: Lista de IDs que sigues
}

export default function PerfilPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [recommended, setRecommended] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modales
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const [newUsername, setNewUsername] = useState("");
  const [newBio, setNewBio] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data() as UserProfile;
          setProfileData(data);
          setNewUsername(data.displayName);
          setNewBio(data.bio || "");
        } else {
          setNewUsername(currentUser.displayName || "Usuario_" + Math.floor(Math.random() * 1000));
          setShowSetupModal(true);
        }
      } else {
        setProfileData(null);
      }
      setLoading(false);
      fetchRecommended(currentUser?.uid);
    });

    return () => unsubscribe();
  }, []);

  // Función para obtener usuarios recomendados (Anti-bot: solo usuarios con bio)
  const fetchRecommended = async (currentUid?: string) => {
    try {
      const q = query(collection(db, "users"), limit(5));
      const querySnapshot = await getDocs(q);
      const users: UserProfile[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as UserProfile;
        // No mostrarse a uno mismo y solo mostrar usuarios que ya completaron su bio
        if (data.uid !== currentUid && data.bio && data.bio.length > 0) {
          users.push(data);
        }
      });
      setRecommended(users);
    } catch (error) {
      console.error("Error buscando recomendados:", error);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error en login:", error);
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
    if (!user) return;
    if (newUsername.trim().length < 3) {
      alert("El nombre debe tener al menos 3 caracteres.");
      return;
    }

    setIsSaving(true);
    try {
      const userRef = doc(db, "users", user.uid);
      const updatedProfile: UserProfile = {
        uid: user.uid,
        email: user.email || "",
        displayName: newUsername.trim(),
        photoURL: user.photoURL || "",
        bio: newBio.trim(),
        reputation: profileData?.reputation || 10, // Damos 10 RP por completar el perfil
        tickets: profileData?.tickets || 0,
        followers: profileData?.followers || [],
        following: profileData?.following || [],
      };

      await setDoc(userRef, updatedProfile, { merge: true });
      setProfileData(updatedProfile);
      setShowSetupModal(false);
      setShowEditModal(false);
      window.location.reload();
    } catch (error) {
      console.error("Error guardando perfil:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="w-full max-w-6xl mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-6 relative z-10 font-sans">
      
      {/* Modales de Edición (Ocultos por defecto) */}
      {(showSetupModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#121319] border border-neutral-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">
              {showSetupModal ? "Actualiza tu perfil (Requerido)" : "Editar perfil"}
            </h2>
            <div className="mb-4">
              <label className="text-xs text-neutral-400 mb-1 block">Nombre de usuario</label>
              <input type="text" maxLength={15} value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="w-full bg-[#1a1b26] border border-neutral-700 rounded-lg p-3 text-white focus:outline-none focus:border-pink-500" />
            </div>
            <div className="mb-6">
              <label className="text-xs text-neutral-400 mb-1 block">Biografía (Obligatoria para seguir a otros)</label>
              <textarea rows={3} value={newBio} onChange={(e) => setNewBio(e.target.value)} className="w-full bg-[#1a1b26] border border-neutral-700 rounded-lg p-3 text-white focus:outline-none focus:border-pink-500 resize-none" />
            </div>
            <div className="flex justify-end gap-3">
              {showSetupModal && <button onClick={() => { handleLogout(); setShowSetupModal(false); }} className="px-4 py-2 rounded-lg bg-[#1a1b26] text-white">Cancelar</button>}
              {showEditModal && <button onClick={() => setShowEditModal(false)} className="px-4 py-2 rounded-lg bg-[#1a1b26] text-white">Cancelar</button>}
              <button onClick={saveProfile} disabled={isSaving} className="px-6 py-2 rounded-lg bg-[#448b59] hover:bg-[#367047] text-white font-bold disabled:opacity-50">
                {isSaving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
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
                <button onClick={() => setShowEditModal(true)} className="px-4 py-2 rounded-xl bg-[#1b1c26] hover:bg-[#252633] text-[15px] font-semibold text-white transition-colors h-10">
                  Editar perfil
                </button>
              </div>
            </div>

            <h1 className="text-[26px] font-bold text-white mb-1 tracking-tight">
              {loading ? "Cargando..." : (profileData?.displayName || "Jugador Invitado")}
            </h1>
            {profileData?.bio && <p className="text-sm text-neutral-400 mb-4">{profileData.bio}</p>}
            
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
                    <img src={recUser.photoURL || "https://via.placeholder.com/40"} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-neutral-700" />
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