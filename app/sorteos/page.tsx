"use client";

import { useState } from "react";
import Link from "next/link";
import { PrizeArtwork, TICKET_PACKAGES } from "@/app/components/GiveawayCard";
import styles from "@/app/components/Hub.module.css";

export default function SorteosPage() {
  const [selectedId, setSelectedId] = useState("double");
  const [showNotice, setShowNotice] = useState(false);
  const selected = TICKET_PACKAGES.find((item) => item.id === selectedId) ?? TICKET_PACKAGES[1];

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.topline}><span>GTA6HUB / Sorteos</span><Link href="/comunidad">Ir a la comunidad ↗</Link></div>
        <div className={styles.prizeGrid}>
          <section className={styles.prizeColumn} aria-labelledby="prize-title">
            <PrizeArtwork />
            <div className={styles.prizeCaption}><span>EL PREMIO / PS5 + GTA VI</span><span>PARA LA COMUNIDAD</span></div>
            <h1 id="prize-title" className={styles.prizeHeading}>La próxima PS5<br />podría ser <em>la tuya.</em></h1>
            <p className={styles.description}>Vice City se disfruta mejor con consola propia. Participa por una PS5 + GTA VI y empieza a imaginar tu primera partida.</p>
          </section>

          <section id="tickets" className={styles.purchasePanel} aria-labelledby="ticket-title">
            <div className={styles.panelHeading}><h2 id="ticket-title">Elige tus tickets</h2><span className={styles.ticketIcon} aria-hidden="true">[↗]</span></div>
            <fieldset className={styles.packageList}>
              <legend className={styles.packageLegend}>Un premio. Tres formas de participar.</legend>
              {TICKET_PACKAGES.map((item) => (
                <label key={item.id} className={`${styles.packageOption} ${selectedId === item.id ? styles.packageSelected : ""}`}>
                  <input type="radio" name="tickets" value={item.id} checked={selectedId === item.id} onChange={() => { setSelectedId(item.id); setShowNotice(false); }} />
                  <span className={styles.packageCopy}>
                    <strong>{item.tickets} {item.tickets === 1 ? "ticket" : "tickets"}{item.id === "legend" && <span className={styles.packageTag}>Mejor precio</span>}</strong>
                    <small>{item.name} · ${(item.price / item.tickets).toFixed(2)} por ticket</small>
                  </span>
                  <span className={styles.packageAmount}>${item.price}<small>USD</small></span>
                </label>
              ))}
            </fieldset>
            <div className={styles.orderTotal} aria-live="polite"><span>{selected.tickets} {selected.tickets === 1 ? "ticket seleccionado" : "tickets seleccionados"}</span><strong>${selected.price} <small>USD</small></strong></div>
            <button type="button" className={styles.primaryButton} onClick={() => setShowNotice(true)}>Continuar con {selected.tickets} {selected.tickets === 1 ? "ticket" : "tickets"}<span aria-hidden="true">→</span></button>
            <p className={styles.panelNote}>Compra disponible próximamente. Puedes elegir tu paquete desde ahora.</p>
            {showNotice && <p role="status" className={styles.notice}>El pago estará disponible pronto. Tu selección es de {selected.tickets} {selected.tickets === 1 ? "ticket" : "tickets"} por ${selected.price} USD. Todavía no se ha realizado ninguna compra.</p>}
            <div className={styles.deadlineNote}><strong>Cuando cierre, ya no podrás entrar.</strong><p>Los tickets estarán disponibles hasta la fecha de cierre del sorteo. Las novedades se compartirán en la comunidad.</p></div>
          </section>
        </div>

        <section className={styles.infoRow} aria-label="Cómo participar">
          <div><span>01</span><h3>Elige tu entrada</h3><p>1, 2 o 5 tickets. El paquete de 5 deja cada ticket a $2 USD.</p></div>
          <div><span>02</span><h3>Completa tu compra</h3><p>Cuando se habilite el pago, podrás continuar con el paquete que hayas elegido.</p></div>
          <div><span>03</span><h3>Sigue el sorteo</h3><p>Visita la comunidad para conversar con otros fans y seguir las novedades.</p></div>
        </section>
        <section className={styles.faq} aria-labelledby="faq-title">
          <h2 id="faq-title">Antes de entrar</h2>
          <details><summary>¿Qué incluye el premio?</summary><p>El premio anunciado es una PS5 + GTA VI. Los detalles de la consola, la edición del juego y la entrega se publicarán en las bases del sorteo antes de habilitar la compra.</p></details>
          <details><summary>¿Hasta cuándo puedo participar?</summary><p>Las participaciones se cerrarán en la fecha establecida para el sorteo. La fecha y las bases se publicarán antes de abrir los pagos.</p></details>
          <details><summary>¿Cómo se elegirá al ganador?</summary><p>El método de selección y el anuncio del ganador se detallarán en las bases del sorteo antes de habilitar las compras. Sigue las novedades en la comunidad.</p></details>
        </section>
        <footer className={styles.footer}><span>GTA6HUB · Proyecto de fans. No afiliado a Rockstar Games.</span><Link href="/comunidad">Nos vemos en la comunidad ↗</Link></footer>
      </div>
    </div>
  );
}
