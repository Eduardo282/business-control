import { io } from "socket.io-client";
const API_URL = import.meta.env.VITE_API_URL?.replace("/graphql", "") || "http://localhost:4000";

const instances = {};

export function getSocket(token) {
  if (!token) return null;
  if (!instances[token]) {
    instances[token] = io(API_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }
  return instances[token];
}

export function disconnectSocket(token) {
  if (instances[token]) {
    instances[token].disconnect();
    delete instances[token];
  }
}
