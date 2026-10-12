import Link from "next/link";
import styles from "./Hub.module.css";

export interface TicketPackage {
  id: string;
  name: string;
  tickets: number;
  price: number;
  unitPrice: string;
  badge?: string;
  highlight?: boolean;
}

export const TICKET_PACKAGES: TicketPackage[] = [
  {
    id: "basic",
    name: "Pack Básico",
    tickets: 1,
    price: 3,
    unitPrice: "$3.00 c/u",
  },
  {
    id: "double",
    name: "Pack Doble",
    tickets: 2,
    price: 5,
    unitPrice: "$2.50 c/u",
    badge: "Popular · Ahorras $1",
  },
  {
    id: "legend",
    name: "Pack Leyenda Vice City",
    tickets: 5,
    price: 10,
    unitPrice: "$2.00 c/u",
    badge: "Mejor Valor · 33% Ahorro",
    highlight: true,
  },
];

export function PrizeArtwork({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`${styles.prizeArt} ${compact ? styles.compactArt : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=1000&q=80"
        alt="Consola PlayStation 5, premio del sorteo promocional"
        width={1000}
        height={750}
        loading="lazy"
      />
      <span className={styles.artLabel}>LeonidaCrew / SORTEO PROMOCIONAL</span>
      <div className={styles.artTitle}>
        <span>WELCOME TO</span>
        <strong>VICE CITY.</strong>
        <span>PS5 + GTA VI BUNDLE</span>
      </div>
      <span className={styles.artNumber} aria-hidden="true">VI</span>
    </div>
  );
}

export default function GiveawayCard() {
  return (
    <section className={styles.giveawayCard} aria-label="Sorteo promocional de la comunidad">
      <PrizeArtwork compact />
      <div className={styles.giveawayBody}>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></span>
          <p className={styles.eyebrow} style={{ margin: 0 }}>Sorteo promocional de la Crew</p>
        </div>
        <h2>Una PS5 + GTA VI. Tu próxima partida.</h2>
        <p>Compra stickers digitales y recíbelos por correo. Cada sticker incluye 1 ticket para el sorteo de una PS5 + GTA VI.</p>
        
        <div className={styles.cardPrice}>
          <span>Desde <strong>$3 USD</strong></span>
          <span>Packs de 1 / 2 / 5 stickers</span>
        </div>
        
        <Link href="/sorteos#tickets" className={styles.primaryButton}>
          <span>Elegir mis stickers</span>
          <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </section>
  );
}
