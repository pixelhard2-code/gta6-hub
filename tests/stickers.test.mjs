import test, { after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID, createHmac } from "node:crypto";
import { createRequire } from "node:module";
import { join } from "node:path";
import { readFileSync } from "node:fs";
const require = createRequire(import.meta.url);
const { initializeApp, deleteApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { unzipSync } = require("fflate");
if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.STICKER_TEST_BUILD) throw new Error("Use the emulator test runner.");
const { createStickerOrder, prepareStickerCheckout, applyVerifiedPayment, deliverStickerOrder, verifyMercadoPagoSignature } = require(join(process.env.STICKER_TEST_BUILD, "commerce.js"));
const { STICKER_PACKAGES, validDeliveryEmail } = require(join(process.env.STICKER_TEST_BUILD, "catalog.js"));
const { stickerZip } = require(join(process.env.STICKER_TEST_BUILD, "files.js"));
const { sendStickerEmailWithConfig } = require(join(process.env.STICKER_TEST_BUILD, "email-transport.js"));
const app = initializeApp({ projectId: "demo-gta6hub-follow" }, `stickers-${randomUUID()}`);
const db = getFirestore(app);
after(async () => { await db.terminate(); await deleteApp(app); });
const merchant = { collectorId: "12345", liveMode: false };
let sequence = 70000;
async function order(packageId = "legend", uid = `buyer-${randomUUID()}`) {
  const result = await createStickerOrder(db, { uid, packageId, email: "buyer@example.invalid", amount: packageId === "legend" ? 10000 : packageId === "double" ? 5000 : 3000, currency: "CLP", attemptId: randomUUID() });
  const payment = { id: String(++sequence), external_reference: result.id, status: "approved", transaction_amount: result.order.amount, transaction_amount_refunded: 0, currency_id: "CLP", collector_id: "12345", live_mode: false };
  return { ...result, uid, payment };
}
const collection = async (uid) => (await db.collection("sticker_collections").doc(uid).get()).data();

test("the three supplied payment links match the 1, 2 and 5 sticker packs", () => {
  assert.deepEqual(STICKER_PACKAGES.map(p=>[p.stickers,p.price,p.paymentUrl]), [[1,3,"https://mpago.la/2SARTNX"],[2,5,"https://mpago.la/1J28NAx"],[5,10,"https://mpago.la/22A25HZ"]]);
  for (const pack of STICKER_PACKAGES) assert.equal(pack.stickerIds.length, pack.stickers);
});
test("webhook authentication binds payment ID, request ID and timestamp", () => {
  const signature = createHmac("sha256", "test-secret").update("id:123;request-id:request-1;ts:1700000000;").digest("hex");
  assert.equal(verifyMercadoPagoSignature("test-secret", "123", "request-1", `ts=1700000000,v1=${signature}`), true);
  assert.equal(verifyMercadoPagoSignature("test-secret", "124", "request-1", `ts=1700000000,v1=${signature}`), false);
  assert.equal(verifyMercadoPagoSignature("wrong", "123", "request-1", `ts=1700000000,v1=${signature}`), false);
  assert.equal(verifyMercadoPagoSignature("test-secret", "123", null, null), false);
});
test("recipient validation rejects header injection and invalid addresses", () => {
  assert.equal(validDeliveryEmail("buyer@example.invalid"), true);
  for (const email of ["", "buyer", "buyer@example.invalid\nBCC:other@example.invalid", "a@example.invalid,b@example.invalid"]) assert.equal(validDeliveryEmail(email), false);
});
test("a checkout retry keeps the same order and cannot change its owner or contents", async () => {
  const input = { uid: `buyer-${randomUUID()}`, packageId: "basic", email: "buyer@example.invalid", amount: 3000, currency: "CLP", attemptId: randomUUID() };
  const first = await createStickerOrder(db, input), second = await createStickerOrder(db, input);
  assert.equal(first.id, second.id);
  await assert.rejects(createStickerOrder(db, { ...input, packageId: "legend" }), /conflicting-order/);
});
test("concurrent checkout requests create one preference and retries reuse its URL", async () => {
  const item=await order("basic");
  let started,finish,calls=0;
  const ready=new Promise(resolve=>{started=resolve;});
  const held=new Promise(resolve=>{finish=resolve;});
  const create=async(saved)=>{calls++;assert.equal(saved.uid,item.uid);started();await held;return {preferenceId:"simulated-preference",checkoutUrl:"https://www.mercadopago.cl/checkout/v1/redirect?pref_id=simulated"};};
  const first=prepareStickerCheckout(db,item.id,create);
  await ready;
  await assert.rejects(prepareStickerCheckout(db,item.id,create),/checkout-busy/);
  finish();
  const url=await first;
  assert.equal(await prepareStickerCheckout(db,item.id,create),url);
  assert.equal(calls,1);
  const failed=await order("basic");
  await assert.rejects(prepareStickerCheckout(db,failed.id,async()=>{throw new Error("simulated-outage");}));
  assert.equal((await db.collection("sticker_orders").doc(failed.id).get()).data().checkoutLeaseUntil,0);
});
test("only an approved payment grants the exact pack, once across concurrent notifications", async () => {
  const item = await order();
  await Promise.all([applyVerifiedPayment(db,item.payment,merchant),applyVerifiedPayment(db,item.payment,merchant)]);
  await applyVerifiedPayment(db,item.payment,merchant);
  assert.equal((await collection(item.uid)).total,5);
  assert.deepEqual(Object.values((await collection(item.uid)).counts),[1,1,1,1,1]);
  assert.equal((await db.collection("sticker_leaderboard").doc(item.uid).get()).data().total,5);
  assert.equal((await db.collection("sticker_deliveries").doc(item.id).get()).data().email,"buyer@example.invalid");
});
test("unapproved payments do not create a collection or email job", async () => {
  const item=await order("basic");
  for(const status of ["pending","in_process","rejected"]) await applyVerifiedPayment(db,{...item.payment,status},merchant);
  assert.equal(await collection(item.uid),undefined);
  assert.equal((await db.collection("sticker_deliveries").doc(item.id).get()).exists,false);
});
test("a rejected payment can be retried with a new operation on the same checkout", async () => {
  const item=await order("double");
  await applyVerifiedPayment(db,{...item.payment,status:"rejected"},merchant);
  assert.equal((await db.collection("sticker_orders").doc(item.id).get()).data().paymentId,undefined);
  assert.equal(await prepareStickerCheckout(db,item.id,async()=>({preferenceId:"retry",checkoutUrl:"https://www.mercadopago.cl/retry"})),"https://www.mercadopago.cl/retry");
  const approved={...item.payment,id:String(++sequence)};
  await applyVerifiedPayment(db,approved,merchant);
  await applyVerifiedPayment(db,{...item.payment,status:"rejected"},merchant);
  assert.equal((await collection(item.uid)).total,2);
  assert.equal((await db.collection("sticker_orders").doc(item.id).get()).data().status,"approved");
});
test("amount, currency, seller, environment and reference mismatches cannot credit stickers", async () => {
  const item=await order("basic");
  for(const change of [{transaction_amount:1},{currency_id:"USD"},{collector_id:"another"},{live_mode:true},{external_reference:"lc_"+"f".repeat(32)}]) await assert.rejects(applyVerifiedPayment(db,{...item.payment,...change},merchant));
  assert.equal(await collection(item.uid),undefined);
});
test("two separate purchases accumulate atomically, including repeated sticker designs", async () => {
  const first=await order("basic"),second=await order("double",first.uid);
  await Promise.all([applyVerifiedPayment(db,first.payment,merchant),applyVerifiedPayment(db,second.payment,merchant)]);
  const inventory=await collection(first.uid);
  assert.equal(inventory.total,3);
  assert.equal(inventory.counts["vice-palm"],2);
  assert.equal(inventory.counts["night-ride"],1);
});
test("refund and chargeback notifications remove entries once and cancel a queued email", async () => {
  const item=await order("double");
  await applyVerifiedPayment(db,item.payment,merchant);
  await applyVerifiedPayment(db,{...item.payment,status:"refunded",transaction_amount_refunded:5000},merchant);
  await applyVerifiedPayment(db,{...item.payment,status:"refunded",transaction_amount_refunded:5000},merchant);
  await applyVerifiedPayment(db,item.payment,merchant); // An older approved snapshot cannot restore a refunded pack.
  assert.equal((await collection(item.uid)).total,0);
  assert.equal((await db.collection("sticker_leaderboard").doc(item.uid).get()).data().total,0);
  assert.equal((await db.collection("sticker_deliveries").doc(item.id).get()).data().status,"cancelled");
});
test("a different payment for an already-paid order is flagged without duplicate credit", async () => {
  const item=await order("basic");
  await applyVerifiedPayment(db,item.payment,merchant);
  const result=await applyVerifiedPayment(db,{...item.payment,id:String(++sequence)},merchant);
  assert.equal(result.status,"needs_review");
  assert.equal((await collection(item.uid)).total,1);
});
test("email failures remain retryable without granting stickers twice", async () => {
  const item=await order("basic");
  await applyVerifiedPayment(db,item.payment,merchant);
  await assert.rejects(deliverStickerOrder(db,item.id,async()=>{throw new Error("simulated-outage")}));
  assert.equal((await db.collection("sticker_deliveries").doc(item.id).get()).data().status,"pending");
  let sends=0;
  const send=async(job)=>{assert.equal(job.email,"buyer@example.invalid");sends++;return "email-test-1";};
  await Promise.all([deliverStickerOrder(db,item.id,send),deliverStickerOrder(db,item.id,send)]);
  await deliverStickerOrder(db,item.id,send);
  assert.equal(sends,1);
  assert.equal((await collection(item.uid)).total,1);
});
test("one Mercado Pago operation cannot be reassigned and credited to two buyers", async () => {
  const first=await order("basic"),second=await order("basic");
  await applyVerifiedPayment(db,first.payment,merchant);
  await assert.rejects(applyVerifiedPayment(db,{...second.payment,id:first.payment.id},merchant),/payment-already-assigned/);
  assert.equal((await collection(first.uid)).total,1);
  assert.equal(await collection(second.uid),undefined);
});
test("email retries send the same purchased archive, recipient and idempotency key", async () => {
  const item=await order("double");
  const job={orderId:item.id,email:item.order.email,packageId:"double",quantity:2};
  const config={apiKey:"simulated-key",from:"Shop <shop@example.invalid>",appUrl:"https://example.invalid/"};
  const requests=[];
  const send=async(url,request)=>{assert.equal(url,"https://api.resend.com/emails");requests.push(request);return Response.json({id:"simulated-email"});};
  assert.equal(await sendStickerEmailWithConfig(job,config,send),"simulated-email");
  await sendStickerEmailWithConfig(job,config,send);
  assert.equal(requests[0].body,requests[1].body);
  assert.equal(requests[0].headers["Idempotency-Key"],`stickers-${item.id}`);
  const mail=JSON.parse(requests[0].body);
  assert.deepEqual(mail.to,[job.email]);
  assert.ok(mail.text.includes("https://example.invalid/perfil"));
  assert.equal(mail.attachments[0].filename,"leonidacrew-double.zip");
  assert.deepEqual(Object.keys(unzipSync(Buffer.from(mail.attachments[0].content,"base64"))).filter(name=>name.endsWith(".png")),["vice-palm.png","night-ride.png"]);
  await assert.rejects(sendStickerEmailWithConfig(job,config,async()=>Response.json({error:"simulated"},{status:500})),/email-provider-failed/);
});
test("each download contains only the purchased designs and valid transparent PNG files", async () => {
  for(const pack of STICKER_PACKAGES){
    const archive=unzipSync(await stickerZip(pack.stickerIds,pack.stickers));
    const files=Object.keys(archive).filter(name=>name.endsWith(".png"));
    assert.equal(files.length,pack.stickers);
    for(const file of files) {
      const png=Buffer.from(archive[file]);
      assert.equal(png.subarray(0,8).toString("hex"),"89504e470d0a1a0a");
      assert.equal(png.readUInt32BE(16),1200);assert.equal(png.readUInt32BE(20),1200);
      assert.equal(png[25],6); // RGBA, including transparency.
      assert.equal(png.subarray(-12).toString("hex"),"0000000049454e44ae426082");
    }
  }
  await assert.rejects(stickerZip(["../../secret"],1),/invalid-stickers/);
  assert.equal(readFileSync("assets/stickers/vice-palm.png").subarray(0,8).toString("hex"),"89504e470d0a1a0a");
});
test("browser clients cannot write paid balances, ranking or orders", async () => {
  const firebase = require("firebase/app"), firestore = require("firebase/firestore");
  const clientApp=firebase.initializeApp({projectId:"demo-gta6hub-follow",apiKey:"demo-key"},randomUUID());
  const client=firestore.getFirestore(clientApp);
  const [host,port]=process.env.FIRESTORE_EMULATOR_HOST.split(":");
  firestore.connectFirestoreEmulator(client,host,Number(port));
  for(const name of ["sticker_collections","sticker_leaderboard","sticker_orders"]){
    await assert.rejects(firestore.setDoc(firestore.doc(client,name,"fake"),{total:99999}),{code:"permission-denied"});
  }
  await firestore.terminate(client);await firebase.deleteApp(clientApp);
});
