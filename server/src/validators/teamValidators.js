const { body } = require('express-validator');

const createTeamValidators = [
  body('name')
    .trim()
    .notEmpty().withMessage('Team name is required')
    .isLength({ max: 100 }).withMessage('Team name must be 100 characters or fewer'),
  body('members')
    .trim()
    .notEmpty().withMessage('Members are required'),
  body('demo_presentation_url')
    .optional({ values: 'falsy' })
    .trim()
    .isURL().withMessage('Presentation URL must be a valid URL'),
  body('live_app_url')
    .optional({ values: 'falsy' })
    .trim()
    .isURL().withMessage('Live app URL must be a valid URL'),
];

const updateTeamValidators = [
  body('name')
    .trim()
    .notEmpty().withMessage('Team name is required')
    .isLength({ max: 100 }).withMessage('Team name must be 100 characters or fewer'),
  body('members')
    .trim()
    .notEmpty().withMessage('Members are required'),
  body('demo_presentation_url')
    .optional({ values: 'falsy' })
    .trim()
    .isURL().withMessage('Presentation URL must be a valid URL'),
  body('live_app_url')
    .optional({ values: 'falsy' })
    .trim()
    .isURL().withMessage('Live app URL must be a valid URL'),
];

const reorderTeamsValidators = [
  body('orderedIds')
    .isArray({ min: 1 }).withMessage('orderedIds must be a non-empty array'),
  body('orderedIds.*')
    .isUUID().withMessage('Each ID must be a valid UUID'),
];

module.exports = { createTeamValidators, updateTeamValidators, reorderTeamsValidators };
