import { OpenFgaClient, CredentialsMethod, ConsistencyPreference } from "@openfga/sdk";
import { readFileSync } from "node:fs";
const base = { apiUrl: process.env.FGA_URL ?? "http://localhost:8080",
  credentials: { method: CredentialsMethod.ApiToken, config: { token: "spikekey" } } };
const admin = new OpenFgaClient(base);
const { id: storeId } = await admin.createStore({ name: "unset-spike" });
const model = JSON.parse(readFileSync("../model.json", "utf8"));
const { authorization_model_id } = await new OpenFgaClient({ ...base, storeId }).writeAuthorizationModel(model);
const fga = new OpenFgaClient({ ...base, storeId, authorizationModelId: authorization_model_id });
const did = (d: string) => d.replaceAll("%", "%25").replaceAll(":", "%3A");
const m = (d: string) => `member:${did(d)}`;
await fga.write({ writes: [
  { user: m("did:plc:alice"), relation: "owner", object: "organization:acme" },
  { user: m("did:plc:dave"), relation: "member", object: "organization:acme" },
  { user: "organization:acme", relation: "organization", object: "org_document:spec" },
]});
const check = (u: string, r: string, o: string, consistency?: ConsistencyPreference) =>
  fga.check({ user: u, relation: r, object: o }, consistency ? { consistency } : {}).then(x => x.allowed);
console.log("dave reads spec:", await check(m("did:plc:dave"), "can_read", "org_document:spec"));
// revocation: remove dave, check again immediately
await fga.write({ deletes: [{ user: m("did:plc:dave"), relation: "member", object: "organization:acme" }] });
console.log("after removal, dave reads spec:", await check(m("did:plc:dave"), "can_read", "org_document:spec"));
// idempotency: writing the same tuple twice
await fga.write({ writes: [{ user: m("did:plc:bob"), relation: "member", object: "organization:acme" }] });
try { await fga.write({ writes: [{ user: m("did:plc:bob"), relation: "member", object: "organization:acme" }] }); console.log("duplicate write: ok"); }
catch (e: any) { console.log("duplicate write error:", e?.name, String(e?.message).slice(0, 160)); }
try { await fga.write({ writes: [{ user: m("did:plc:bob"), relation: "member", object: "organization:acme" }] }, { conflict: { onDuplicateWrites: "ignore" } } as any); console.log("duplicate write with ignore: ok"); }
catch (e: any) { console.log("ignore option error:", String(e?.message).slice(0, 160)); }
// invalid relation
try { await check(m("did:plc:bob"), "can_fly", "org_document:spec"); } catch (e: any) { console.log("invalid relation ->", e?.name, String(e?.message).slice(0,120)); }
// latency
for (const [label, c] of [["default", undefined], ["higher", ConsistencyPreference.HigherConsistency]] as const) {
  const t: number[] = [];
  for (let i = 0; i < 2000; i++) { const s = performance.now(); await check(m("did:plc:alice"), "can_update", "org_document:spec", c); t.push(performance.now() - s); }
  t.sort((a, b) => a - b); console.log(label, "p50", t[1000].toFixed(2), "p99", t[1980].toFixed(2), "ms");
}
const b = await fga.batchCheck({ checks: [
  { user: m("did:plc:alice"), relation: "can_update", object: "org_document:spec" },
  { user: m("did:plc:bob"), relation: "can_update", object: "org_document:spec" }] });
console.log("batch:", b.result.map(r => r.allowed));
console.log("listObjects alice can_update:", (await fga.listObjects({ user: m("did:plc:alice"), relation: "can_update", type: "org_document" })).objects);
await Bun.write("/tmp/claude-0/spike/ids.json", JSON.stringify({ storeId, authorization_model_id }));
