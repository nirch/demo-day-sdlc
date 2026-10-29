const { body } = require('express-validator');

const createCriterionValidators = [
  body('name')
    .trim()
    .notEmpty().withMessage('Criterion name is required')
    .isLength({ max: 100 }).withMessage('Criterion name must be 100 characters or fewer'),
  body('description')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 255 }).withMessage('Description must be 255 characters or fewer'),
];

const updateCriterionValidators = [
  body('name')
    .trim()
    .notEmpty().withMessage('Criterion name is required')
    .isLength({ max: 100 }).withMessage('Criterion name must be 100 characters or fewer'),
  body('description')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 255 }).withMessage('Description must be 255 characters or fewer'),
];

const reorderCriteriaValidators = [
  body('orderedIds')
    .isArray({ min: 1 }).withMessage('orderedIds must be a non-empty array'),
  body('orderedIds.*')
    .isUUID().withMessage('Each ID must be a valid UUID'),
];

module.exports = { createCriterionValidators, updateCriterionValidators, reorderCriteriaValidators };
