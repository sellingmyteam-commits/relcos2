import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Message } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useChatToasts(currentUsername: string) {
  const { toast } = useToast();
  const lastSeenId = useRef<number>(-1);
  const initialized = useRef(false);

  const { data: messages } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (!messages || messages.length === 0) return;

    const maxId = Math.max(...messages.map((m) => m.id));

    if (!initialized.current) {
      lastSeenId.current = maxId;
      initialized.current = true;
      return;
    }

    const newMessages = messages.filter(
      (m) => m.id > lastSeenId.current && m.fromUser !== currentUsername
    );

    for (const msg of newMessages) {
      toast({
        title: msg.fromUser,
        description: msg.content.length > 80 ? msg.content.slice(0, 80) + "…" : msg.content,
        duration: 4000,
      });
    }

    lastSeenId.current = maxId;
  }, [messages]);
}
