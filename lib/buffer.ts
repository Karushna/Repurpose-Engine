import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getDb } from "@/lib/firebase-admin";

const BUFFER_PROVIDER = "buffer";
const OAUTH_SCOPES =
  "posts:write posts:read account:read offline_access";
const TOKEN_EXPIRY_SKEW_MS = 60_000;

type BufferOAuthEnv = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authUrl: string;
  tokenUrl: string;
  apiBase: string;
};

type BufferTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
  error_description?: string;
};

export type BufferConnection = {
  id: string;
  userId: string;
  provider: "buffer";
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scope: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

export type BufferChannel = {
  id: string;
  name: string;
  displayName?: string | null;
  service: string;
};

type BufferGraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

type CreateBufferPostInput = {
  userId: string;
  channelId: string;
  text: string;
  mode: "addToQueue" | "customScheduled";
  dueAt?: string;
};

export function getBufferOAuthScopes() {
  return OAUTH_SCOPES;
}

export function getBufferOAuthEnv(): BufferOAuthEnv {
  const clientId = process.env.BUFFER_CLIENT_ID;
  const clientSecret = process.env.BUFFER_CLIENT_SECRET;
  const redirectUri = process.env.BUFFER_REDIRECT_URI;
  const authUrl = process.env.BUFFER_AUTH_URL;
  const tokenUrl = process.env.BUFFER_TOKEN_URL;
  const apiBase = process.env.BUFFER_API_BASE;

  const missing = [
    ["BUFFER_CLIENT_ID", clientId],
    ["BUFFER_CLIENT_SECRET", clientSecret],
    ["BUFFER_REDIRECT_URI", redirectUri],
    ["BUFFER_AUTH_URL", authUrl],
    ["BUFFER_TOKEN_URL", tokenUrl],
    ["BUFFER_API_BASE", apiBase],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length) {
    throw new Error(`Missing Buffer OAuth environment variables: ${missing.join(", ")}`);
  }

  return {
    clientId: clientId!,
    clientSecret: clientSecret!,
    redirectUri: redirectUri!,
    authUrl: authUrl!,
    tokenUrl: tokenUrl!,
    apiBase: apiBase!,
  };
}

function connectionDoc(userId: string) {
  return getDb().collection("bufferConnections").doc(userId);
}

function toDate(value: unknown) {
  if (value instanceof Date) {
    return value;
  }

  if (value instanceof Timestamp) {
    return value.toDate();
  }

  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

function parseConnection(id: string, data: FirebaseFirestore.DocumentData) {
  const expiresAt = toDate(data.expiresAt);

  if (
    data.provider !== BUFFER_PROVIDER ||
    typeof data.userId !== "string" ||
    typeof data.accessToken !== "string" ||
    typeof data.refreshToken !== "string" ||
    !expiresAt
  ) {
    return null;
  }

  return {
    id,
    userId: data.userId,
    provider: BUFFER_PROVIDER,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresAt,
    scope: typeof data.scope === "string" ? data.scope : "",
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  } satisfies BufferConnection;
}

export async function getBufferConnection(userId: string) {
  const snapshot = await connectionDoc(userId).get();

  if (!snapshot.exists) {
    return null;
  }

  return parseConnection(snapshot.id, snapshot.data() ?? {});
}

export async function saveBufferConnection(
  userId: string,
  tokens: Required<Pick<BufferTokenResponse, "access_token" | "refresh_token">> &
    Pick<BufferTokenResponse, "expires_in" | "scope">
) {
  const expiresAt = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000);
  const ref = connectionDoc(userId);

  // TODO: Encrypt accessToken and refreshToken before persisting once this app
  // has a token encryption utility or KMS-backed secret helper.
  await ref.set(
    {
      id: ref.id,
      userId,
      provider: BUFFER_PROVIDER,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt,
      scope: tokens.scope ?? OAUTH_SCOPES,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

export async function deleteBufferConnection(userId: string) {
  await connectionDoc(userId).delete();
}

async function exchangeToken(params: Record<string, string>) {
  const env = getBufferOAuthEnv();
  const response = await fetch(env.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params),
    cache: "no-store",
  });

  const tokenResponse = (await response.json()) as BufferTokenResponse;

  if (!response.ok || tokenResponse.error) {
    throw new Error(
      tokenResponse.error_description ||
        tokenResponse.error ||
        "Buffer token request failed"
    );
  }

  if (!tokenResponse.access_token) {
    throw new Error("Buffer token response did not include an access token");
  }

  return tokenResponse;
}

export async function exchangeBufferAuthorizationCode(
  code: string,
  codeVerifier: string
) {
  const env = getBufferOAuthEnv();

  const tokens = await exchangeToken({
    client_id: env.clientId,
    client_secret: env.clientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: env.redirectUri,
    code_verifier: codeVerifier,
  });

  if (!tokens.refresh_token) {
    throw new Error("Buffer token response did not include a refresh token");
  }

  return tokens as Required<Pick<BufferTokenResponse, "access_token" | "refresh_token">> &
    Pick<BufferTokenResponse, "expires_in" | "scope">;
}

export async function getValidBufferConnection(userId: string) {
  const connection = await getBufferConnection(userId);

  if (!connection) {
    throw new Error("Buffer account is not connected");
  }

  if (connection.expiresAt.getTime() - TOKEN_EXPIRY_SKEW_MS > Date.now()) {
    return connection;
  }

  const env = getBufferOAuthEnv();
  const tokens = await exchangeToken({
    client_id: env.clientId,
    client_secret: env.clientSecret,
    grant_type: "refresh_token",
    refresh_token: connection.refreshToken,
  });

  const accessToken = tokens.access_token;
  const refreshToken = tokens.refresh_token ?? connection.refreshToken;
  const expiresAt = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000);

  // Buffer rotates refresh tokens when it returns a new one. Always persist the
  // newest token response before any follow-up API call.
  await connectionDoc(userId).set(
    {
      accessToken,
      refreshToken,
      expiresAt,
      scope: tokens.scope ?? connection.scope,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return {
    ...connection,
    accessToken,
    refreshToken,
    expiresAt,
    scope: tokens.scope ?? connection.scope,
  };
}

async function bufferRequest<T>(
  userId: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const env = getBufferOAuthEnv();
  const connection = await getValidBufferConnection(userId);

  const res = await fetch(env.apiBase, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${connection.accessToken}`,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
    cache: "no-store",
  });

  if (res.status === 401) {
    throw new Error("Buffer authorization expired. Please reconnect Buffer.");
  }

  const json = (await res.json()) as BufferGraphQLResponse<T>;

  if (!res.ok) {
    throw new Error(`Buffer API request failed with status ${res.status}`);
  }

  if (json.errors?.length) {
    throw new Error(json.errors[0].message || "Buffer GraphQL error");
  }

  if (!json.data) {
    throw new Error("No data returned from Buffer");
  }

  return json.data;
}

export async function getOrganizations(userId: string) {
  const query = `
    query GetOrganizations {
      account {
        organizations {
          id
          name
        }
      }
    }
  `;

  const data = await bufferRequest<{
    account: {
      organizations: Array<{
        id: string;
        name: string;
      }>;
    };
  }>(userId, query);

  return data.account.organizations;
}

export async function getChannels(userId: string, organizationId: string) {
  const query = `
    query GetChannels($organizationId: OrganizationId!) {
      channels(input: { organizationId: $organizationId }) {
        id
        name
        displayName
        service
      }
    }
  `;

  const data = await bufferRequest<{
    channels: BufferChannel[];
  }>(userId, query, { organizationId });

  return data.channels;
}

export async function getAllChannelsForUser(userId: string) {
  const organizations = await getOrganizations(userId);
  const channelGroups = await Promise.all(
    organizations.map(async (organization) => ({
      organizationId: organization.id,
      channels: await getChannels(userId, organization.id),
    }))
  );

  return {
    organizations,
    channels: channelGroups.flatMap((group) =>
      group.channels.map((channel) => ({
        ...channel,
        organizationId: group.organizationId,
      }))
    ),
  };
}

export async function createBufferPost(input: CreateBufferPostInput) {
  const { userId, channelId, text, mode, dueAt } = input;

  if (mode === "customScheduled" && !dueAt) {
    throw new Error("dueAt is required for customScheduled posts");
  }

  const mutation =
    mode === "customScheduled"
      ? `
        mutation CreatePost(
          $channelId: ChannelId!,
          $text: String!,
          $dueAt: DateTime!
        ) {
          createPost(
            input: {
              text: $text
              channelId: $channelId
              schedulingType: automatic
              mode: customScheduled
              dueAt: $dueAt
            }
          ) {
            ... on PostActionSuccess {
              post {
                id
                text
                dueAt
                channelId
              }
            }
            ... on MutationError {
              message
            }
          }
        }
      `
      : `
        mutation CreatePost(
          $channelId: ChannelId!,
          $text: String!
        ) {
          createPost(
            input: {
              text: $text
              channelId: $channelId
              schedulingType: automatic
              mode: addToQueue
            }
          ) {
            ... on PostActionSuccess {
              post {
                id
                text
                dueAt
                channelId
              }
            }
            ... on MutationError {
              message
            }
          }
        }
      `;

  const variables =
    mode === "customScheduled"
      ? { channelId, text, dueAt }
      : { channelId, text };

  const data = await bufferRequest<{
    createPost:
      | {
          post: {
            id: string;
            text: string;
            dueAt: string | null;
            channelId: string;
          };
        }
      | {
          message: string;
        };
  }>(userId, mutation, variables);

  if ("message" in data.createPost) {
    throw new Error(data.createPost.message);
  }

  return data.createPost.post;
}
