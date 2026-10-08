import Link from "next/link";

export default function PerfilPage() {
  return (
    <main className="w-full max-w-6xl mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-6 relative z-10 font-sans">
      
      {/* =========================================
          COLUMNA IZQUIERDA (Perfil Principal)
      ========================================= */}
      <div className="w-full lg:w-2/3 flex flex-col gap-6">
        
        {/* Tarjeta Superior */}
        <div className="bg-[#121319] border border-neutral-800 rounded-2xl overflow-hidden shadow-lg">
          {/* Banner */}
          <div className="h-40 md:h-48 w-full bg-gradient-to-r from-[#1a1b26] to-[#241b2d] relative border-b border-neutral-800/50">
             <div className="absolute inset-0 bg-[radial-gradient(#ffffff10_1px,transparent_1px)] [background-size:20px_20px]"></div>
          </div>

          <div className="px-6 pb-6 relative">
            {/* Fila del Avatar y Botones de Acción */}
            <div className="flex justify-between items-end -mt-12 md:-mt-16 mb-4">
              
              {/* Avatar */}
              <div className="w-24 h-24 md:w-32 md:h-32 bg-[#1e2029] rounded-full flex items-center justify-center text-5xl shadow-xl overflow-hidden relative z-10 border-4 border-[#121319]">
                😎
              </div>

              {/* Botones */}
              <div className="flex items-center gap-3 mb-2">
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1b1c26] hover:bg-[#252633] text-[15px] font-semibold text-white transition-colors h-10">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-300">
                    <circle cx="12" cy="8" r="7"></circle>
                    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
                  </svg>
                  <span>Logros</span>
                </button>
                
                <button className="flex items-center justify-center px-3 py-2 rounded-xl bg-[#1b1c26] hover:bg-[#252633] text-white transition-colors h-10 w-11">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-300">
                    <path d="M11 5L16 10L11 15"></path>
                    <path d="M16 10H8C5.79086 10 4 11.7909 4 14V19"></path>
                  </svg>
                </button>

                <button className="px-4 py-2 rounded-xl bg-[#1b1c26] hover:bg-[#252633] text-[15px] font-semibold text-white transition-colors h-10">
                  Editar perfil
                </button>
              </div>
            </div>

            {/* Información del Usuario */}
            <h1 className="text-[26px] font-bold text-white mb-3 tracking-tight [text-shadow:0.5px_0_0_rgba(255,255,255,0.5)]">
              PixelHard
            </h1>
            
            {/* Seguidores y Siguiendo */}
            <div className="flex gap-8 text-[15px] font-medium mt-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-white font-semibold">0</span>
                <span className="text-[#6c7083]">Seguidores</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-white font-semibold">0</span>
                <span className="text-[#6c7083]">Siguiendo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tarjeta Inferior: Actividad y Nivel */}
        <div className="bg-[#121319] border border-neutral-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[15px] font-semibold flex items-center gap-2 text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-500">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="9" y1="21" x2="9" y2="9"></line>
              </svg>
              Estadísticas de Actividad
            </h2>
            <span className="text-[13px] font-semibold px-2.5 py-1 rounded-md bg-[#1b1c26] text-[#6c7083]">
              Nivel 4
            </span>
          </div>

          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-[13px] text-[#6c7083] mb-1">Reputación Total (RP)</p>
              <h3 className="text-[32px] font-bold text-white tracking-tight">4,250</h3>
            </div>
            
            <div className="flex bg-[#1b1c26] rounded-lg p-1 gap-1">
              <button className="px-3 py-1.5 text-[13px] font-semibold rounded-md text-[#6c7083] hover:text-white transition-colors">1D</button>
              <button className="px-3 py-1.5 text-[13px] font-semibold rounded-md bg-[#2d2f3d] text-white shadow-sm">1W</button>
              <button className="px-3 py-1.5 text-[13px] font-semibold rounded-md text-[#6c7083] hover:text-white transition-colors">1M</button>
            </div>
          </div>

          <div className="w-full h-1.5 bg-[#1b1c26] rounded-full overflow-hidden mb-3">
            <div className="h-full bg-pink-500 w-[65%] rounded-full"></div>
          </div>
          <p className="text-[13px] text-[#6c7083] text-right font-medium">750 RP para Nivel 5</p>
        </div>

      </div>

      {/* =========================================
          COLUMNA DERECHA (Configuración y Actividad)
      ========================================= */}
      <div className="w-full lg:w-1/3 flex flex-col gap-6">
        
        {/* Panel de Cuenta */}
        <div className="bg-[#121319] border border-neutral-800 rounded-2xl flex flex-col overflow-hidden shadow-lg">
          
          <div className="p-4 border-b border-neutral-800/50 flex justify-between items-center cursor-pointer hover:bg-[#1b1c26]/50 transition-colors">
            <h2 className="font-semibold text-[15px] text-white">Cuenta</h2>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#6c7083]">
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
          </div>

          <div className="p-4 flex flex-col gap-3">
            
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#16171e] border border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-orange-500/10">
                  <span className="text-orange-500 text-lg">🦊</span>
                </div>
                <div>
                  <p className="text-[12px] text-[#6c7083] mb-0.5">Conectado con</p>
                  <p className="text-[14px] font-semibold text-white leading-none">
                    MetaMask <span className="font-normal text-[#6c7083]">· billetera</span>
                  </p>
                </div>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#6c7083] cursor-pointer hover:text-white">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#16171e] border border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-red-500/10">
                  <span className="text-red-500 text-lg">G</span>
                </div>
                <div>
                  <p className="text-[12px] text-[#6c7083] mb-0.5">Vincular correo</p>
                  <p className="text-[14px] font-semibold text-white leading-none">
                    Google <span className="font-normal text-[#6c7083]">· social</span>
                  </p>
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#6c7083] cursor-pointer hover:text-white">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
            </div>

            <hr className="border-neutral-800/50 my-2" />

            <button className="flex items-center gap-3 text-[14px] font-medium text-[#c4c7d3] hover:text-white transition-colors py-1.5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#6c7083]">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              Soporte
            </button>
            
            <button className="flex items-center gap-3 text-[14px] font-medium text-[#c4c7d3] hover:text-white transition-colors py-1.5 mb-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#6c7083]">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
              Idioma
            </button>

            <button className="w-full py-2.5 rounded-xl bg-[#2a1c24] hover:bg-[#35212c] text-[#ef4444] font-semibold text-[14px] transition-colors flex items-center justify-center gap-2 mt-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Cerrar sesión
            </button>
          </div>
        </div>

        {/* Panel Inferior Derecho */}
        <div className="bg-[#121319] border border-neutral-800 rounded-2xl flex flex-col overflow-hidden shadow-lg min-h-[220px]">
          <div className="p-4 border-b border-neutral-800/50">
            <h2 className="font-semibold text-[15px] text-white">Mejores aportes</h2>
          </div>
          <div className="flex-grow flex items-center justify-center p-6 text-[14px] text-[#6c7083]">
            No hay aportes disponibles
          </div>
        </div>

      </div>
    </main>
  );
}