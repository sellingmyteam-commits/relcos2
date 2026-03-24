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
    const socket = io();
    socket.on("connect", () => {
      const username = localStorage.getItem("chatUsername");
      if (username) {
        socket.emit("user_online", username);
      }
    });
    socket.on("reconnect", () => {
      const username = localStorage.getItem("chatUsername");
      if (username) {
        socket.emit("user_online", username);
      }
    });
    window.__sharedSocket = socket;
  }
  return window.__sharedSocket;
}
