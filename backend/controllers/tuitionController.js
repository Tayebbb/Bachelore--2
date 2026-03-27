import { Tuition } from '../db/models.js';
import { isAdminFromReq } from '../utils/auth.js';

export const getTuitions = async (req, res) => {
  try {
    const tuitions = await Tuition.findAll({
      where: { IsActive: true },
      order: [['CreatedAt', 'DESC']],
    });

    res.json(
      tuitions.map((t) => ({
        _id: t.TuitionId,
        title: t.Title,
        subject: t.Subject,
        days: t.Days,
        salary: t.Salary,
        location: t.Location,
        description: t.Description,
        contact: t.Contact,
        postedBy: t.PostedBy,
        createdAt: t.CreatedAt,
      })),
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createTuition = async (req, res) => {
  try {
    if (!isAdminFromReq(req)) {
      return res.status(403).json({ msg: 'Forbidden: Admins only' });
    }

    const { title, subject, days, salary, location, description, contact } = req.body;
    if (!title || !subject || !days || !salary || !location || !description || !contact) {
      return res.status(400).json({ msg: 'All fields are required' });
    }
    // validate Bangladeshi-style mobile: starts with 01 and 11 digits total
    const PHONE_RE = /^01\d{9}$/;
    if (!PHONE_RE.test(contact)) {
      return res.status(400).json({ msg: 'Contact must be an 11-digit phone number starting with 01' });
    }
    const tuition = await Tuition.create({
      Title: title,
      Subject: subject,
      Days: days,
      Salary: salary,
      Location: location,
      Description: description,
      Contact: contact,
      PostedBy: 'admin',
    });

    res.status(201).json({
      msg: 'Tuition posted',
      tuition: {
        _id: tuition.TuitionId,
        title: tuition.Title,
        subject: tuition.Subject,
        days: tuition.Days,
        salary: tuition.Salary,
        location: tuition.Location,
        description: tuition.Description,
        contact: tuition.Contact,
        postedBy: tuition.PostedBy,
        createdAt: tuition.CreatedAt,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
