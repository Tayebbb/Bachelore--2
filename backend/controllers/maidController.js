import { AppliedMaid, BookedMaid, Maid, db } from '../db/models.js';
import { Op } from 'sequelize';
import { isAdminFromReq, normalizeEmail } from '../utils/auth.js';

export const listMaids = async (req, res) => {
  try{
    const list = await Maid.findAll({ where: { IsActive: true }, order: [['CreatedAt', 'DESC']] });
    res.json(
      list.map((maid) => ({
        _id: maid.MaidId,
        name: maid.Name,
        hourlyRate: maid.HourlyRate,
        location: maid.Location,
        description: maid.Description,
        contact: maid.Contact,
        createdAt: maid.CreatedAt,
      })),
    );
  }catch(err){ res.status(500).json({ error: err.message }); }
};

export const createMaid = async (req, res) => {
  try{
    if (!isAdminFromReq(req)) return res.status(403).json({ msg: 'Forbidden' });

    const { name, hourlyRate, location, description, contact } = req.body;
    if(!name || !hourlyRate) return res.status(400).json({ msg: 'name and hourlyRate required' });

    const maid = await Maid.create({
      Name: name,
      HourlyRate: hourlyRate,
      Location: location || '',
      Description: description || '',
      Contact: contact || '',
    });

    res.status(201).json({
      msg: 'Maid added',
      maid: {
        _id: maid.MaidId,
        name: maid.Name,
        hourlyRate: maid.HourlyRate,
        location: maid.Location,
        description: maid.Description,
        contact: maid.Contact,
        createdAt: maid.CreatedAt,
      },
    });
  }catch(err){ res.status(500).json({ error: err.message }); }
};

export const deleteMaid = async (req, res) => {
  try{
    if (!isAdminFromReq(req)) return res.status(403).json({ msg: 'Forbidden' });

    const id = req.params.id;
    await Maid.destroy({ where: { MaidId: id } });
    res.json({ msg: 'Deleted' });
  }catch(err){ res.status(500).json({ error: err.message }); }
};

// user creates a booking request
export const createMaidApplication = async (req, res) => {
  try{
    const { maidId, name, email, contact, message } = req.body;
    console.log('createMaidApplication body:', { maidId, name, email, contact });
    if(!maidId || !name || !email || !contact) return res.status(400).json({ msg: 'maidId, name, email and contact required' });

    const maid = await Maid.findByPk(maidId);
    if(!maid || !maid.IsActive) return res.status(404).json({ msg: 'Maid not found' });

    const app = await AppliedMaid.create({
      MaidId: maidId,
      Name: name,
      Email: normalizeEmail(email),
      Contact: contact,
      Message: message || '',
    });

    res.status(201).json({ msg: 'Maid booking request submitted', application: app });
  }catch(err){ res.status(500).json({ error: err.message }); }
};

export const deleteMaidApplication = async (req, res) => {
  try{
    const id = req.params.id;
    await AppliedMaid.destroy({ where: { AppliedMaidId: id } });
    res.json({ msg: 'Deleted' });
  }catch(err){ res.status(500).json({ error: err.message }); }
}

export const listMaidApplications = async (req, res) => {
  try{
    const list = await AppliedMaid.findAll({ include: [{ model: Maid }], order: [['CreatedAt', 'DESC']] });
    res.json(list);
  }catch(err){ res.status(500).json({ error: err.message }); }
};

// admin verifies application -> moves it to BookedMaid and deletes original Maid and application
export const verifyMaidApplication = async (req, res) => {
  try{
    if (!isAdminFromReq(req)) return res.status(403).json({ msg: 'Forbidden' });

    const appId = req.params.id;
    const transaction = await db.sequelize.transaction();
    try {
      const app = await AppliedMaid.findByPk(appId, { transaction });
      if (!app) {
        await transaction.rollback();
        return res.status(404).json({ msg: 'Application not found' });
      }

      const alreadyBooked = await BookedMaid.findOne({ where: { AppliedMaidId: appId }, transaction });
      if (alreadyBooked) {
        await transaction.rollback();
        return res.status(409).json({ msg: 'Application already booked' });
      }

      const maid = await Maid.findByPk(app.MaidId, { transaction });
      if (!maid) {
        await transaction.rollback();
        return res.status(404).json({ msg: 'Maid not found' });
      }

      const booked = await BookedMaid.create(
        {
          AppliedMaidId: app.AppliedMaidId,
          MaidId: maid.MaidId,
          Name: maid.Name || 'Maid',
          HourlyRate: maid.HourlyRate || 'Negotiable',
          Location: maid.Location || 'Unknown',
          Contact: maid.Contact || 'N/A',
          ApplicantName: app.Name || 'Applicant',
          ApplicantEmail: app.Email || 'unknown@example.com',
          ApplicantContact: app.Contact || 'N/A',
          Message: app.Message || '',
        },
        { transaction },
      );

      app.Status = 'Booked';
      await app.save({ transaction });

      maid.IsActive = false;
      await maid.save({ transaction });

      await transaction.commit();
      res.json({ msg: 'Maid booking verified and marked busy', booked });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }catch(err){ res.status(500).json({ error: err.message }); }
};

// admin unbook busy maid early -> recreate maid and remove booked record
export const unbookMaid = async (req, res) => {
  try{
    if (!isAdminFromReq(req)) return res.status(403).json({ msg: 'Forbidden' });

    const id = req.params.id;
    const transaction = await db.sequelize.transaction();
    try {
      const booked = await BookedMaid.findByPk(id, { transaction });
      if (!booked) {
        await transaction.rollback();
        return res.status(404).json({ msg: 'Booked maid not found' });
      }

      if (booked.MaidId) {
        const maid = await Maid.findByPk(booked.MaidId, { transaction });
        if (maid) {
          maid.IsActive = true;
          await maid.save({ transaction });
        }
      }

      if (booked.AppliedMaidId) {
        const app = await AppliedMaid.findByPk(booked.AppliedMaidId, { transaction });
        if (app) {
          app.Status = 'Pending';
          await app.save({ transaction });
        }
      }

      await booked.destroy({ transaction });
      await transaction.commit();
      res.json({ msg: 'Maid is available again' });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }catch(err){ res.status(500).json({ error: err.message }); }
};

// list busy maids
export const listBookedMaids = async (req, res) => {
  try{
    const list = await BookedMaid.findAll({ order: [['BookedAt', 'DESC']] });
    res.json(list);
  }catch(err){ res.status(500).json({ error: err.message }); }
};

// cleanup job: release expired busy maids back into Maid collection
export const releaseExpiredBookedMaids = async (req, res) => {
  try{
    const now = new Date();
    const expired = await BookedMaid.findAll({
      where: { BusyUntil: { [Op.lte]: now } },
    });

    let released = 0;
    for (const booked of expired) {
      if (booked.MaidId) {
        const maid = await Maid.findByPk(booked.MaidId);
        if (maid) {
          maid.IsActive = true;
          await maid.save();
        }
      }
      await booked.destroy();
      released += 1;
    }

    res.json({ msg: 'Released expired busy maids', count: released });
  }catch(err){ res.status(500).json({ error: err.message }); }
};
