const judgeInviteService = require('../services/judgeInviteService');

const generateToken = async (req, res, next) => {
  try {
    const result = await judgeInviteService.generateToken(req.params.eventId);
    res.json({ data: result, error: null });
  } catch (err) {
    next(err);
  }
};

const getToken = async (req, res, next) => {
  try {
    const result = await judgeInviteService.getToken(req.params.eventId);
    res.json({ data: result, error: null });
  } catch (err) {
    next(err);
  }
};

const validateToken = async (req, res, next) => {
  try {
    const result = await judgeInviteService.validateToken(req.params.token);
    res.json({ data: result, error: null });
  } catch (err) {
    next(err);
  }
};

const joinAsJudge = async (req, res, next) => {
  try {
    const result = await judgeInviteService.joinAsJudge(req.params.token, req.body);
    res.status(201).json({ data: result, error: null });
  } catch (err) {
    next(err);
  }
};

module.exports = { generateToken, getToken, validateToken, joinAsJudge };
