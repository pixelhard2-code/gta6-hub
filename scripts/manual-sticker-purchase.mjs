// Private merchant operation. No Mercado Pago or email API is called here.
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
const require = createRequire(import.meta.url);
const args = process.argv.slice(2);
const sent = args[0] === "--email-sent";
if (sent ? args.length !== 2 : args.length !== 8 || args[7] !== "--confirmed-in-dashboard") throw new Error("Usage: node scripts/manual-sticker-purchase.mjs PAYMENT_ID FIREBASE_UID basic|double|legend DELIVERY_EMAIL GROSS_AMOUNT CLP|USD REVIEWER --confirmed-in-dashboard\nAfter sending the email: node scripts/manual-sticker-purchase.mjs --email-sent ORDER_ID");
require("@next/env").loadEnvConfig(process.cwd());
const build = mkdtempSync(join(tmpdir(),"leonidacrew-manual-"));
let app, db;
try {
  execFileSync(process.execPath,["node_modules/typescript/bin/tsc","app/lib/stickers/manual.ts","--target","ES2020","--module","commonjs","--moduleResolution","node","--esModuleInterop","--skipLibCheck","--outDir",build],{stdio:"inherit"});
  symlinkSync(resolve("node_modules"),join(build,"node_modules"),"dir");
  const { creditDashboardReviewedPurchase, markManualStickerEmailSent } = require(join(build,"manual.js"));
  const { initializeApp, cert } = require("firebase-admin/app");
  const account = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT ? JSON.parse(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT) : {projectId:process.env.FIREBASE_ADMIN_PROJECT_ID,clientEmail:process.env.FIREBASE_ADMIN_CLIENT_EMAIL,privateKey:process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g,"\n")};
  app=initializeApp({credential:cert(account)},"manual-sticker-merchant");
  db=require("firebase-admin/firestore").getFirestore(app);
  if(sent) {
    const changed=await markManualStickerEmailSent(db,args[1]);
    console.log(changed ? "Manual email marked as sent." : "Email was already marked as sent.");
  } else {
    const [paymentId,uid,packageId,email,amount,currency,reviewer]=args;
    await require("firebase-admin/auth").getAuth(app).getUser(uid);
    const result=await creditDashboardReviewedPurchase(db,{paymentId,uid,packageId,email,amount:Number(amount),currency,reviewer,confirmedInDashboard:true});
    console.log(`Order: ${result.orderId}. ${result.repeated ? "Already credited; no extra stickers granted." : "Credited to collection and ranking."} Email must be sent manually.`);
  }
} finally {
  if(db)await db.terminate();
  if(app)await require("firebase-admin/app").deleteApp(app);
  rmSync(build,{recursive:true,force:true});
}
