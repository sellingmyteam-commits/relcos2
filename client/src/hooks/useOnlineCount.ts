import { useState, useEffect } from "react";
import { getSharedSocket } from "@/lib/socket";

export function useOnlineCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const socket = getSharedSocket();

    const handler = (stats: { total: number; pages: Record<string, number> }) => {
      setCount(stats.total);
    };

    socket.on("stats_update", handler);

    return () => {
      socket.off("stats_update", handler);
    };
  }, []);

  return count;
}
