import jwt from 'jsonwebtoken';

export const ADMIN_CODE = process.env.ADMIN_CODE || 'choton2025';
export const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret';

export function parseAuthHeader(req) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function isAdminFromReq(req) {
  const payload = parseAuthHeader(req);
  if (payload?.role === 'admin') return true;

  const adminCode = req.body?.adminCode || req.query?.adminCode;
  return adminCode === ADMIN_CODE;
}

export function normalizeEmail(value = '') {
  return String(value).trim().toLowerCase();
}

export function requireAuth(req, res, next) {
  const payload = parseAuthHeader(req);
  if (!payload) {
    return res.status(401).json({ msg: 'Authentication required.' });
  }

  req.auth = payload;
  return next();
}

export function requireRole(...roles) {
  const allowed = new Set(roles.map((r) => String(r).toLowerCase()));
  return (req, res, next) => {
    const payload = req.auth || parseAuthHeader(req);
    if (!payload) {
      console.debug('[auth] requireRole failed: No payload');
      return res.status(401).json({ msg: 'Authentication required.' });
    }

    const role = String(payload.role || '').toLowerCase();
    if (!allowed.has(role)) {
      console.debug(`[auth] requireRole forbidden: role '${role}' not in [${Array.from(allowed).join(', ')}]`);
      return res.status(403).json({ msg: 'You are not authorized for this resource.' });
    }

    req.auth = payload;
    return next();
  };
}

export function getAuthUserId(req) {
  return req?.auth?.user_id || null;
}
