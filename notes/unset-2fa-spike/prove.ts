/**
 * Spike proofs for Unset two-factor after an AT Protocol callback.
 *
 * better-auth 1.7.25. Run with NODE_ENV=development and TEST unset:
 *   bun prove.ts
 *
 * The pending step is started the way better-auth's own test does for a
 * custom sign-in path: packages/better-auth/src/plugins/two-factor/two-factor.test.ts
 * "trusted device on a custom-gated sign-in path" (tag v1.7.25,
 * 3fa26c979160914ce8e1c0e8786b1f48aa2552e5). The docs sentence is
 * docs/content/docs/plugins/2fa.mdx at that tag: non-credential sign-in is
 * not gated unless the app adds a hook.
 */
import { createOTP } from "@better-auth/utils/otp";
import { betterAuth, type BetterAuthPlugin } from "better-auth";
import { createAuthEndpoint, createAuthMiddleware } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import { symmetricDecrypt } from "better-auth/crypto";
import { getMigrations } from "better-auth/db/migration";
import { bearer, twoFactor } from "better-auth/plugins";
import { PostgresDialect } from "kysely";
import { Pool } from "pg";
import * as z from "zod";

const WEB = "http://127.0.0.1:8080";
const CALLBACK = "/atproto/callback";

const logs: string[] = [];
const stray: string[] = [];
const secretValues: { label: string; value: string }[] = [];

function watch(label: string, value: string | null | undefined) {
	if (value) secretValues.push({ label, value });
}

function safe(value: unknown): string {
	try {
		return JSON.stringify(value);
	} catch {
		return String(value);
	}
}

const originalConsole = {
	log: console.log,
	info: console.info,
	warn: console.warn,
	error: console.error,
	debug: console.debug,
};

for (const key of ["log", "info", "warn", "error", "debug"] as const) {
	console[key] = (...args: unknown[]) => {
		stray.push(args.map((part) => safe(part)).join(" "));
	};
}

function report(line: string) {
	originalConsole.log(line);
}

function fail(message: string): never {
	restoreConsole();
	throw new Error(message);
}

function restoreConsole() {
	console.log = originalConsole.log;
	console.info = originalConsole.info;
	console.warn = originalConsole.warn;
	console.error = originalConsole.error;
	console.debug = originalConsole.debug;
}

function assertClean(where: string) {
	const blob = `${logs.join("\n")}\n${stray.join("\n")}`;
	for (const entry of secretValues) {
		if (entry.value.length > 0 && blob.includes(entry.value)) {
			fail(`${where} contains ${entry.label}`);
		}
	}
}

const pool = new Pool({
	host: "/var/run/postgresql",
	database: "spike_2fa",
	user: "ubuntu",
});
const dialect = new PostgresDialect({ pool });

function authOptions(extra: {
	allowPasswordless: boolean;
	twoFactorCookieMaxAge?: number;
}) {
	return {
		baseURL: WEB,
		trustedOrigins: [WEB],
		appName: "Unset",
		telemetry: { enabled: false },
		account: { accountLinking: { disableImplicitLinking: true } },
		database: { dialect, type: "postgres" as const },
		logger: {
			level: "debug" as const,
			log(level: string, message: string, ...args: unknown[]) {
				logs.push(safe({ level, message, args }));
			},
		},
		plugins: [
			bearer(),
			twoFactor({
				allowPasswordless: extra.allowPasswordless,
				issuer: "Unset",
				...(extra.twoFactorCookieMaxAge
					? { twoFactorCookieMaxAge: extra.twoFactorCookieMaxAge }
					: {}),
			}),
			atprotoPlugin(),
		],
	};
}

function atprotoPlugin(): BetterAuthPlugin {
	return {
		id: "atproto",
		endpoints: {
			callback: createAuthEndpoint(
				CALLBACK,
				{
					method: "POST",
					body: z.object({
						did: z.string().regex(/^did:plc:[a-z2-7]{24}$/),
					}),
				},
				async (ctx) => {
					const did = ctx.body.did;
					const email = `${await sha256Hex(did)}@user.invalid`;
					const existing =
						await ctx.context.internalAdapter.findAccountOwnerByKey({
							providerId: "atproto",
							accountId: did,
						});
					const userId =
						existing?.kind === "owned"
							? existing.user.id
							: (
									await ctx.context.internalAdapter.createOAuthUser(
										{
											email,
											name: "member",
											emailVerified: true,
										},
										{ providerId: "atproto", accountId: did },
									)
								).user.id;
					const user = await ctx.context.internalAdapter.findUserById(userId);
					if (!user) fail("user row missing after callback");
					const session = await ctx.context.internalAdapter.createSession(
						user.id,
					);
					if (!session) fail("session was not created");
					await setSessionCookie(ctx, { session, user });
					return ctx.json({
						token: session.token,
						user: { id: user.id },
					});
				},
			),
		},
		hooks: {
			after: [
				{
					matcher: (hookCtx) => hookCtx.path === CALLBACK,
					handler: createAuthMiddleware(async (hookCtx) => {
						if (!hookCtx.context.newSession?.user.twoFactorEnabled) return;
						const pending = await runTwoFactorSignInHook(hookCtx);
						if (!pending?.twoFactorRedirect) {
							fail("2FA member did not enter the pending step");
						}
						return hookCtx.json(pending);
					}),
				},
			],
		},
	};
}

async function runTwoFactorSignInHook(ctx: {
	context: { getPlugin: (id: string) => { hooks?: { after?: Hook[] } } | null };
	responseHeaders?: Headers;
}): Promise<{ twoFactorRedirect?: boolean; twoFactorMethods?: string[] } | null> {
	const plugin = ctx.context.getPlugin("two-factor");
	const step = plugin?.hooks?.after?.find((hook) =>
		hook.matcher({ ...ctx, path: "/sign-in/email" }),
	);
	if (!step) fail("two-factor after hook is not registered");
	const outcome = (await step.handler({
		...ctx,
		returnHeaders: true,
	})) as {
		headers: Headers;
		response?: { twoFactorRedirect?: boolean; twoFactorMethods?: string[] };
	};
	outcome.headers.forEach((value, key) => {
		if (key.toLowerCase() === "set-cookie") {
			ctx.responseHeaders?.append(key, value);
		} else {
			ctx.responseHeaders?.set(key, value);
		}
	});
	return outcome.response ?? null;
}

type Hook = {
	matcher: (ctx: { path?: string }) => boolean;
	handler: (ctx: unknown) => Promise<unknown>;
};

async function sha256Hex(value: string): Promise<string> {
	const digest = await crypto.subtle.digest(
		"SHA-256",
		new TextEncoder().encode(value),
	);
	return [...new Uint8Array(digest)]
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");
}

function syntheticDid(): string {
	const alphabet = "abcdefghijklmnopqrstuvwxyz234567";
	const bytes = new Uint8Array(24);
	crypto.getRandomValues(bytes);
	let did = "did:plc:";
	for (const byte of bytes) did += alphabet[byte % alphabet.length];
	return did;
}

type Auth = ReturnType<typeof betterAuth>;

async function post(
	auth: Auth,
	path: string,
	body: Record<string, unknown>,
	headers: Record<string, string> = {},
) {
	const requestHeaders = new Headers({
		"content-type": "application/json",
		origin: WEB,
		...headers,
	});
	const response = await auth.handler(
		new Request(`${WEB}/api/auth${path}`, {
			method: "POST",
			headers: requestHeaders,
			body: JSON.stringify(body),
		}),
	);
	const text = await response.text();
	let json: Record<string, unknown> | null = null;
	if (text) {
		try {
			json = JSON.parse(text) as Record<string, unknown>;
		} catch {
			json = null;
		}
	}
	return {
		status: response.status,
		json,
		cookies: response.headers.getSetCookie(),
	};
}

async function getSession(auth: Auth, headers: Record<string, string>) {
	const response = await auth.handler(
		new Request(`${WEB}/api/auth/get-session`, {
			method: "GET",
			headers,
		}),
	);
	const text = await response.text();
	let json: Record<string, unknown> | null = null;
	if (text && text !== "null") {
		json = JSON.parse(text) as Record<string, unknown>;
	}
	return { status: response.status, json };
}

function cookiePair(lines: string[], name: string): string | null {
	const line = lines.find((entry) => entry.startsWith(`${name}=`));
	if (!line) return null;
	return line.split(";")[0] ?? null;
}

function redactCookies(lines: string[]): string[] {
	return lines.map((line) => {
		const parts = line.split(";");
		const pair = parts[0] ?? "";
		const eq = pair.indexOf("=");
		const name = eq === -1 ? pair : pair.slice(0, eq);
		return [`${name}=<redacted>`, ...parts.slice(1)].join(";");
	});
}

function cookieAttributes(lines: string[], name: string): string[] {
	const line = lines.find((entry) => entry.startsWith(`${name}=`));
	if (!line) return [];
	return line
		.split(";")
		.slice(1)
		.map((part) => part.trim())
		.filter((part) => part.length > 0);
}

async function userIdFor(did: string): Promise<string> {
	const email = `${await sha256Hex(did)}@user.invalid`;
	const result = await pool.query<{ id: string }>(
		'select id from "user" where email = $1',
		[email],
	);
	const id = result.rows[0]?.id;
	if (!id) fail("user id missing");
	return id;
}

async function sessionCount(userId: string): Promise<number> {
	const result = await pool.query<{ n: number }>(
		'select count(*)::int as n from "session" where "userId" = $1',
		[userId],
	);
	return result.rows[0]?.n ?? 0;
}

async function currentTotp(auth: Auth, userId: string): Promise<string> {
	const ctx = await auth.$context;
	const row = await ctx.adapter.findOne<{ secret: string }>({
		model: "twoFactor",
		where: [{ field: "userId", value: userId }],
	});
	if (!row) fail("twoFactor row missing");
	const raw = await symmetricDecrypt({
		key: ctx.secretConfig,
		data: row.secret,
	});
	watch("totp secret", raw);
	const code = await createOTP(raw, { digits: 6, period: 30 }).totp();
	watch("totp code", code);
	return code;
}

async function enableTotp(auth: Auth, did: string) {
	const callback = await post(auth, CALLBACK, { did });
	if (callback.status !== 200 || typeof callback.json?.token !== "string") {
		fail(`enable setup callback ${callback.status}`);
	}
	watch("session token", callback.json.token);
	const sessionPair = cookiePair(callback.cookies, "better-auth.session_token");
	if (!sessionPair) fail("session cookie missing before enable");
	const enabled = await post(
		auth,
		"/two-factor/enable",
		{},
		{ cookie: sessionPair },
	);
	if (enabled.status !== 200 || enabled.json?.method !== "totp") {
		fail(`enable ${enabled.status} ${safe(enabled.json && Object.keys(enabled.json))}`);
	}
	const backupCodes = enabled.json?.backupCodes;
	const totpURI = enabled.json?.totpURI;
	if (!Array.isArray(backupCodes) || typeof totpURI !== "string") {
		fail("enable did not return backup codes and a totp uri");
	}
	for (const code of backupCodes) {
		if (typeof code === "string") watch("backup code", code);
	}
	watch("totp uri", totpURI);
	const userId = await userIdFor(did);
	const totp = await currentTotp(auth, userId);
	const verified = await post(
		auth,
		"/two-factor/verify-totp",
		{ code: totp },
		{ cookie: sessionPair },
	);
	if (verified.status !== 200) fail(`enrollment verify ${verified.status}`);
	const nextPair =
		cookiePair(verified.cookies, "better-auth.session_token") ?? sessionPair;
	return {
		userId,
		backupCodes: backupCodes as string[],
		sessionPair: nextPair,
		totpURI,
	};
}

async function main() {
	const options = authOptions({ allowPasswordless: true });
	const migrations = await getMigrations(options);
	await migrations.runMigrations();
	const auth = betterAuth(options);
	await auth.$context;

	const summary: Record<string, unknown> = {};

	const plainDid = syntheticDid();
	watch("did", plainDid);
	const plain = await post(auth, CALLBACK, { did: plainDid });
	if (plain.status !== 200 || typeof plain.json?.token !== "string") {
		fail(`member without 2FA status ${plain.status}`);
	}
	watch("session token", plain.json.token);
	if ("twoFactorRedirect" in (plain.json ?? {})) {
		fail("member without 2FA was sent to the pending step");
	}
	const plainSession = await getSession(auth, {
		authorization: `Bearer ${plain.json.token}`,
	});
	if (!plainSession.json) fail("member without 2FA has no session");
	const plainId = await userIdFor(plainDid);
	summary.without2fa = {
		status: plain.status,
		hasToken: true,
		sessionCount: await sessionCount(plainId),
		bearerAccepted: plainSession.status === 200,
	};

	const memberDid = syntheticDid();
	watch("did", memberDid);
	const enrolled = await enableTotp(auth, memberDid);
	const sessionsBeforePending = await sessionCount(enrolled.userId);
	const pending = await post(auth, CALLBACK, { did: memberDid });
	const pendingJson = pending.json ?? {};
	if (pending.status !== 200 || pendingJson.twoFactorRedirect !== true) {
		fail(`pending step status ${pending.status}`);
	}
	if ("token" in pendingJson) fail("pending step returned a token");
	const pendingSessions = await sessionCount(enrolled.userId);
	const twoFactorPair = cookiePair(pending.cookies, "better-auth.two_factor");
	if (!twoFactorPair) fail("pending step did not set two_factor");
	watch("two factor cookie", twoFactorPair.split("=").slice(1).join("="));
	const verification = await pool.query<{
		identifier: string;
		value: string;
		expiresAt: Date;
	}>(
		`select identifier, value, "expiresAt" from verification where identifier like '2fa-%'`,
	);
	for (const row of verification.rows) watch("verification identifier", row.identifier);
	const challenge = verification.rows.find(
		(row) =>
			row.value === enrolled.userId && !row.identifier.startsWith("2fa-attempts-"),
	);
	const attempts = challenge
		? verification.rows.find(
				(row) => row.identifier === `2fa-attempts-${challenge.identifier}`,
			)
		: undefined;
	if (!challenge || !attempts) fail("verification rows were not both written");
	const lifetimeSeconds = Math.round(
		(challenge.expiresAt.getTime() - Date.now()) / 1000,
	);
	const sessionCookie = cookiePair(pending.cookies, "better-auth.session_token");
	summary.pending = {
		twoFactorRedirect: true,
		methods: pendingJson.twoFactorMethods,
		sessionCountUnchanged: pendingSessions === sessionsBeforePending,
		cookieName: "better-auth.two_factor",
		cookieAttributes: cookieAttributes(pending.cookies, "better-auth.two_factor"),
		sessionCookieAttributes: sessionCookie
			? cookieAttributes(pending.cookies, "better-auth.session_token")
			: [],
		lifetimeSeconds,
		attemptValueIsZero: attempts.value === "0",
		challengePrefix: challenge.identifier.startsWith("2fa-"),
		setCookies: redactCookies(pending.cookies),
	};
	const sessionLines = pending.cookies.filter((line) =>
		line.startsWith("better-auth.session_token="),
	);
	const sessionCookieChecks = [];
	for (const line of sessionLines) {
		const pair = line.split(";")[0] ?? "";
		const got = await getSession(auth, { cookie: pair, origin: WEB });
		sessionCookieChecks.push({
			maxAgeZero: /max-age=0/i.test(line),
			accepted: Boolean(got.json),
		});
	}
	summary.pendingSessionCookies = sessionCookieChecks;
	if (sessionCookieChecks.some((check) => check.accepted)) {
		fail("pending response set a usable session cookie");
	}
	if (pendingSessions !== sessionsBeforePending) {
		fail("pending step left a session row");
	}
	if (lifetimeSeconds < 590 || lifetimeSeconds > 600) {
		fail(`cookie lifetime ${lifetimeSeconds}`);
	}

	const code = await currentTotp(auth, enrolled.userId);
	const wrong = code === "000000" ? "111111" : "000000";
	watch("totp code", wrong);
	const rejected = await post(
		auth,
		"/two-factor/verify-totp",
		{ code: wrong },
		{ cookie: twoFactorPair },
	);
	if (rejected.status === 200) fail("wrong code was accepted");
	if ((await sessionCount(enrolled.userId)) !== sessionsBeforePending) {
		fail("wrong code created a session");
	}

	const accepted = await post(
		auth,
		"/two-factor/verify-totp",
		{ code },
		{ cookie: twoFactorPair },
	);
	if (accepted.status !== 200 || typeof accepted.json?.token !== "string") {
		fail(`correct code status ${accepted.status}`);
	}
	watch("session token", accepted.json.token);
	const acceptedSession = await getSession(auth, {
		authorization: `Bearer ${accepted.json.token}`,
	});
	if (!acceptedSession.json) fail("correct code did not yield a session");

	const lockDid = syntheticDid();
	watch("did", lockDid);
	await enableTotp(auth, lockDid);
	const lockPending = await post(auth, CALLBACK, { did: lockDid });
	const lockPair = cookiePair(lockPending.cookies, "better-auth.two_factor");
	if (!lockPair) fail("lockout challenge missing");
	watch("two factor cookie", lockPair.split("=").slice(1).join("="));
	const lockUser = await userIdFor(lockDid);
	const sessionsBeforeLock = await sessionCount(lockUser);
	const lockCode = await currentTotp(auth, lockUser);
	const wrongCodes: number[] = [];
	for (let i = 0; i < 5; i += 1) {
		const attempt = await post(
			auth,
			"/two-factor/verify-totp",
			{ code: lockCode === "000000" ? "111111" : "000000" },
			{ cookie: lockPair },
		);
		wrongCodes.push(attempt.status);
	}
	const locked = await post(
		auth,
		"/two-factor/verify-totp",
		{ code: lockCode },
		{ cookie: lockPair },
	);
	const lockedBody = locked.json ?? {};
	if (lockedBody.code !== "TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE") {
		fail(`lockout code ${String(lockedBody.code)} status ${locked.status}`);
	}
	if ((await sessionCount(lockUser)) !== sessionsBeforeLock) {
		fail("lockout created a session");
	}
	summary.totp = {
		wrongStatus: rejected.status,
		correctStatus: accepted.status,
		bearerAccepted: acceptedSession.status === 200,
		fiveWrongStatuses: wrongCodes,
		afterFiveStatus: locked.status,
		afterFiveCode: lockedBody.code,
	};

	const short = betterAuth(
		authOptions({ allowPasswordless: true, twoFactorCookieMaxAge: 1 }),
	);
	const shortDid = syntheticDid();
	watch("did", shortDid);
	await enableTotp(short, shortDid);
	const shortPending = await post(short, CALLBACK, { did: shortDid });
	const shortPair = cookiePair(shortPending.cookies, "better-auth.two_factor");
	if (!shortPair) fail("short challenge missing");
	watch("two factor cookie", shortPair.split("=").slice(1).join("="));
	const shortUser = await userIdFor(shortDid);
	const sessionsBeforeExpiry = await sessionCount(shortUser);
	const shortCode = await currentTotp(short, shortUser);
	await new Promise((resolve) => setTimeout(resolve, 1500));
	const expired = await post(
		short,
		"/two-factor/verify-totp",
		{ code: shortCode },
		{ cookie: shortPair },
	);
	const sessionsAfterExpiry = await sessionCount(shortUser);
	summary.expiry = {
		status: expired.status,
		code: expired.json?.code ?? null,
		sessionUnchanged: sessionsAfterExpiry === sessionsBeforeExpiry,
	};
	if (expired.status === 200 || sessionsAfterExpiry !== sessionsBeforeExpiry) {
		fail("expired challenge created a session");
	}

	const backupDid = syntheticDid();
	watch("did", backupDid);
	const backup = await enableTotp(auth, backupDid);
	const stored = await pool.query<{ backupCodes: string; secret: string }>(
		'select "backupCodes", secret from "twoFactor" where "userId" = $1',
		[backup.userId],
	);
	const storedCodes = stored.rows[0]?.backupCodes ?? "";
	const storedSecret = stored.rows[0]?.secret ?? "";
	for (const code of backup.backupCodes) {
		if (storedCodes.includes(code)) fail("backup code stored in plaintext");
	}
	if (storedSecret.includes("otpauth")) fail("totp uri stored");
	const first = await consumeBackup(auth, backupDid, backup.backupCodes[0]!);
	const again = await consumeBackup(auth, backupDid, backup.backupCodes[0]!);
	const second = await consumeBackup(auth, backupDid, backup.backupCodes[1]!);
	const regenerated = await post(
		auth,
		"/two-factor/generate-backup-codes",
		{},
		{ cookie: second.sessionPair },
	);
	if (regenerated.status !== 200 || !Array.isArray(regenerated.json?.backupCodes)) {
		fail(`regenerate ${regenerated.status}`);
	}
	const nextCodes = regenerated.json.backupCodes as string[];
	for (const code of nextCodes) watch("backup code", code);
	const oldAfter = await consumeBackup(auth, backupDid, backup.backupCodes[2]!);
	const freshAfter = await consumeBackup(auth, backupDid, nextCodes[0]!);
	const storedAfter = await pool.query<{ backupCodes: string }>(
		'select "backupCodes" from "twoFactor" where "userId" = $1',
		[backup.userId],
	);
	const ctx = await auth.$context;
	const decryptedBackup = await symmetricDecrypt({
		key: ctx.secretConfig,
		data: storedCodes,
	});
	const parsedBackup = JSON.parse(decryptedBackup) as string[];
	summary.backup = {
		count: backup.backupCodes.length,
		storedIsHex: /^[0-9a-f]+$/.test(storedCodes),
		storedHasEnvelope: storedCodes.startsWith("$ba$"),
		decryptsToTheSameSet: parsedBackup.join() === backup.backupCodes.join(),
		plaintext: false,
		firstStatus: first.status,
		usedAgainStatus: again.status,
		usedAgainCode: again.code,
		secondStatus: second.status,
		oldAfterRegenerateStatus: oldAfter.status,
		newAfterRegenerateStatus: freshAfter.status,
		storedAfterIsHex: /^[0-9a-f]+$/.test(storedAfter.rows[0]?.backupCodes ?? ""),
	};

	const relayDid = syntheticDid();
	watch("did", relayDid);
	await enableTotp(auth, relayDid);
	const relayPending = await post(auth, CALLBACK, { did: relayDid });
	const relayPair = cookiePair(relayPending.cookies, "better-auth.two_factor");
	if (!relayPair) fail("relay challenge missing");
	const relayValue = relayPair.slice(relayPair.indexOf("=") + 1);
	watch("two factor cookie", relayValue);
	const hostCookie = `__Host-unset-pending=${relayValue}; Path=/; HttpOnly; Secure; SameSite=Lax`;
	if (/domain=/i.test(hostCookie)) fail("__Host- cookie has a Domain attribute");
	const relayCode = await currentTotp(auth, await userIdFor(relayDid));
	const missingOrigin = await post(
		auth,
		"/two-factor/verify-totp",
		{ code: relayCode },
		{ cookie: relayPair, origin: "" },
	);
	const evil = await post(
		auth,
		"/two-factor/verify-totp",
		{ code: relayCode },
		{ cookie: relayPair, origin: "https://evil.example" },
	);
	const relayed = await post(
		auth,
		"/two-factor/verify-totp",
		{ code: relayCode },
		{ cookie: relayPair, origin: WEB },
	);
	summary.relay = {
		hostCookieAttributes: ["Path=/", "HttpOnly", "Secure", "SameSite=Lax"],
		hostHasDomain: false,
		forwardName: "better-auth.two_factor",
		missingOriginStatus: missingOrigin.status,
		missingOriginCode: missingOrigin.json?.code ?? null,
		evilOriginStatus: evil.status,
		evilOriginCode: evil.json?.code ?? null,
		relayedStatus: relayed.status,
		relayedHasToken: typeof relayed.json?.token === "string",
	};
	if (typeof relayed.json?.token === "string") {
		watch("session token", relayed.json.token);
	}
	if (relayed.status !== 200) fail(`relayed verify ${relayed.status}`);

	const freshDid = syntheticDid();
	watch("did", freshDid);
	const freshCallback = await post(auth, CALLBACK, { did: freshDid });
	const freshPair = cookiePair(freshCallback.cookies, "better-auth.session_token");
	if (!freshPair || typeof freshCallback.json?.token !== "string") {
		fail("fresh-session setup failed");
	}
	watch("session token", freshCallback.json.token);
	await pool.query(
		`update "session" set "createdAt" = now() - interval '2 days' where token = $1`,
		[freshCallback.json.token],
	);
	const staleEnable = await post(
		auth,
		"/two-factor/enable",
		{},
		{ cookie: freshPair },
	);
	const listSessions = await auth.handler(
		new Request(`${WEB}/api/auth/list-sessions`, {
			headers: { cookie: freshPair, origin: WEB },
		}),
	);
	const listBody = (await listSessions.json()) as { code?: string };
	summary.fresh = {
		staleEnableStatus: staleEnable.status,
		listSessionsStatus: listSessions.status,
		listSessionsCode: listBody.code ?? null,
	};
	if (staleEnable.status !== 200) {
		fail(`stale enable ${staleEnable.status} ${String(listBody.code)}`);
	}

	const otherDid = syntheticDid();
	watch("did", otherDid);
	const other = await enableTotp(auth, otherDid);
	const otherPending = await post(auth, CALLBACK, { did: otherDid });
	const otherPair = cookiePair(otherPending.cookies, "better-auth.two_factor");
	if (!otherPair) fail("second session challenge missing");
	const otherCode = other.backupCodes[3]!;
	const otherVerify = await post(
		auth,
		"/two-factor/verify-backup-code",
		{ code: otherCode },
		{ cookie: otherPair },
	);
	if (otherVerify.status !== 200 || typeof otherVerify.json?.token !== "string") {
		fail(`second session ${otherVerify.status}`);
	}
	watch("session token", otherVerify.json.token);
	const beforeDisable = await sessionCount(other.userId);
	await pool.query(
		`update "session" set "createdAt" = now() - interval '2 days' where "userId" = $1`,
		[other.userId],
	);
	const disabled = await post(
		auth,
		"/two-factor/disable",
		{},
		{ cookie: other.sessionPair },
	);
	const afterDisable = await sessionCount(other.userId);
	const otherStill = await getSession(auth, {
		authorization: `Bearer ${otherVerify.json.token}`,
	});
	const callerAfter = await getSession(auth, {
		cookie: other.sessionPair,
		origin: WEB,
	});
	summary.disable = {
		status: disabled.status,
		sessionsBefore: beforeDisable,
		sessionsAfter: afterDisable,
		callerSessionAccepted: Boolean(callerAfter.json),
		otherSessionAccepted: Boolean(otherStill.json),
	};
	if (disabled.status !== 200) fail(`disable ${disabled.status}`);
	if (!otherStill.json) fail("disable removed the other session");

	const strict = betterAuth(authOptions({ allowPasswordless: false }));
	const strictDid = syntheticDid();
	watch("did", strictDid);
	const strictCallback = await post(strict, CALLBACK, { did: strictDid });
	const strictPair = cookiePair(
		strictCallback.cookies,
		"better-auth.session_token",
	);
	if (!strictPair) fail("strict callback missing session");
	const strictEnable = await post(
		strict,
		"/two-factor/enable",
		{},
		{ cookie: strictPair },
	);
	const strictPassword = await post(
		strict,
		"/two-factor/enable",
		{ password: "not-a-password" },
		{ cookie: strictPair },
	);
	summary.passwordRequired = {
		emptyStatus: strictEnable.status,
		emptyCode: strictEnable.json?.code ?? null,
		wrongPasswordStatus: strictPassword.status,
		wrongPasswordCode: strictPassword.json?.code ?? null,
	};

	const limited = betterAuth({
		...authOptions({ allowPasswordless: true }),
		rateLimit: { enabled: true },
	});
	const limitedDid = syntheticDid();
	watch("did", limitedDid);
	await enableTotp(limited, limitedDid);
	const limitedPending = await post(limited, CALLBACK, { did: limitedDid });
	const limitedPair = cookiePair(
		limitedPending.cookies,
		"better-auth.two_factor",
	);
	if (!limitedPair) fail("rate-limit challenge missing");
	watch("two factor cookie", limitedPair.slice(limitedPair.indexOf("=") + 1));
	await new Promise((resolve) => setTimeout(resolve, 11000));
	const limitedStatuses: number[] = [];
	for (let i = 0; i < 4; i += 1) {
		const attempt = await post(
			limited,
			"/two-factor/verify-totp",
			{ code: "000000" },
			{ cookie: limitedPair },
		);
		limitedStatuses.push(attempt.status);
	}
	summary.rateLimit = { enabledStatuses: limitedStatuses };

	const defaultSecret = await readDefaultSecret();
	watch("development secret", defaultSecret);
	assertClean("logs");
	const redactedLogs = [...logs, ...stray].map((line) => {
		let redacted = line;
		for (const entry of secretValues) {
			redacted = redacted.split(entry.value).join("<redacted>");
		}
		return redacted;
	});
	summary.logs = {
		entries: logs.length,
		stray: stray.length,
		clean: true,
		redacted: redactedLogs,
	};

	restoreConsole();
	report(JSON.stringify(summary, null, 2));
	await pool.end();
}

async function consumeBackup(auth: Auth, did: string, code: string) {
	const pending = await post(auth, CALLBACK, { did });
	const pair = cookiePair(pending.cookies, "better-auth.two_factor");
	if (!pair) fail("backup challenge missing");
	watch("two factor cookie", pair.slice(pair.indexOf("=") + 1));
	const verified = await post(
		auth,
		"/two-factor/verify-backup-code",
		{ code },
		{ cookie: pair },
	);
	if (typeof verified.json?.token === "string") {
		watch("session token", verified.json.token);
	}
	const nextPair = cookiePair(verified.cookies, "better-auth.session_token");
	return {
		status: verified.status,
		code: verified.json?.code ?? null,
		sessionPair: nextPair ?? "",
	};
}

async function readDefaultSecret(): Promise<string> {
	const source = await Bun.file(
		`${import.meta.dir}/node_modules/better-auth/dist/utils/constants.mjs`,
	).text();
	const match = source.match(/DEFAULT_SECRET = "([^"]+)"/);
	if (!match?.[1]) fail("could not read the development fallback");
	return match[1];
}

if (process.env.NODE_ENV === "test" || process.env.TEST) {
	restoreConsole();
	throw new Error("NODE_ENV=test or TEST is set; origin checks would be skipped");
}

await main().catch(async (error: unknown) => {
	restoreConsole();
	const message = error instanceof Error ? error.message : "prove failed";
	originalConsole.error(message);
	try {
		await pool.end();
	} catch {
		// The pool may already be closed.
	}
	process.exit(1);
});
