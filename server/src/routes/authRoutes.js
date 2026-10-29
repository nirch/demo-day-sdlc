const { Router } = require('express');
const { loginValidators } = require('../validators/authValidators');
const validate = require('../middleware/validate');
const authController = require('../controllers/authController');

const router = Router();

router.post('/login', loginValidators, validate, authController.login);

module.exports = router;
