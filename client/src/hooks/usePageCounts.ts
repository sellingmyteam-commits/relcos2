import { useState, useEffect } from "react";
import { getSharedSocket } from "@/lib/socket";

export function usePageCounts(): Record<string, number> {
  const [pages, setPages] = useState<Record<string, number>>({});

  useEffect(() => {
    const socket = getSharedSocket();
    const handler = (stats: { total: number; pages: Record<string, number> }) => {
      setPages(stats.pages || {});
    };
    socket.on("stats_update", handler);
    return () => { socket.off("stats_update", handler); };
  }, []);

  return pages;
}
