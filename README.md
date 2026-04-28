# Repurpose Engine

Repurpose Engine is a Next.js App Router app that turns source content into
LinkedIn, X, and Instagram drafts, then queues or schedules the selected draft
through a user-connected Buffer account.

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Copy `.env.example` to `.env.local` and fill in your OpenAI, Firebase, and
Buffer OAuth values.

## Environment Variables

Firebase client auth:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Firebase Admin:

```bash
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

Buffer:

```bash
BUFFER_CLIENT_ID=
BUFFER_CLIENT_SECRET=
BUFFER_REDIRECT_URI=http://localhost:3000/api/buffer/callback
BUFFER_AUTH_URL=https://auth.buffer.com/auth
BUFFER_TOKEN_URL=https://auth.buffer.com/token
BUFFER_API_BASE=https://api.buffer.com
```

The Firebase private key supports escaped newlines:
`process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")`.

## Firebase Auth

The app uses Firebase email/password auth on `/login`.

After sign-in or sign-up, the frontend gets a Firebase ID token and posts it to
`/api/auth/session-login`. The server verifies the ID token with Firebase Admin
and creates an httpOnly `__session` cookie. Server routes verify that cookie and
use the Firebase UID as the application user ID.

Logout calls `/api/auth/session-logout`, which clears the session cookie.

## Buffer OAuth Setup

1. In Buffer, create or open your developer/API app.
2. Add the redirect URI that matches your environment:
   `http://localhost:3000/api/buffer/callback` locally.
3. For production, add:
   `https://repurpose-engine-jet.vercel.app/api/buffer/callback`.
4. Add the same URI to `BUFFER_REDIRECT_URI`.
5. Add the Buffer client ID and secret to `BUFFER_CLIENT_ID` and
   `BUFFER_CLIENT_SECRET`.

The app requests:

```text
posts:write posts:read account:read offline_access
```

## How Buffer Connections Work

1. The user signs in with Firebase.
2. They click **Connect Buffer**.
3. `/api/buffer/connect` verifies the Firebase session cookie and redirects to
   Buffer with OAuth 2.0 Authorization Code + PKCE.
4. Buffer redirects back to `/api/buffer/callback`.
5. The server verifies the Firebase session cookie, exchanges the code for
   tokens, and stores them in Firestore at `bufferConnections/{firebaseUid}`.
6. `/api/buffer/channels` refreshes the token if needed and returns only
   channel/profile data to the frontend.
7. `/api/publish` verifies the Firebase session, validates that the selected
   Buffer channel belongs to that user, then publishes with that user's token.

Access tokens and refresh tokens are never exposed to the browser or stored in
localStorage.

## Firestore

Buffer connections are stored in the `bufferConnections` collection with the
Firebase UID as the document ID:

```text
bufferConnections/{uid}
```

Fields:

```text
id
userId
provider
accessToken
refreshToken
expiresAt
scope
createdAt
updatedAt
```

## Vercel Setup

Add all environment variables in Vercel Project Settings.

For `FIREBASE_PRIVATE_KEY`, paste the private key with escaped newlines, for
example:

```text
-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
```

Set production Buffer redirect URI to:

```text
https://repurpose-engine-jet.vercel.app/api/buffer/callback
```

Add that exact URL in the Buffer Developer Dashboard.

## Scripts

```bash
npm run lint
npm run build
```
