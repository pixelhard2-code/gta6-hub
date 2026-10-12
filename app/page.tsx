import Link from "next/link";
import Image from "next/image";
import ReleaseCountdown from "@/app/components/ReleaseCountdown";
import HomeCommunity from "@/app/components/HomeCommunity";
import { PrizeArtwork, TICKET_PACKAGES } from "@/app/components/GiveawayCard";
import hub from "@/app/components/Hub.module.css";
import styles from "@/app/components/Home.module.css";

const ARTWORK = "/vice-city-hero.png";

export default function Home() {
  return (
    <div className={`${hub.page} ${styles.home}`}>
      <section className={styles.hero} aria-labelledby="home-title">
        <div className={styles.heroVisual} aria-hidden="true">
          <Image src={ARTWORK} alt="" fill sizes="100vw" loading="eager" fetchPriority="high" priority />
        </div>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>LeonidaCrew / Comunidad oficial de fans</p>
          <h1 id="home-title">La espera<br />también<br /><em>se juega</em></h1>
          <p className={styles.heroDescription}>
            Noticias, teorías, filtraciones y una crew hispanohablante que vive Grand Theft Auto VI todos los días.
          </p>
          <ReleaseCountdown />
          <div className={styles.heroActions}>
            <Link href="/sorteos#tickets" className={hub.primaryButton}>
              <span>Ver stickers digitales</span>
              <span aria-hidden="true">↗</span>
            </Link>
            <Link href="/comunidad" className={styles.secondaryButton}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v5m0 3v1" />
              </svg>
              <span>Conocer la crew</span>
            </Link>
          </div>
        </div>
        <div className={styles.sceneCaption} aria-hidden="true">
          <span>VICE CITY</span>
          <span>19 NOV 2026</span>
        </div>
      </section>

      <div className={hub.shell}>
        <div className={styles.worldStrip} aria-hidden="true">
          <span>VICE CITY</span>
          <span>LEONIDA</span>
          <strong>GTA VI</strong>
          <span>LA CREW</span>
          <span>LeonidaCrew</span>
        </div>

        {/* Sección de Sorteo */}
        <section className={styles.giveawaySection} aria-labelledby="home-giveaway-title">
          <div className={styles.sectionHead}>
            <div>
              <p className={hub.eyebrow}>El sorteo de LeonidaCrew</p>
              <h2 id="home-giveaway-title">Tu próxima partida<br />Tu próxima consola</h2>
            </div>
            <Link href="/sorteos" className={styles.textLink}>Ver detalles del sorteo ↗</Link>
          </div>
          <div className={styles.giveawayFeature}>
            <div className={styles.giveawayArtwork}>
              <PrizeArtwork />
              <span className={styles.prizeStamp}>EL PREMIO / PS5 + GTA VI</span>
            </div>
            <div className={styles.giveawayCopy}>
              <p className={styles.smallLabel}>Sorteo para la comunidad</p>
              <h3>Una PS5 + GTA VI<br /><em>Podría ser tuya</em></h3>
              <p>
                Compra stickers digitales de LeonidaCrew y recíbelos por correo. Cada sticker incluye 1 ticket para participar en el sorteo promocional de una PlayStation 5 + GTA VI.
              </p>
              <div className={styles.homePackages}>
                {TICKET_PACKAGES.map((item) => (
                  <Link key={item.id} href={`/sorteos?paquete=${item.id}#tickets`}>
                    <span>{item.tickets} {item.tickets === 1 ? "sticker" : "stickers"}</span>
                    <strong>${item.price} <small>USD</small></strong>
                    <span>{item.highlight ? "Mejor valor ↗" : "Elegir ↗"}</span>
                  </Link>
                ))}
              </div>
              <Link href="/sorteos#tickets" className={hub.primaryButton}>
                <span>Elegir mis stickers</span>
                <span aria-hidden="true">→</span>
              </Link>
              <p className={styles.giveawayNote}>
                ⚡ 1 sticker = 1 ticket. Venta y entrega por correo próximamente.
              </p>
            </div>
          </div>
        </section>

        {/* Sección Muro Comunitario */}
        <section className={styles.communitySection} aria-labelledby="home-community-title">
          <div className={styles.sectionHead}>
            <div>
              <p className={hub.eyebrow}>En el muro, ahora</p>
              <h2 id="home-community-title">La ciudad ya tiene crew</h2>
              <p className={styles.sectionDescription}>Publicaciones y teorías recientes de los miembros activos.</p>
            </div>
            <Link href="/comunidad" className={styles.textLink}>Entrar a la comunidad ↗</Link>
          </div>
          <HomeCommunity />
        </section>

        {/* Llamado final a la acción */}
        <section className={styles.finalCta} aria-labelledby="last-call-title">
          <div>
            <p className={hub.eyebrow}>Nos vemos en Vice City</p>
            <h2 id="last-call-title">Haz que la espera cuente</h2>
            <p>La comunidad pone la conversación. Tú eliges tu próximo paso.</p>
          </div>
          <div>
            <Link href="/sorteos#tickets" className={hub.primaryButton}>
              <span>Ver stickers digitales</span>
              <span aria-hidden="true">↗</span>
            </Link>
            <Link href="/comunidad#new-post" className={styles.secondaryButton}>
              Entrar al muro
            </Link>
          </div>
        </section>

        <footer className={hub.footer}>
          <span>LeonidaCrew · Comunidad de fans. No afiliada a Rockstar Games ni Take-Two Interactive.</span>
          <a href="https://www.rockstargames.com/VI" target="_blank" rel="noopener noreferrer">
            Fecha y arte oficial: Rockstar Games ↗
          </a>
        </footer>
      </div>
    </div>
  );
}
