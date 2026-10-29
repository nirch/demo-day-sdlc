const { Criterion, Event, sequelize } = require('../models');

const CRITERIA_ATTRIBUTES = ['id', 'event_id', 'name', 'description', 'sort_order', 'created_at', 'updated_at'];

const DEFAULT_CRITERIA = [
  { name: 'Technical Complexity', description: 'Ambition and difficulty of the technical implementation', sort_order: 0 },
  { name: 'Product Quality', description: 'Completeness, polish, does it solve the stated problem', sort_order: 1 },
  { name: 'UI/UX Design', description: 'Visual design, usability, interaction quality', sort_order: 2 },
  { name: 'Presentation & Communication', description: 'Demo clarity, storytelling, time management', sort_order: 3 },
  { name: 'Innovation & Creativity', description: 'Originality of idea or approach', sort_order: 4 },
];

const assertEventDraft = async (eventId) => {
  const event = await Event.findByPk(eventId, { attributes: ['id', 'status'] });

  if (!event) {
    const err = new Error('Event not found');
    err.status = 404;
    throw err;
  }

  if (event.status !== 'draft') {
    const err = new Error('Criteria can only be modified while the event is in draft status');
    err.status = 403;
    throw err;
  }

  return event;
};

const seedDefaults = async (eventId, transaction) => {
  const rows = DEFAULT_CRITERIA.map((c) => ({
    event_id: eventId,
    name: c.name,
    description: c.description,
    sort_order: c.sort_order,
  }));

  await Criterion.bulkCreate(rows, { transaction });
};

const findAllByEvent = async (eventId) => {
  const event = await Event.findByPk(eventId, { attributes: ['id'] });

  if (!event) {
    const err = new Error('Event not found');
    err.status = 404;
    throw err;
  }

  return Criterion.findAll({
    attributes: CRITERIA_ATTRIBUTES,
    where: { event_id: eventId },
    order: [['sort_order', 'ASC']],
  });
};

const create = async (eventId, { name, description }) => {
  await assertEventDraft(eventId);

  const maxResult = await Criterion.max('sort_order', { where: { event_id: eventId } });
  const nextOrder = (maxResult ?? -1) + 1;

  try {
    return await Criterion.create({
      event_id: eventId,
      name,
      description: description || null,
      sort_order: nextOrder,
    });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      const dupErr = new Error('A criterion with this name already exists in this event');
      dupErr.status = 409;
      throw dupErr;
    }
    throw err;
  }
};

const update = async (criterionId, eventId, { name, description }) => {
  await assertEventDraft(eventId);

  const criterion = await Criterion.findOne({ where: { id: criterionId, event_id: eventId } });

  if (!criterion) {
    const err = new Error('Criterion not found');
    err.status = 404;
    throw err;
  }

  try {
    await criterion.update({
      name,
      description: description || null,
    });

    return criterion;
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      const dupErr = new Error('A criterion with this name already exists in this event');
      dupErr.status = 409;
      throw dupErr;
    }
    throw err;
  }
};

const remove = async (criterionId, eventId) => {
  await assertEventDraft(eventId);

  const count = await Criterion.count({ where: { event_id: eventId } });

  if (count <= 1) {
    const err = new Error('Cannot delete the last criterion. Events must have at least one scoring criterion.');
    err.status = 400;
    throw err;
  }

  const criterion = await Criterion.findOne({ where: { id: criterionId, event_id: eventId } });

  if (!criterion) {
    const err = new Error('Criterion not found');
    err.status = 404;
    throw err;
  }

  await criterion.destroy();
};

const reorder = async (eventId, orderedIds) => {
  await assertEventDraft(eventId);

  const criteria = await Criterion.findAll({
    attributes: ['id'],
    where: { event_id: eventId },
  });

  const existingIds = criteria.map((c) => c.id).sort();
  const providedIds = [...orderedIds].sort();

  if (existingIds.length !== providedIds.length || !existingIds.every((id, i) => id === providedIds[i])) {
    const err = new Error('orderedIds must contain exactly the same criterion IDs that belong to this event');
    err.status = 400;
    throw err;
  }

  const t = await sequelize.transaction();
  try {
    for (let i = 0; i < orderedIds.length; i++) {
      await Criterion.update(
        { sort_order: i },
        { where: { id: orderedIds[i], event_id: eventId }, transaction: t },
      );
    }
    await t.commit();
  } catch (err) {
    await t.rollback();
    throw err;
  }

  return Criterion.findAll({
    attributes: CRITERIA_ATTRIBUTES,
    where: { event_id: eventId },
    order: [['sort_order', 'ASC']],
  });
};

module.exports = { seedDefaults, findAllByEvent, create, update, remove, reorder };
