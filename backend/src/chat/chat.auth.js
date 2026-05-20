import { verifyToken } from "../utils/jwt.js";

export function authMiddleware(socket, next) {
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
}
