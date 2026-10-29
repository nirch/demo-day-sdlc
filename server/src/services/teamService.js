const { Team, Event, sequelize } = require('../models');

const TEAM_ATTRIBUTES = ['id', 'event_id', 'name', 'members', 'demo_presentation_url', 'live_app_url', 'sort_order', 'created_at', 'updated_at'];

const assertEventDraft = async (eventId) => {
  const event = await Event.findByPk(eventId, { attributes: ['id', 'status'] });

  if (!event) {
    const err = new Error('Event not found');
    err.status = 404;
    throw err;
  }

  if (event.status !== 'draft') {
    const err = new Error('Teams can only be modified while the event is in draft status');
    err.status = 403;
    throw err;
  }

  return event;
};

const findAllByEvent = async (eventId) => {
  const event = await Event.findByPk(eventId, { attributes: ['id'] });

  if (!event) {
    const err = new Error('Event not found');
    err.status = 404;
    throw err;
  }

  return Team.findAll({
    attributes: TEAM_ATTRIBUTES,
    where: { event_id: eventId },
    order: [['sort_order', 'ASC']],
  });
};

const create = async (eventId, { name, members, demo_presentation_url, live_app_url }) => {
  await assertEventDraft(eventId);

  try {
    const maxResult = await Team.max('sort_order', { where: { event_id: eventId } });
    const nextOrder = (maxResult == null ? -1 : maxResult) + 1;

    return await Team.create({
      event_id: eventId,
      name,
      members,
      demo_presentation_url: demo_presentation_url || null,
      live_app_url: live_app_url || null,
      sort_order: nextOrder,
    });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      const dupErr = new Error('A team with this name already exists in this event');
      dupErr.status = 409;
      throw dupErr;
    }
    throw err;
  }
};

const update = async (teamId, eventId, { name, members, demo_presentation_url, live_app_url }) => {
  await assertEventDraft(eventId);

  const team = await Team.findOne({ where: { id: teamId, event_id: eventId } });

  if (!team) {
    const err = new Error('Team not found');
    err.status = 404;
    throw err;
  }

  try {
    await team.update({
      name,
      members,
      demo_presentation_url: demo_presentation_url || null,
      live_app_url: live_app_url || null,
    });

    return team;
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      const dupErr = new Error('A team with this name already exists in this event');
      dupErr.status = 409;
      throw dupErr;
    }
    throw err;
  }
};

const remove = async (teamId, eventId) => {
  await assertEventDraft(eventId);

  const team = await Team.findOne({ where: { id: teamId, event_id: eventId } });

  if (!team) {
    const err = new Error('Team not found');
    err.status = 404;
    throw err;
  }

  await team.destroy();
};

const reorder = async (eventId, orderedIds) => {
  await assertEventDraft(eventId);

  const teams = await Team.findAll({
    attributes: ['id'],
    where: { event_id: eventId },
  });

  const existingIds = teams.map((t) => t.id).sort();
  const providedIds = [...orderedIds].sort();

  if (existingIds.length !== providedIds.length || !existingIds.every((id, i) => id === providedIds[i])) {
    const err = new Error('orderedIds must contain exactly the same team IDs that belong to this event');
    err.status = 400;
    throw err;
  }

  const t = await sequelize.transaction();
  try {
    for (let i = 0; i < orderedIds.length; i++) {
      await Team.update(
        { sort_order: i },
        { where: { id: orderedIds[i], event_id: eventId }, transaction: t },
      );
    }
    await t.commit();
  } catch (err) {
    await t.rollback();
    throw err;
  }

  return Team.findAll({
    attributes: TEAM_ATTRIBUTES,
    where: { event_id: eventId },
    order: [['sort_order', 'ASC']],
  });
};

module.exports = { findAllByEvent, create, update, remove, reorder };
