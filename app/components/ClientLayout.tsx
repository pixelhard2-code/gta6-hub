"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useCurrentUserProfile } from "@/app/lib/useCurrentUserProfile";
import AuthModal from "@/app/components/AuthModal";
import DesktopHeader from "@/app/components/DesktopHeader";
import desktopStyles from "@/app/components/DesktopLayout.module.css";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = useCurrentUserProfile();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 24);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  
  // Estados para menús y modales
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Lógica para decidir qué nombre mostrar (Prioriza tu nombre de Firebase, si no, usa el de Google)
  const displayNameToShow = profile?.displayName || user?.displayName || "Mi Perfil";
  const displayPhotoToShow = profile?.photoURL || user?.photoURL || "";

  return (
    <>
      {/* === HEADER MÓVIL === */}
      <header className={`${desktopStyles.mobileHeader} ${pathname === "/" ? desktopStyles.mobileHomeHeader : ""} ${scrolled ? desktopStyles.scrolledHeader : ""}`}>
        <Link href="/" className={desktopStyles.mobileBrand}>
          GTA<span>6</span>HUB
        </Link>
        
        <div>
          {user ? (
             <Link href="/perfil" className="block w-9 h-9 rounded-full overflow-hidden border-2 border-pink-500/50 hover:border-pink-500 transition-colors">
               {displayPhotoToShow ? (
                 // eslint-disable-next-line @next/next/no-img-element
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
               className={desktopStyles.mobileSignIn}
             >
               Iniciar sesión
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
      <div role="navigation" aria-label="Navegación móvil" className={`${desktopStyles.mobileNavigation} md:hidden fixed bottom-0 left-0 w-full bg-[#111116] border-t border-gray-900 z-50 flex justify-between items-center px-4 h-16`}>
        <Link href="/" aria-current={pathname === "/" ? "page" : undefined} aria-label="Inicio" className="text-gray-400 hover:text-[#ecacc9] transition-colors" onClick={() => setIsMenuOpen(false)}>
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
        </Link>

        <Link href="/novedades" aria-current={pathname === "/novedades" ? "page" : undefined} aria-label="Novedades y Tráilers" className="text-gray-400 hover:text-[#ecacc9] transition-colors" onClick={() => setIsMenuOpen(false)}>
          <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg>
        </Link>

        <Link href="/comunidad#new-post" aria-current={pathname === "/comunidad" ? "page" : undefined} aria-label="Publicar en la comunidad" className="text-gray-400 hover:text-white transition-colors" onClick={() => setIsMenuOpen(false)}>
          <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8m-4-4h8"/></svg>
        </Link>

        <Link href="/sorteos" aria-current={pathname === "/sorteos" ? "page" : undefined} aria-label="Sorteos" className="text-gray-400 hover:text-[#ecacc9] transition-colors" onClick={() => setIsMenuOpen(false)}>
          <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
        </Link>

        <div className="relative">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`transition-colors ${isMenuOpen ? 'text-white' : 'text-gray-400'}`}
            aria-label="Más opciones" aria-expanded={isMenuOpen} aria-controls="mobile-more-menu"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01"/></svg>
          </button>

          {isMenuOpen && (
            <div id="mobile-more-menu" className="absolute bottom-14 right-0 w-56 bg-[#111111]/95 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-2xl overflow-hidden py-2 z-50">
              <Link href="/perfil" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"/></svg>
                <span className="font-medium text-sm">Mi perfil</span>
              </Link>
              <Link href="/comunidad" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                <span className="font-medium text-sm">Comunidad</span>
              </Link>
              <div className="h-[1px] w-full bg-gray-800/50 my-1"></div>
              <Link href="/soporte" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83"/></svg>
                <span className="font-medium text-sm">Soporte y Ayuda</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {isMenuOpen && <div className="md:hidden fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)}></div>}

      {/* === MODAL DE INICIO DE SESIÓN FLOTANTE === */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}
