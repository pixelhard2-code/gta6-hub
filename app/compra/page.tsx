import type { Metadata } from "next";
import PurchaseStatus from "@/app/components/PurchaseStatus";
import styles from "@/app/components/Hub.module.css";

export const metadata: Metadata = { title: "Estado de tu compra", robots: { index: false, follow: false } };

export default function PurchasePage() {
  return <div className={styles.page}><div className={styles.shell}>
    <p className={styles.eyebrow}>LeonidaCrew / Tus stickers</p>
    <h1 className={styles.pageTitle}>Estado de tu compra</h1>
    <PurchaseStatus />
  </div></div>;
}
