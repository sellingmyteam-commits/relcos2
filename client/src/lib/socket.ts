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
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
    });
    const identify = () => {
      const userId = localStorage.getItem("siteUserId");
      const username = localStorage.getItem("chatUsername");
      if (userId) socket.emit("user_identify", { userId, username: username || "" });
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
  const username = localStorage.getItem("chatUsername") || "";
  if (socket.connected) {
    socket.emit("user_identify", { userId: String(userId), username });
  }
}
