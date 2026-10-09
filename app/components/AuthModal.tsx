"use client";

import React from "react";
import { signInWithPopup, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";
import { auth } from "@/app/lib/firebase";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ESTA LÍNEA ES LA IMPORTANTE (export default)
export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  if (!isOpen) return null;

  // Función para iniciar sesión con Google
  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onClose();
    } catch (error) {
      console.error("Error al iniciar sesión con Google:", error);
    }
  };

  // Función para iniciar sesión con GitHub
  const handleGithubLogin = async () => {
    try {
      const provider = new GithubAuthProvider();
      await signInWithPopup(auth, provider);
      onClose();
    } catch (error) {
      console.error("Error al iniciar sesión con GitHub:", error);
    }
  };

  // Lista dinámica de métodos de acceso (puedes agregar más aquí fácilmente y aparecerán solos)
  const socialLogins = [
    {
      name: "Continuar con Google",
      icon: "🌐",
      onClick: handleGoogleLogin,
      primary: true,
    },
    {
      name: "GitHub",
      icon: "💻",
      onClick: handleGithubLogin,
      primary: false,
    },
  ];

  const wallets = [
    { name: "MetaMask", badge: "RECIENTE", icon: "🦊" },
    { name: "Phantom", badge: "DETECTADA", icon: "👻" },
    { name: "WalletConnect", badge: "", icon: "🔗" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Tarjeta flotante principal */}
      <div className="bg-[#121212] border border-gray-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative text-white">
        
        {/* Botón de Cerrar (X) */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-white bg-gray-900/80 hover:bg-gray-800 p-2 rounded-full transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>

        {/* Header del Modal */}
        <div className="text-center mt-2 mb-6">
          <div className="w-12 h-12 bg-gradient-to-tr from-green-400 to-cyan-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-green-500/20 mb-3">
            <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Bienvenido de nuevo</h2>
          <p className="text-sm text-gray-400 mt-1">Inicia sesión para empezar a participar en los sorteos.</p>
        </div>

        {/* Botones de Redes Sociales (Generados dinámicamente) */}
        <div className="space-y-3 mb-6">
          {socialLogins.map((item, index) => (
            <button
              key={index}
              onClick={item.onClick}
              className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-medium text-sm transition-all shadow-md ${
                item.primary 
                  ? "bg-white text-black hover:bg-gray-200 font-semibold" 
                  : "bg-[#1a1a1a] border border-gray-800 hover:bg-[#222] text-white"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.name}</span>
            </button>
          ))}
        </div>

        <div className="relative flex py-2 items-center mb-6">
          <div className="flex-grow border-t border-gray-800"></div>
          <span className="flex-shrink mx-4 text-gray-500 text-xs uppercase tracking-wider">o conecta una billetera</span>
          <div className="flex-grow border-t border-gray-800"></div>
        </div>

        {/* Billeteras (Se agregan automáticamente si amplías el arreglo) */}
        <div className="space-y-2 mb-2 max-h-40 overflow-y-auto pr-1">
          {wallets.map((wallet, index) => (
            <div 
              key={index}
              className="flex items-center justify-between p-3 bg-[#181818] hover:bg-[#202020] border border-gray-800/60 rounded-xl cursor-pointer transition-colors"
              onClick={() => alert(`Conexión con ${wallet.name} próximamente`)}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{wallet.icon}</span>
                <span className="text-sm font-medium">{wallet.name}</span>
              </div>
              {wallet.badge && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  wallet.badge === "RECIENTE" ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                }`}>
                  {wallet.badge}
                </span>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}