const { Event, Team, User, sequelize } = require('../models');
const { ForeignKeyConstraintError } = require('sequelize');
const criteriaService = require('./criteriaService');

const EVENT_ATTRIBUTES = ['id', 'name', 'description', 'date', 'status', 'time_limit', 'created_by', 'created_at', 'updated_at'];
const EVENT_DETAIL_ATTRIBUTES = [...EVENT_ATTRIBUTES, 'winner_team_id'];

const findAll = async () => {
  return Event.findAll({
    attributes: EVENT_ATTRIBUTES,
    order: [['date', 'DESC']],
  });
};

const create = async ({ name, description, date, time_limit, created_by }) => {
  const t = await sequelize.transaction();
  try {
    const event = await Event.create({
      name,
      description: description || null,
      date,
      status: 'draft',
      time_limit: time_limit || 7,
      created_by,
    }, { transaction: t });

    await criteriaService.seedDefaults(event.id, t);
    await t.commit();

    return event;
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

const findById = async (id) => {
  return Event.findByPk(id, {
    attributes: EVENT_DETAIL_ATTRIBUTES,
    include: [
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'email'],
      },
    ],
  });
};

const remove = async (id) => {
  const event = await Event.findByPk(id, { attributes: ['id', 'status'] });

  if (!event) {
    const err = new Error('Event not found');
    err.status = 404;
    throw err;
  }

  if (event.status !== 'draft') {
    const err = new Error('Only draft events can be deleted');
    err.status = 409;
    throw err;
  }

  await event.destroy();
};

const selectWinner = async (eventId, teamId) => {
  const event = await Event.findByPk(eventId, { attributes: ['id'] });

  if (!event) {
    const err = new Error('Event not found');
    err.status = 404;
    throw err;
  }

  const team = await Team.findOne({
    where: { id: teamId, event_id: eventId },
    attributes: ['id'],
  });

  if (!team) {
    const err = new Error('Team not found');
    err.status = 404;
    throw err;
  }

  try {
    await Event.update({ winner_team_id: team.id }, { where: { id: eventId } });
  } catch (error) {
    if (error instanceof ForeignKeyConstraintError) {
      // The team was deleted between the check above and the update.
      const err = new Error('Team not found');
      err.status = 404;
      throw err;
    }
    throw error;
  }

  return { id: event.id, winner_team_id: team.id };
};

module.exports = { findAll, create, findById, remove, selectWinner };
