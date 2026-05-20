import { Server } from "socket.io";
import { logger } from "../utils/logger.js";
import { authMiddleware } from "./chat.auth.js";
import { registerConversationHandlers } from "./handlers/conversation.handlers.js";
import { registerMessageHandlers } from "./handlers/message.handlers.js";
import { registerAgentHandlers } from "./handlers/agent.handlers.js";
import { registerTypingHandlers } from "./handlers/typing.handlers.js";

let io;

// Track which conversation rooms each socket is in
// socketId → Set<conversationId>
const socketConversations = new Map();

// Track user presence per conversation
// conversationId → { clients: Set<socketId>, agents: Set<socketId> }
const conversationPresence = new Map();

function getPresence(convId) {
  if (!conversationPresence.has(convId)) {
    conversationPresence.set(convId, { clients: new Set(), agents: new Set() });
  }
  return conversationPresence.get(convId);
}

export function initSocketIO(httpServer, corsOrigin) {
  io = new Server(httpServer, {
    cors: {
      origin: corsOrigin,
      credentials: true,
    },
    // Performance tuning for thousands of connections
    pingTimeout: 30000,
    pingInterval: 15000,
    maxHttpBufferSize: 1e6, // 1 MB max message
    transports: ["websocket", "polling"], // Prefer websocket
  });

  // ── Authentication middleware ──
  io.use(authMiddleware);

  // ── Connection handler ──
  io.on("connection", (socket) => {
    const user = socket.user;
    logger.info(`🔌 Socket connected: ${socket.id} (user: ${JSON.stringify(user)})`);

    socketConversations.set(socket.id, new Set());

    // Auto-join agents to the agents room (portal contacts are NOT agents)
    const isAgent = user.role && ["ADMIN", "SOPORTE", "VENTAS"].includes(user.role);
    if (isAgent) {
      socket.join("agents");
    }

    // Helper: join a conversation room and track presence
    function joinConvRoom(convId) {
      socket.join(`conv:${convId}`);
      socketConversations.get(socket.id)?.add(convId);
      const presence = getPresence(convId);
      if (isAgent) {
        presence.agents.add(socket.id);
      } else {
        presence.clients.add(socket.id);
      }
    }

    // Prepare context to share with modular handlers
    const context = {
      user,
      isAgent,
      joinConvRoom,
      socketConversations,
      conversationPresence,
      getPresence,
    };

    // Register modular handlers
    registerConversationHandlers(io, socket, context);
    registerMessageHandlers(io, socket, context);
    registerAgentHandlers(io, socket, context);
    registerTypingHandlers(io, socket, context);

    // ── Disconnect — notify all conversation rooms ──
    socket.on("disconnect", (reason) => {
      logger.info(`🔌 Socket disconnected: ${socket.id} (${reason})`);

      const convIds = socketConversations.get(socket.id) || new Set();

      for (const convId of convIds) {
        const presence = getPresence(convId);
        if (isAgent) {
          presence.agents.delete(socket.id);
        } else {
          presence.clients.delete(socket.id);
        }

        // Notify the room that a participant left
        socket.to(`conv:${convId}`).emit("user:disconnected", {
          conversationId: convId,
          isAgent,
          timestamp: new Date().toISOString(),
        });
      }

      socketConversations.delete(socket.id);
    });
  });

  logger.info("🔌 Socket.IO initialized for support chat");
  return io;
}

export function getIO() {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
}
