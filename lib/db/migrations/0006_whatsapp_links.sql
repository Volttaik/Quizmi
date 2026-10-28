-- WhatsApp account linking.
--
-- A link ties one WhatsApp number (jid) to one existing QuizMe user, which is
-- the account Clerk already created. Links are soft-deleted (unlinked_at) so
-- the history of who linked which number is kept. At most one active link
-- exists per number and per user.

CREATE TABLE IF NOT EXISTS whatsapp_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wa_jid TEXT NOT NULL,
  linked_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  unlinked_at TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS whatsapp_links_active_jid
  ON whatsapp_links (wa_jid) WHERE unlinked_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS whatsapp_links_active_user
  ON whatsapp_links (user_id) WHERE unlinked_at IS NULL;

-- Pending link requests. Only a SHA-256 hash of the random token is stored, so
-- a database read cannot reveal a live link. A request is single-use
-- (consumed_at) and expires quickly (expires_at).

CREATE TABLE IF NOT EXISTS whatsapp_link_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wa_jid TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  consumed_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS whatsapp_link_codes_jid_idx
  ON whatsapp_link_codes (wa_jid, created_at);

-- Failed code confirmations, counted per signed-in user so guessing is limited
-- even though a wrong guess matches no code row.

CREATE TABLE IF NOT EXISTS whatsapp_link_confirm_failures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  failed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS whatsapp_link_confirm_failures_user_idx
  ON whatsapp_link_confirm_failures (user_id, failed_at);
