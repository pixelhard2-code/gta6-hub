"use client";

import { Component, type ReactNode, useId } from "react";
import { GIVEAWAY_MILESTONE } from "./config";
import { readMilestone, STICKERS_PER_PRIZE } from "./model";
import styles from "./GiveawayMilestone.module.css";

const numbers = new Intl.NumberFormat("es-CL");
const dates = new Intl.DateTimeFormat("es-CL", {
  day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
});

class SectionBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

function MilestoneContent() {
  const titleId = useId();
  const progressId = useId();
  const milestone = readMilestone(GIVEAWAY_MILESTONE);
  if (!milestone) return null;
  const { displayedStickers, updatedOn, demo, prizes, nextPrizes, progress, remaining, nextGoal } = milestone;
  const hasCount = displayedStickers !== null;

  return (
    <section className={styles.card} aria-labelledby={titleId}>
      <div className={styles.intro}>
        <p className={styles.eyebrow}><span aria-hidden="true" /> META DE LA CREW</p>
        {demo && <p className={styles.demo}>DEMOSTRACIÓN · DATOS SIMULADOS</p>}
        <h2 id={titleId}>Más stickers.<br /><em>Más PS5 en el sorteo.</em></h2>
        <p className={styles.description}>
          Por cada <strong>1.000 stickers confirmados</strong>, sumamos otra PlayStation 5 + GTA VI al sorteo promocional.
        </p>
        <a className={styles.cta} href="#tickets">Elegir mis stickers <span aria-hidden="true">↗</span></a>
      </div>

      <div className={styles.goal}>
        <div className={styles.prizes}>
          <div>
            <span className={styles.label}>EN EL SORTEO</span>
            <p><strong>{numbers.format(prizes)}</strong><span>PS5 + GTA VI</span></p>
          </div>
          <span className={styles.arrow} aria-hidden="true">→</span>
          <div className={styles.nextPrize}>
            <span className={styles.label}>PRÓXIMA META</span>
            <p><strong>{numbers.format(nextPrizes)}</strong><span>PS5 + GTA VI</span></p>
          </div>
        </div>

        <div className={styles.progressHeading}>
          <span id={progressId}>{demo ? "Avance simulado" : hasCount ? "Avance de este tramo" : "Próximo objetivo"}</span>
          <strong>{hasCount ? `${numbers.format(progress)} / ` : ""}{numbers.format(STICKERS_PER_PRIZE)} stickers</strong>
        </div>
        {hasCount ? (
          <progress
            className={styles.progress}
            value={progress}
            max={STICKERS_PER_PRIZE}
            aria-labelledby={progressId}
            aria-valuetext={`${demo ? "Demostración con datos simulados. " : ""}${numbers.format(progress)} de 1.000 stickers en este tramo. Faltan ${numbers.format(remaining)} para sumar otra PS5 con GTA VI.`}
          />
        ) : <div className={styles.emptyTrack} aria-hidden="true" />}
        <p className={styles.goalNote}>
          {hasCount ? <><strong>{demo ? "En este ejemplo faltan" : "Faltan"} {numbers.format(remaining)} stickers</strong> para llegar a {numbers.format(nextGoal)} y sumar el siguiente premio.</> : "El avance se publicará cuando esté confirmado el conteo de ventas."}
        </p>
        <p className={styles.update}>
          {demo ? "Vista experimental: estas cifras no representan ventas reales ni agregan premios al sorteo." : hasCount && updatedOn ? <>Conteo publicado: {numbers.format(displayedStickers)} stickers · <time dateTime={updatedOn}>{dates.format(new Date(`${updatedOn}T00:00:00Z`))}</time></> : "1 premio inicial + 1 adicional por cada meta completada."}
        </p>
      </div>
    </section>
  );
}

// A rendering failure removes only this optional promotion, leaving checkout intact.
export default function GiveawayMilestone() {
  return <SectionBoundary><MilestoneContent /></SectionBoundary>;
}
