const { Router } = require('express');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const validate = require('../middleware/validate');
const { createEventValidators } = require('../validators/eventValidators');
const eventController = require('../controllers/eventController');

const router = Router();

router.use(auth);

router.get('/', eventController.listEvents);
router.post('/', requireRole('admin'), createEventValidators, validate, eventController.createEvent);
router.get('/:id', eventController.getEvent);
router.delete('/:id', requireRole('admin'), eventController.deleteEvent);

module.exports = router;
