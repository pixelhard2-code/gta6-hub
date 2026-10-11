import type { Metadata } from "next";
import Link from "next/link";
import styles from "@/app/components/Hub.module.css";

export const metadata: Metadata = {
  title: "Novedades y Tráilers Oficiales de GTA VI",
  description:
    "Todos los detalles confirmados de Grand Theft Auto VI por Rockstar Games: tráiler oficial 1, análisis de Jason y Lucia, el mapa del estado de Leonida y capturas en 4K.",
  openGraph: {
    title: "GTA6HUB | Novedades Oficiales de Grand Theft Auto VI",
    description:
      "Tráiler oficial de Rockstar Games, protagonistas Lucia y Jason, locaciones de Vice City y especificaciones técnicas.",
    images: ["/gta6-cover.jpg"],
  },
};

const TRAILER_STATS = [
  { label: "Récord Guinness", value: "93M+ vistas en 24h" },
  { label: "Banda Sonora", value: "Tom Petty — 'Love Is A Long Road'" },
  { label: "Plataformas", value: "PlayStation 5 · Xbox Series X|S" },
  { label: "Lanzamiento", value: "Noviembre 2026" },
];

const LOCATIONS = [
  {
    name: "Vice City & Ocean Beach",
    category: "Metrópolis y Vida Nocturna",
    desc: "Bulevares llenos de palmeras, hoteles art déco en Ocean Drive, clubes exclusivos y yates de lujo. El corazón palpitante del estado.",
    badge: "Urbano / Playas",
  },
  {
    name: "Kelly County & Manglares",
    category: "Pantanos y Vida Silvestre",
    desc: "Zonas pantanosas salvajes navegables en hidrodeslizador. Caimanes, pesca furtiva, barro y comunidades rurales aisladas.",
    badge: "Naturaleza Salvaje",
  },
  {
    name: "Port Gellhorn & Bahía",
    category: "Distritos Industriales y Calle",
    desc: "Puertos de carga, talleres de modificación, autopistas y carreras callejeras ilegales fuera de la vigilancia costera.",
    badge: "Bajos Fondos",
  },
  {
    name: "Cayos de Leonida (Keys)",
    category: "Archipiélago y Puentes Marítimos",
    desc: "Carreteras eternas sobre el mar turquesa conectando pequeñas islas con puertos pesqueros y mansiones privadas.",
    badge: "Islas y Costas",
  },
];

const KEY_FACTS = [
  {
    title: "Lucia y Jason: La Dinámica de la Pareja",
    content:
      "Inspirados en la mística de Bonnie & Clyde, Jason y Lucia protagonizan una historia de lealtad criminal en una Leonida contemporánea hiperconectada a las redes sociales.",
    icon: "👥",
  },
  {
    title: "Motor Gráfico RAGE 9 de Nueva Generación",
    content:
      "Física avanzada de fluidos marítimos, iluminación global por trazado de rayos y densidades de peatones y tráfico vehicular sin precedentes en la industria.",
    icon: "⚡",
  },
  {
    title: "Sátira Digital y Redes Sociales",
    content:
      "El tráiler confirmó que las transmisiones en vivo estilo TikTok e Instagram serán una parte orgánica del mundo y de las misiones secundarias del juego.",
    icon: "📱",
  },
  {
    title: "Exclusivo de Consolas de Nueva Generación",
    content:
      "Rockstar Games confirmó su llegada inicial para PlayStation 5 y Xbox Series X|S, aprovechando toda la potencia de sus discos SSD ultrarrápidos.",
    icon: "🎮",
  },
];

export default function NovedadesPage() {
  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.topline}>
          <span>GTA6HUB / Centro de Noticias Oficiales</span>
          <Link href="/sorteos">Ver sorteo de PS5 ↗</Link>
        </div>

        <header className="mb-10">
          <p className={styles.eyebrow}>Rockstar Games / Gran Theft Auto VI</p>
          <h1 className={styles.pageTitle}>
            Bienvenido a Leonida.<br />
            Todo lo confirmado de GTA VI.
          </h1>
          <p className={styles.subtitle}>
            El archivo oficial de la crew con los tráilers de Rockstar Games, datos del mapa de Vice City y especificaciones de estreno.
          </p>
        </header>

        {/* === SECCIÓN TRÁILER OFICIAL 1 === */}
        <section aria-labelledby="trailer-title" className="mb-14">
          <div className="bg-[#121319] border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 md:p-8 border-b border-neutral-800/80 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-mono text-pink-400 uppercase tracking-widest block mb-1">
                  Tráiler Oficial 1
                </span>
                <h2 id="trailer-title" className="text-xl md:text-2xl font-bold text-white">
                  Grand Theft Auto VI Trailer 1
                </h2>
              </div>
              <a
                href="https://www.youtube.com/watch?v=QdBZY2fkU-0"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 transition-colors flex items-center gap-2"
              >
                <span>Ver en YouTube</span>
                <span aria-hidden="true">↗</span>
              </a>
            </div>

            {/* Video Container */}
            <div className="relative aspect-video w-full bg-black">
              <iframe
                src="https://www.youtube-nocookie.com/embed/QdBZY2fkU-0"
                title="Grand Theft Auto VI Trailer 1 de Rockstar Games"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-0"
              />
            </div>

            {/* Trailer Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-[#161720] border-t border-neutral-800/60">
              {TRAILER_STATS.map((stat, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-500">
                    {stat.label}
                  </span>
                  <strong className="text-xs md:text-sm font-semibold text-neutral-200">
                    {stat.value}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* === DATOS Y PILARES CLAVE === */}
        <section aria-labelledby="facts-title" className="mb-14">
          <div className="mb-6">
            <p className={styles.eyebrow}>Lo que sabemos</p>
            <h2 id="facts-title" className="text-2xl font-bold text-white">
              Pilares Clave del Juego
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {KEY_FACTS.map((fact, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl bg-[#14141c] border border-neutral-800 hover:border-neutral-700 transition-colors flex flex-col gap-3 shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{fact.icon}</span>
                  <h3 className="text-base font-bold text-white">
                    {fact.title}
                  </h3>
                </div>
                <p className="text-xs md:text-sm text-neutral-400 leading-relaxed">
                  {fact.content}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* === MAPA Y UBICACIONES DE LEONIDA === */}
        <section aria-labelledby="locations-title" className="mb-14">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className={styles.eyebrow}>El Estado de Leonida</p>
              <h2 id="locations-title" className="text-2xl font-bold text-white">
                Las Regiones de Vice City y Alrededores
              </h2>
            </div>
            <span className="text-xs font-mono text-pink-400 border border-pink-500/30 px-3 py-1 rounded-full">
              4 Zonas Principales Reveladas
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {LOCATIONS.map((loc, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-[#14141c] border border-neutral-800 flex flex-col justify-between gap-4 shadow-lg hover:border-neutral-700 transition-colors"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-pink-300">
                      {loc.category}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400 bg-neutral-800/80 px-2 py-0.5 rounded">
                      {loc.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white">{loc.name}</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    {loc.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* === CALL TO ACTION === */}
        <section className="p-8 md:p-10 rounded-3xl bg-gradient-to-r from-[#211528] via-[#161420] to-[#121319] border border-pink-500/30 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
          <div className="max-w-xl">
            <span className="text-xs font-mono uppercase tracking-widest text-pink-400 block mb-2">
              Únete a la conversación
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3">
              ¿Qué teoría tienes sobre el próximo tráiler?
            </h2>
            <p className="text-xs md:text-sm text-neutral-300 leading-relaxed">
              La comunidad de GTA6HUB comparte teorías, análisis fotograma a fotograma y participa por la consola de su próxima partida.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/comunidad"
              className="px-6 py-3.5 rounded-xl bg-[#f3b5a7] hover:bg-[#f8cbc2] text-[#241820] text-xs font-bold transition-all shadow-md"
            >
              Entrar al Muro ↗
            </Link>
            <Link
              href="/sorteos#tickets"
              className="px-6 py-3.5 rounded-xl bg-[#282030] hover:bg-[#352840] text-neutral-200 border border-neutral-700 text-xs font-semibold transition-all"
            >
              Participar en el Sorteo ↗
            </Link>
          </div>
        </section>

        <footer className={styles.footer}>
          <span>GTA6HUB · Información recopilada para fans. Grand Theft Auto es marca registrada de Rockstar Games / Take-Two Interactive.</span>
          <a
            href="https://www.rockstargames.com/VI"
            target="_blank"
            rel="noopener noreferrer"
          >
            Sitio Oficial de Rockstar Games ↗
          </a>
        </footer>
      </div>
    </div>
  );
}
