import bcrypt from 'bcryptjs';
import { User } from '../db/models.js';
import { normalizeEmail } from '../utils/auth.js';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);
    console.log('Login request for:', normalizedEmail);
    const user = await User.findOne({ where: { Email: normalizedEmail } });
    if (!user) return res.status(400).json({ msg: "User not found" });

    let ok = false;
    const stored = user.Password || '';
    console.log('Stored password present:', !!stored, 'looksHashed:', stored.startsWith && stored.startsWith('$2'));
    // If password looks bcrypt-hashed (starts with $2), compare normally.
    if (stored.startsWith('$2')) {
      ok = await bcrypt.compare(password, stored);
    } else {
      // Legacy: stored as plaintext — allow login and migrate to hashed password
      if (password === stored) {
        ok = true;
        try {
          const newHash = await bcrypt.hash(password, 10);
          user.Password = newHash;
          await user.save();
          console.log('Migrated plaintext password for user', user.Email);
        } catch (mErr) {
          console.warn('Password migration failed for', user.Email, mErr.message);
        }
      } else {
        ok = false;
      }
    }
    if (!ok) return res.status(400).json({ msg: 'Invalid credentials' });

    console.log('Login successful for:', user.Email);

    res.json({
      msg: "Login successful",
      user: {
        id: user.UserId,
        fullName: user.FullName,
        email: user.Email,
        roommateCategory: user.RoommateCategory || 'SeekerRoommate',
        isAvailableAsHost: !!user.IsAvailableAsHost,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};