# QuizMe WhatsApp bot

The bot talks to QuizMe only over HTTPS. It never connects to the database.

## Environment

| Variable | Where | Purpose |
| --- | --- | --- |
| `WHATSAPP_BOT_API_KEYS` | QuizMe app | Comma-separated bot keys, each at least 32 characters. Two keys allow zero-downtime rotation. Unset means every bot call is refused (503). |
| `QUIZMI_API_BASE_URL` | Bot | Base URL, e.g. `https://quizmi.space` |
| `QUIZMI_API_KEY` | Bot | One of the keys above |

## API (v1)

All endpoints require `Authorization: Bearer <bot key>`.

- `GET /whatsapp/api/v1/courses?q=&subject=&limit=&offset=` returns published courses.
- `GET /whatsapp/api/v1/courses/{code}` returns one course by code. Returns 404 if unknown.

- `POST /whatsapp/api/v1/link` body `{ jid }` starts linking. Returns a single-use link (10 minute expiry) that the bot sends to that number. Max 5 per number per hour.
- `GET /whatsapp/api/v1/account?jid=` returns link status and the user's name.
- `DELETE /whatsapp/api/v1/account?jid=` unlinks the number.

Linking needs two proofs: the token reached that WhatsApp number, and the student signed in with Clerk on the website (`/whatsapp/link`) and confirmed. Neither the phone number nor the bot key is enough on its own. The link keeps the student's existing account, purchases and history.

Errors use `{ "error": string }`. A missing or wrong key returns 401. Missing server config returns 503.

## Running the bot

```bash
cd whatsapp
npm install
QUIZMI_API_BASE_URL=https://quizmi.space QUIZMI_API_KEY=... npm start
```

On first run a QR code prints in the terminal. Scan it from WhatsApp > Linked devices. The
session is saved in `WHATSAPP_SESSION_DIR` (default `./.whatsapp-session`), which is git-ignored
and holds account credentials, so keep it private.

## Commands

`/help`, `/menu`, `/search [query]`, `/courses`, `/next`, `/course [code]`, `/buy [code]`, `/quiz [code]`, `/answer [letter]`, `/submit`, `/login` (sends the link), `/mycourses`, `/logout`. Replying to a course card with BUY, DETAILS or QUIZ acts on that course. Quiz state is kept in memory, so an open quiz is lost if the bot restarts.

## Status

- Done: bot auth, read-only catalogue endpoints, command parser, command router, HTTPS API client, Baileys connection with QR pairing, reconnect and dedupe, and tests for the parser, router, bot auth and course route rejection paths.
- Not verified: the WhatsApp connection itself. It has not been run against a real WhatsApp account, because it needs a QR pairing and the Baileys build pinned here is a release candidate.
- Done: account linking through the existing Clerk sign-in, with single-use expiring links, attempt and rate limits, and DB-backed tests.
- Done: course cards that can be quoted, paging, purchases through Paystack links, and timed quizzes over the API. The web card, quiz and purchase routes are covered by typecheck only, not by automated tests.
