import express from 'express';
import { Notification } from '../db/models.js';
import { normalizeEmail } from '../utils/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { userEmail } = req.query;
    if (!userEmail) return res.status(400).json({ msg: 'userEmail is required' });

    const list = await Notification.findAll({
      where: { UserEmail: normalizeEmail(userEmail) },
      order: [['CreatedAt', 'DESC']],
      limit: 50,
    });

    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/read', async (req, res) => {
  try {
    const item = await Notification.findByPk(req.params.id);
    if (!item) return res.status(404).json({ msg: 'Notification not found' });

    item.IsRead = true;
    await item.save();
    res.json({ msg: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
