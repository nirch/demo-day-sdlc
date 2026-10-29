const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { sequelize, Event, User, EventJudge } = require('../models');

const generateToken = async (eventId) => {
  const event = await Event.findOne({ where: { id: eventId } });

  if (!event) {
    const err = new Error('Event not found');
    err.status = 404;
    throw err;
  }

  const inviteToken = crypto.randomUUID();
  await event.update({ judge_invite_token: inviteToken });

  return { judge_invite_token: inviteToken };
};

const getToken = async (eventId) => {
  const event = await Event.findOne({
    where: { id: eventId },
    attributes: ['id', 'judge_invite_token'],
  });

  if (!event) {
    const err = new Error('Event not found');
    err.status = 404;
    throw err;
  }

  return { judge_invite_token: event.judge_invite_token };
};

const validateToken = async (token) => {
  const event = await Event.findOne({
    where: { judge_invite_token: token },
    attributes: ['id', 'name'],
  });

  if (!event) {
    const err = new Error('This invite link is not valid');
    err.status = 404;
    throw err;
  }

  return { event: { id: event.id, name: event.name } };
};

const joinAsJudge = async (token, { name, title, company }) => {
  const t = await sequelize.transaction();

  try {
    const event = await Event.findOne({
      where: { judge_invite_token: token },
      attributes: ['id', 'name'],
      transaction: t,
    });

    if (!event) {
      const err = new Error('This invite link is not valid');
      err.status = 404;
      throw err;
    }

    const trimmedName = name.trim();

    const existingJudge = await User.findOne({
      where: sequelize.where(
        sequelize.fn('LOWER', sequelize.col('User.name')),
        trimmedName.toLowerCase()
      ),
      include: [{
        model: Event,
        as: 'judgedEvents',
        where: { id: event.id },
        attributes: [],
      }],
      transaction: t,
    });

    if (existingJudge) {
      const err = new Error('A judge with this name has already joined this event');
      err.status = 409;
      throw err;
    }

    const user = await User.create({
      name: trimmedName,
      title,
      company,
      role: 'judge',
    }, { transaction: t });

    await EventJudge.create({
      event_id: event.id,
      user_id: user.id,
    }, { transaction: t });

    await t.commit();

    const jwtToken = jwt.sign(
      { id: user.id, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      token: jwtToken,
      user: { id: user.id, name: user.name, role: user.role },
      event: { id: event.id, name: event.name },
    };
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

module.exports = { generateToken, getToken, validateToken, joinAsJudge };
