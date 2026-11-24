import { OpenFgaClient, CredentialsMethod } from "@openfga/sdk";
const ids = await Bun.file("/tmp/claude-0/spike/ids.json").json();
for (const retry of [undefined, 0]) {
  const fga = new OpenFgaClient({ apiUrl: "http://localhost:8080", storeId: ids.storeId, authorizationModelId: ids.authorization_model_id,
    credentials: { method: CredentialsMethod.ApiToken, config: { token: "spikekey" } }, ...(retry === 0 ? { retryParams: { maxRetry: 0 } } : {}) });
  const s = performance.now();
  try { const r = await fga.check({ user: "member:x", relation: "can_update", object: "org_document:spec" }); console.log("retry", retry, "UNEXPECTED", r); }
  catch (e: any) { console.log("retry", retry, "threw", e?.name ?? e?.constructor?.name, "after", (performance.now() - s).toFixed(0), "ms"); }
}
const bad = new OpenFgaClient({ apiUrl: "http://localhost:8080", storeId: ids.storeId, credentials: { method: CredentialsMethod.ApiToken, config: { token: "wrong" } } });
