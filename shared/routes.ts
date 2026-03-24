import { z } from "zod";
import { insertMessageSchema, insertDirectMessageSchema, messages, directMessages } from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  messages: {
    list: {
      method: "GET" as const,
      path: "/api/messages",
      responses: {
        200: z.array(z.custom<typeof messages.$inferSelect>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/messages",
      input: insertMessageSchema,
      responses: {
        201: z.custom<typeof messages.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  dm: {
    list: {
      method: "GET" as const,
      path: "/api/dm/:user1/:user2",
      responses: {
        200: z.array(z.custom<typeof directMessages.$inferSelect>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/dm",
      input: insertDirectMessageSchema,
      responses: {
        201: z.custom<typeof directMessages.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    conversations: {
      method: "GET" as const,
      path: "/api/dm/conversations/:username",
      responses: {
        200: z.array(z.string()),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type MessageInput = z.infer<typeof api.messages.create.input>;
export type DirectMessageInput = z.infer<typeof api.dm.create.input>;
