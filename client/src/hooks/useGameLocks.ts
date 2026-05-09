import { useEffect, useState, useCallback } from "react";

let cache: Set<string> = new Set();
const listeners = new Set<(s: Set<string>) => void>();

async function refresh() {
  try {
    const res = await fetch("/api/locked-games");
    if (!res.ok) return;
    const list: { gameId: string }[] = await res.json();
    cache = new Set(list.map(l => l.gameId));
    listeners.forEach(fn => fn(cache));
  } catch {}
}

let started = false;
function ensurePolling() {
  if (started) return;
  started = true;
  refresh();
  setInterval(refresh, 30000);
}

export function useGameLocks() {
  const [locked, setLocked] = useState<Set<string>>(cache);

  useEffect(() => {
    ensurePolling();
    listeners.add(setLocked);
    return () => {
      listeners.delete(setLocked);
    };
  }, []);

  const isLocked = useCallback((href: string) => {
    const id = href.replace(/^\//, "").split("/")[0];
    return locked.has(id);
  }, [locked]);

  return { locked, isLocked, refresh };
}
