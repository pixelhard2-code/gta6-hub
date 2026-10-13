"use client";
import { useCallback, useEffect, useState } from "react";
import type { User } from "firebase/auth";

export interface StickerPurchase { id: string; quantity: number; packageId: string; status: string; email: string; createdAt: number; delivery: string }
export interface StickerCollectionData { configured: boolean; total: number; counts: Record<string, number>; orders: StickerPurchase[] }
const EMPTY: StickerCollectionData = { configured: false, total: 0, counts: {}, orders: [] };

export function useStickerCollection(user: User | null, publicUid?: string, enabled = true) {
  const [data, setData] = useState<StickerCollectionData>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((value) => value + 1), []);
  useEffect(() => {
    let active = true;
    let busy = false;
    const controller = new AbortController();
    setData(EMPTY);
    setError("");
    if (!enabled || (!user && !publicUid)) { setLoading(false); return; }
    setLoading(true);
    const load = async () => {
      if (busy || !active) return;
      busy = true;
      try {
        const token = publicUid ? null : await user!.getIdToken();
        const response = await fetch(publicUid ? `/api/stickers/collection/${encodeURIComponent(publicUid)}` : "/api/stickers/collection", { headers: token ? { Authorization: `Bearer ${token}` } : {}, cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("collection-failed");
        const result = await response.json();
        if (active) { setData({ ...EMPTY, ...result }); setError(""); }
      } catch { if (active && !controller.signal.aborted) setError("No pudimos cargar los stickers. Vuelve a intentarlo."); }
      finally { busy = false; if (active) setLoading(false); }
    };
    void load();
    const onFocus = () => { if (document.visibilityState === "visible") void load(); };
    const timer = window.setInterval(onFocus, 20000);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => { active = false; controller.abort(); window.clearInterval(timer); window.removeEventListener("focus", onFocus); document.removeEventListener("visibilitychange", onFocus); };
  }, [user, publicUid, revision, enabled]);
  return { data, loading, error, refresh };
}
