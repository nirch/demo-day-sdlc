const { body } = require('express-validator');

const createEventValidators = [
  body('name')
    .trim()
    .notEmpty().withMessage('Event name is required'),
  body('date')
    .notEmpty().withMessage('Date is required')
    .isDate().withMessage('Must be a valid date')
    .custom((value) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const eventDate = new Date(value);
      if (eventDate < today) {
        throw new Error('Date must be today or in the future');
      }
      return true;
    }),
  body('time_limit')
    .optional()
    .isInt({ min: 1, max: 60 }).withMessage('Time limit must be between 1 and 60 minutes')
    .toInt(),
  body('description')
    .optional()
    .trim(),
];

module.exports = { createEventValidators };
