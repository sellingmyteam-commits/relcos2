import { useState, useEffect } from "react";
import { getSharedSocket } from "@/lib/socket";

export interface OnlineUser {
  id: string;
  username: string;
}

export function useOnlineUsers(): OnlineUser[] {
  const [users, setUsers] = useState<OnlineUser[]>([]);

  useEffect(() => {
    const socket = getSharedSocket();

    const handler = (stats: { total: number; pages: Record<string, number>; onlineUsers?: OnlineUser[] }) => {
      setUsers(stats.onlineUsers ?? []);
    };

    socket.on("stats_update", handler);
    return () => { socket.off("stats_update", handler); };
  }, []);

  return users;
}
