/**
 * Phase 4 — HTTP endpoint tests.
 *
 * The Clerk webhook handler (convex/clerk.ts) reads CLERK_WEBHOOK_SECRET at
 * module load time.  We set the env var here, before convex-test lazy-loads
 * the module, so the import succeeds with a known test secret that our
 * signWebhook helper also uses.
 */
import { createHmac } from 'crypto';
import { convexTest } from 'convex-test';
import { describe, expect, it } from 'vitest';
import { internal } from '../_generated/api';
import schema from '../schema';

// ---- signing ----

// A valid `whsec_` secret: "whsec_" + base64 of 32 raw bytes.
const TEST_SECRET = 'whsec_' + Buffer.from('testsecretwith32bytesabcdefghijk').toString('base64');

// Must be set before convex-test lazy-loads clerk.ts (which reads the env var
// at module level via ensureEnvironmentVariable).
process.env.CLERK_WEBHOOK_SECRET = TEST_SECRET;

const modules = import.meta.glob('../**/*.*s');

/**
 * Produce a Svix-signed request body + headers for a given payload.
 * Algorithm: https://docs.svix.com/receiving/verifying-payloads/how
 */
function signWebhook(payload: object): { body: string; headers: Record<string, string> } {
  const body = JSON.stringify(payload);
  const msgId = `msg_test_${Date.now()}`;
  const ts = Math.floor(Date.now() / 1000);
  const secretBytes = Buffer.from(TEST_SECRET.replace('whsec_', ''), 'base64');
  const toSign = `${msgId}.${ts}.${body}`;
  const sig = createHmac('sha256', secretBytes).update(toSign).digest('base64');

  return {
    body,
    headers: {
      'content-type': 'application/json',
      'svix-id': msgId,
      'svix-timestamp': String(ts),
      'svix-signature': `v1,${sig}`,
    },
  };
}

// ---- minimal Clerk user fixture ----

function clerkUser(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    object: 'user',
    username: null,
    first_name: 'Test',
    last_name: 'User',
    image_url: 'https://example.com/avatar.jpg',
    has_image: false,
    password_enabled: true,
    two_factor_enabled: false,
    totp_enabled: false,
    backup_code_enabled: false,
    email_addresses: [],
    primary_email_address_id: null,
    phone_numbers: [],
    primary_phone_number_id: null,
    primary_web3_wallet_id: null,
    web3_wallets: [],
    external_accounts: [],
    external_id: null,
    last_sign_in_at: null,
    banned: false,
    locked: false,
    lockout_expires_in_seconds: null,
    verification_attempts_remaining: null,
    created_at: Date.now(),
    updated_at: Date.now(),
    delete_self_enabled: true,
    create_organization_enabled: true,
    last_active_at: null,
    mfa_enabled_at: null,
    mfa_disabled_at: null,
    legal_accepted_at: null,
    profile_image_url: null,
    public_metadata: {},
    private_metadata: [],
    unsafe_metadata: {},
    saml_accounts: [],
    password_last_updated_at: null,
    ...overrides,
  };
}

// ---- tests ----

describe('POST /api/webhooks/clerk', () => {
  it('returns 400 for a request with an invalid signature', async () => {
    const t = convexTest(schema, modules);

    const response = await t.fetch('/api/webhooks/clerk', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'svix-id': 'msg_bad',
        'svix-timestamp': String(Math.floor(Date.now() / 1000)),
        'svix-signature': 'v1,invalidsignature',
      },
      body: JSON.stringify({ type: 'user.created', data: clerkUser('user_1') }),
    });

    expect(response.status).toBe(400);
  });

  it('returns 400 when svix headers are missing', async () => {
    const t = convexTest(schema, modules);

    const response = await t.fetch('/api/webhooks/clerk', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'user.created', data: clerkUser('user_1') }),
    });

    expect(response.status).toBe(400);
  });

  it('creates a user on user.created event', async () => {
    const t = convexTest(schema, modules);

    const user = clerkUser('user_clerk_1');
    const { body, headers } = signWebhook({ type: 'user.created', data: user });

    const response = await t.fetch('/api/webhooks/clerk', {
      method: 'POST',
      headers,
      body,
    });

    expect(response.status).toBe(200);

    const saved = await t.query(internal.users.getUser, { clerkId: 'user_clerk_1' });
    expect(saved).not.toBeNull();
    expect(saved?.clerkId).toBe('user_clerk_1');
    expect(saved?.first_name).toBe('Test');
  });

  it('updates an existing user on user.updated event', async () => {
    const t = convexTest(schema, modules);

    // Create the user first via user.created
    const user = clerkUser('user_clerk_2', { first_name: 'Original' });
    const create = signWebhook({ type: 'user.created', data: user });
    await t.fetch('/api/webhooks/clerk', { method: 'POST', headers: create.headers, body: create.body });

    // Now update
    const updated = clerkUser('user_clerk_2', { first_name: 'Updated' });
    const update = signWebhook({ type: 'user.updated', data: updated });
    const response = await t.fetch('/api/webhooks/clerk', {
      method: 'POST',
      headers: update.headers,
      body: update.body,
    });

    expect(response.status).toBe(200);

    const saved = await t.query(internal.users.getUser, { clerkId: 'user_clerk_2' });
    expect(saved?.first_name).toBe('Updated');
  });

  it('deletes a user on user.deleted event', async () => {
    const t = convexTest(schema, modules);

    // Create the user first
    const user = clerkUser('user_clerk_3');
    const create = signWebhook({ type: 'user.created', data: user });
    await t.fetch('/api/webhooks/clerk', { method: 'POST', headers: create.headers, body: create.body });

    // Confirm they exist
    const before = await t.query(internal.users.getUser, { clerkId: 'user_clerk_3' });
    expect(before).not.toBeNull();

    // Delete
    const del = signWebhook({ type: 'user.deleted', data: { id: 'user_clerk_3', deleted: true } });
    const response = await t.fetch('/api/webhooks/clerk', {
      method: 'POST',
      headers: del.headers,
      body: del.body,
    });

    expect(response.status).toBe(200);

    const after = await t.query(internal.users.getUser, { clerkId: 'user_clerk_3' });
    expect(after).toBeNull();
  });

  it('returns 200 and ignores unknown event types', async () => {
    const t = convexTest(schema, modules);

    const { body, headers } = signWebhook({
      type: 'session.created',
      data: { id: 'sess_123' },
    });

    const response = await t.fetch('/api/webhooks/clerk', {
      method: 'POST',
      headers,
      body,
    });

    expect(response.status).toBe(200);
  });

  it('is idempotent — user.created on an existing user overwrites without error', async () => {
    const t = convexTest(schema, modules);

    const user = clerkUser('user_clerk_4');
    const req = signWebhook({ type: 'user.created', data: user });

    // Send twice
    await t.fetch('/api/webhooks/clerk', { method: 'POST', headers: req.headers, body: req.body });
    const req2 = signWebhook({ type: 'user.created', data: user });
    const second = await t.fetch('/api/webhooks/clerk', {
      method: 'POST',
      headers: req2.headers,
      body: req2.body,
    });

    expect(second.status).toBe(200);

    // Still only one user record
    const users = await t.run(async (ctx) =>
      ctx.db.query('users').collect()
    );
    expect(users.filter((u) => u.clerkId === 'user_clerk_4')).toHaveLength(1);
  });
});
