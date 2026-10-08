import "./globals.css";
import Link from "next/link"; 

export const metadata = {
  title: "GTA 6 - Comunidad y Cuenta Regresiva",
  description: "Comunidad para esperar el lanzamiento de Grand Theft Auto VI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased bg-neutral-950 text-white min-h-screen flex flex-col selection:bg-pink-500 selection:text-white">
        
        <header className="w-full flex justify-center py-6 px-4 z-50 sticky top-0 bg-neutral-950/80 backdrop-blur-md border-b border-white/5">
          <div className="w-full max-w-5xl flex flex-col sm:flex-row justify-between items-center gap-4">
            
            <Link href="/" className="text-2xl md:text-3xl font-black tracking-tighter text-white drop-shadow-[0_0_15px_rgba(236,72,153,0.5)] hover:scale-105 transition-transform">
              GTA<span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-cyan-400">6</span>HUB
            </Link>
            
            <nav className="flex items-center gap-6 bg-neutral-900/50 px-6 py-2 rounded-full border border-neutral-800">
               <Link href="/sorteos" className="text-sm font-bold text-neutral-300 hover:text-pink-400 transition-colors tracking-wide uppercase">
                 Sorteos
               </Link>
               <div className="w-px h-4 bg-neutral-700"></div>
               <Link href="#" className="text-sm font-bold text-neutral-300 hover:text-cyan-400 transition-colors tracking-wide uppercase">
                 Foros
               </Link>
            </nav>

            <div className="flex gap-4 items-center">
                <button className="hidden md:block text-sm font-bold text-neutral-400 hover:text-white transition-colors">
                    Iniciar Sesión
                </button>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2 text-sm font-bold rounded-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 transition-all shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_30px_rgba(236,72,153,0.5)] transform hover:-translate-y-0.5"
                >
                  Instagram
                </a>
            </div>
          </div>
        </header>

        <div className="flex-grow w-full">
          {children}
        </div>

      </body>
    </html>
  );
}