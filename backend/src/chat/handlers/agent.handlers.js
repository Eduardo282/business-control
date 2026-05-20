import * as chatService from "../chat.service.js";
import { logger } from "../../utils/logger.js";

export function registerAgentHandlers(io, socket, context) {
  const { user, isAgent, joinConvRoom } = context;

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
      logger.error("conversation:take error:", err);
      socket.emit("error", { message: "Error al tomar conversación" });
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
      logger.error("queue:list error:", err);
    }
  });
}
