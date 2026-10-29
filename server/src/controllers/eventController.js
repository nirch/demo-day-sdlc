const eventService = require('../services/eventService');

const listEvents = async (req, res, next) => {
  try {
    const events = await eventService.findAll();
    res.json({ data: events, error: null });
  } catch (err) {
    next(err);
  }
};

const createEvent = async (req, res, next) => {
  try {
    const { name, description, date, time_limit } = req.body;
    const event = await eventService.create({
      name,
      description,
      date,
      time_limit,
      created_by: req.user.id,
    });
    res.status(201).json({ data: event, error: null });
  } catch (err) {
    next(err);
  }
};

const getEvent = async (req, res, next) => {
  try {
    const event = await eventService.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ data: null, error: 'Event not found' });
    }

    res.json({ data: event, error: null });
  } catch (err) {
    next(err);
  }
};

const deleteEvent = async (req, res, next) => {
  try {
    await eventService.remove(req.params.id);
    res.json({ data: { message: 'Event deleted successfully' }, error: null });
  } catch (err) {
    next(err);
  }
};

module.exports = { listEvents, createEvent, getEvent, deleteEvent };
