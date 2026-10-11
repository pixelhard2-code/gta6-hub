"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "./firebase";
import { readUserProfile, type UserProfile } from "./profiles";

export function useCurrentUserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let version = 0;
    let stopProfile = () => {};
    const stopAuth = onAuthStateChanged(auth, (currentUser) => {
      const currentVersion = ++version;
      stopProfile();
      stopProfile = () => {};
      setUser(currentUser);
      setProfile(null);
      setError("");
      setLoading(Boolean(currentUser));
      if (!currentUser) return;
      stopProfile = onSnapshot(doc(db, "users", currentUser.uid), (snapshot) => {
        if (!active || currentVersion !== version) return;
        setProfile(snapshot.exists() ? readUserProfile(snapshot.id, snapshot.data()) : null);
        setLoading(false);
      }, () => {
        if (!active || currentVersion !== version) return;
        setError("No pudimos cargar tu perfil. Recarga la página para volver a intentarlo.");
        setLoading(false);
      });
    });
    return () => { active = false; stopAuth(); stopProfile(); };
  }, []);

  return { user, profile, loading, error };
}
