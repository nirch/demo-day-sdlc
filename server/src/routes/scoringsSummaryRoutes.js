const { Router } = require('express');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const scoreController = require('../controllers/scoreController');

const router = Router({ mergeParams: true });

router.use(auth);

router.get('/scoring-summary', requireRole('admin'), scoreController.getScoringsSummaryAdmin);

module.exports = router;
