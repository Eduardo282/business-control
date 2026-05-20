import * as chatService from "../chat.service.js";
import { logger } from "../../utils/logger.js";

export function registerConversationHandlers(io, socket, context) {
  const { user, isAgent, joinConvRoom, conversationPresence } = context;

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
      logger.error("conversation:start error:", err);
      socket.emit("error", { message: "Error al iniciar conversación" });
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
      logger.error("conversation:join error:", err);
      socket.emit("error", { message: "Error al unirse a conversación" });
    }
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
      logger.error("conversation:close error:", err);
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
      logger.error("conversation:rate error:", err);
    }
  });
}
