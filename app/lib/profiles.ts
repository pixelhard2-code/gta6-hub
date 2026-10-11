export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  bio: string;
  reputation: number;
  tickets: number;
  followers: string[];
  following: string[];
}

export function uniqueUserIds(value: unknown): string[] {
  return Array.isArray(value)
    ? [...new Set(value.filter((id): id is string => typeof id === "string" && id.length > 0))]
    : [];
}

export function readUserProfile(uid: string, data: Record<string, unknown>): UserProfile {
  const text = (value: unknown) => typeof value === "string" ? value : "";
  const count = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? value : 0;
  return {
    uid,
    email: text(data.email),
    displayName: text(data.displayName || data.username || data.nombreUsuario || data.usuario || data.name) || "Jugador",
    photoURL: text(data.photoURL || data.avatar || data.foto),
    bio: text(data.bio),
    reputation: count(data.reputation),
    tickets: count(data.tickets),
    followers: uniqueUserIds(data.followers).filter((id) => id !== uid),
    following: uniqueUserIds(data.following).filter((id) => id !== uid),
  };
}
