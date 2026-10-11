import test, { after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

// Use the same SDK module instance as the compiled CommonJS application actions.
const require = createRequire(import.meta.url);
const { initializeApp, deleteApp } = require("firebase/app");
const { getFirestore, connectFirestoreEmulator, doc, setDoc, updateDoc, getDocFromServer, terminate } = require("firebase/firestore");

if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.PROFILE_TEST_BUILD) throw new Error("Use npm run test:profiles within the emulator.");
const load = (name) => import(pathToFileURL(join(process.env.PROFILE_TEST_BUILD, `${name}.js`)).href);
const { setFollowState, saveUserProfile } = await load("profile-actions");
const { readUserProfile } = await load("profiles");
const { PROFILE_AVATARS } = await load("avatars");
const app = initializeApp({ projectId: "demo-gta6hub-follow", apiKey: "demo-test-key" }, `profiles-${randomUUID()}`);
const db = getFirestore(app);
const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(":");
connectFirestoreEmulator(db, host, Number(port));
after(async () => { await terminate(db); await deleteApp(app); });

const read = async (uid) => (await getDocFromServer(doc(db, "users", uid))).data();
async function fixture() {
  const a = `a-${randomUUID()}`, b = `b-${randomUUID()}`;
  const profile = (uid) => ({ uid, displayName: "Jugador", bio: "Una teoría para Vice City", photoURL: "", followers: [], following: [], reputation: 0, tickets: 9 });
  await Promise.all([setDoc(doc(db, "users", a), profile(a)), setDoc(doc(db, "users", b), profile(b))]);
  return { a, b };
}

test("following persists, repeated follows count once, and unfollow removes both sides", async () => {
  const { a, b } = await fixture();
  for (let click = 0; click < 3; click++) await setFollowState(db, a, b, true);
  assert.deepEqual((await read(a)).following, [b]);
  assert.deepEqual((await read(b)).followers, [a]);
  // A fresh server read is also the state used after page reload.
  assert.equal(readUserProfile(a, await read(a)).following.includes(b), true);
  await setFollowState(db, a, b, false);
  await setFollowState(db, a, b, false);
  assert.deepEqual((await read(a)).following, []);
  assert.deepEqual((await read(b)).followers, []);
  await setFollowState(db, a, b, true);
  assert.deepEqual((await read(b)).followers, [a]);
});

test("simultaneous follow requests from two tabs remain idempotent", async () => {
  const { a, b } = await fixture();
  await Promise.all([setFollowState(db, a, b, true), setFollowState(db, a, b, true)]);
  assert.deepEqual((await read(a)).following, [b]);
  assert.deepEqual((await read(b)).followers, [a]);
});

test("failure writing the target never leaves a one-sided follow", async () => {
  const { a, b } = await fixture();
  await updateDoc(doc(db, "users", b), { rejectUpdates: true });
  await assert.rejects(setFollowState(db, a, b, true), { code: "permission-denied" });
  assert.deepEqual((await read(a)).following, []);
  assert.deepEqual((await read(b)).followers, []);
});

test("self-follow is forbidden and biography is required only when following", async () => {
  const { a, b } = await fixture();
  await assert.rejects(setFollowState(db, a, a, true), { code: "self-follow" });
  await updateDoc(doc(db, "users", a), { bio: "  " });
  await assert.rejects(setFollowState(db, a, b, true), { code: "incomplete-profile" });
  await updateDoc(doc(db, "users", a), { bio: "Mi crew" });
  await setFollowState(db, a, b, true);
  await updateDoc(doc(db, "users", a), { bio: "" });
  await setFollowState(db, a, b, false);
  assert.deepEqual((await read(b)).followers, []);
});

test("editing a profile preserves newer social relationships, tickets and zero reputation", async () => {
  const { a, b } = await fixture();
  await updateDoc(doc(db, "users", b), { followers: ["another-player"], following: ["a-third-player"] });
  await Promise.all([
    saveUserProfile(db, { uid: b, email: "test@example.invalid" }, { displayName: "Nueva crew", bio: "Actualizada", photoURL: PROFILE_AVATARS[2].src }),
    setFollowState(db, a, b, true),
  ]);
  const saved = await read(b);
  assert.deepEqual(new Set(saved.followers), new Set(["another-player", a]));
  assert.deepEqual(saved.following, ["a-third-player"]);
  assert.equal(saved.reputation, 0);
  assert.equal(saved.tickets, 9);
  assert.equal(saved.photoURL, PROFILE_AVATARS[2].src);
  assert.equal(saved.displayName, "Nueva crew");
});

test("old profiles use document IDs, default missing lists and repair duplicate relationships", async () => {
  const { a, b } = await fixture();
  await setDoc(doc(db, "users", a), { displayName: "Veterano", bio: "Mi crew", following: [b, b], uid: "stale-id" });
  await setDoc(doc(db, "users", b), { displayName: "Veterano", bio: "Mi crew", followers: [a, a] });
  await setFollowState(db, a, b, true);
  assert.deepEqual((await read(a)).following, [b]);
  assert.deepEqual((await read(b)).followers, [a]);
  assert.equal(readUserProfile(b, await read(b)).uid, b);
  assert.deepEqual(readUserProfile(b, await read(b)).following, []);
});

test("each of five preloaded avatars can be saved and read back, without resetting a profile", async () => {
  assert.equal(PROFILE_AVATARS.length, 5);
  assert.equal(new Set(PROFILE_AVATARS.map((avatar) => avatar.src)).size, 5);
  const uid = `avatar-${randomUUID()}`;
  for (const avatar of PROFILE_AVATARS) {
    assert.match(readFileSync(join("public", avatar.src), "utf8"), /<svg/);
    await saveUserProfile(db, { uid, email: null }, { displayName: "Coleccionista", bio: "Mi crew", photoURL: avatar.src });
    assert.equal((await read(uid)).photoURL, avatar.src);
  }
  assert.equal((await read(uid)).reputation, 10);
});
