import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { User } from '../db/models.js';
import { normalizeEmail } from '../utils/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_USERS_FILE = path.join(__dirname, '..', 'db', 'local-users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key';

async function readLocalUsers() {
  try {
    const raw = await fs.readFile(LOCAL_USERS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeLocalUsers(users) {
  await fs.writeFile(LOCAL_USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

export const signup = async (req, res) => {
  try {
    const { name, fullName, email, phone, password } = req.body;

    const trimmedName = String(name || fullName || '').trim();
    const trimmedEmail = normalizeEmail(email);
    const trimmedPhone = String(phone || '').trim();
    const rawPassword = String(password || '');

    if (typeof name !== 'string' && typeof fullName !== 'string') {
      return res.status(400).json({ message: 'Name is required' });
    }

    if (trimmedName.length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters long' });
    }

    if (!trimmedEmail) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const austEmailPattern = /^[^\s@]+@aust\.edu$/i;
    if (!austEmailPattern.test(trimmedEmail)) {
      return res.status(400).json({ message: 'Only AUST email is allowed (example@aust.edu)' });
    }

    if (!trimmedPhone) {
      return res.status(400).json({ message: 'Phone is required' });
    }

    if (!/^\d{10,15}$/.test(trimmedPhone)) {
      return res.status(400).json({ message: 'Phone must contain only digits and be 10 to 15 characters long' });
    }

    if (!rawPassword) {
      return res.status(400).json({ message: 'Password is required' });
    }

    if (rawPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    const existingUser = await User.findOne({ where: { email: trimmedEmail } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const localUsers = await readLocalUsers();
    const localDuplicate = localUsers.some((user) => normalizeEmail(user?.email) === trimmedEmail);
    if (localDuplicate) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashed = await bcrypt.hash(rawPassword, 10);

    const saved = await User.create({
      name: trimmedName,
      email: trimmedEmail,
      password_hash: hashed,
      role: 'student',
    });

    localUsers.push({
      user_id: saved.user_id,
      name: trimmedName,
      email: trimmedEmail,
      password_hash: hashed,
      role: 'student',
      created_at: new Date().toISOString(),
      profile: {
        phone: trimmedPhone,
        university: null,
        year: null,
        semester: null,
        eduEmail: trimmedEmail,
      },
    });

    await writeLocalUsers(localUsers);

    const token = jwt.sign({ user_id: saved.user_id, role: 'student' }, JWT_SECRET, {
      expiresIn: '7d',
    });

    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: saved.user_id,
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        role: 'student',
      },
      token,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: String(err.message || err) });
  }
};
