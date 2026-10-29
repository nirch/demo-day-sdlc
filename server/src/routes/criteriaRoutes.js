const { Router } = require('express');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const validate = require('../middleware/validate');
const { createCriterionValidators, updateCriterionValidators, reorderCriteriaValidators } = require('../validators/criteriaValidators');
const criteriaController = require('../controllers/criteriaController');

const router = Router({ mergeParams: true });

router.use(auth);

router.get('/', requireRole('admin', 'judge'), criteriaController.listCriteria);
router.post('/', createCriterionValidators, validate, criteriaController.createCriterion);
router.put('/reorder', reorderCriteriaValidators, validate, criteriaController.reorderCriteria);
router.put('/:criterionId', updateCriterionValidators, validate, criteriaController.updateCriterion);
router.delete('/:criterionId', criteriaController.deleteCriterion);

module.exports = router;
