-- Outgoing WhatsApp course cards. When the bot sends a course card, its
-- WhatsApp message ID is stored here with the course it describes, so a
-- student who quotes that card (BUY, DETAILS, QUIZ) resolves to the right
-- course even after the bot restarts. Rows are only written for cards.

CREATE TABLE IF NOT EXISTS whatsapp_card_messages (
  message_id TEXT PRIMARY KEY,
  wa_jid TEXT NOT NULL,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS whatsapp_card_messages_jid_idx
  ON whatsapp_card_messages (wa_jid, created_at);
