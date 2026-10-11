"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { db } from "@/app/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { readUserProfile, type UserProfile } from "@/app/lib/profiles";
import { PROFILE_AVATARS } from "@/app/lib/avatars";

interface UserListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  userIds: string[];
}

export default function UserListModal({
  isOpen,
  onClose,
  title,
  userIds,
}: UserListModalProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    const fetchUsers = async () => {
      if (userIds.length === 0) {
        setUsers([]);
        return;
      }

      setLoading(true);
      try {
        const uniqueIds = Array.from(new Set(userIds)).slice(0, 30);
        const docs = await Promise.all(
          uniqueIds.map(async (uid) => {
            try {
              const snap = await getDoc(doc(db, "users", uid));
              if (snap.exists()) {
                return readUserProfile(snap.id, snap.data() || {});
              }
              return null;
            } catch {
              return null;
            }
          })
        );

        if (active) {
          setUsers(docs.filter((item): item is UserProfile => item !== null));
        }
      } catch (err) {
        console.error("Error cargando usuarios:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchUsers();
    return () => {
      active = false;
    };
  }, [isOpen, userIds]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-list-title"
        className="bg-[#121319] border border-neutral-800 rounded-2xl w-full max-w-md max-h-[85dvh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-neutral-800/80 flex items-center justify-between">
          <h2 id="user-list-title" className="text-base font-bold text-white flex items-center gap-2">
            <span>{title}</span>
            <span className="text-xs font-mono font-normal text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded-full">
              {userIds.length}
            </span>
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/60 transition-colors"
            aria-label="Cerrar modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex flex-col gap-3 flex-1 min-h-[220px]">
          {loading ? (
            <div className="flex flex-col gap-3 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse p-2 rounded-xl bg-neutral-900/40">
                  <div className="w-10 h-10 rounded-full bg-neutral-800" />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="w-24 h-3 bg-neutral-800 rounded" />
                    <div className="w-40 h-2.5 bg-neutral-800/60 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : userIds.length === 0 || users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
              <span className="text-3xl">👥</span>
              <p className="text-sm font-semibold text-neutral-300">No hay jugadores aquí</p>
              <p className="text-xs text-neutral-500 max-w-xs">
                Aún no hay perfiles registrados en esta lista.
              </p>
            </div>
          ) : (
            users.map((item) => (
              <div
                key={item.uid}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#161720] hover:bg-[#1b1c28] border border-neutral-800/60 transition-colors"
              >
                <Link
                  href={`/usuario/${item.uid}`}
                  onClick={onClose}
                  className="flex items-center gap-3 min-w-0 flex-1 mr-3"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-[#241c2c] border border-neutral-700 flex-shrink-0 flex items-center justify-center text-sm font-bold text-pink-300">
                    {item.photoURL ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.photoURL}
                        alt={item.displayName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = PROFILE_AVATARS[0].src;
                        }}
                      />
                    ) : (
                      item.displayName.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <strong className="text-sm font-bold text-white truncate hover:text-pink-300 transition-colors">
                      {item.displayName}
                    </strong>
                    {item.bio ? (
                      <span className="text-xs text-neutral-400 truncate">
                        {item.bio}
                      </span>
                    ) : (
                      <span className="text-[11px] text-neutral-500 font-mono">
                        Miembro de la Crew
                      </span>
                    )}
                  </div>
                </Link>

                <Link
                  href={`/usuario/${item.uid}`}
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-lg bg-[#252230] hover:bg-white hover:text-black text-xs font-semibold text-neutral-200 transition-all flex-shrink-0"
                >
                  Ver
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
