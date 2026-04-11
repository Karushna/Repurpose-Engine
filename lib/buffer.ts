const BUFFER_API_URL = "https://api.buffer.com";

type BufferGraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

async function bufferRequest<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const apiKey = process.env.BUFFER_API_KEY;

  if (!apiKey) {
    throw new Error("BUFFER_API_KEY is missing");
  }

  const res = await fetch(BUFFER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
    cache: "no-store",
  });

  const json = (await res.json()) as BufferGraphQLResponse<T>;

  console.log("BUFFER GRAPHQL RESPONSE:", JSON.stringify(json, null, 2));

  if (json.errors?.length) {
    throw new Error(json.errors[0].message || "Buffer GraphQL error");
  }

  if (!json.data) {
    throw new Error("No data returned from Buffer");
  }

  return json.data;
}

export async function getOrganizations() {
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
  }>(query);

  return data.account.organizations;
}

export async function getChannels(organizationId: string) {
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
    channels: Array<{
      id: string;
      name: string;
      displayName?: string | null;
      service: string;
    }>;
  }>(query, { organizationId });

  return data.channels;
}

type CreateBufferPostInput = {
  channelId: string;
  text: string;
  mode: "addToQueue" | "customScheduled";
  dueAt?: string;
};

export async function createBufferPost(input: CreateBufferPostInput) {
  const { channelId, text, mode, dueAt } = input;

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
  }>(mutation, variables);

  if ("message" in data.createPost) {
    throw new Error(data.createPost.message);
  }

  return data.createPost.post;
}