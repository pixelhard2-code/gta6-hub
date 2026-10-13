"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "@/app/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { useCurrentUserProfile } from "@/app/lib/useCurrentUserProfile";
import styles from "@/app/components/Hub.module.css";
import { getStickerPackage, STICKER_PACKAGES, validDeliveryEmail } from "@/app/lib/stickers/catalog";

const FAQ_ITEMS = [
  {
    question: "¿Dónde veo mis stickers y participaciones?",
    answer: "En Mi perfil encontrarás Mis stickers, los diseños y el número de copias adquiridas. Cada sticker de una compra confirmada equivale a una participación. Si pagas con un enlace directo de Mercado Pago, envía aquí el número de operación, el pack y el correo de entrega para validar tu compra. La entrega automática por API enviará los PNG por correo y actualizará tu colección tras aprobarse el pago.",
  },
  {
    question: "¿Cuándo se realizará el sorteo y cómo se elegirá al ganador?",
    answer: "La fecha de cierre, el procedimiento y las bases del sorteo promocional se publicarán en la comunidad y en la página de Sorteos antes de habilitar la venta de stickers digitales. El ganador se seleccionará de manera transparente y verificable.",
  },
  {
    question: "¿Por qué se exige una biografía para seguir a otros usuarios o publicar?",
    answer: "Para mantener una comunidad activa y evitar cuentas bots o spam. Exigimos que cada miembro presente brevemente a su personaje o expectativas de GTA VI antes de interactuar en la crew.",
  },
  {
    question: "¿Qué puedo hacer si encuentro un bug o un usuario problemático?",
    answer: "Puedes utilizar el formulario de esta página seleccionando 'Reporte de Bug' o 'Reportar contenido'. Nuestro equipo revisará el incidente a la brevedad.",
  },
];

export default function SoportePage() {
  const { user, profile } = useCurrentUserProfile();
  const [topic, setTopic] = useState("tickets");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [paymentOperation, setPaymentOperation] = useState("");
  const [stickerPackage, setStickerPackage] = useState("basic");
  const isStickerPayment = topic === "sticker-payment";
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("motivo") === "sticker-payment") setTopic("sticker-payment");
    const pack = getStickerPackage(params.get("paquete"));
    if (pack) setStickerPackage(pack.id);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !message.trim()) return;
    if (isStickerPayment && (!user || !/^[1-9]\d*$/.test(paymentOperation.trim()) || !validDeliveryEmail(email.trim() || user.email))) {
      setError(!user ? "Inicia sesión desde el botón superior para asociar la compra a tu perfil." : "Introduce el número de operación y un correo válido para recibir tus stickers.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const contactEmail = email.trim() || user?.email || "Sin email especificado";
    const contactName = name.trim() || profile?.displayName || user?.displayName || "Miembro de la Crew";
    const generatedTicket = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      await addDoc(collection(db, "support_tickets"), {
        ticketCode: generatedTicket,
        topic,
        name: contactName,
        email: contactEmail,
        message: message.trim(),
        userId: user?.uid || null,
        createdAt: Date.now(),
        status: "open",
        ...(isStickerPayment ? { paymentOperationId: paymentOperation.trim(), stickerPackageId: stickerPackage, deliveryEmail: contactEmail, paymentVerification: "pending-merchant-review" } : {}),
      });
      setTicketId(generatedTicket);
      setMessage("");
      setPaymentOperation("");
    } catch {
      setError("No se pudo guardar tu solicitud. Conservamos los datos para que vuelvas a intentarlo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.topline}>
          <span>LeonidaCrew / Centro de Ayuda</span>
          <Link href="/comunidad">Ir al muro de la crew ↗</Link>
        </div>

        <header className="mb-10">
          <p className={styles.eyebrow}>Asistencia a la comunidad</p>
          <h1 className={styles.pageTitle}>¿En qué podemos ayudarte?</h1>
          <p className={styles.subtitle}>
            Respuestas a dudas frecuentes sobre el sorteo de PS5, tu cuenta y canales de contacto directo con los moderadores.
          </p>
        </header>

        {/* Status card */}
        <div className="mb-10 p-4 rounded-xl bg-[#14141c] border border-neutral-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-sm font-semibold text-neutral-200">
              Stickers con enlaces directos: <strong className="text-emerald-400 font-bold">Validación manual</strong>
            </span>
          </div>
          <span className="text-xs text-neutral-400 font-mono">
            El envío por correo se realiza después de revisar la compra.
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* FAQ Column */}
          <section className="lg:col-span-7 flex flex-col gap-6" aria-labelledby="faq-section-title">
            <div>
              <h2 id="faq-section-title" className="text-xl font-bold text-white mb-2">
                Preguntas Frecuentes
              </h2>
              <p className="text-sm text-neutral-400">
                Las consultas más habituales de los miembros de Vice City.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {FAQ_ITEMS.map((item, index) => (
                <details
                  key={index}
                  className="group bg-[#161720] border border-neutral-800 rounded-xl overflow-hidden transition-colors"
                >
                  <summary className="p-4 cursor-pointer font-semibold text-sm text-neutral-200 group-hover:text-pink-300 list-none flex justify-between items-center select-none">
                    <span>{item.question}</span>
                    <span className="text-pink-400 text-lg group-open:rotate-45 transition-transform font-mono">
                      +
                    </span>
                  </summary>
                  <div className="px-4 pb-4 text-xs leading-relaxed text-neutral-400 border-t border-neutral-800/40 pt-3">
                    {item.answer}
                  </div>
                </details>
              ))}
            </div>

            {/* Direct Channels */}
            <div className="mt-4 p-6 rounded-2xl bg-gradient-to-br from-[#1b1725] to-[#121319] border border-pink-500/20">
              <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                <span>💬</span> Comunidad & Redes Oficiales
              </h3>
              <p className="text-xs text-neutral-300 mb-4 leading-relaxed">
                Únete a la conversación directa con otros fans, debate teorías y mantente al tanto de los próximos sorteos.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/comunidad"
                  className="px-4 py-2 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/40 text-pink-200 text-xs font-bold transition-colors"
                >
                  Entrar al Muro ↗
                </Link>
                <Link
                  href="/sorteos"
                  className="px-4 py-2 rounded-lg bg-[#252230] hover:bg-[#322e42] text-neutral-200 text-xs font-semibold transition-colors"
                >
                  Bases del Sorteo ↗
                </Link>
              </div>
            </div>
          </section>

          {/* Contact Form Column */}
          <section className="lg:col-span-5 bg-[#14141c] border border-neutral-800 rounded-2xl p-6 shadow-xl" aria-labelledby="contact-form-title">
            <h2 id="contact-form-title" className="text-lg font-bold text-white mb-1">
              Enviar Consulta o Reporte
            </h2>
            <p className="text-xs text-neutral-400 mb-6">
              ¿No encontraste lo que buscabas? Déjanos un mensaje y te responderemos.
            </p>

            {ticketId ? (
              <div className="p-5 rounded-xl bg-pink-950/30 border border-pink-500/40 text-center animate-in fade-in">
                <div className="w-12 h-12 bg-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-3 text-pink-300 text-2xl">
                  ✓
                </div>
                <h3 className="text-base font-bold text-white mb-1">¡Mensaje Enviado!</h3>
                <p className="text-xs text-neutral-300 mb-3">
                  Hemos registrado tu solicitud con el código de seguimiento:
                </p>
                <div className="font-mono font-bold text-sm bg-black/40 py-2 px-3 rounded text-pink-300 inline-block mb-4">
                  #{ticketId}
                </div>
                <p className="text-[11px] text-neutral-400 mb-4">
                  Revisaremos tu mensaje a la brevedad. Gracias por ser parte de LeonidaCrew.
                </p>
                <button
                  type="button"
                  onClick={() => setTicketId(null)}
                  className="text-xs text-pink-400 hover:underline font-semibold"
                >
                  Enviar otra consulta
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label htmlFor="support-topic" className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Motivo de contacto
                  </label>
                  <select
                    id="support-topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full bg-[#1b1c26] border border-neutral-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-pink-500"
                  >
                    <option value="tickets">Consulta sobre Stickers o Sorteo</option>
                    <option value="sticker-payment">Registrar compra de stickers</option>
                    <option value="bug">Reportar un error o Bug en la web</option>
                    <option value="account">Problema con mi Cuenta o Perfil</option>
                    <option value="moderation">Reportar contenido o usuario</option>
                    <option value="suggestion">Sugerencia para la plataforma</option>
                    <option value="other">Otro asunto</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="support-name" className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Tu nombre o usuario
                  </label>
                  <input
                    id="support-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={profile?.displayName || user?.displayName || "Ej: JugadorViceCity"}
                    className="w-full bg-[#1b1c26] border border-neutral-700 rounded-lg p-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label htmlFor="support-email" className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    {isStickerPayment ? "Correo para recibir tus stickers *" : "Correo electrónico de respuesta"}
                  </label>
                  <input
                    id="support-email"
                    type="email"
                    required={isStickerPayment && !user?.email}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={user?.email || "tu-correo@ejemplo.com"}
                    className="w-full bg-[#1b1c26] border border-neutral-700 rounded-lg p-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-pink-500"
                  />
                </div>

                {isStickerPayment && <fieldset className="flex flex-col gap-3 border border-pink-500/20 rounded-lg p-3">
                  <legend className="text-xs font-semibold text-pink-200 px-1">Datos de la compra</legend>
                  <label className="text-xs text-neutral-300" htmlFor="support-payment-operation">Número de operación de Mercado Pago *<input id="support-payment-operation" required inputMode="numeric" pattern="[1-9][0-9]*" maxLength={30} value={paymentOperation} onChange={(event) => setPaymentOperation(event.target.value)} className="w-full mt-1 bg-[#1b1c26] border border-neutral-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-pink-500" /></label>
                  <label className="text-xs text-neutral-300" htmlFor="support-sticker-pack">Pack que compraste<select id="support-sticker-pack" value={stickerPackage} onChange={(event) => setStickerPackage(event.target.value)} className="w-full mt-1 bg-[#1b1c26] border border-neutral-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-pink-500">{STICKER_PACKAGES.map(pack => <option key={pack.id} value={pack.id}>{pack.name} · {pack.stickers} {pack.stickers === 1 ? "sticker" : "stickers"}</option>)}</select></label>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">Revisaremos la operación en nuestra cuenta de Mercado Pago. Registrar la solicitud todavía no acredita stickers. {user ? "Tu cuenta quedará asociada a esta solicitud." : "Inicia sesión para vincularla a tu perfil."}</p>
                </fieldset>}

                <div>
                  <label htmlFor="support-message" className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Detalle de tu mensaje *
                  </label>
                  <textarea
                    id="support-message"
                    required
                    rows={4}
                    maxLength={1500}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Cuéntanos con detalle tu consulta, duda o el fallo que experimentaste..."
                    className="w-full bg-[#1b1c26] border border-neutral-700 rounded-lg p-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-pink-500 resize-none"
                  />
                </div>

                {error && (
                  <p role="alert" className="text-xs text-[#f3b5a7]">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !message.trim()}
                  className="w-full py-3 px-4 rounded-xl bg-[#f3b5a7] hover:bg-[#f8cbc2] text-[#241820] font-bold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                >
                  {isSubmitting ? "Enviando solicitud..." : "Enviar mensaje a soporte →"}
                </button>
              </form>
            )}
          </section>
        </div>

        <footer className={styles.footer}>
          <span>LeonidaCrew · Centro de Ayuda para la comunidad de fans. No afiliado a Rockstar Games.</span>
          <Link href="/">Volver al inicio ↗</Link>
        </footer>
      </div>
    </div>
  );
}
