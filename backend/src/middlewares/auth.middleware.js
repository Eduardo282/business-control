import { verifyToken } from '../utils/jwt.js';

export function authMiddleware(req, _res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    req.user = verifyToken(token); // { userId, role }
  } catch {
    req.user = null;
  }
  next();
}
