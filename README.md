# OperatorApp — Backend

REST + WebSocket API for the OperatorApp customer support platform. Handles authentication, real-time chat, message translation, AI-powered knowledge base queries, and the **Paint State** context-relevance engine.

Built with Node.js, Express, Prisma (PostgreSQL), Socket.IO, and the OpenAI API.

---

## Features

- **Real-time chat** — Socket.IO server with thread rooms, operator presence channel, and message broadcast.
- **Two-mode authentication**
    - **JWT** for operators logging into the dashboard.
    - **Hashed API keys** for the embedded customer chat widget. Keys are issued via `/auth/create-api-key` and stored as SHA-256 hashes.
- **Translation pipeline** — every incoming message is translated to the operator's preferred language with `gpt-4o-mini`; both `text_original` and `text_translated` plus the detected language are stored.
- **Per-operator knowledge base** — operators upload free-text knowledge that's synced to an OpenAI vector store. Queries use OpenAI's `file_search` tool for grounded answers (no hallucinated facts).
- **Prompt buttons** — saved, reusable prompts that fire against the knowledge base and return a response ready to send to the customer.
- **Customer simulation** — sandbox endpoint that drives an AI customer for testing operator flows.
- **Paint State engine** — scores each thread's relevance to six context sections (customer / session / URL trail / cart / orders / sentiment) and assigns a per-thread hue using a golden-angle distribution, so the dashboard can paint each thread with a distinctive color and brighten sections as they become relevant. See [`paint/`](./paint) for the catalog and scoring logic.

---

## Tech stack

- **Runtime:** Node.js (CommonJS)
- **HTTP:** Express 4
- **Real-time:** Socket.IO 4
- **ORM:** Prisma 5 with the PostgreSQL adapter
- **Auth:** Passport JWT, bcryptjs, jsonwebtoken
- **AI:** OpenAI Chat Completions + Responses API (`gpt-4o-mini`), vector stores
- **Caching:** apicache

---

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- An OpenAI API key

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (copy and fill in values)
cp .env.example .env

# 3. Run database migrations
npx prisma migrate dev

# 4. Generate the Prisma client
npx prisma generate

# 5. Start the server
node app.js
```

---

## Environment variables

Copy `.env.example` to `.env` and fill in:

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string for Prisma. |
| `SESSION_SECRET` | Secret used by Passport's JWT strategy. |
| `JWT_SECRET` | Secret used to sign / verify JWTs. |
| `PORT` | HTTP port the Express server listens on. |
| `PORT_SOCCET` | (Reserved) socket port — kept for parity with `.env.example`. |
| `OPENAI_API_KEY` | API key used for translation, knowledge queries, and paint scoring. |
| `INTERNAL_FRONTEND_URL` | Origin of the trusted internal operator frontend (used by CORS middleware). |

---

## API reference

All endpoints return `{ success: boolean, data?, error? }`.

### Auth — `/auth`

| Method | Path | Auth | Body | Purpose |
| --- | --- | --- | --- | --- |
| POST | `/auth/login` | — | `{ username, password }` | Log in, returns JWT. |
| POST | `/auth/sign-up` | — | `{ username, email, password, name, languages }` | Register a new operator. |
| POST | `/auth/logout` | — | — | Clear session. |
| POST | `/auth/create-api-key` | JWT | — | Issue an API key for the customer widget. |

### Threads — `/thread`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/thread` | API key | Create a thread for a customer (called by the widget). |
| GET | `/thread` | JWT | List threads for the authenticated operator. Filters: `name`, `pendingOnly`, `hasMessages`. |
| GET | `/thread/username/:username` | JWT or API key | Get a thread by customer username. |
| GET | `/thread/:id` | — | Get a thread by ID. |
| GET | `/thread/:id/messages` | — | Get all messages in a thread. |
| GET | `/thread/:id/paint` | — | Current Paint State for the thread. |
| PATCH | `/thread/:id/status` | JWT | Update thread status (`OPEN` / `PENDING` / `RESOLVED` / `CLOSED`). |
| PATCH | `/thread/:id/assign` | — | Assign the thread to an operator. |

### AI — `/ai`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/ai/customerSimulation` | API key | Generate a simulated customer reply (testing). |
| POST | `/ai/knowledge` | JWT or API key | Upsert the operator's knowledge base content. |
| POST | `/ai/knowledge/query` | JWT or API key | Query the knowledge base (uses OpenAI vector store). |
| POST | `/ai/prompt-button` | JWT | Create a prompt button. |
| GET | `/ai/prompt-button` | JWT | List the operator's prompt buttons. |
| PATCH | `/ai/prompt-button` | JWT | Upsert a prompt button by name. |
| DELETE | `/ai/prompt-button/:buttonId` | JWT | Delete a prompt button. |
| POST | `/ai/prompt-button/fire` | JWT | Fire a prompt button against the knowledge base for a given thread. |

### Operator — `/operator`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/operator/languages` | JWT | Get the operator's preferred languages. |
| PATCH | `/operator/update-languages` | JWT | Update the operator's preferred languages. |

### WebSocket events

Connect to the Socket.IO server with either `auth.token` (JWT) or `auth.apiKey` (raw key — server hashes and matches).

| Event | Direction | Payload | Purpose |
| --- | --- | --- | --- |
| `join_thread` | client → server | `threadId` | Join a thread room. |
| `join_operator_threads` | client → server | — | Join the global `operators` room. |
| `leave_operator_threads` | client → server | — | Leave the `operators` room. |
| `send_message` | client → server | `{ thread_id, text, sender }` | Persist and broadcast a message. |
| `message` | server → client | `{ success, event, data }` | New message in the thread room. |
| `thread_updated` | server → client | `{ thread_id, status, last_message }` | Broadcast to the `operators` room. |
| `paint_updated` | server → client | `{ thread_id, scores, base_color }` | Updated Paint State after a message. |

---

## Project structure

```
backend/
├── app.js                 # Entry point — Express + Socket.IO setup
├── config/
│   ├── passport.js        # JWT strategy
│   └── socket.js          # Socket.IO auth middleware + event handlers
├── controllers/           # HTTP & socket controllers (thin)
├── service/               # Business logic
│   ├── aiService.js       # OpenAI calls (chat, translate, KB query, scoring)
│   ├── knowledgeService.js
│   ├── vectorStoreService.js
│   ├── paintService.js    # Paint State orchestration
│   ├── threadService.js
│   ├── authService.js
│   ├── operatorService.js
│   └── realTimeChatService.js
├── routes/                # Express routers
├── middleware/
│   ├── authMiddleware.js          # JWT
│   ├── apiKeyMiddleware.js        # Hashed API key
│   ├── authenticateAnyMiddleware.js  # Either of the above
│   └── cors.middleware.js         # Dynamic CORS
├── models/
│   └── queries.js         # All Prisma queries
├── paint/
│   ├── paintCatalog.js    # Section catalog (customer, session, cart, ...)
│   └── paintScoring.js    # Decay + boost + AI scoring
├── prisma/
│   └── schema.prisma      # Database schema
└── helper/
    └── authHelper.js
```

---

## Data model

The Prisma schema (`prisma/schema.prisma`) covers:

- **Operator** — support agent. Has username, hashed password, languages, optional `api_key` (hashed), and `vector_store_id` / `vector_file_id` for the knowledge base.
- **Customer** — end user chatting on the storefront. Linked to threads, orders, intakes.
- **Thread** — a conversation. Has a status (`OPEN` / `PENDING` / `RESOLVED` / `CLOSED`), an assigned operator, a paint state, and a session context snapshot.
- **Message** — text + translation + detected language + sender type (`OPERATOR` / `CUSTOMER` / `SYSTEM`), with attached files.
- **ThreadPaintState** — per-thread context scores, scoring version, and base HSV color.
- **SessionContextSnapshot** — per-thread snapshot of customer, country/city, URL trail, cart, orders, sentiment.
- **Order**, **Shipment**, **Intake**, **File** — supporting e-commerce / support entities.
- **KnowledgeBase** — operator's free-text knowledge synced to OpenAI.
- **PromptButtons** — saved operator prompts.

---

## Paint State — how it works

Each new message triggers `paintService.updateThreadPaintState`, which:

1. Loads or initializes the thread's paint state. The base hue is `(thread_id × 137.508) mod 360` — the golden-angle trick gives adjacent threads visibly distinct colors.
2. Loads the latest session context snapshot (cart, orders, URL trail, etc.).
3. For each of the six sections in [`paint/paintCatalog.js`](./paint/paintCatalog.js), computes a relevance boost from:
    - Keyword matches in the message (per-language).
    - Entity references found in the snapshot (e.g. cart items, tracking numbers).
    - An optional AI scoring pass (`scoreSectionsSemantically`) that asks `gpt-4o-mini` to rate the message's relevance to each section.
4. Applies decay to previous scores and adds the new boost (capped per message).
5. Persists the new scores and broadcasts a `paint_updated` socket event.

The frontend uses the base hue + per-section score to render section colors with `hsl(h, s, v × (0.4 + 0.6 × score))`.

---

## License

MIT