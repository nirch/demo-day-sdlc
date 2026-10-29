const scoreService = require('../services/scoreService');

const getScores = async (req, res, next) => {
  try {
    const { eventId, teamId } = req.params;
    const result = await scoreService.getScores(eventId, teamId, req.user.id);
    res.json({ data: result, error: null });
  } catch (err) {
    next(err);
  }
};

const putScores = async (req, res, next) => {
  try {
    const { eventId, teamId } = req.params;
    const { scores, comment } = req.body;
    const result = await scoreService.upsertScores(eventId, teamId, req.user.id, scores, comment);
    res.json({ data: result, error: null });
  } catch (err) {
    next(err);
  }
};

const getScoresSummary = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const summary = await scoreService.getScoresSummary(eventId, req.user.id);
    res.json({ data: summary, error: null });
  } catch (err) {
    next(err);
  }
};

const getScoringsSummaryAdmin = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const summary = await scoreService.getScoringsSummaryAdmin(eventId);
    res.json({ data: summary, error: null });
  } catch (err) {
    next(err);
  }
};

module.exports = { getScores, putScores, getScoresSummary, getScoringsSummaryAdmin };
