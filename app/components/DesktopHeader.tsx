"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import styles from "./DesktopLayout.module.css";

interface DesktopHeaderProps {
  signedIn: boolean;
  displayName: string;
  photo: string | null;
  onSignIn: () => void;
}

const LINKS = [
  { href: "/", label: "Inicio", icon: "home" },
  { href: "/novedades", label: "Novedades", icon: "news" },
  { href: "/sorteos", label: "Sorteos", icon: "ticket" },
  { href: "/comunidad", label: "Comunidad", icon: "community" },
] as const;

function NavIcon({ type }: { type: (typeof LINKS)[number]["icon"] }) {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {type === "home" ? <><path d="m3 10 9-7 9 7" /><path d="M5 9v12h14V9M9 21v-7h6v7" /></> : type === "news" ? <><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" /><path d="M18 14h-8" /><path d="M15 18h-5" /><path d="M10 6h8v4h-8V6Z" /></> : type === "ticket" ? <><path d="M4 5h16v5a2 2 0 0 0 0 4v5H4v-5a2 2 0 0 0 0-4Z" /><path d="M15 5v3m0 3v2m0 3v3" /></> : <><path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5Z" /><path d="M8 11h8m-8 4h5" /></>}
  </svg>;
}

export default function DesktopHeader({ signedIn, displayName, photo, onSignIn }: DesktopHeaderProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 24);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return <header className={`${styles.desktopHeader} ${pathname === "/" ? styles.homeHeader : ""} ${scrolled ? styles.scrolledHeader : ""}`}>
    <a className={styles.skipLink} href="#site-content">Saltar al contenido</a>
    <div className={styles.headerInner}>
      <Link href="/" className={styles.brand} aria-label="GTA6HUB — Inicio">
        <strong>GTA<span>6</span>HUB</strong>
        <span className={styles.brandCaption}>La comunidad de GTA VI</span>
      </Link>
      <nav className={styles.navigation} aria-label="Navegación principal">
        {LINKS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return <Link key={item.href} href={item.href} className={`${styles.navItem} ${active ? styles.activeItem : ""}`} aria-current={active ? "page" : undefined}>
            <NavIcon type={item.icon} /><span>{item.label}</span>
          </Link>;
        })}
      </nav>
      <div className={styles.actions}>
        <Link href="/sorteos#tickets" className={styles.ticketButton}>Ver tickets <span aria-hidden="true">↗</span></Link>
        <span className={styles.separator} aria-hidden="true" />
        {signedIn ? <Link href="/perfil" className={styles.profile} aria-label={`Mi perfil: ${displayName}`}>
          <span className={styles.avatar}>{photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" width={34} height={34} loading="lazy" />
          ) : displayName.charAt(0).toUpperCase()}</span>
          <span className={styles.profileCopy}><span>Mi perfil</span><strong>{displayName}</strong></span>
        </Link> : <button type="button" onClick={onSignIn} className={styles.signInButton}>Iniciar sesión</button>}
      </div>
    </div>
  </header>;
}
