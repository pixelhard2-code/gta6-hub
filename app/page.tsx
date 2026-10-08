"use client";

import { useState, useEffect } from "react";
import Link from "next/link"; 

export default function Home() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const targetDate = new Date("2026-11-19T00:00:00").getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="w-full flex flex-col items-center p-4 md:p-8 relative overflow-hidden">
      
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none opacity-30 -z-10"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-[500px] bg-pink-600/20 blur-[150px] pointer-events-none rounded-full -z-10"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-600/20 blur-[150px] pointer-events-none rounded-full -z-10"></div>

      <section className="flex flex-col items-center text-center mt-8 md:mt-16 z-10 w-full max-w-4xl relative">
        <span className="px-4 py-1.5 rounded-full text-xs font-bold tracking-widest bg-pink-500/10 text-pink-400 border border-pink-500/20 mb-8 uppercase">
          Comunidad Oficial de Espera
        </span>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-4 leading-tight">
          ¿Cuánto falta para <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400">
            Grand Theft Auto VI?
          </span>
        </h1>

        <p className="text-neutral-400 text-sm md:text-base max-w-xl mb-10 leading-relaxed">
          Únete a nuestra comunidad. Publicamos actualizaciones diarias en Instagram y realizaremos sorteos de consolas PS5 previa al lanzamiento.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-5 w-full max-w-2xl mb-12">
          {[
            { label: "DÍAS", value: timeLeft.days },
            { label: "HORAS", value: timeLeft.hours },
            { label: "MINUTOS", value: timeLeft.minutes },
            { label: "SEGUNDOS", value: timeLeft.seconds },
          ].map((item, index) => (
            <div
              key={index}
              className="flex flex-col items-center justify-center p-5 md:p-7 rounded-2xl bg-neutral-900/80 border border-neutral-800/80 backdrop-blur-md shadow-2xl"
            >
              <span className="text-4xl md:text-5xl font-black text-white tabular-nums tracking-tight">
                {String(item.value).padStart(2, "0")}
              </span>
              <span className="text-xs text-neutral-400 font-bold uppercase mt-2 tracking-widest">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        <button className="px-8 py-4 text-base md:text-lg font-black rounded-full bg-white text-black hover:bg-neutral-200 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 uppercase tracking-wider">
            Únete a la Comunidad
        </button>
      </section>

      <section className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6 my-16 z-10 relative">
        <Link className="p-8 rounded-3xl bg-black/40 border border-pink-500/20 backdrop-blur-md shadow-[0_0_30px_rgba(236,72,153,0.05)] hover:border-pink-500/50 transition-all duration-300 group block cursor-pointer" href="/sorteos">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-600 to-purple-600 flex items-center justify-center mb-6 transform group-hover:-translate-y-1 transition-transform">
             <span className="text-2xl text-white font-black">🎁</span>
          </div>
          <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 font-black text-xl mb-3 uppercase tracking-wide">Sorteos y Premios</h3>
          <p className="text-neutral-400 text-sm leading-relaxed">
            Participa en nuestros sorteos mensuales por consolas PS5, accesorios y copias de GTA 6 para el día del lanzamiento.
          </p>
        </Link>
        <div className="p-8 rounded-3xl bg-black/40 border border-cyan-500/20 backdrop-blur-md shadow-[0_0_30px_rgba(6,182,212,0.05)] hover:border-cyan-500/50 transition-all duration-300 group">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-6 transform group-hover:-translate-y-1 transition-transform">
             <span className="text-2xl text-white font-black">💬</span>
          </div>
          <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 font-black text-xl mb-3 uppercase tracking-wide">Foros de la Comunidad</h3>
          <p className="text-neutral-400 text-sm leading-relaxed">
            Debate sobre los últimos trailers, comparte teorías y conoce a otros fans del juego de toda habla hispana.
          </p>
        </div>
        <div className="p-8 rounded-3xl bg-black/40 border border-purple-500/20 backdrop-blur-md shadow-[0_0_30px_rgba(168,85,247,0.05)] hover:border-purple-500/50 transition-all duration-300 group">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mb-6 transform group-hover:-translate-y-1 transition-transform">
             <span className="text-2xl text-white font-black">⭐</span>
          </div>
          <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 font-black text-xl mb-3 uppercase tracking-wide">Sube de Nivel</h3>
          <p className="text-neutral-400 text-sm leading-relaxed">
            Gana puntos participando activamente en la comunidad para desbloquear beneficios exclusivos y más chances de ganar.
          </p>
        </div>
      </section>

      <footer className="w-full max-w-5xl flex flex-col md:flex-row justify-between items-center py-8 border-t border-white/10 text-xs text-neutral-600 z-10 relative">
        <p>© 2026 GTA 6 HUB. Proyecto de fans.</p>
        <p className="mt-2 md:mt-0">No afiliado a Rockstar Games ni Take-Two Interactive.</p>
      </footer>
    </main>
  );
}