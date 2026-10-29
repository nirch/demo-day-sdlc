const { body } = require('express-validator');

const joinAsJudgeValidators = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('title')
    .trim()
    .notEmpty().withMessage('Role is required')
    .isLength({ min: 2, max: 50 }).withMessage('Role must be between 2 and 50 characters'),
  body('company')
    .trim()
    .notEmpty().withMessage('Company is required')
    .isLength({ min: 2, max: 100 }).withMessage('Company must be between 2 and 100 characters'),
];

module.exports = { joinAsJudgeValidators };
