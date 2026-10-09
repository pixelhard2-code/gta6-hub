"use client";

import { useState } from "react";

const PACKAGES = [
  { id: "basic", name: "Pase Básico", tickets: 1, price: 3, note: "Para probar tu suerte", accent: "border-white/10", button: "bg-white/5 hover:bg-white/10" },
  { id: "double", name: "Pase Doble", tickets: 2, price: 5, note: "Más oportunidades por menos", accent: "border-cyan-400/70 ring-1 ring-cyan-400/20", button: "bg-cyan-400 text-slate-950 hover:bg-cyan-300", popular: true },
  { id: "legend", name: "Pase Leyenda", tickets: 5, price: 10, note: "El mejor precio por ticket", accent: "border-white/10", button: "bg-white/5 hover:bg-white/10" },
];

export default function SorteosPage() {
  const [selectedId, setSelectedId] = useState("double");
  const [showNotice, setShowNotice] = useState(false);
  const selectedPackage = PACKAGES.find((item) => item.id === selectedId) ?? PACKAGES[1];

  function handleContinue() {
    // Aquí debe conectarse la pasarela de pago antes de aceptar cobros reales.
    setShowNotice(true);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#07090d] text-white">
      <section className="relative isolate border-b border-white/10">
        <div className="absolute inset-0 -z-10">
          <img
            src="https://images.unsplash.com/photo-1606813907291-d86efa9b94db?q=80&w=2000&auto=format&fit=crop"
            alt=""
            className="h-full w-full object-cover object-center opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#07090d] via-[#07090d]/90 to-[#07090d]/55" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07090d] via-transparent to-[#07090d]/30" />
        </div>

        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-8 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1.15fr_.85fr] lg:gap-14 lg:px-12 lg:py-24">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[.18em] text-cyan-200 sm:text-xs">
              <span className="h-2 w-2 rounded-full bg-cyan-300" />
              Sorteo especial gaming
            </div>
            <h1 className="text-4xl font-black leading-[.98] tracking-tight sm:text-6xl lg:text-7xl">
              TU PRÓXIMA
              <span className="mt-2 block bg-gradient-to-r from-cyan-300 via-sky-400 to-fuchsia-400 bg-clip-text text-transparent">GRAN AVENTURA</span>
              <span className="mt-2 block">PUEDE EMPEZAR AQUÍ.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
              Participa por una experiencia gaming épica. Elige tus tickets en segundos y revisa las condiciones del sorteo antes de participar.
            </p>
            <a href="#paquetes" className="mt-8 inline-flex min-h-12 items-center justify-center rounded-xl bg-cyan-300 px-6 py-3 text-sm font-extrabold text-slate-950 shadow-lg shadow-cyan-400/20 transition hover:-translate-y-0.5 hover:bg-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:ring-offset-2 focus:ring-offset-slate-950">
              ELEGIR MIS TICKETS <span aria-hidden="true" className="ml-2">↓</span>
            </a>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-400 sm:text-sm">
              <span>✓ Paquetes claros</span>
              <span>✓ Sin límite artificial de tickets</span>
              <span>✓ Condiciones transparentes</span>
            </div>
          </div>

          <div className="mx-auto w-full max-w-md lg:ml-auto">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#11151d]/90 p-3 shadow-2xl shadow-black/40 backdrop-blur sm:p-4">
              <div className="flex items-center justify-between px-2 pb-3 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-[.22em] text-slate-400">Premio destacado</span>
                <span className="rounded-full border border-fuchsia-300/25 bg-fuchsia-300/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-fuchsia-200">Edición gaming</span>
              </div>
              <div className="relative overflow-hidden rounded-2xl bg-slate-900">
                <img src="https://images.unsplash.com/photo-1606813907291-d86efa9b94db?q=80&w=1200&auto=format&fit=crop" alt="Consola de videojuegos" className="aspect-[4/3] w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                  <p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-300">Tu próxima aventura</p>
                  <h2 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">PS5 <span className="text-cyan-300">+</span></h2>
                  <p className="text-2xl font-extrabold sm:text-3xl">GTA VI</p>
                  <p className="mt-3 max-w-xs text-xs leading-5 text-slate-300">Consulta el premio exacto, la fecha de cierre y las reglas en las condiciones oficiales.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 p-2 pt-4 sm:p-3">
                <div className="rounded-xl bg-white/[.04] p-3">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">Desde</p>
                  <p className="mt-1 text-2xl font-black">$3 <span className="text-xs font-semibold text-slate-400">USD</span></p>
                </div>
                <div className="rounded-xl bg-white/[.04] p-3">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">Participación</p>
                  <p className="mt-1 text-sm font-bold text-cyan-200">Elige tu paquete</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="paquetes" className="mx-auto w-full max-w-7xl scroll-mt-6 px-5 py-14 sm:px-8 sm:py-20 lg:px-12">
        <div className="mx-auto mb-9 max-w-2xl text-center sm:mb-12">
          <p className="text-xs font-bold uppercase tracking-[.24em] text-cyan-300">Tu participación</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">ELIGE TU PAQUETE</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-400 sm:text-base sm:leading-7">Selecciona una opción. Puedes cambiarla cuando quieras antes de continuar.</p>
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 items-stretch gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
          {PACKAGES.map((item) => {
            const isSelected = selectedId === item.id;
            return (
              <article key={item.id} className={`relative flex min-w-0 flex-col rounded-2xl border bg-[#10131a] p-5 transition duration-200 sm:p-6 ${item.accent} ${isSelected ? "shadow-xl shadow-cyan-400/[.07]" : "hover:border-white/25"}`}>
                {item.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-cyan-300 to-blue-400 px-4 py-1.5 text-[10px] font-black uppercase tracking-[.12em] text-slate-950">Recomendado</span>}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-extrabold sm:text-xl">{item.name}</h3>
                    <p className="mt-1 text-sm text-slate-400">{item.note}</p>
                  </div>
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-lg ${isSelected ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-200" : "border-white/10 bg-white/[.03] text-slate-300"}`} aria-hidden="true">{item.tickets === 1 ? "◇" : item.tickets === 2 ? "✦" : "✧"}</span>
                </div>
                <div className="mt-7 flex items-end gap-2">
                  <span className="text-5xl font-black tracking-tight">${item.price}</span>
                  <span className="mb-1 text-xs font-semibold text-slate-500">USD</span>
                </div>
                <p className="mt-2 text-sm text-slate-300">{item.tickets} {item.tickets === 1 ? "ticket" : "tickets"} <span className="text-slate-600">·</span> <span className="font-semibold text-slate-200">${(item.price / item.tickets).toFixed(2)} por ticket</span></p>
                <div className="my-5 h-px bg-white/10" />
                <ul className="mb-7 space-y-3 text-sm text-slate-300">
                  <li className="flex gap-2.5"><span className="font-black text-cyan-300">✓</span>{item.tickets} {item.tickets === 1 ? "oportunidad" : "oportunidades"} de participación</li>
                  <li className="flex gap-2.5"><span className="font-black text-cyan-300">✓</span>Precio total visible antes de pagar</li>
                  {item.tickets > 1 && <li className="flex gap-2.5"><span className="font-black text-cyan-300">✓</span>Ahorro frente a tickets individuales</li>}
                </ul>
                <button type="button" aria-pressed={isSelected} onClick={() => { setSelectedId(item.id); setShowNotice(false); }} className={`mt-auto flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-extrabold transition focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-[#10131a] ${isSelected ? "bg-cyan-300 text-slate-950" : "border border-white/10 bg-white/[.04] text-white hover:bg-white/[.09]"}`}>
                  {isSelected ? "✓ Paquete seleccionado" : "Elegir este paquete"}
                </button>
              </article>
            );
          })}
        </div>

        <div className="mx-auto mt-7 max-w-5xl rounded-2xl border border-white/10 bg-white/[.03] p-4 sm:mt-8 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-slate-500">Tu selección</p>
            <p className="mt-1 text-lg font-extrabold">{selectedPackage.tickets} {selectedPackage.tickets === 1 ? "ticket" : "tickets"} <span className="mx-1 text-slate-600">·</span> ${selectedPackage.price} USD</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">Las participaciones estarán disponibles hasta la fecha de cierre indicada en las condiciones oficiales.</p>
          </div>
          <button type="button" onClick={handleContinue} className="mt-4 flex min-h-12 w-full shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-300 to-sky-400 px-6 py-3 text-sm font-black text-slate-950 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:ring-offset-2 focus:ring-offset-[#07090d] sm:mt-0 sm:w-auto">
            CONTINUAR · ${selectedPackage.price} USD <span className="ml-2" aria-hidden="true">→</span>
          </button>
        </div>

        {showNotice && <div role="status" className="mx-auto mt-4 max-w-5xl rounded-xl border border-amber-300/25 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">La selección funciona correctamente, pero la pasarela de pago todavía no está conectada. No se ha realizado ningún cobro. Conecta y prueba el checkout antes de anunciar ventas.</div>}
      </section>

      <section className="border-t border-white/10 bg-[#0a0c11]">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 md:grid-cols-3 lg:px-12">
          <div><p className="text-sm font-extrabold">¿Cómo funciona?</p><p className="mt-2 text-sm leading-6 text-slate-400">Elige un paquete, revisa las condiciones y completa el proceso de compra cuando el pago esté habilitado.</p></div>
          <div><p className="text-sm font-extrabold">Sin falsa escasez</p><p className="mt-2 text-sm leading-6 text-slate-400">No mostramos contadores de tickets restantes ni ventas en vivo. Las participaciones se mantienen abiertas hasta la fecha de cierre oficial.</p></div>
          <div><p className="text-sm font-extrabold">Antes de participar</p><p className="mt-2 text-sm leading-6 text-slate-400">Lee las reglas, requisitos, fecha de cierre, selección del ganador y detalles del premio en las condiciones oficiales.</p><div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-cyan-200"><a className="underline underline-offset-4 hover:text-cyan-100" href="/terminos">Términos y condiciones</a><a className="underline underline-offset-4 hover:text-cyan-100" href="/privacidad">Privacidad</a></div></div>
        </div>
      </section>
    </main>
  );
}
