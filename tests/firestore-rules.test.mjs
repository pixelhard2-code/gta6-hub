import test, { after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const { initializeApp, deleteApp } = require("firebase/app");
const {
  getFirestore, connectFirestoreEmulator, doc, collection, addDoc, setDoc, updateDoc,
  deleteDoc, getDocFromServer, getDocs, query, where, orderBy, limit,
  arrayUnion, arrayRemove, writeBatch, terminate, setLogLevel,
} = require("firebase/firestore");
const { initializeApp: adminApp, deleteApp: deleteAdminApp } = require("firebase-admin/app");
const { getFirestore: adminFirestore } = require("firebase-admin/firestore");
if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.RULES_TEST_BUILD) throw new Error("Use npm run test:rules in the isolated emulator.");
const { setFollowState, saveUserProfile } = require(join(process.env.RULES_TEST_BUILD, "profile-actions.js"));
const { createCommunityReply, deleteCommunityReply } = require(join(process.env.RULES_TEST_BUILD, "community-actions.js"));
const projectId = "demo-gta6hub-rules";
const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(":");
const clients = [];
const admin = adminApp({ projectId }, "admin-" + randomUUID());
const server = adminFirestore(admin);
setLogLevel("silent");
function client(uid = null) {
  const app = initializeApp({ projectId, apiKey: "emulator-only" }, randomUUID());
  const db = getFirestore(app);
  connectFirestoreEmulator(db, host, Number(port), uid ? { mockUserToken: { sub: uid, email: uid + "@example.com", email_verified: true } } : undefined);
  clients.push({ app, db });
  return db;
}
after(async () => {
  await Promise.all(clients.map(async ({ app, db }) => { await terminate(db); await deleteApp(app); }));
  await server.terminate();
  await deleteAdminApp(admin);
});
const anonymous = client();
const denied = (promise) => assert.rejects(promise, { code: "permission-denied" });
const read = async (db, path) => (await getDocFromServer(doc(db, path))).data();
const profile = (uid, fields = {}) => ({
  uid, email: uid + "@example.com", displayName: "Jugador", photoURL: "/avatars/vice-ape.svg",
  bio: "Fan de Vice City", reputation: 10, tickets: 0, followers: [], following: [], ...fields,
});
async function users() {
  const a = "a-" + randomUUID(), b = "b-" + randomUUID(), c = "c-" + randomUUID();
  await Promise.all([a, b, c].map(uid => server.doc("users/" + uid).set(profile(uid))));
  return { a, b, c, alice: client(a), bob: client(b), carol: client(c) };
}
const postData = uid => ({ authorId: uid, authorName: "Jugador", authorPhoto: "", content: "Una teoría de GTA VI", createdAt: Date.now(), likedBy: [], replyCount: 0 });
async function post(db, uid) { return (await addDoc(collection(db, "posts"), postData(uid))).id; }
const replyData = uid => ({ authorId: uid, authorName: "Jugador", authorPhoto: "", content: "Mi respuesta", createdAt: Date.now() });
const requestData = uid => ({
  ticketCode: "TKT-123456", topic: "bug", name: "Jugador", email: "cliente@example.com",
  message: "Necesito ayuda", userId: uid, createdAt: Date.now(), status: "open",
});

test("public home and profile queries remain available without login", async () => {
  const { a, alice } = await users();
  await post(alice, a);
  assert.equal((await read(anonymous, "users/" + a)).uid, a);
  assert.ok((await getDocs(query(collection(anonymous, "users"), limit(6)))).size > 0);
  assert.ok((await getDocs(query(collection(anonymous, "posts"), orderBy("createdAt", "desc"), limit(30)))).size > 0);
});
test("signup and editing use the real profile action; balances cannot be forged", async () => {
  const uid = "new-" + randomUUID(), db = client(uid);
  await saveUserProfile(db, { uid, email: uid + "@example.com" }, { displayName: "VicePlayer", bio: "Mi crew", photoURL: "/avatars/neon-fox.svg" });
  await saveUserProfile(db, { uid, email: uid + "@example.com" }, { displayName: "VicePlayer", bio: "Nueva bio", photoURL: "https://example.com/google-photo.png" });
  assert.equal((await read(db, "users/" + uid)).bio, "Nueva bio");
  for (const fields of [{ tickets: 99 }, { reputation: 999 }, { admin: true }, { followers: ["fake"] }]) {
    await denied(updateDoc(doc(db, "users", uid), fields));
  }
  await denied(deleteDoc(doc(db, "users", uid)));
});
test("anonymous edits, changing another profile and claiming another email are denied", async () => {
  const { a, b, alice } = await users();
  await denied(updateDoc(doc(anonymous, "users", a), { bio: "Cambio ajeno" }));
  await denied(updateDoc(doc(alice, "users", b), { bio: "Cambio ajeno" }));
  await denied(updateDoc(doc(alice, "users", a), { email: "otro@example.com" }));
  await denied(setDoc(doc(alice, "users", "fake-" + randomUUID()), profile(a)));
});
test("following persists once across repeated and concurrent real action calls", async () => {
  const { a, b, alice } = await users();
  await Promise.all([setFollowState(alice, a, b, true), setFollowState(client(a), a, b, true)]);
  await setFollowState(alice, a, b, true);
  assert.deepEqual((await read(alice, "users/" + a)).following, [b]);
  assert.deepEqual((await read(alice, "users/" + b)).followers, [a]);
  await setFollowState(alice, a, b, false);
  await setFollowState(alice, a, b, false);
  assert.deepEqual((await read(alice, "users/" + b)).followers, []);
});
test("one-sided follows, self-follow and adding a different person's follower are rejected", async () => {
  const { a, b, c, alice } = await users();
  await denied(updateDoc(doc(alice, "users", a), { following: [b] }));
  await denied(updateDoc(doc(alice, "users", b), { followers: [a] }));
  await denied(updateDoc(doc(alice, "users", a), { following: [a] }));
  const batch = writeBatch(alice);
  batch.update(doc(alice, "users", a), { following: [b] });
  batch.update(doc(alice, "users", b), { followers: [c] });
  await denied(batch.commit());
});
test("different followers can follow and unfollow the same person concurrently", async () => {
  const { a, b, c, alice, carol } = await users();
  await Promise.all([setFollowState(alice, a, b, true), setFollowState(carol, c, b, true)]);
  assert.deepEqual(new Set((await read(alice, "users/" + b)).followers), new Set([a, c]));
  await Promise.all([setFollowState(alice, a, b, false), setFollowState(carol, c, b, false)]);
  assert.deepEqual((await read(alice, "users/" + b)).followers, []);
});
test("concurrent follows also repair a legacy target's duplicate follower list", async () => {
  const { a, b, c, alice, carol } = await users();
  await server.doc("users/" + b).update({ followers: ["legacy", "legacy"] });
  await Promise.all([setFollowState(alice, a, b, true), setFollowState(carol, c, b, true)]);
  assert.deepEqual(new Set((await read(alice, "users/" + b)).followers), new Set(["legacy", a, c]));
  assert.equal((await read(alice, "users/" + b)).followers.length, 3);
});
test("unfollowing still works after clearing bio, and duplicate legacy lists normalize", async () => {
  const { a, b, alice } = await users();
  await server.doc("users/" + a).update({ following: [b, b] });
  await server.doc("users/" + b).update({ followers: [a, a] });
  await setFollowState(alice, a, b, true);
  await updateDoc(doc(alice, "users", a), { bio: "" });
  await setFollowState(alice, a, b, false);
  assert.deepEqual((await read(alice, "users/" + a)).following, []);
  assert.deepEqual((await read(alice, "users/" + b)).followers, []);
  const batch = writeBatch(alice);
  batch.update(doc(alice, "users", a), { following: [b] });
  batch.update(doc(alice, "users", b), { followers: [a] });
  await denied(batch.commit());
});
test("authors can publish and delete; others cannot impersonate, edit or delete them", async () => {
  const { a, b, alice, bob } = await users();
  const id = await post(alice, a);
  await denied(addDoc(collection(anonymous, "posts"), postData(a)));
  await denied(addDoc(collection(bob, "posts"), postData(a)));
  await denied(updateDoc(doc(bob, "posts", id), { content: "Texto cambiado" }));
  await denied(deleteDoc(doc(bob, "posts", id)));
  await updateDoc(doc(bob, "users", b), { bio: " " });
  await denied(addDoc(collection(bob, "posts"), postData(b)));
  await deleteDoc(doc(alice, "posts", id));
});
test("likes can toggle only the caller and cannot alter other likes", async () => {
  const { a, b, c, alice, bob, carol } = await users();
  const id = await post(alice, a), ref = doc(bob, "posts", id);
  await updateDoc(ref, { likedBy: arrayUnion(b) });
  await updateDoc(doc(carol, "posts", id), { likedBy: arrayUnion(c) });
  await denied(updateDoc(ref, { likedBy: [b] }));
  await denied(updateDoc(ref, { likedBy: [b, c, a] }));
  await denied(updateDoc(ref, { likedBy: [b, b, c] }));
  await updateDoc(ref, { likedBy: arrayRemove(b) });
  assert.deepEqual((await read(alice, "posts/" + id)).likedBy, [c]);
});
test("comment actions atomically maintain counts, including concurrent comments", async () => {
  const { a, b, alice, bob } = await users();
  const id = await post(alice, a);
  const [first, second] = await Promise.all([
    createCommunityReply(bob, id, replyData(b)), createCommunityReply(alice, id, replyData(a)),
  ]);
  assert.equal((await read(alice, "posts/" + id)).replyCount, 2);
  assert.equal((await getDocs(collection(anonymous, "posts", id, "comments"))).size, 2);
  await deleteCommunityReply(bob, id, first);
  await deleteCommunityReply(bob, id, first);
  assert.equal((await read(alice, "posts/" + id)).replyCount, 1);
  await deleteCommunityReply(alice, id, second);
  assert.equal((await read(alice, "posts/" + id)).replyCount, 0);
  const [third, fourth] = await Promise.all([
    createCommunityReply(bob, id, replyData(b)), createCommunityReply(alice, id, replyData(a)),
  ]);
  await Promise.all([deleteCommunityReply(bob, id, third), deleteCommunityReply(alice, id, fourth)]);
  assert.equal((await read(alice, "posts/" + id)).replyCount, 0);
  const fifth = await createCommunityReply(bob, id, replyData(b));
  await Promise.all([deleteCommunityReply(bob, id, fifth), deleteCommunityReply(alice, id, fifth)]);
  assert.equal((await read(alice, "posts/" + id)).replyCount, 0);
});
test("post author can moderate replies; unrelated users cannot delete or edit them", async () => {
  const { a, b, alice, bob, carol } = await users();
  const id = await post(alice, a), reply = await createCommunityReply(bob, id, replyData(b));
  await denied(deleteCommunityReply(carol, id, reply));
  await denied(updateDoc(doc(bob, "posts", id, "comments", reply), { content: "Reescrito" }));
  await deleteCommunityReply(alice, id, reply);
  assert.equal((await read(alice, "posts/" + id)).replyCount, 0);
  await denied(createCommunityReply(carol, id, replyData(a)));
});
test("comments and counters cannot be forged independently or with unrelated changes", async () => {
  const { a, b, alice, bob } = await users(), id = await post(alice, a);
  await denied(addDoc(collection(bob, "posts", id, "comments"), replyData(b)));
  await denied(updateDoc(doc(bob, "posts", id), { replyCount: 1 }));
  await denied(updateDoc(doc(bob, "posts", id), { replyCount: 999, replyMutationId: "A".repeat(20) }));
  const reply = await createCommunityReply(bob, id, replyData(b));
  await denied(deleteDoc(doc(bob, "posts", id, "comments", reply)));
  const batch = writeBatch(bob);
  batch.delete(doc(bob, "posts", id, "comments", reply));
  batch.update(doc(bob, "posts", id), { replyCount: 0, replyMutationId: reply, content: "Usurpado" });
  await denied(batch.commit());
});
test("purchase collections, nested records and unknown future collections deny browser access", async () => {
  const { a, alice } = await users();
  for (const name of ["sticker_orders", "sticker_payments", "sticker_collections", "sticker_leaderboard", "sticker_deliveries", "sticker_checkout_limits", "sticker_entries", "sticker_entry_counters", "sticker_referral_sales", "sticker_referral_totals", "sticker_test_referral_sales", "sticker_test_referral_totals", "sticker_test_entries", "sticker_test_entry_counters", "sticker_future_private", "unknown_private"]) {
    const path = name + "/" + a;
    await server.doc(path).set({ uid: a, email: "privado@example.com", buyerContact: { firstName: "Nombre", lastName: "Apellido", phone: "+56912345678" }, total: 5 });
    for (const db of [anonymous, alice]) {
      await denied(getDocFromServer(doc(db, path)));
      await denied(getDocs(collection(db, name)));
      await denied(setDoc(doc(db, path), { uid: a, total: 999 }));
      await denied(deleteDoc(doc(db, path)));
      await denied(setDoc(doc(db, name, a, "nested", "record"), { total: 999 }));
    }
    assert.equal((await server.doc(path).get()).data().total, 5);
  }
});
test("support preserves signed and anonymous submissions but protects contact and payment data", async () => {
  const { a, b, alice, bob } = await users();
  const anonymousRef = await addDoc(collection(anonymous, "support_tickets"), requestData(null));
  await denied(getDocFromServer(anonymousRef));
  const mine = await addDoc(collection(alice, "support_tickets"), requestData(a));
  assert.equal((await read(alice, mine.path)).userId, a);
  await denied(getDocFromServer(doc(bob, mine.path)));
  await denied(getDocs(collection(alice, "support_tickets")));
  assert.ok((await getDocs(query(collection(alice, "support_tickets"), where("userId", "==", a)))).size > 0);
  await denied(addDoc(collection(alice, "support_tickets"), requestData(b)));
  await denied(updateDoc(mine, { status: "approved" }));
  await denied(deleteDoc(mine));
  const payment = { ...requestData(a), topic: "sticker-payment", paymentOperationId: "12345", stickerPackageId: "basic", deliveryEmail: "cliente@example.com", paymentVerification: "pending-merchant-review" };
  await addDoc(collection(alice, "support_tickets"), payment);
  await denied(addDoc(collection(anonymous, "support_tickets"), { ...payment, userId: null }));
  await denied(addDoc(collection(alice, "support_tickets"), { ...payment, paymentVerification: "approved" }));
});
