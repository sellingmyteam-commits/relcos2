import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { DirectMessageInput } from "@shared/routes";
import type { DirectMessage } from "@shared/schema";

export function useDirectMessages(user1: string, user2: string) {
  return useQuery<DirectMessage[]>({
    queryKey: ["/api/dm", user1, user2],
    queryFn: async () => {
      if (!user1 || !user2) return [];
      const res = await fetch(`/api/dm/${encodeURIComponent(user1)}/${encodeURIComponent(user2)}`);
      if (!res.ok) throw new Error("Failed to fetch DMs");
      return res.json();
    },
    enabled: !!user1 && !!user2,
    refetchInterval: 1500,
  });
}

export function useCreateDirectMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: DirectMessageInput) => {
      const res = await fetch("/api/dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to send DM");
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/dm", variables.fromUser, variables.toUser] });
      queryClient.invalidateQueries({ queryKey: ["/api/dm/conversations", variables.fromUser] });
    },
  });
}

export function useConversations(username: string) {
  return useQuery<string[]>({
    queryKey: ["/api/dm/conversations", username],
    queryFn: async () => {
      if (!username) return [];
      const res = await fetch(`/api/dm/conversations/${encodeURIComponent(username)}`);
      if (!res.ok) throw new Error("Failed to fetch conversations");
      return res.json();
    },
    enabled: !!username,
    refetchInterval: 3000,
  });
}
