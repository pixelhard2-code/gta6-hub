"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { auth, db } from "@/app/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";

interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  bio: string;
  reputation: number;
  followers: string[];
  following: string[];
}

export default function PerfilPublico() {
  const params = useParams();
  const profileId = params.id as string; // El ID del usuario que estamos visitando

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  
  const [publicProfile, setPublicProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // 1. Saber quién soy yo (el que navega)
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const myRef = doc(db, "users", user.uid);
        const mySnap = await getDoc(myRef);
        if (mySnap.exists()) {
          setCurrentUserProfile(mySnap.data() as UserProfile);
        }
      }
    });

    // 2. Cargar los datos del perfil que estamos visitando
    const fetchPublicProfile = async () => {
      const docRef = doc(db, "users", profileId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        setPublicProfile({
          ...data,
          followers: data.followers || [],
          following: data.following || [],
        });
      }
      setLoading(false);
    };

    fetchPublicProfile();
    return () => unsubscribe();
  }, [profileId]);

  // 3. Revisar si ya lo sigo
  useEffect(() => {
    if (currentUserProfile && publicProfile) {
      setIsFollowing(currentUserProfile.following.includes(publicProfile.uid));
    }
  }, [currentUserProfile, publicProfile]);

  // Función anti-bots para seguir
  const handleFollow = async () => {
    if (!currentUser) {
      alert("Debes iniciar sesión para seguir a usuarios.");
      return;
    }
    if (!currentUserProfile || !currentUserProfile.bio) {
      alert("ANTI-BOT: Debes completar tu biografía en tu perfil antes de poder seguir a otros.");
      return;
    }
    if (currentUser.uid === publicProfile?.uid) {
      alert("No puedes seguirte a ti mismo.");
      return;
    }

    setIsProcessing(true);
    const myRef = doc(db, "users", currentUser.uid);
    const targetRef = doc(db, "users", profileId);

    try {
      if (isFollowing) {
        // Dejar de seguir
        await updateDoc(myRef, { following: arrayRemove(profileId) });
        await updateDoc(targetRef, { followers: arrayRemove(currentUser.uid) });
        
        setIsFollowing(false);
        setPublicProfile(prev => prev ? { ...prev, followers: prev.followers.filter(id => id !== currentUser.uid) } : null);
      } else {
        // Seguir
        await updateDoc(myRef, { following: arrayUnion(profileId) });
        await updateDoc(targetRef, { followers: arrayUnion(currentUser.uid) });
        
        setIsFollowing(true);
        setPublicProfile(prev => prev ? { ...prev, followers: [...prev.followers, currentUser.uid] } : null);
      }
    } catch (error) {
      console.error("Error al seguir:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="text-white text-center mt-20">Buscando usuario...</div>;
  if (!publicProfile) return <div className="text-white text-center mt-20">Usuario no encontrado.</div>;

  return (
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
              <button 
                onClick={handleFollow}
                disabled={isProcessing}
                className={`px-6 py-2 rounded-xl text-[15px] font-bold transition-all h-10 ${
                  isFollowing 
                  ? "bg-transparent border border-neutral-600 text-white hover:border-red-500 hover:text-red-500" 
                  : "bg-white text-black hover:bg-neutral-200"
                }`}
              >
                {isProcessing ? "..." : isFollowing ? "Siguiendo" : "Seguir"}
              </button>
            </div>
          </div>

          <h1 className="text-[26px] font-bold text-white mb-1 tracking-tight">
            {publicProfile.displayName}
          </h1>
          <p className="text-sm text-neutral-400 mb-4">{publicProfile.bio}</p>
          
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
  );
}