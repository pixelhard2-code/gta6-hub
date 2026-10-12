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
    name: "Entrada Básica",
    tickets: 1,
    price: 3,
    unitPrice: "$3.00 c/u",
  },
  {
    id: "double",
    name: "Pack Doble Chance",
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
        alt="Consola PlayStation 5 edición especial GTA VI"
        width={1000}
        height={750}
        loading="lazy"
      />
      <span className={styles.artLabel}>LeonidaCrew / SORTEO OFICIAL</span>
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
    <section className={styles.giveawayCard} aria-label="Sorteo oficial de la comunidad">
      <PrizeArtwork compact />
      <div className={styles.giveawayBody}>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></span>
          <p className={styles.eyebrow} style={{ margin: 0 }}>Sorteo de la Crew</p>
        </div>
        <h2>Una PS5 + GTA VI. Tu próxima partida.</h2>
        <p>Participa por una PlayStation 5 junto al lanzamiento más esperado de la historia.</p>
        
        <div className={styles.cardPrice}>
          <span>Desde <strong>$3 USD</strong></span>
          <span>1 / 2 / 5 tickets disponibles</span>
        </div>
        
        <Link href="/sorteos#tickets" className={styles.primaryButton}>
          <span>Elegir mis tickets</span>
          <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </section>
  );
}
