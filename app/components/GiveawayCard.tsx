import Link from "next/link";
import styles from "./Hub.module.css";

export const TICKET_PACKAGES = [
  { id: "basic", name: "Básico", tickets: 1, price: 3 },
  { id: "double", name: "Doble", tickets: 2, price: 5 },
  { id: "legend", name: "Leyenda", tickets: 5, price: 10 },
];

export function PrizeArtwork({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`${styles.prizeArt} ${compact ? styles.compactArt : ""}`}>
      {/* The existing console photograph, kept separate from the page background. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=1000&q=80" alt="Consola PlayStation 5" width={1000} height={750} />
      <span className={styles.artLabel}>GTA6HUB / SORTEO</span>
      <div className={styles.artTitle}><span>WELCOME TO</span><strong>VICE CITY.</strong><span>PS5 + GTA VI</span></div>
      <span className={styles.artNumber} aria-hidden="true">VI</span>
    </div>
  );
}

export default function GiveawayCard() {
  return (
    <section className={styles.giveawayCard} aria-label="Sorteo de la comunidad">
      <PrizeArtwork compact />
      <div className={styles.giveawayBody}>
        <p className={styles.eyebrow}>Sorteo de la comunidad</p>
        <h2>Una PS5. Tu próxima historia.</h2>
        <p>Participa por una PS5 + GTA VI. Elige tus tickets antes del cierre del sorteo.</p>
        <div className={styles.cardPrice}><span>Desde <strong>$3 USD</strong></span><span>1 / 2 / 5 tickets</span></div>
        <Link href="/sorteos#tickets" className={styles.primaryButton}>Elegir mis tickets <span aria-hidden="true">↗</span></Link>
      </div>
    </section>
  );
}
