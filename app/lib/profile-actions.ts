import { arrayRemove, arrayUnion, doc, getDocFromServer, runTransaction, type Firestore } from "firebase/firestore";
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

  // Atomic array transforms preserve simultaneous follows from different people.
  // Legacy duplicate lists still need normalization using the transaction snapshot.
  const graph = (follower: Record<string, unknown> | undefined, target: Record<string, unknown> | undefined) =>
    JSON.stringify([follower?.following || [], target?.followers || []]);
  for (let attempt = 0; attempt < 3; attempt++) {
    let graphAtRead: string | undefined;
    try {
      await runTransaction(database, async (transaction) => {
        const followerSnapshot = await transaction.get(followerRef);
        const targetSnapshot = await transaction.get(targetRef);
        if (!followerSnapshot.exists()) throw new ProfileActionError("missing-profile");
        if (!targetSnapshot.exists()) throw new ProfileActionError("missing-user");
        const follower = readUserProfile(followerId, followerSnapshot.data());
        const target = readUserProfile(targetId, targetSnapshot.data());
        graphAtRead = graph(followerSnapshot.data(), targetSnapshot.data());
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
        transaction.update(followerRef, {
          following: JSON.stringify(followerSnapshot.data().following) === JSON.stringify(follower.following)
            ? (shouldFollow ? arrayUnion(targetId) : arrayRemove(targetId)) : [...following],
        });
        transaction.update(targetRef, {
          followers: JSON.stringify(targetSnapshot.data().followers) === JSON.stringify(target.followers)
            ? (shouldFollow ? arrayUnion(followerId) : arrayRemove(followerId)) : [...followers],
        });
      });
      return;
    } catch (error) {
      if (attempt === 2 || (error as { code?: string }).code !== "permission-denied" || !graphAtRead) throw error;
      const [latestFollower, latestTarget] = await Promise.all([getDocFromServer(followerRef), getDocFromServer(targetRef)]);
      // Retry only a changed social graph, never a persistent permissions failure.
      if (graph(latestFollower.data(), latestTarget.data()) === graphAtRead) throw error;
    }
  }
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
