import * as chatService from "../chat.service.js";
import { logger } from "../../utils/logger.js";

export function registerMessageHandlers(io, socket, context) {
  const { user, isAgent } = context;

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
      logger.error("message:send error:", err);
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
      logger.error("message:delete error:", err);
      socket.emit("error", { message: "Error al eliminar mensaje" });
    }
  });

  // ── Request message history ──
  socket.on("messages:history", async ({ conversationId, beforeId }) => {
    try {
      const messages = await chatService.getMessages(conversationId, 50, beforeId);
      socket.emit("messages:history", { conversationId, messages });
    } catch (err) {
      logger.error("messages:history error:", err);
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
}
