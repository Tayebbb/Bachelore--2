import { AppliedTuition, Tuition } from '../db/models.js';

export const createApplication = async (req, res) => {
  try {
    const { tuitionId, name, email, contact, message } = req.body;
    if (!tuitionId || !name || !email || !contact) {
      return res.status(400).json({ msg: 'tuitionId, name, email and contact are required' });
    }

    const tuition = await Tuition.findByPk(tuitionId);
    if (!tuition || !tuition.IsActive) {
      return res.status(404).json({ msg: 'Tuition not found' });
    }

    const app = await AppliedTuition.create({
      TuitionId: tuitionId,
      Name: name,
      Email: email,
      Contact: contact,
      Message: message || '',
    });

    res.status(201).json({
      msg: 'Application submitted',
      application: {
        _id: app.AppliedTuitionId,
        tuitionId: app.TuitionId,
        name: app.Name,
        email: app.Email,
        contact: app.Contact,
        message: app.Message,
        createdAt: app.CreatedAt,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const listApplications = async (req, res) => {
  try {
    const list = await AppliedTuition.findAll({
      include: [{ model: Tuition }],
      order: [['CreatedAt', 'DESC']],
    });

    res.json(
      list.map((app) => ({
        _id: app.AppliedTuitionId,
        tuitionId: app.TuitionId,
        name: app.Name,
        email: app.Email,
        contact: app.Contact,
        message: app.Message,
        status: app.Status,
        createdAt: app.CreatedAt,
        tuition: app.Tuition
          ? {
              _id: app.Tuition.TuitionId,
              title: app.Tuition.Title,
              subject: app.Tuition.Subject,
            }
          : null,
      })),
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteApplication = async (req, res) => {
  try{
    const id = req.params.id;
    await AppliedTuition.destroy({ where: { AppliedTuitionId: id } });
    res.json({ msg: 'Deleted' });
  }catch(err){ res.status(500).json({ error: err.message }); }
}
