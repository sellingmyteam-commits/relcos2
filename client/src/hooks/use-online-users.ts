import { useState, useEffect } from "react";
import { getSharedSocket } from "@/lib/socket";

export function useOnlineUsers(username?: string) {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    const socket = getSharedSocket();

    const handler = (users: string[]) => {
      setOnlineUsers(users);
    };

    socket.on("online_users", handler);

    if (username && username.trim()) {
      socket.emit("user_online", username.trim());
    }

    return () => {
      socket.off("online_users", handler);
    };
  }, [username]);

  return onlineUsers;
}
