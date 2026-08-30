// Shared auth helpers for WORKLOG's Pages Functions.
// Uses the Web Crypto API (crypto.subtle / crypto.getRandomValues), which is
// available natively in the Cloudflare Workers runtime — no extra dependency.

const ITERATIONS = 100000;
const SESSION_DAYS = 365;
const COOKIE_NAME = 'wl_session';

function toHex(bufferLike) {
  return [...new Uint8Array(bufferLike)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
function fromHex(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  return bytes;
}

export async function hashPassword(password, saltHex) {
  const enc = new TextEncoder();
  const salt = saltHex ? fromHex(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return { hash: toHex(bits), salt: toHex(salt) };
}

export async function verifyPassword(password, saltHex, expectedHashHex) {
  const { hash } = await hashPassword(password, saltHex);
  if (hash.length !== expectedHashHex.length) return false;
  let diff = 0;
  for (let i = 0; i < hash.length; i++) diff |= hash.charCodeAt(i) ^ expectedHashHex.charCodeAt(i);
  return diff === 0;
}

export function newToken() {
  return toHex(crypto.getRandomValues(new Uint8Array(32)));
}

export function newId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${toHex(crypto.getRandomValues(new Uint8Array(4)))}`;
}

export async function createSession(env, userId) {
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString();
  await env.DB.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(token, userId, expiresAt)
    .run();
  return { token, expiresAt };
}

export function sessionCookie(token) {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}`;
}
export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

function parseCookies(header) {
  const out = {};
  (header || '').split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    out[pair.slice(0, idx).trim()] = decodeURIComponent(pair.slice(idx + 1).trim());
  });
  return out;
}

export function getSessionToken(request) {
  const cookies = parseCookies(request.headers.get('Cookie'));
  return cookies[COOKIE_NAME] || null;
}

export async function getCurrentUser(request, env) {
  const token = getSessionToken(request);
  if (!token) return null;
  const row = await env.DB.prepare(
    `SELECT users.* FROM sessions JOIN users ON users.id = sessions.user_id
     WHERE sessions.token = ? AND sessions.expires_at > datetime('now')`
  )
    .bind(token)
    .first();
  if (!row) return null;

  // Sliding expiration: as long as this session is used at least once within
  // SESSION_DAYS, it keeps extending and never actually lapses in practice.
  const newExpiresAt = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString();
  await env.DB.prepare('UPDATE sessions SET expires_at = ? WHERE token = ?').bind(newExpiresAt, token).run();

  return row;
}

export function publicUser(u) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    bankName: u.bank_name,
    bankBranch: u.bank_branch,
    bankAccountType: u.bank_account_type,
    bankAccountNumber: u.bank_account_number,
    bankAccountHolder: u.bank_account_holder,
    invoiceRegNumber: u.invoice_reg_number,
  };
}
