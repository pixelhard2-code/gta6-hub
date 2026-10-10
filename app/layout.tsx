"use client";

import "./globals.css";
import Link from "next/link";
import { useState, useEffect } from "react";
import { auth, db } from "@/app/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import AuthModal from "@/app/components/AuthModal";
import DesktopHeader from "@/app/components/DesktopHeader";
import desktopStyles from "@/app/components/DesktopLayout.module.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [user, setUser] = useState<User | null>(null);
  const [customName, setCustomName] = useState<string>("");
  const [customPhoto, setCustomPhoto] = useState<string>("");
  
  // Estados para menús y modales
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          // Buscamos en la colección "usuarios". 
          // (Si tu colección en Firebase se llama "users", cambia la palabra aquí abajo)
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            
            // CHISMOSO 1: Te dirá en la consola (F12) qué datos encontró en Firebase
            console.log("¡Datos encontrados en Firebase! Revisa cómo se llama tu campo de nombre:", data);
            
            // Busca tu nombre ("PixelHard") en cualquiera de los nombres de campo más comunes
            const nombreGuardado = data.username || data.nombreUsuario || data.usuario || data.displayName || data.name || "";
            setCustomName(nombreGuardado);
            
            // Busca tu foto de perfil personalizada
            setCustomPhoto(data.photoURL || data.avatar || data.foto || "");
          } else {
            // CHISMOSO 2: Te dirá si el documento no existe en esa colección
            console.log("No se encontró ningún documento en la colección 'usuarios' para el UID:", currentUser.uid);
            setCustomName("");
            setCustomPhoto("");
          }
        } catch (error) {
          console.error("Error obteniendo los datos del usuario:", error);
        }
      } else {
          setCustomName("");
          setCustomPhoto("");
      }
    });
    return () => unsubscribe();
  }, []);

  // Lógica para decidir qué nombre mostrar (Prioriza tu nombre de Firebase, si no, usa el de Google)
  const displayNameToShow = customName || (user ? user.displayName : "") || "Mi Perfil";
  const displayPhotoToShow = customPhoto || (user ? user.photoURL : "");

  return (
    <html lang="es">
      <body className="antialiased bg-[#0d0d12] text-white min-h-screen pb-20 md:pb-0 relative">
        
        {/* === HEADER MÓVIL === */}
        <header className="md:hidden w-full flex justify-between items-center p-4 bg-[#0d0d12] border-b border-gray-900 sticky top-0 z-40">
          <Link href="/" className="font-extrabold text-xl tracking-wider text-white flex items-center gap-1">
            GTA<span className="text-pink-500">6</span>HUB
          </Link>
          
          <div>
            {user ? (
               <Link href="/perfil" className="block w-9 h-9 rounded-full overflow-hidden border-2 border-pink-500/50 hover:border-pink-500 transition-colors">
                 {displayPhotoToShow ? (
                   <img src={displayPhotoToShow} alt="Perfil" className="w-full h-full object-cover" />
                 ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-400">
                        {displayNameToShow ? displayNameToShow.charAt(0).toUpperCase() : "U"}
                    </div>
                 )}
               </Link>
            ) : (
               <button 
                 onClick={() => setIsAuthModalOpen(true)}
                 className="bg-[#f3b5a7] hover:bg-[#f8cbc2] text-[#241820] text-xs font-bold py-1.5 px-4 rounded-md transition-colors"
               >
                 Iniciar Sesión
               </button>
            )}
          </div>
        </header>

        {/* === NAVBAR ESCRITORIO === */}
        <DesktopHeader
          signedIn={Boolean(user)}
          displayName={displayNameToShow}
          photo={displayPhotoToShow || null}
          onSignIn={() => setIsAuthModalOpen(true)}
        />

        {/* === CONTENIDO PRINCIPAL === */}
        <main id="site-content" className={desktopStyles.desktopContent} tabIndex={-1}>
          {children}
        </main>

        {/* === BARRA DE NAVEGACIÓN INFERIOR (Móvil) === */}
        <div className="md:hidden fixed bottom-0 left-0 w-full bg-[#111116] border-t border-gray-900 z-50 flex justify-between items-center px-6 h-16">
          <Link href="/" aria-label="Inicio" className="text-gray-400 hover:text-[#ecacc9] transition-colors" onClick={() => setIsMenuOpen(false)}>
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          </Link>

          <Link href="/comunidad" aria-label="Comunidad" className="text-gray-400 hover:text-[#ecacc9] transition-colors" onClick={() => setIsMenuOpen(false)}>
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"/></svg>
          </Link>

          <Link href="/comunidad#new-post" aria-label="Publicar en la comunidad" className="text-gray-400 hover:text-white transition-colors" onClick={() => setIsMenuOpen(false)}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8m-4-4h8"/></svg>
          </Link>

          <Link href="/sorteos" aria-label="Sorteos" className="text-gray-400 hover:text-[#ecacc9] transition-colors" onClick={() => setIsMenuOpen(false)}>
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
          </Link>

          <div className="relative">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`transition-colors ${isMenuOpen ? 'text-white' : 'text-gray-400'}`}
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01"/></svg>
            </button>

            {isMenuOpen && (
              <div className="absolute bottom-14 right-0 w-56 bg-[#111111]/95 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-2xl overflow-hidden py-2 z-50">
                <Link href="/perfil" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"/></svg>
                  <span className="font-medium text-sm">Mi perfil</span>
                </Link>
                <div className="h-[1px] w-full bg-gray-800/50 my-1"></div>
                <Link href="/soporte" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83"/></svg>
                  <span className="font-medium text-sm">Soporte</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {isMenuOpen && <div className="md:hidden fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)}></div>}

        {/* === MODAL DE INICIO DE SESIÓN FLOTANTE === */}
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      </body>
    </html>
  );
}