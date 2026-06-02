import { forbidden, unauthenticated } from "../errors/appErrors.js";

export function requireRoles(ctxUser, allowedRoles = []) {
  if (!ctxUser) throw unauthenticated();
  if (!allowedRoles.includes(ctxUser.role)) throw forbidden();
}
