import { BookedTuition, AppliedTuition, Tuition, db } from '../db/models.js';
import { isAdminFromReq, normalizeEmail } from '../utils/auth.js';

export const listBooked = async (req, res) => {
  try {
    const { tuitionId, email } = req.query;
    const where = {};
    if (tuitionId) where.TuitionId = tuitionId;
    if (email) where.ApplicantEmail = normalizeEmail(email);
    const list = await BookedTuition.findAll({ where, order: [['BookedAt', 'DESC']] });

    res.json(
      list.map((b) => ({
        _id: b.BookedTuitionId,
        tuitionRef: b.TuitionId,
        title: b.Title,
        subject: b.Subject,
        days: b.Days,
        salary: b.Salary,
        location: b.Location,
        description: b.Description,
        contact: b.Contact,
        applicantName: b.ApplicantName,
        applicantEmail: b.ApplicantEmail,
        applicantContact: b.ApplicantContact,
        message: b.Message,
        bookedAt: b.BookedAt,
      })),
    );
  } catch (err) {
    console.error('verifyApplication error', err);
    res.status(500).json({ error: err.message || String(err) });
  }
}

export const verifyApplication = async (req, res) => {
  try{
    if (!isAdminFromReq(req)) return res.status(403).json({ msg: 'Forbidden' });

    const appId = req.params.id;
    const transaction = await db.sequelize.transaction();
    try {
      const app = await AppliedTuition.findByPk(appId, { transaction });
      if (!app) {
        await transaction.rollback();
        return res.status(404).json({ msg: 'Application not found' });
      }

      const alreadyBooked = await BookedTuition.findOne({ where: { AppliedTuitionId: appId }, transaction });
      if (alreadyBooked) {
        await transaction.rollback();
        return res.status(409).json({ msg: 'Application already booked' });
      }

      const tuition = await Tuition.findByPk(app.TuitionId, { transaction });
      if (!tuition) {
        await transaction.rollback();
        return res.status(404).json({ msg: 'Tuition not found' });
      }

      const booked = await BookedTuition.create(
        {
          AppliedTuitionId: app.AppliedTuitionId,
          TuitionId: tuition.TuitionId,
          Title: tuition.Title || tuition.Subject || 'Tuition',
          Subject: tuition.Subject || 'General',
          Days: tuition.Days || 'To be arranged',
          Salary: tuition.Salary || 'Negotiable',
          Location: tuition.Location || 'Unknown',
          Description: tuition.Description || '',
          Contact: tuition.Contact || 'N/A',
          ApplicantName: app.Name || 'Applicant',
          ApplicantEmail: normalizeEmail(app.Email || 'unknown@example.com'),
          ApplicantContact: app.Contact || 'N/A',
          Message: app.Message || '',
        },
        { transaction },
      );

      app.Status = 'Booked';
      await app.save({ transaction });

      tuition.IsActive = false;
      await tuition.save({ transaction });

      await transaction.commit();
      return res.json({ msg: 'Application verified and tuition booked', booked });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }catch(err){ res.status(500).json({ error: err.message }); }
}

export const unbookTuition = async (req, res) => {
  try{
    if (!isAdminFromReq(req)) return res.status(403).json({ msg: 'Forbidden' });

    const id = req.params.id;
    const transaction = await db.sequelize.transaction();
    try {
      const booked = await BookedTuition.findByPk(id, { transaction });
      if (!booked) {
        await transaction.rollback();
        return res.status(404).json({ msg: 'Booked tuition not found' });
      }

      const tuition = booked.TuitionId ? await Tuition.findByPk(booked.TuitionId, { transaction }) : null;
      if (tuition) {
        tuition.IsActive = true;
        await tuition.save({ transaction });
      }

      if (booked.AppliedTuitionId) {
        const app = await AppliedTuition.findByPk(booked.AppliedTuitionId, { transaction });
        if (app) {
          app.Status = 'Pending';
          await app.save({ transaction });
        }
      }

      await booked.destroy({ transaction });
      await transaction.commit();
      res.json({ msg: 'Tuition unbooked and visible again', tuition });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }catch(err){ res.status(500).json({ error: err.message }); }
}
