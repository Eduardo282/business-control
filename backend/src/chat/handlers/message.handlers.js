import * as chatService from "../chat.service.js";
import { logger } from "../../utils/logger.js";

export function registerMessageHandlers(io, socket, context) {
  const { user, isAgent } = context;

  // ── Send a message ──
  socket.on("message:send", async ({ conversationId, body }) => {
    try {
      if (!body || !body.trim()) return;

      const conversation = await chatService.getConversation(conversationId);
      if (!conversation) {
        return socket.emit("error", { message: "Conversación no encontrada" });
      }
      if (conversation.status === "CLOSED") {
        return socket.emit("error", { message: "El chat está suspendido." });
      }

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

  // Messages are immutable audit records. Keep the handler so older clients get
  // an explicit rejection instead of silently diverging from server state.
  socket.on("message:delete", () => {
    socket.emit("error", { message: "Los mensajes no se pueden eliminar." });
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
