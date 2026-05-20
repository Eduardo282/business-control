export function registerTypingHandlers(io, socket, context) {
  const { user, isAgent } = context;

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
}
