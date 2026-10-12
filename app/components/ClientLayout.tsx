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
                  <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-sm font-bold text-neutral-300">
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

      {/* === BARRA DE NAVEGACIÓN INFERIOR (Móvil con etiquetas) === */}
      <div role="navigation" aria-label="Navegación móvil" className={`${desktopStyles.mobileNavigation} md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-1`}>
        <Link
          href="/"
          aria-current={pathname === "/" ? "page" : undefined}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 transition-colors ${
            pathname === "/" ? "text-[#ffa99f] font-bold" : "text-neutral-400 hover:text-white font-medium"
          }`}
          onClick={() => setIsMenuOpen(false)}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          <span className="text-[10px] tracking-tight">Inicio</span>
        </Link>

        <Link
          href="/novedades"
          aria-current={pathname === "/novedades" ? "page" : undefined}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 transition-colors ${
            pathname === "/novedades" ? "text-[#ffa99f] font-bold" : "text-neutral-400 hover:text-white font-medium"
          }`}
          onClick={() => setIsMenuOpen(false)}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg>
          <span className="text-[10px] tracking-tight">Novedades</span>
        </Link>

        <Link
          href="/comunidad"
          aria-current={pathname === "/comunidad" ? "page" : undefined}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 transition-colors ${
            pathname === "/comunidad" ? "text-[#ffa99f] font-bold" : "text-neutral-400 hover:text-white font-medium"
          }`}
          onClick={() => setIsMenuOpen(false)}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
          <span className="text-[10px] tracking-tight">Comunidad</span>
        </Link>

        <Link
          href="/sorteos"
          aria-current={pathname === "/sorteos" ? "page" : undefined}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 transition-colors relative ${
            pathname === "/sorteos" ? "text-[#ffa99f] font-bold" : "text-neutral-400 hover:text-white font-medium"
          }`}
          onClick={() => setIsMenuOpen(false)}
        >
          <div className="relative">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
            <span className="absolute -top-1 -right-2 text-[8px] font-bold bg-pink-500 text-white rounded-full px-1 py-0.2 leading-none">PS5</span>
          </div>
          <span className="text-[10px] tracking-tight">Sorteos</span>
        </Link>

        <div className="relative">
          <button 
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 transition-colors ${
              isMenuOpen ? "text-white font-bold" : "text-neutral-400 hover:text-white font-medium"
            }`}
            aria-label="Más opciones" aria-expanded={isMenuOpen} aria-controls="mobile-more-menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01"/></svg>
            <span className="text-[10px] tracking-tight">Más</span>
          </button>

          {isMenuOpen && (
            <div id="mobile-more-menu" className="absolute bottom-16 right-0 w-60 bg-[#141520]/95 backdrop-blur-2xl border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden py-2 z-50">
              <Link href="/perfil" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-neutral-200 hover:bg-white/10 hover:text-white transition-colors">
                <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"/></svg>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">Mi Perfil</span>
                  <span className="text-[11px] text-neutral-400">Ver estadísticas y avatar</span>
                </div>
              </Link>
              <Link href="/comunidad#new-post" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-neutral-200 hover:bg-white/10 hover:text-white transition-colors">
                <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8m-4-4h8"/></svg>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">Crear Publicación</span>
                  <span className="text-[11px] text-neutral-400">Comparte tu teoría o clip</span>
                </div>
              </Link>
              <div className="h-[1px] w-full bg-neutral-800/80 my-1"></div>
              <Link href="/soporte" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-neutral-200 hover:bg-white/10 hover:text-white transition-colors">
                <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83"/></svg>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">Soporte y Ayuda</span>
                  <span className="text-[11px] text-neutral-400">Tickets y estado del sistema</span>
                </div>
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
