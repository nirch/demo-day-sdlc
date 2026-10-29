const criteriaService = require('../services/criteriaService');

const listCriteria = async (req, res, next) => {
  try {
    const criteria = await criteriaService.findAllByEvent(req.params.eventId);
    res.json({ data: criteria, error: null });
  } catch (err) {
    next(err);
  }
};

const createCriterion = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const criterion = await criteriaService.create(req.params.eventId, {
      name,
      description,
    });
    res.status(201).json({ data: criterion, error: null });
  } catch (err) {
    next(err);
  }
};

const updateCriterion = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const criterion = await criteriaService.update(req.params.criterionId, req.params.eventId, {
      name,
      description,
    });
    res.json({ data: criterion, error: null });
  } catch (err) {
    next(err);
  }
};

const deleteCriterion = async (req, res, next) => {
  try {
    await criteriaService.remove(req.params.criterionId, req.params.eventId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

const reorderCriteria = async (req, res, next) => {
  try {
    const { orderedIds } = req.body;
    const criteria = await criteriaService.reorder(req.params.eventId, orderedIds);
    res.json({ data: criteria, error: null });
  } catch (err) {
    next(err);
  }
};

module.exports = { listCriteria, createCriterion, updateCriterion, deleteCriterion, reorderCriteria };
