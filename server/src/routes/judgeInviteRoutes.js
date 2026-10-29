const { Router } = require('express');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const validate = require('../middleware/validate');
const { joinAsJudgeValidators } = require('../validators/judgeInviteValidators');
const judgeInviteController = require('../controllers/judgeInviteController');

// Admin routes — mounted at /api/events/:eventId/judge-invite
const adminRouter = Router({ mergeParams: true });
adminRouter.use(auth);
adminRouter.use(requireRole('admin'));
adminRouter.post('/', judgeInviteController.generateToken);
adminRouter.get('/', judgeInviteController.getToken);

// Public routes — mounted at /api/judge-invite
const publicRouter = Router();
publicRouter.get('/:token', judgeInviteController.validateToken);
publicRouter.post('/:token/join', joinAsJudgeValidators, validate, judgeInviteController.joinAsJudge);

module.exports = { adminRouter, publicRouter };
