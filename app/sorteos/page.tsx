import Link from "next/link";

export default function SorteosPage() {
  return (
    <main className="w-full flex flex-col items-center p-4 md:p-8 relative overflow-hidden">
      
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none opacity-30 -z-10"></div>
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-600/10 blur-[150px] pointer-events-none rounded-full -z-10"></div>

      <nav className="w-full max-w-5xl flex items-center mb-6 z-10 relative mt-4">
        <Link className="text-pink-500 hover:text-pink-400 flex items-center gap-2 font-black tracking-widest uppercase transition-colors text-sm" href="/">
          ← Volver a la Base
        </Link>
      </nav>

      <section className="w-full max-w-5xl flex flex-col items-center text-center z-10 relative">
        
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-900/30 border border-pink-500/30 backdrop-blur-sm mb-6">
          <span className="text-xl">🎟️</span>
          <span className="text-xs md:text-sm font-bold tracking-widest text-pink-400 uppercase">Sorteos Oficiales</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 uppercase">
          Participa y <br className="md:hidden" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">Gana</span>
        </h1>
        <p className="text-neutral-400 max-w-2xl text-sm md:text-base mb-12">
          Participa gratis por consolas, periféricos y copias de Grand Theft Auto VI. Los usuarios más activos en nuestra comunidad tienen más posibilidades de ganar.
        </p>

        <div className="w-full bg-black/60 border border-pink-500/30 rounded-[2rem] p-6 md:p-10 backdrop-blur-xl shadow-[0_0_50px_rgba(236,72,153,0.05)] flex flex-col md:flex-row items-center gap-8 md:gap-12 text-left relative overflow-hidden group">
          
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

          <div className="w-full md:w-1/3 aspect-square bg-gradient-to-br from-neutral-900 to-black rounded-3xl border border-white/5 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
            <span className="text-8xl transform group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_0_20px_rgba(236,72,153,0.5)]">🎮</span>
            <div className="absolute bottom-4 bg-pink-500 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
               Premio Mayor
            </div>
          </div>

          <div className="w-full md:w-2/3 flex flex-col items-start z-10">
            <div className="bg-green-500/10 text-green-400 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-widest mb-4 border border-green-500/20">
              🟢 Estado: Activo
            </div>
            
            <h2 className="text-3xl md:text-4xl font-black mb-3 text-white">PlayStation 5 Pro</h2>
            
            <p className="text-neutral-400 mb-6 text-sm md:text-base leading-relaxed">
              Llévate la consola definitiva para jugar a GTA 6 en todo su esplendor. El sorteo se realizará en directo a través de nuestro Instagram.
            </p>

            <div className="w-full bg-neutral-950/80 rounded-2xl p-5 border border-white/5 mb-8">
              <h4 className="text-xs text-neutral-500 uppercase font-black tracking-widest mb-3">Cómo participar:</h4>
              <ul className="text-sm text-neutral-300 space-y-3 font-medium">
                <li className="flex items-center gap-3"><span className="text-green-400">✔️</span> Crear una cuenta en GTA 6 HUB (Próximamente)</li>
                <li className="flex items-center gap-3"><span className="text-green-400">✔️</span> Seguir nuestra página de Instagram</li>
                <li className="flex items-center gap-3 text-pink-400"><span className="text-pink-400">⭐</span> Bono: Nivel 5 de usuario otorga doble participación</li>
              </ul>
            </div>

            <button className="w-full md:w-auto px-8 py-4 text-base font-black rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:from-pink-500 hover:to-purple-500 transition-all shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_40px_rgba(236,72,153,0.5)] transform hover:-translate-y-1 uppercase tracking-widest">
              Unirse al Sorteo
            </button>
          </div>
        </div>
      </section>
      
    </main>
  );
}