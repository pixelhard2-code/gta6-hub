import { doc, runTransaction, type Firestore } from "firebase/firestore";
import { readUserProfile } from "./profiles";

export class ProfileActionError extends Error {
  constructor(public code: "self-follow" | "missing-profile" | "missing-user" | "incomplete-profile" | "invalid-name") {
    super(code);
    this.name = "ProfileActionError";
  }
}

/** An explicit state makes repeated requests and transaction retries idempotent. */
export async function setFollowState(database: Firestore, followerId: string, targetId: string, shouldFollow: boolean) {
  if (followerId === targetId) throw new ProfileActionError("self-follow");
  const followerRef = doc(database, "users", followerId);
  const targetRef = doc(database, "users", targetId);

  await runTransaction(database, async (transaction) => {
    const followerSnapshot = await transaction.get(followerRef);
    const targetSnapshot = await transaction.get(targetRef);
    if (!followerSnapshot.exists()) throw new ProfileActionError("missing-profile");
    if (!targetSnapshot.exists()) throw new ProfileActionError("missing-user");
    const follower = readUserProfile(followerId, followerSnapshot.data());
    const target = readUserProfile(targetId, targetSnapshot.data());
    // A user may still unfollow after removing their biography.
    if (shouldFollow && !follower.bio.trim()) throw new ProfileActionError("incomplete-profile");

    const following = new Set(follower.following);
    const followers = new Set(target.followers);
    if (shouldFollow) {
      following.add(targetId);
      followers.add(followerId);
    } else {
      following.delete(targetId);
      followers.delete(followerId);
    }
    // Both sides commit together; no intermediate one-sided relationship.
    transaction.update(followerRef, { following: [...following] });
    transaction.update(targetRef, { followers: [...followers] });
  });
}

export async function saveUserProfile(
  database: Firestore,
  user: { uid: string; email: string | null },
  changes: { displayName: string; bio: string; photoURL: string },
) {
  const displayName = changes.displayName.trim();
  if (displayName.length < 3 || displayName.length > 15) throw new ProfileActionError("invalid-name");
  const profileRef = doc(database, "users", user.uid);
  const fields = { uid: user.uid, email: user.email || "", displayName, bio: changes.bio.trim(), photoURL: changes.photoURL };
  await runTransaction(database, async (transaction) => {
    const snapshot = await transaction.get(profileRef);
    if (snapshot.exists()) {
      // Editing an avatar or bio must never overwrite a newer social graph or balance.
      transaction.update(profileRef, fields);
    } else {
      transaction.set(profileRef, { ...fields, reputation: 10, tickets: 0, followers: [], following: [] });
    }
  });
}
