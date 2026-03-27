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
