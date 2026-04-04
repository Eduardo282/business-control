export function requireRoles(ctxUser, allowedRoles = []) {
  if (!ctxUser) throw new Error('No autenticado');
  if (!allowedRoles.includes(ctxUser.role)) throw new Error('No autorizado');
}
