"use client";

import React, { useEffect, useState } from "react";
import { signInWithPopup, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";
import { auth } from "@/app/lib/firebase";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [walletNotice, setWalletNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setWalletNotice(null);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onClose();
    } catch (error) {
      console.error("Error al iniciar sesión con Google:", error);
    }
  };

  const handleGithubLogin = async () => {
    try {
      const provider = new GithubAuthProvider();
      await signInWithPopup(auth, provider);
      onClose();
    } catch (error) {
      console.error("Error al iniciar sesión con GitHub:", error);
    }
  };

  const socialLogins = [
    {
      name: "Continuar con Google",
      icon: "🌐",
      onClick: handleGoogleLogin,
      primary: true,
    },
    {
      name: "Continuar con GitHub",
      icon: "💻",
      onClick: handleGithubLogin,
      primary: false,
    },
  ];

  const wallets = [
    { name: "MetaMask", badge: "Pronto", icon: "🦊" },
    { name: "Phantom", badge: "Pronto", icon: "👻" },
    { name: "WalletConnect", badge: "DePay", icon: "🔗" },
  ];

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="bg-[#12131c] border border-neutral-800 w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-3xl p-6 md:p-8 shadow-2xl relative text-white"
      >
        {/* Botón de Cerrar (X) */}
        <button 
          type="button"
          onClick={onClose}
          aria-label="Cerrar modal"
          className="absolute top-5 right-5 text-neutral-400 hover:text-white bg-neutral-900/80 hover:bg-neutral-800 p-2 rounded-full transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>

        {/* Header del Modal */}
        <div className="text-center mt-2 mb-6">
          <div className="w-12 h-12 bg-gradient-to-tr from-pink-500 to-rose-400 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-pink-500/25 mb-3">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
            </svg>
          </div>
          <h2 id="auth-modal-title" className="text-2xl font-bold tracking-tight">
            Únete a la Crew
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            Inicia sesión para publicar teorías, participar en el sorteo de PS5 y seguir a otros jugadores.
          </p>
        </div>

        {/* Botones de Redes Sociales */}
        <div className="space-y-3 mb-6">
          {socialLogins.map((item, index) => (
            <button
              key={index}
              type="button"
              onClick={item.onClick}
              className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-medium text-sm transition-all shadow-md ${
                item.primary 
                  ? "bg-[#f3b5a7] text-[#241820] hover:bg-[#f8cbc2] font-bold" 
                  : "bg-[#181926] border border-neutral-700/80 hover:bg-[#202133] text-white"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.name}</span>
            </button>
          ))}
        </div>

        <div className="relative flex py-2 items-center mb-5">
          <div className="flex-grow border-t border-neutral-800"></div>
          <span className="flex-shrink mx-4 text-neutral-500 text-xs font-mono uppercase tracking-wider">
            o billetera Web3 (DePay)
          </span>
          <div className="flex-grow border-t border-neutral-800"></div>
        </div>

        {/* Billeteras */}
        <div className="space-y-2 mb-2">
          {wallets.map((wallet, index) => (
            <button
              key={index}
              type="button"
              className="w-full flex items-center justify-between p-3 bg-[#161724] hover:bg-[#1e1f30] border border-neutral-800/80 rounded-xl cursor-pointer transition-colors text-left"
              onClick={() => setWalletNotice(`La conexión con ${wallet.name} se activará en la Fase 2 junto a la pasarela de pagos DePay.`)}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{wallet.icon}</span>
                <span className="text-sm font-medium text-neutral-200">{wallet.name}</span>
              </div>
              {wallet.badge && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-300 border border-pink-500/30 font-mono">
                  {wallet.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {walletNotice && (
          <div className="mt-4 p-3 rounded-xl bg-pink-950/30 border border-pink-500/30 text-xs text-pink-200">
            {walletNotice}
          </div>
        )}

        <p className="text-[11px] text-center text-neutral-400 mt-6">
          Al continuar, aceptas las normas de convivencia de la crew de GTA6HUB.
        </p>
      </div>
    </div>
  );
}