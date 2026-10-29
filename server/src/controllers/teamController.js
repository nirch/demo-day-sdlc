const teamService = require('../services/teamService');

const listTeams = async (req, res, next) => {
  try {
    const teams = await teamService.findAllByEvent(req.params.eventId);
    res.json({ data: teams, error: null });
  } catch (err) {
    next(err);
  }
};

const createTeam = async (req, res, next) => {
  try {
    const { name, members, demo_presentation_url, live_app_url } = req.body;
    const team = await teamService.create(req.params.eventId, {
      name,
      members,
      demo_presentation_url,
      live_app_url,
    });
    res.status(201).json({ data: team, error: null });
  } catch (err) {
    next(err);
  }
};

const updateTeam = async (req, res, next) => {
  try {
    const { name, members, demo_presentation_url, live_app_url } = req.body;
    const team = await teamService.update(req.params.teamId, req.params.eventId, {
      name,
      members,
      demo_presentation_url,
      live_app_url,
    });
    res.json({ data: team, error: null });
  } catch (err) {
    next(err);
  }
};

const deleteTeam = async (req, res, next) => {
  try {
    await teamService.remove(req.params.teamId, req.params.eventId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

const reorderTeams = async (req, res, next) => {
  try {
    const { orderedIds } = req.body;
    const teams = await teamService.reorder(req.params.eventId, orderedIds);
    res.json({ data: teams, error: null });
  } catch (err) {
    next(err);
  }
};

module.exports = { listTeams, createTeam, updateTeam, deleteTeam, reorderTeams };
