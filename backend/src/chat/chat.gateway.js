import { Server } from "socket.io";
import { verifyToken } from "../utils/jwt.js";
import * as chatService from "./chat.service.js";

/**
 * Socket.IO Gateway for Support Chat
 *
 * Architecture notes:
 * - Each conversation gets its own Socket.IO "room" → conv:{id}
 * - Agents join an "agents" room to receive notifications of waiting chats
 * - Redis adapter can be plugged in for horizontal scaling (see commented code)
 *
 * Events emitted TO clients:
 *   conversation:created   — new conversation data
 *   conversation:assigned  — agent took the conversation
 *   conversation:closed    — conversation ended
 *   message:new            — new message in the conversation
 *   message:deleted        — a message was deleted
 *   queue:update           — updated waiting queue (agents only)
 *   user:disconnected      — the other party disconnected
 *   user:reconnected       — the other party reconnected
 *   messages:seen          — messages were marked as seen
 *   error                  — error message
 *
 * Events received FROM clients:
 *   conversation:start     — client wants to start a chat
 *   conversation:join      — agent/client joins existing conversation
 *   conversation:take      — agent takes a waiting conversation
 *   conversation:close     — agent/client closes conversation
 *   conversation:rate      — client rates the conversation
 *   message:send           — send a message
 *   message:delete         — delete a message
 *   messages:history       — request message history
 *   messages:seen          — mark messages as seen
 *   queue:list             — agent requests waiting queue
 */

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

  // ── Optional: Redis adapter for horizontal scaling ──
  // Uncomment when you have Redis in production:
  //
  // import { createAdapter } from "@socket.io/redis-adapter";
  // import { createClient } from "redis";
  // const pubClient = createClient({ url: process.env.REDIS_URL });
  // const subClient = pubClient.duplicate();
  // await Promise.all([pubClient.connect(), subClient.connect()]);
  // io.adapter(createAdapter(pubClient, subClient));
  // console.log("🔴 Redis adapter connected for Socket.IO");

  // ── Authentication middleware ──
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Authentication required"));
    }
    try {
      const decoded = verifyToken(token);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  // ── Connection handler ──
  io.on("connection", (socket) => {
    const user = socket.user;
    console.log(`🔌 Socket connected: ${socket.id} (user: ${JSON.stringify(user)})`);

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

    // ── Client starts a new conversation ──
    socket.on("conversation:start", async ({ subject, contactId } = {}) => {
      try {
        const cId = contactId || user.contactId;
        if (!cId) {
          return socket.emit("error", { message: "Se requiere contactId" });
        }

        // Check if there's already an open conversation
        const existing = await chatService.getOpenConversationByContact(cId);
        if (existing) {
          joinConvRoom(existing.id);
          const messages = await chatService.getMessages(existing.id);
          return socket.emit("conversation:created", { conversation: existing, messages, resumed: true });
        }

        const conversation = await chatService.createConversation(cId, subject || "Soporte General");

        // Add system message
        await chatService.addMessage(conversation.id, "SYSTEM", null, "Bienvenido al chat de soporte. Un agente se conectará pronto.");

        joinConvRoom(conversation.id);

        const messages = await chatService.getMessages(conversation.id);
        socket.emit("conversation:created", { conversation, messages, resumed: false });

        // Notify agents about new waiting conversation
        const waiting = await chatService.getWaitingConversations();
        io.to("agents").emit("queue:update", waiting);
      } catch (err) {
        console.error("conversation:start error:", err);
        socket.emit("error", { message: "Error al iniciar conversación" });
      }
    });

    // ── Agent takes a waiting conversation ──
    socket.on("conversation:take", async ({ conversationId }) => {
      try {
        if (!isAgent) {
          return socket.emit("error", { message: "Solo agentes pueden tomar conversaciones" });
        }

        const conversation = await chatService.assignAgent(conversationId, user.userId);
        if (!conversation) {
          return socket.emit("error", { message: "Conversación no encontrada" });
        }

        joinConvRoom(conversationId);

        // System message
        const sysMsg = await chatService.addMessage(
          conversationId,
          "SYSTEM",
          null,
          "Un agente se ha conectado. ¿En qué podemos ayudarte?"
        );

        // Notify the client in the room
        io.to(`conv:${conversationId}`).emit("conversation:assigned", { conversation });
        io.to(`conv:${conversationId}`).emit("message:new", sysMsg);

        // Update waiting queue for all agents
        const waiting = await chatService.getWaitingConversations();
        io.to("agents").emit("queue:update", waiting);
      } catch (err) {
        console.error("conversation:take error:", err);
        socket.emit("error", { message: "Error al tomar conversación" });
      }
    });

    // ── Join an existing conversation ──
    socket.on("conversation:join", async ({ conversationId }) => {
      try {
        const conversation = await chatService.getConversation(conversationId);
        if (!conversation) {
          return socket.emit("error", { message: "Conversación no encontrada" });
        }

        joinConvRoom(conversationId);
        const messages = await chatService.getMessages(conversationId);
        socket.emit("conversation:created", { conversation, messages, resumed: true });

        // Notify the other party that we reconnected
        socket.to(`conv:${conversationId}`).emit("user:reconnected", {
          conversationId,
          isAgent,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.error("conversation:join error:", err);
        socket.emit("error", { message: "Error al unirse a conversación" });
      }
    });

    // ── Send a message ──
    socket.on("message:send", async ({ conversationId, body }) => {
      try {
        if (!body || !body.trim()) return;

        const senderType = isAgent ? "AGENT" : "CLIENT";
        const senderId = isAgent ? user.userId : (user.contactId || null);

        const message = await chatService.addMessage(
          conversationId,
          senderType,
          senderId,
          body.trim()
        );

        // Broadcast to everyone in the room (including sender for confirmation)
        io.to(`conv:${conversationId}`).emit("message:new", message);
      } catch (err) {
        console.error("message:send error:", err);
        socket.emit("error", { message: "Error al enviar mensaje" });
      }
    });

    // ── Delete a message ──
    socket.on("message:delete", async ({ messageId, conversationId }) => {
      try {
        const deleted = await chatService.deleteMessage(messageId);
        if (!deleted) {
          return socket.emit("error", { message: "Mensaje no encontrado" });
        }
        // Notify everyone in the room
        io.to(`conv:${conversationId}`).emit("message:deleted", {
          messageId,
          conversationId,
          deletedBy: isAgent ? "AGENT" : "CLIENT",
        });
      } catch (err) {
        console.error("message:delete error:", err);
        socket.emit("error", { message: "Error al eliminar mensaje" });
      }
    });

    // ── Request message history ──
    socket.on("messages:history", async ({ conversationId, beforeId }) => {
      try {
        const messages = await chatService.getMessages(conversationId, 50, beforeId);
        socket.emit("messages:history", { conversationId, messages });
      } catch (err) {
        console.error("messages:history error:", err);
        socket.emit("error", { message: "Error al cargar historial" });
      }
    });

    // ── Mark messages as seen ──
    socket.on("messages:seen", ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit("messages:seen", {
        conversationId,
        seenBy: isAgent ? "AGENT" : "CLIENT",
        timestamp: new Date().toISOString(),
      });
    });

    // ── Close conversation ──
    socket.on("conversation:close", async ({ conversationId }) => {
      try {
        const closedBy = isAgent ? "el agente" : "el cliente";
        const conversation = await chatService.closeConversation(conversationId);

        const sysMsg = await chatService.addMessage(
          conversationId,
          "SYSTEM",
          null,
          `La conversación ha sido cerrada por ${closedBy}. ¡Gracias por contactarnos!`
        );

        io.to(`conv:${conversationId}`).emit("message:new", sysMsg);
        io.to(`conv:${conversationId}`).emit("conversation:closed", { conversation, closedBy });

        // Update waiting queue
        const waiting = await chatService.getWaitingConversations();
        io.to("agents").emit("queue:update", waiting);

        // Clean up presence
        conversationPresence.delete(conversationId);
      } catch (err) {
        console.error("conversation:close error:", err);
        socket.emit("error", { message: "Error al cerrar conversación" });
      }
    });

    // ── Rate conversation ──
    socket.on("conversation:rate", async ({ conversationId, rating }) => {
      try {
        if (rating < 1 || rating > 5) return;
        await chatService.closeConversation(conversationId, rating);
        socket.emit("conversation:rated", { conversationId, rating });
      } catch (err) {
        console.error("conversation:rate error:", err);
      }
    });

    // ── Agent requests waiting queue ──
    socket.on("queue:list", async () => {
      try {
        if (!isAgent) return;
        const waiting = await chatService.getWaitingConversations();
        socket.emit("queue:update", waiting);

        // Also send active conversations for this agent
        const active = await chatService.getActiveConversationsByAgent(user.userId);
        socket.emit("agent:active", active);
      } catch (err) {
        console.error("queue:list error:", err);
      }
    });

    // ── Typing indicators ──
    socket.on("typing:start", ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit("typing:start", {
        conversationId,
        user: { id: user.userId || user.contactId, isAgent },
      });
    });

    socket.on("typing:stop", ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit("typing:stop", {
        conversationId,
        user: { id: user.userId || user.contactId, isAgent },
      });
    });

    // ── Disconnect — notify all conversation rooms ──
    socket.on("disconnect", async (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.id} (${reason})`);

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

  console.log("🔌 Socket.IO initialized for support chat");
  return io;
}

export function getIO() {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
}
