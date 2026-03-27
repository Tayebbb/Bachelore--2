import jwt from 'jsonwebtoken';
import { ADMIN_CODE, JWT_SECRET } from '../utils/auth.js';

export const adminLogin = (req, res) => {
  const { adminCode } = req.body;
  if (adminCode !== ADMIN_CODE) {
    return res.status(401).json({ msg: 'Invalid admin code' });
  }
  const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '2h' });
  res.json({ token });
};
