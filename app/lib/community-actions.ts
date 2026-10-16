import { collection, doc, getDocFromServer, increment, writeBatch, type Firestore } from "firebase/firestore";

interface CommunityReply {
  authorId: string;
  authorName: string;
  authorPhoto: string;
  content: string;
  createdAt: number;
}

// The reply and its cached count must commit together so rules can verify both.
export async function createCommunityReply(database: Firestore, postId: string, data: CommunityReply) {
  const postRef = doc(database, "posts", postId);
  const replyRef = doc(collection(postRef, "comments"));
  const batch = writeBatch(database);
  batch.set(replyRef, data);
  batch.update(postRef, {
    replyCount: increment(1), replyMutationId: replyRef.id,
    lastReplyAuthor: data.authorName, lastReplyAt: data.createdAt,
  });
  await batch.commit();
  return replyRef.id;
}

export async function deleteCommunityReply(database: Firestore, postId: string, replyId: string) {
  const postRef = doc(database, "posts", postId);
  const replyRef = doc(postRef, "comments", replyId);
  const [post, reply] = await Promise.all([getDocFromServer(postRef), getDocFromServer(replyRef)]);
  if (!reply.exists()) return;
  const batch = writeBatch(database);
  batch.delete(replyRef);
  if (post.exists()) batch.update(postRef, {
    replyCount: Number(post.data().replyCount) > 0 ? increment(-1) : 0,
    replyMutationId: replyId,
  });
  try { await batch.commit(); }
  catch (error) {
    // Another tab may already have deleted it; rules prevent a second decrement.
    if ((error as { code?: string }).code === "permission-denied" && !(await getDocFromServer(replyRef)).exists()) return;
    throw error;
  }
}
