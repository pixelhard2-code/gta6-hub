"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
// Importamos tu configuración de Firebase
import { db } from "@/app/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export default function SorteosPage() {
  // Estados para la barra de progreso en tiempo real
  const [ticketsSold, setTicketsSold] = useState(0);
  const totalTickets = 1000; // Meta de tickets a vender

  // Escuchar en tiempo real la cantidad de tickets vendidos desde Firebase
  useEffect(() => {
    // Asumimos que crearás un documento llamado "estado" dentro de la colección "sorteos"
    const docRef = doc(db, "sorteos", "estado");
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setTicketsSold(docSnap.data().vendidos || 0);
      }
    }, (error) => {
      console.error("Error leyendo tickets:", error);
    });

    return () => unsubscribe();
  }, []);

  // Cálculo del porcentaje para la barra
  const progressPercentage = Math.min((ticketsSold / totalTickets) * 100, 100);

  // Función temporal para los botones de compra (aquí irá Stripe/MercadoPago después)
  const handlePurchase = (tickets: number, price: number) => {
    console.log(`Iniciando compra de ${tickets} tickets por $${price} USD...`);
    alert(`Próximamente: Serás redirigido a la pasarela de pago para comprar ${tickets} tickets por $${price} USD.`);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-20">
      
      {/* HEADER / HERO SECTION */}
      <div className="relative w-full h-[40vh] md:h-[50vh] flex items-center justify-center overflow-hidden border-b border-pink-500/20">
        {/* Imagen de fondo (Placeholder de consola/gaming) */}
        <div className="absolute inset-0 opacity-30">
          <img 
            src="https://images.unsplash.com/photo-1606813907291-d86efa9b94db?q=80&w=2000&auto=format&fit=crop" 
            alt="PS5 Background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-black/50"></div>
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-10">
          <span className="bg-pink-500/10 text-pink-400 font-bold px-4 py-1.5 rounded-full text-sm tracking-wider uppercase border border-pink-500/30 mb-4 inline-block">
            Sorteo Especial Lanzamiento
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4">
            Gana una <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-cyan-400">PS5 + GTA VI</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
            Participa para llevarte la consola de nueva generación y la edición definitiva de Grand Theft Auto VI el día de su lanzamiento.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        
        {/* BARRA DE PROGRESO EN TIEMPO REAL */}
        <div className="bg-[#0a0a0a] border border-gray-800 rounded-2xl p-6 md:p-8 shadow-2xl shadow-pink-500/5 mb-16">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Tickets Vendidos</h3>
              <p className="text-sm text-gray-400">El sorteo se realiza al llegar a la meta</p>
            </div>
            <div className="text-right">
              <span className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500">
                {ticketsSold}
              </span>
              <span className="text-gray-500 font-medium"> / {totalTickets}</span>
            </div>
          </div>
          
          <div className="w-full bg-gray-900 rounded-full h-4 md:h-6 border border-gray-800 overflow-hidden relative">
            {/* Animación de brillo en la barra */}
            <div 
              className="bg-gradient-to-r from-cyan-500 to-pink-500 h-full rounded-full transition-all duration-1000 ease-out relative"
              style={{ width: `${progressPercentage}%` }}
            >
              <div className="absolute inset-0 bg-white/20 w-full h-full animate-pulse"></div>
            </div>
          </div>
          <p className="text-center text-xs text-gray-500 mt-4 uppercase tracking-widest font-semibold">
            Actualización en tiempo real
          </p>
        </div>

        {/* SECCIÓN DE PRECIOS / LLAMADA A LA ACCIÓN */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Elige tu Paquete de Tickets</h2>
          <p className="text-gray-400">A mayor cantidad de tickets, más posibilidades tienes de ganar.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-center">
          
          {/* Paquete 1: Básico */}
          <div className="bg-[#0a0a0a] border border-gray-800 rounded-2xl p-8 hover:border-gray-600 transition-colors flex flex-col h-full">
            <div className="flex-grow">
              <h3 className="text-xl font-bold text-gray-300 mb-2">Pase Básico</h3>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-5xl font-extrabold text-white">$3</span>
                <span className="text-gray-500 font-medium">USD</span>
              </div>
              <ul className="space-y-4 mb-8 text-gray-400">
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  <span>1 Ticket para el sorteo</span>
                </li>
              </ul>
            </div>
            <button 
              onClick={() => handlePurchase(1, 3)}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-4 px-6 rounded-xl transition-colors"
            >
              Comprar 1 Ticket
            </button>
          </div>

          {/* Paquete 2: Popular (Destacado) */}
          <div className="bg-[#111] border-2 border-pink-500 rounded-2xl p-8 transform md:-translate-y-4 shadow-2xl shadow-pink-500/10 flex flex-col h-full relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-bold px-4 py-1 rounded-full text-sm">
              MÁS POPULAR
            </div>
            <div className="flex-grow mt-2">
              <h3 className="text-xl font-bold text-pink-400 mb-2">Pase Doble</h3>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-5xl font-extrabold text-white">$5</span>
                <span className="text-gray-500 font-medium">USD</span>
              </div>
              <ul className="space-y-4 mb-8 text-gray-300">
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  <span className="font-bold">2 Tickets para el sorteo</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  <span>Ahorras $1 USD</span>
                </li>
              </ul>
            </div>
            <button 
              onClick={() => handlePurchase(2, 5)}
              className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-pink-500/25"
            >
              Comprar 2 Tickets
            </button>
          </div>

          {/* Paquete 3: Premium */}
          <div className="bg-[#0a0a0a] border border-gray-800 rounded-2xl p-8 hover:border-cyan-500/50 transition-colors flex flex-col h-full">
            <div className="flex-grow">
              <h3 className="text-xl font-bold text-cyan-400 mb-2">Pase Leyenda</h3>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-5xl font-extrabold text-white">$10</span>
                <span className="text-gray-500 font-medium">USD</span>
              </div>
              <ul className="space-y-4 mb-8 text-gray-400">
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  <span className="font-bold text-white">5 Tickets para el sorteo</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  <span>Mejor valor garantizado</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  <span>Insignia en la comunidad</span>
                </li>
              </ul>
            </div>
            <button 
              onClick={() => handlePurchase(5, 10)}
              className="w-full bg-gray-800 hover:bg-cyan-900/50 hover:text-cyan-400 border border-transparent hover:border-cyan-500/50 text-white font-bold py-4 px-6 rounded-xl transition-all"
            >
              Comprar 5 Tickets
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}