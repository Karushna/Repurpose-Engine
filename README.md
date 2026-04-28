# Repurpose Engine

Repurpose Engine is a Next.js App Router app that turns source content into
LinkedIn, X, and Instagram drafts, then queues or schedules the selected draft
through Buffer.

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Copy `.env.example` to `.env.local` and fill in your OpenAI, Firebase Admin,
and Buffer OAuth values.

## Required Environment Variables

```bash
OPENAI_API_KEY=

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

BUFFER_CLIENT_ID=
BUFFER_CLIENT_SECRET=
BUFFER_REDIRECT_URI=
BUFFER_AUTH_URL=https://auth.buffer.com/auth
BUFFER_TOKEN_URL=https://auth.buffer.com/token
BUFFER_API_BASE=https://api.buffer.com
```

For local development, set:

```bash
BUFFER_REDIRECT_URI=http://localhost:3000/api/buffer/callback
REPURPOSE_ENGINE_USER_ID=local-dev-user
```

`REPURPOSE_ENGINE_USER_ID` is a temporary development placeholder because this
repo does not currently include a real application auth system. Replace
`lib/auth.ts` with Firebase Auth, NextAuth, Clerk, or your chosen session system
before production multi-user use.

## Buffer OAuth Setup

1. In Buffer, create or open your developer/API app.
2. Add the redirect URI that matches your deployment:
   `http://localhost:3000/api/buffer/callback` for local development, and
   `https://your-domain.com/api/buffer/callback` for production.
3. Add the same value to `BUFFER_REDIRECT_URI`.
4. Add the Buffer client ID and client secret to `BUFFER_CLIENT_ID` and
   `BUFFER_CLIENT_SECRET`.
5. Keep `BUFFER_AUTH_URL`, `BUFFER_TOKEN_URL`, and `BUFFER_API_BASE` pointed at
   the Buffer OAuth and GraphQL endpoints shown above unless Buffer changes
   those in your developer dashboard.

The app requests these scopes:

```text
posts:write posts:read account:read offline_access
```

`offline_access` is used to receive a refresh token so scheduled publishing can
continue after the short-lived access token expires.

## How Clients Connect Buffer

1. The user opens `/app`.
2. They click **Connect Buffer**.
3. The app redirects them to Buffer with OAuth 2.0 Authorization Code + PKCE.
4. Buffer redirects back to `/api/buffer/callback`.
5. The server validates state, exchanges the code for tokens, and stores the
   connection in Firestore under `bufferConnections/{userId}_buffer`.
6. The frontend calls `/api/buffer/channels` to show that user's Buffer
   channels.
7. Publishing calls `/api/publish`, which validates that the selected channel
   belongs to the connected Buffer user before creating the Buffer post.

Tokens are never sent to the browser or stored in localStorage.

## Vercel Setup

Add all required environment variables in the Vercel project settings for each
environment. Use the deployed callback URL for production:

```text
https://your-domain.com/api/buffer/callback
```

Add that exact URL to the Buffer Developer Dashboard. The redirect URI must
match exactly.

## Production Notes

- Add real application authentication and replace `getCurrentUserId` in
  `lib/auth.ts`.
- Add token encryption before production if you have a KMS or encryption helper.
  The storage layer includes TODO comments where encryption should be applied.
- Rotate any old single-user `BUFFER_API_KEY`; the app no longer uses it for
  Buffer publishing.

## Scripts

```bash
npm run lint
npm run build
```
