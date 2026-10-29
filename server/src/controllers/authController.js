const authService = require('../services/authService');

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json({ data: result, error: null });
  } catch (err) {
    next(err);
  }
};

module.exports = { login };
