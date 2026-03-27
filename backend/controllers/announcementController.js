import { Announcement } from '../db/models.js';
import { isAdminFromReq } from '../utils/auth.js';

export const getAnnouncements = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { rows, count } = await Announcement.findAndCountAll({
      offset,
      limit,
      order: [['CreatedAt', 'DESC']],
    });
    const announcements = rows.map((row) => ({
      id: row.AnnouncementId,
      title: row.Title,
      message: row.Message,
      author: row.Author,
      createdAt: row.CreatedAt,
    }));
    res.json({ announcements, total: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createAnnouncement = async (req, res) => {
  try {
    if (!isAdminFromReq(req)) {
      return res.status(403).json({ msg: 'Forbidden: Admins only' });
    }

    const { title, message } = req.body;
    if (!title || !message) {
      return res.status(400).json({ msg: 'Title and message are required' });
    }

    const announcement = await Announcement.create({
      Title: title,
      Message: message,
      Author: 'admin',
    });

    res.status(201).json({
      msg: 'Announcement created',
      announcement: {
        id: announcement.AnnouncementId,
        title: announcement.Title,
        message: announcement.Message,
        author: announcement.Author,
        createdAt: announcement.CreatedAt,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
