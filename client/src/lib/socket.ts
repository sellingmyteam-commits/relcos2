import { io, Socket } from "socket.io-client";

declare global {
  interface Window {
    __sharedSocket?: Socket;
  }
}

export function getSharedSocket(): Socket {
  if (!window.__sharedSocket || window.__sharedSocket.disconnected) {
    if (window.__sharedSocket) {
      window.__sharedSocket.disconnect();
    }
    const socket = io(window.location.origin, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
    });
    const identify = () => {
      const userId = localStorage.getItem("siteUserId");
      if (userId) socket.emit("user_identify", userId);
    };
    socket.on("connect", identify);
    socket.on("reconnect", identify);
    window.__sharedSocket = socket;
  }
  return window.__sharedSocket;
}

/** Call this after storing a new siteUserId to re-announce the user to the server. */
export function reIdentifyUser(userId: string | number) {
  const socket = getSharedSocket();
  if (socket.connected) {
    socket.emit("user_identify", String(userId));
  }
}
