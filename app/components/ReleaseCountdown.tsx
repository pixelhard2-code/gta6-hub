"use client";

import { useEffect, useState } from "react";
import styles from "./Home.module.css";

// Calendar countdown to the announced release date, at midnight in Chile.
// Rockstar has announced the day, but this does not represent an official unlock time.
const RELEASE_AT = new Date("2026-11-19T00:00:00-03:00").getTime();

export default function ReleaseCountdown() {
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    function update() { setRemaining(Math.max(0, RELEASE_AT - Date.now())); }
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const values = remaining === null ? null : [
    Math.floor(remaining / 86400000),
    Math.floor((remaining % 86400000) / 3600000),
    Math.floor((remaining % 3600000) / 60000),
    Math.floor((remaining % 60000) / 1000),
  ];

  return <div className={styles.countdownBlock}>
    <p className={styles.countdownHeading}>{remaining === 0 ? "Llegó la fecha anunciada." : "Cada vez falta menos."}</p>
    <div className={styles.countdown} role="timer" aria-label="Cuenta regresiva a la fecha de lanzamiento de GTA VI" aria-live="off">
      {["Días", "Horas", "Min", "Seg"].map((label, index) => <div key={label}><strong>{values ? String(values[index]).padStart(2, "0") : "—"}</strong><span>{label}</span></div>)}
    </div>
    <p className={styles.clockNote}>Hasta el inicio del 19 de noviembre, hora de Chile.</p>
  </div>;
}
