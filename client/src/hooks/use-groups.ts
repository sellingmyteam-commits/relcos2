import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ChatGroup, GroupMessage } from "@shared/schema";

export type GroupWithMembers = ChatGroup & { members: string[] };

export type GroupInvite = {
  id: number;
  groupId: number;
  groupName: string;
  invitedBy: string;
  createdAt: string | null;
};

export function useGroups(username: string) {
  return useQuery<GroupWithMembers[]>({
    queryKey: ["/api/groups/user", username],
    queryFn: async () => {
      if (!username) return [];
      const res = await fetch(`/api/groups/user/${encodeURIComponent(username)}`);
      if (!res.ok) throw new Error("Failed to fetch groups");
      return res.json();
    },
    enabled: !!username,
    refetchInterval: 90000,
  });
}

export function useGroupMessages(groupId: number | null, username: string) {
  return useQuery<GroupMessage[]>({
    queryKey: ["/api/groups", groupId, "messages"],
    queryFn: async () => {
      if (!groupId || !username) return [];
      const res = await fetch(`/api/groups/${groupId}/messages?username=${encodeURIComponent(username)}`);
      if (!res.ok) throw new Error("Failed to fetch group messages");
      return res.json();
    },
    enabled: !!groupId && !!username,
    refetchInterval: 8000,
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; createdBy: string; members: string[] }) => {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || "Failed to create group");
      }
      return res.json() as Promise<GroupWithMembers>;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups/user", variables.createdBy] });
    },
  });
}

export function useSendGroupMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { groupId: number; fromUser: string; content: string }) => {
      const res = await fetch(`/api/groups/${data.groupId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromUser: data.fromUser, content: data.content }),
      });
      if (!res.ok) throw new Error("Failed to send message");
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups", variables.groupId, "messages"] });
    },
  });
}

export function useLeaveGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, username }: { groupId: number; username: string }) => {
      const res = await fetch(`/api/groups/${groupId}/members/${encodeURIComponent(username)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to leave group");
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups/user", variables.username] });
    },
  });
}

export function useAddGroupMembers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, usernames, addedBy }: { groupId: number; usernames: string[]; addedBy: string }) => {
      for (const username of usernames) {
        const res = await fetch(`/api/groups/${groupId}/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, addedBy }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.message || "Failed to add member");
        }
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups/user", variables.addedBy] });
    },
  });
}

export function useInviteGroupMembers() {
  return useMutation({
    mutationFn: async ({ groupId, usernames, invitedBy }: { groupId: number; usernames: string[]; invitedBy: string }) => {
      const res = await fetch(`/api/groups/${groupId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernames, invitedBy }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || "Failed to send invites");
      }
      return res.json() as Promise<{ ok: boolean; invited: number }>;
    },
  });
}

export function useGroupInvites(username: string) {
  return useQuery<GroupInvite[]>({
    queryKey: ["/api/groups/invites", username],
    queryFn: async () => {
      if (!username) return [];
      const res = await fetch(`/api/groups/invites/${encodeURIComponent(username)}`);
      if (!res.ok) throw new Error("Failed to fetch invites");
      return res.json();
    },
    enabled: !!username,
    refetchInterval: 90000,
  });
}

export function useAcceptGroupInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ inviteId, username }: { inviteId: number; username: string }) => {
      const res = await fetch(`/api/groups/invites/${inviteId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      if (!res.ok) throw new Error("Failed to accept invite");
      return res.json() as Promise<{ ok: boolean; groupId: number }>;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups/invites", variables.username] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups/user", variables.username] });
    },
  });
}

export function useDeclineGroupInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ inviteId, username }: { inviteId: number; username: string }) => {
      const res = await fetch(`/api/groups/invites/${inviteId}/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      if (!res.ok) throw new Error("Failed to decline invite");
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups/invites", variables.username] });
    },
  });
}
