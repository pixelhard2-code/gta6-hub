import Link from "next/link";
import Image from "next/image";
import ReleaseCountdown from "@/app/components/ReleaseCountdown";
import HomeCommunity from "@/app/components/HomeCommunity";
import { PrizeArtwork, TICKET_PACKAGES } from "@/app/components/GiveawayCard";
import hub from "@/app/components/Hub.module.css";
import styles from "@/app/components/Home.module.css";

const ARTWORK = "/gta6-cover.jpg";

export default function Home() {
  return <div className={`${hub.page} ${styles.home}`}>
    <div className={hub.shell}>
      <section className={styles.hero} aria-labelledby="home-title">
        <div className={styles.heroCopy}>
          <p className={styles.kicker}><span aria-hidden="true" />GTA6HUB / Tu punto de encuentro</p>
          <h1 id="home-title">La espera<br />también se<br /><em>juega.</em></h1>
          <p className={styles.heroDescription}>GTA VI está cada vez más cerca. Únete a la crew, comparte tus teorías y participa por la consola de tu próxima partida.</p>
          <ReleaseCountdown />
          <div className={styles.heroActions}><Link href="/sorteos#tickets" className={hub.primaryButton}>Elegir mis tickets <span aria-hidden="true">↗</span></Link><Link href="/comunidad" className={styles.secondaryButton}>Conocer la crew</Link></div>
        </div>
        <div className={styles.heroVisual}>
          {/* Official artwork from Rockstar's public media gallery. */}
          <Image src={ARTWORK} alt="Arte de Grand Theft Auto VI con Jason, Lucia y escenas de Vice City" fill sizes="(max-width: 700px) 100vw, 60vw" loading="eager" fetchPriority="high" />
          <div className={styles.artFooter}><span>GRAND THEFT AUTO VI</span><span>ROCKSTAR GAMES ↗</span></div>
          <div className={styles.releaseBadge}><span>Fecha anunciada</span><strong>19 NOV <em>2026</em></strong><span>PS5 · XBOX SERIES X|S</span></div>
        </div>
      </section>
      <div className={styles.worldStrip} aria-hidden="true"><span>VICE CITY</span><span>LEONIDA</span><strong>GTA VI</strong><span>LA CREW</span><span>GTA6HUB</span></div>

      <section className={styles.giveawaySection} aria-labelledby="home-giveaway-title">
        <div className={styles.sectionHead}><div><p className={hub.eyebrow}>El sorteo de GTA6HUB</p><h2 id="home-giveaway-title">Tu próxima partida.<br />Tu próxima consola.</h2></div><Link href="/sorteos" className={styles.textLink}>Ver el sorteo completo ↗</Link></div>
        <div className={styles.giveawayFeature}>
          <div className={styles.giveawayArtwork}><PrizeArtwork /><span className={styles.prizeStamp}>EL PREMIO / PS5 + GTA VI</span></div>
          <div className={styles.giveawayCopy}><p className={styles.smallLabel}>Para la comunidad</p><h3>Una PS5 + GTA VI.<br /><em>Podría ser tuya.</em></h3><p>La primera misión empieza aquí. Elige un paquete y participa por una PS5 + GTA VI en el sorteo de nuestra comunidad.</p>
            <div className={styles.homePackages}>{TICKET_PACKAGES.map((item) => <Link key={item.id} href={`/sorteos?paquete=${item.id}#tickets`}><span>{item.tickets} {item.tickets === 1 ? "ticket" : "tickets"}</span><strong>${item.price} <small>USD</small></strong><span>{item.id === "legend" ? "Mejor precio ↗" : "Elegir ↗"}</span></Link>)}</div>
            <Link href="/sorteos#tickets" className={hub.primaryButton}>Quiero participar <span aria-hidden="true">→</span></Link><p className={styles.giveawayNote}>Revisa los detalles y la disponibilidad del pago en la página del sorteo.</p>
          </div>
        </div>
      </section>

      <section className={styles.communitySection} aria-labelledby="home-community-title"><div className={styles.sectionHead}><div><p className={hub.eyebrow}>En el muro, ahora</p><h2 id="home-community-title">La ciudad ya tiene crew.</h2><p className={styles.sectionDescription}>Mensajes recientes de quienes también cuentan los días.</p></div><Link href="/comunidad" className={styles.textLink}>Entrar a la comunidad ↗</Link></div><HomeCommunity /></section>

      <section className={styles.finalCta} aria-labelledby="last-call-title"><div><p className={hub.eyebrow}>Nos vemos en Vice City</p><h2 id="last-call-title">Haz que la espera cuente.</h2><p>La comunidad pone la conversación. Tú eliges tu próximo paso.</p></div><div><Link href="/sorteos#tickets" className={hub.primaryButton}>Ver tickets del sorteo <span aria-hidden="true">↗</span></Link><Link href="/comunidad#new-post" className={styles.secondaryButton}>Entrar al muro</Link></div></section>
      <footer className={hub.footer}><span>GTA6HUB · Comunidad de fans. No afiliada a Rockstar Games ni Take-Two Interactive.</span><a href="https://www.rockstargames.com/VI" target="_blank" rel="noopener noreferrer">Fecha y arte: Rockstar Games ↗</a></footer>
    </div>
  </div>;
}
