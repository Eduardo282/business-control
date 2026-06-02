const ALLOWED_BACKOFFICE_ROLES = new Set(["ADMIN", "VENTAS"]);

export function requireBackofficeRole(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "No autenticado" });
  }

  if (!ALLOWED_BACKOFFICE_ROLES.has(req.user.role)) {
    return res.status(403).json({ message: "No autorizado" });
  }

  return next();
}
