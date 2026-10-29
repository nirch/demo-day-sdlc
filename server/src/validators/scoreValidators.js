const { body } = require('express-validator');

const putScoresValidators = [
  body('scores')
    .isArray({ min: 1 }).withMessage('scores must be a non-empty array'),
  body('scores.*.criterionId')
    .isUUID().withMessage('Each score must have a valid criterionId'),
  body('scores.*.value')
    .isInt({ min: 1, max: 5 }).withMessage('Each score value must be an integer between 1 and 5'),
  body('comment')
    .optional({ nullable: true })
    .isString().withMessage('comment must be a string')
    .isLength({ max: 1000 }).withMessage('comment must be 1000 characters or fewer'),
];

module.exports = { putScoresValidators };
