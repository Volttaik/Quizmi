import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  type WAMessage,
  type WASocket,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import { log } from "../logger.js";

export type IncomingMessage = {
  jid: string;
  text: string;
  id: string;
  /** Message ID of the message this one quotes, when the student used Reply. */
  quotedId: string | null;
};

/**
 * A reply to send. `image` is sent as a WhatsApp image with `text` as its
 * caption; if the image fails, the text is sent alone. `onSent` receives the
 * WhatsApp message ID so card messages can be tied to their course.
 */
export type OutgoingPart = {
  text: string;
  image?: string;
  /** Course code to record against this card's WhatsApp message ID. */
  courseCode?: string;
};

export type OutgoingReply = {
  text: string;
  image?: string;
  /** Extra course cards, sent one message each; their message IDs are recorded. */
  cards?: OutgoingPart[];
  onSent?: (messageId: string) => Promise<void>;
} | null;

export type MessageHandler = (message: IncomingMessage) => Promise<OutgoingReply>;

const SEEN_LIMIT = 500;

function extractText(message: WAMessage): string | null {
  const content = message.message;
  if (!content) return null;
  return (
    content.conversation ??
    content.extendedTextMessage?.text ??
    content.imageMessage?.caption ??
    null
  );
}

/**
 * Starts a WhatsApp session and routes text messages to `onMessage`. Reconnects
 * with backoff unless the account was logged out. Returns a stop function.
 */
async function sendPart(
  sock: WASocket,
  jid: string,
  part: OutgoingPart,
  recordCard?: (messageId: string, jid: string, courseCode: string) => Promise<void>
): Promise<void> {
  try {
    const sent = part.image
      ? await sock.sendMessage(jid, { image: { url: part.image }, caption: part.text })
      : await sock.sendMessage(jid, { text: part.text });
    if (sent?.key.id && part.courseCode) {
      await recordCard?.(sent.key.id, jid, part.courseCode);
    }
  } catch (error) {
    log.warn("whatsapp.card_failed", { error: String(error) });
  }
}

export async function startConnection(
  sessionDir: string,
  onMessage: MessageHandler,
  recordCard?: (messageId: string, jid: string, courseCode: string) => Promise<void>
): Promise<() => void> {
  const seen = new Set<string>();
  let socket: WASocket | null = null;
  let stopped = false;
  let attempt = 0;

  const remember = (id: string): boolean => {
    if (seen.has(id)) return false;
    seen.add(id);
    if (seen.size > SEEN_LIMIT) {
      const oldest = seen.values().next().value;
      if (oldest !== undefined) seen.delete(oldest);
    }
    return true;
  };

  async function connect(): Promise<void> {
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();
    const sock = makeWASocket({ version, auth: state, printQRInTerminal: false });
    socket = sock;

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect, qr } = update;
      if (qr) {
        log.info("whatsapp.qr", { hint: "scan with WhatsApp > Linked devices" });
        process.stdout.write(`${qr}\n`);
      }
      if (connection === "open") {
        attempt = 0;
        log.info("whatsapp.connected");
      }
      if (connection === "close" && !stopped) {
        const code = (lastDisconnect?.error as Boom | undefined)?.output?.statusCode;
        if (code === DisconnectReason.loggedOut) {
          log.error("whatsapp.logged_out", { hint: "delete the session dir and re-pair" });
          return;
        }
        attempt += 1;
        const delay = Math.min(30_000, 1000 * 2 ** Math.min(attempt, 5));
        log.warn("whatsapp.reconnecting", { code, delayMs: delay });
        setTimeout(() => void connect().catch((error) => log.error("whatsapp.connect_failed", { error: String(error) })), delay);
      }
    });

    sock.ev.on("messages.upsert", ({ messages, type }) => {
      if (type !== "notify") return;
      for (const message of messages) {
        if (message.key.fromMe) continue;
        const id = message.key.id;
        const jid = message.key.remoteJid;
        const text = extractText(message);
        if (!id || !jid || text === null || !remember(id)) continue;
        const quotedId = message.message?.extendedTextMessage?.contextInfo?.stanzaId ?? null;
        void onMessage({ jid, text, id, quotedId })
          .then(async (reply) => {
            if (!reply) return;
            if (reply.cards) {
              for (const card of reply.cards) {
                await sendPart(sock, jid, card, recordCard);
              }
            }
            if (reply.image) {
              try {
                const sent = await sock.sendMessage(jid, { image: { url: reply.image }, caption: reply.text });
                if (sent?.key.id) await reply.onSent?.(sent.key.id);
                return;
              } catch (error) {
                log.warn("whatsapp.image_failed", { error: String(error) });
              }
            }
            const sent = await sock.sendMessage(jid, { text: reply.text });
            if (sent?.key.id) await reply.onSent?.(sent.key.id);
          })
          .catch((error) => log.error("whatsapp.handler_failed", { error: String(error) }));
      }
    });
  }

  await connect();

  return () => {
    stopped = true;
    socket?.end(undefined);
  };
}
