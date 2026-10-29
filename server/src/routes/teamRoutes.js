const { Router } = require('express');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const validate = require('../middleware/validate');
const { createTeamValidators, updateTeamValidators, reorderTeamsValidators } = require('../validators/teamValidators');
const teamController = require('../controllers/teamController');

const router = Router({ mergeParams: true });

router.use(auth);

router.get('/', requireRole('admin', 'judge'), teamController.listTeams);
router.post('/', requireRole('admin'), createTeamValidators, validate, teamController.createTeam);
router.put('/reorder', requireRole('admin'), reorderTeamsValidators, validate, teamController.reorderTeams);
router.put('/:teamId', requireRole('admin'), updateTeamValidators, validate, teamController.updateTeam);
router.delete('/:teamId', requireRole('admin'), teamController.deleteTeam);

module.exports = router;
