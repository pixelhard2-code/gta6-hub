"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PrizeArtwork, TICKET_PACKAGES } from "@/app/components/GiveawayCard";
import styles from "@/app/components/Hub.module.css";

export default function SorteosPage() {
  const [selectedId, setSelectedId] = useState("legend");
  const [showNotice, setShowNotice] = useState(false);

  useEffect(() => {
    const packageId = new URLSearchParams(window.location.search).get("paquete");
    if (TICKET_PACKAGES.some((item) => item.id === packageId)) {
      setSelectedId(packageId!);
    }
  }, []);

  const selected = TICKET_PACKAGES.find((item) => item.id === selectedId) ?? TICKET_PACKAGES[2];

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.topline}>
          <span>LeonidaCrew / Sorteo promocional de la Crew</span>
          <Link href="/comunidad">Ir a la comunidad ↗</Link>
        </div>

        {/* Banner de Estado Unificado del Sorteo */}
        <div className="mb-8 p-4 rounded-2xl bg-gradient-to-r from-pink-950/30 via-[#181524] to-[#12131c] border border-pink-500/30 flex items-center justify-between flex-wrap gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
            </span>
            <div>
              <p className="text-xs font-bold text-white tracking-wide">
                SORTEO PROMOCIONAL: <span className="text-pink-300">PlayStation 5 + Copia de GTA VI</span>
              </p>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Elige tu pack de stickers digitales. Cada sticker incluye 1 ticket para el sorteo.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono font-bold text-pink-300 bg-pink-500/15 px-3 py-1 rounded-full border border-pink-500/30">
            Stickers desde $2 USD c/u
          </span>
        </div>

        <div className={styles.prizeGrid}>
          {/* Columna Izquierda: Presentación del Premio */}
          <section className={styles.prizeColumn} aria-labelledby="prize-title">
            <PrizeArtwork />
            <div className={styles.prizeCaption}>
              <span>EL PREMIO / PS5 SLIM + GTA VI</span>
              <span className="font-bold text-pink-400">ENTREGA GLOBAL</span>
            </div>
            <h1 id="prize-title" className={styles.prizeHeading}>
              La próxima PS5<br />podría ser <em>la tuya</em>
            </h1>
            <p className={styles.description}>
              Compra stickers digitales de LeonidaCrew y recíbelos por correo. Por cada sticker comprado obtienes 1 ticket, sin costo adicional, para participar en nuestro sorteo promocional de una PlayStation 5 + Grand Theft Auto VI.
            </p>

            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-[#151622] border border-neutral-800">
                <span className="text-xs text-neutral-400 block font-mono">Consola</span>
                <strong className="text-sm text-white font-bold block mt-1">PlayStation 5</strong>
              </div>
              <div className="p-3.5 rounded-xl bg-[#151622] border border-neutral-800">
                <span className="text-xs text-neutral-400 block font-mono">Videojuego</span>
                <strong className="text-sm text-white font-bold block mt-1">GTA VI (Día 1)</strong>
              </div>
              <div className="p-3.5 rounded-xl bg-[#151622] border border-neutral-800 col-span-2 sm:col-span-1">
                <span className="text-xs text-neutral-400 block font-mono">Envío</span>
                <strong className="text-sm text-pink-300 font-bold block mt-1">100% Cubierto</strong>
              </div>
            </div>
          </section>

          {/* Columna Derecha: Selector de Paquetes de Stickers Digitales */}
          <section id="tickets" className={styles.purchasePanel} aria-labelledby="ticket-title">
            <div className={styles.panelHeading}>
              <div>
                <h2 id="ticket-title">Elige tus stickers</h2>
                <p className="text-xs text-neutral-400 mt-1">1 sticker digital = 1 ticket para el sorteo promocional.</p>
              </div>
              <span className={styles.ticketIcon} aria-hidden="true">🎟️</span>
            </div>

            <fieldset className={styles.packageList}>
              <legend className={styles.packageLegend}>Selecciona tu pack de stickers digitales:</legend>
              {TICKET_PACKAGES.map((item) => {
                const isSelected = selectedId === item.id;
                return (
                  <label
                    key={item.id}
                    className={`relative flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#251b29] border-pink-400/80 shadow-md shadow-pink-950/20"
                        : "bg-[#141520] border-neutral-800 hover:border-neutral-700"
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <input
                        type="radio"
                        name="tickets"
                        value={item.id}
                        checked={isSelected}
                        onChange={() => {
                          setSelectedId(item.id);
                          setShowNotice(false);
                        }}
                        className="accent-pink-400 w-4 h-4 flex-none"
                      />
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="text-sm font-bold text-white">
                            {item.tickets} {item.tickets === 1 ? "Sticker" : "Stickers"}
                          </strong>
                          {item.badge && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 font-mono">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <small className="text-xs text-neutral-400 mt-0.5">
                          {item.name} · {item.unitPrice}
                        </small>
                      </div>
                    </div>
                    <div className="text-right flex-none pl-3">
                      <span className="text-xl font-extrabold text-white">
                        ${item.price}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400 ml-1">USD</span>
                    </div>
                  </label>
                );
              })}
            </fieldset>

            <div className={styles.orderTotal} aria-live="polite">
              <span className="text-neutral-300 font-medium">
                Resumen: {selected.tickets} {selected.tickets === 1 ? "sticker seleccionado" : "stickers seleccionados"}
              </span>
              <strong className="text-2xl text-white font-extrabold">
                ${selected.price} <small className="text-xs text-neutral-400 font-mono">USD</small>
              </strong>
            </div>

            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => setShowNotice(true)}
            >
              <span>Confirmar selección ({selected.tickets} {selected.tickets === 1 ? "sticker" : "stickers"})</span>
              <span aria-hidden="true">→</span>
            </button>

            {showNotice ? (
              <div role="status" className="mt-4 p-4 rounded-xl bg-pink-950/30 border border-pink-500/40 text-xs text-pink-100 leading-relaxed animate-in fade-in">
                <div className="flex items-center gap-2 font-bold text-pink-300 mb-1">
                  <span>✓</span>
                  <span>Paquete de stickers seleccionado</span>
                </div>
                <p>
                  Has seleccionado <strong>{selected.tickets} {selected.tickets === 1 ? "sticker digital" : "stickers digitales"}</strong> por <strong>${selected.price} USD</strong>.
                  Cada sticker incluirá 1 ticket para el sorteo y se enviará a tu correo tras confirmar el pago. La venta estará disponible próximamente; esta selección todavía no realiza una compra ni asigna tickets.
                </p>
              </div>
            ) : (
              <p className={styles.panelNote}>
                ⚡ Venta de stickers digitales y entrega por correo próximamente. Elegir un paquete todavía no realiza una compra ni asigna tickets.
              </p>
            )}

            <div className={styles.deadlineNote}>
              <strong>Garantía de transparencia</strong>
              <p>El sorteo promocional se transmitirá en directo y el ganador se anunciará en el muro y nuestras redes. Las bases, las fechas y los plazos para reclamar el premio se publicarán antes de abrir la venta de stickers.</p>
            </div>
          </section>
        </div>

        {/* Flujo de 3 pasos */}
        <section className={styles.infoRow} aria-label="Cómo participar en el sorteo">
          <div className="p-4 rounded-xl bg-[#141520] border border-neutral-800/80">
            <span className="text-pink-400 font-mono font-bold text-xs">Paso 01</span>
            <h3 className="text-sm font-bold text-white mt-2 mb-1">Elige tus stickers</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Packs de 1, 2 o 5 stickers digitales. Recibes el mismo número de tickets para el sorteo. El pack Leyenda deja cada sticker en $2 USD.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#141520] border border-neutral-800/80">
            <span className="text-pink-400 font-mono font-bold text-xs">Paso 02</span>
            <h3 className="text-sm font-bold text-white mt-2 mb-1">Recíbelos por correo</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Al habilitarse la venta y confirmarse el pago, tus stickers se enviarán al correo indicado al comprar. Los tickets incluidos se asociarán a tu perfil.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#141520] border border-neutral-800/80">
            <span className="text-pink-400 font-mono font-bold text-xs">Paso 03</span>
            <h3 className="text-sm font-bold text-white mt-2 mb-1">El sorteo en vivo</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Participa con los tickets incluidos en tu compra de stickers. Sigue la transmisión y el anuncio del ganador de la PS5 + GTA VI en la comunidad.
            </p>
          </div>
        </section>

        {/* Preguntas Frecuentes */}
        <section className={styles.faq} aria-labelledby="faq-title">
          <h2 id="faq-title" className="text-lg font-bold text-white mb-4">
            Sobre los stickers y el sorteo
          </h2>
          <details className="py-2">
            <summary className="font-semibold text-neutral-200 hover:text-pink-300 transition-colors">
              ¿Qué incluye el premio exactamente?
            </summary>
            <p className="mt-2 text-neutral-400 text-xs leading-relaxed">
              El ganador recibirá una consola PlayStation 5 nueva en caja sellada con su respectivo mando DualSense, cables, más una copia oficial de Grand Theft Auto VI el día de lanzamiento mundial, con costos de envío internacional cubiertos por la comunidad. Las condiciones y los plazos de entrega del premio se publicarán en las bases antes de abrir la venta de stickers.
            </p>
          </details>
          <details className="py-2">
            <summary className="font-semibold text-neutral-200 hover:text-pink-300 transition-colors">
              ¿Cómo y cuándo se elegirá al ganador?
            </summary>
            <p className="mt-2 text-neutral-400 text-xs leading-relaxed">
              El sorteo promocional se realizará mediante una selección aleatoria con transmisión en vivo. La fecha, el procedimiento y las bases se publicarán en la página del sorteo y en el muro comunitario antes de abrir la venta. Cada sticker comprado incluirá 1 ticket para participar.
            </p>
          </details>
          <details className="py-2">
            <summary className="font-semibold text-neutral-200 hover:text-pink-300 transition-colors">
              ¿Cómo recibiré mis stickers y veré mis tickets?
            </summary>
            <p className="mt-2 text-neutral-400 text-xs leading-relaxed">
              Tras confirmar el pago, los stickers digitales se enviarán al correo indicado al comprar. Los tickets promocionales aparecerán en tu perfil de LeonidaCrew: 1 por cada sticker comprado. Los plazos de entrega y las condiciones de participación se informarán antes de abrir la venta.
            </p>
          </details>
        </section>

        <footer className={styles.footer}>
          <span>LeonidaCrew · Comunidad de fans de GTA VI. No afiliada a Rockstar Games ni Sony Interactive Entertainment.</span>
          <Link href="/comunidad">Ir a la comunidad ↗</Link>
        </footer>
      </div>
    </div>
  );
}
