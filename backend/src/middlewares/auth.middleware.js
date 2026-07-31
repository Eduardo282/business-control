import { findContactById } from "../repositories/contact.repository.js";
import { verifyToken } from "../utils/jwt.js";

export function createAuthMiddleware({
  verifyTokenFn = verifyToken,
  findContactByIdFn = findContactById,
} = {}) {
  return async function authMiddleware(req, _res, next) {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

    if (!token) {
      req.user = null;
      return next();
    }

    try {
      const user = verifyTokenFn(token);

      if (user?.role === "CONTACT_PORTAL") {
        const contact = await findContactByIdFn(user.contactId);
        if (
          !contact ||
          !Boolean(contact.has_portal_access) ||
          !Boolean(contact.is_active)
        ) {
          req.user = null;
          return next();
        }
      }

      req.user = user;
    } catch {
      req.user = null;
    }

    return next();
  }
}

export const authMiddleware = createAuthMiddleware();
