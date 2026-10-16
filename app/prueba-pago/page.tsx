import type { Metadata } from "next";
import StickerCheckout from "@/app/components/StickerCheckout";
import styles from "@/app/components/Hub.module.css";

export const metadata: Metadata = { title: "Prueba privada de pago", robots: { index: false, follow: false } };

export default function PaymentTrialPage() {
  return <div className={styles.page}><div className={styles.shell}>
    <p className={styles.eyebrow}>LeonidaCrew / Configuración de pagos</p>
    <h1 className={styles.pageTitle}>Prueba de Mercado Pago</h1>
    <p className={styles.subtitle}>Inicia sesión con la cuenta de LeonidaCrew autorizada. Probaremos el pack de 1 sticker y su entrega al correo indicado. Verás el importe simulado antes de abrir Mercado Pago.</p>
    <section className="mt-8 max-w-xl rounded-2xl border border-pink-500/20 bg-[#14141c] p-6">
      <StickerCheckout packageId="basic" testOnly />
    </section>
  </div></div>;
}
