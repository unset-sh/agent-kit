import { OpenFgaClient, CredentialsMethod } from "@openfga/sdk";
const ids = await Bun.file("/tmp/claude-0/spike/ids.json").json();
const fga = new OpenFgaClient({ apiUrl: "http://localhost:8080", storeId: ids.storeId, authorizationModelId: ids.authorization_model_id, credentials: { method: CredentialsMethod.ApiToken, config: { token: "spikekey" } } });
const t = { user: "member:nobody", relation: "member", object: "organization:acme" };
try { await fga.write({ deletes: [t] }); console.log("missing delete: ok"); } catch (e: any) { console.log("missing delete error:", String(e.message).slice(0, 110)); }
await fga.write({ deletes: [t] }, { conflict: { onMissingDeletes: "ignore" } } as any); console.log("missing delete with ignore: ok");
try { await fga.write({ writes: [{ user: "member:x", relation: "owner", object: "profile:y" , condition: undefined}, { user: "module:photos", relation: "owner", object: "profile:z" }] }); } catch (e: any) { console.log("type-invalid write rejected:", String(e.message).slice(0, 140)); }
