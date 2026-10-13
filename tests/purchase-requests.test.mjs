import { createRequire } from "node:module";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const require = createRequire(import.meta.url);
const { readPurchaseRequest, forwardPurchaseRequest } = require(join(process.env.PURCHASE_REQUEST_TEST_BUILD, "purchase-request.js"));
const input = { name: " Cliente de prueba ", email: " buyer@example.invalid ", phone: "+56 9 1234 5678", packageId: "double", paymentId: "1234567890", requestId: "34bf9106-ce56-4bc9-81af-19cfc5b22758", consent: true, website: "" };

test("delivery requests validate contact data, operation, pack and consent", () => {
  const request = readPurchaseRequest(input);
  assert.equal(request.name, "Cliente de prueba");
  assert.equal(request.email, "buyer@example.invalid");
  for (const invalid of [null, {name:"A"}, {name:"A\nB"}, {email:"buyer@example.invalid\r\nCc:other@example.invalid"}, {phone:"abc12345678"}, {phone:"+56 1"}, {phone:"1234567890123456"}, {paymentId:"123a"}, {paymentId:"0"}, {packageId:"free"}, {requestId:"bad"}, {consent:false}, {consent:"true"}, {website:"spam"}]) {
    assert.throws(() => readPurchaseRequest(invalid === null ? null : {...input,...invalid}), /invalid-request/);
  }
});

test("untrusted return parameters never approve a payment or override the recipient", async () => {
  const request = readPurchaseRequest({...input, recipient:"attacker@example.invalid", status:"approved", quantity:500});
  let target, payload, headers;
  const result = await forwardPurchaseRequest(request, "merchant@example.invalid", "https://example.invalid", async (url, options) => {
    target=url; payload=JSON.parse(options.body); headers=options.headers;
    return Response.json({success:"true"});
  });
  assert.equal(target, "https://formsubmit.co/ajax/merchant%40example.invalid");
  assert.equal(headers.Referer, "https://example.invalid/gracias");
  assert.equal(payload.email, "buyer@example.invalid");
  assert.equal(payload.telefono, "+56 9 1234 5678");
  assert.equal(payload.numero_operacion, "1234567890");
  assert.equal(payload.pack, "Pack Doble · 2 stickers");
  assert.match(payload.estado, /Pendiente de verificación/);
  assert.equal(payload.quantity, undefined);
  assert.equal(result.status, "pending-review");
});

test("provider failures, missing configuration and activation do not report successful delivery", async () => {
  const request=readPurchaseRequest(input);
  let calls=0;
  await assert.rejects(forwardPurchaseRequest(request, "", "https://example.invalid", async()=>{calls++;}), /receiver-not-configured/);
  assert.equal(calls,0);
  for(const response of [Response.json({success:"false",message:"This form needs Activation"}),Response.json({success:false}),Response.json({success:"true"},{status:500}),Response.json({}),new Response("unavailable",{status:502})]) {
    await assert.rejects(forwardPurchaseRequest(request,"merchant@example.invalid","https://example.invalid",async()=>response));
  }
});
