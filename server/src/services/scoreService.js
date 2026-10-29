const { sequelize, Score, TeamComment, EventJudge, Criterion, Event, Team, User } = require('../models');

const SCORE_ATTRIBUTES = ['criterion_id', 'value'];
const COMMENT_ATTRIBUTES = ['comment'];

const assertJudgeAssigned = async (eventId, judgeId) => {
  const assignment = await EventJudge.findOne({
    where: { event_id: eventId, user_id: judgeId },
    attributes: ['id'],
  });

  if (!assignment) {
    const err = new Error('Judge is not assigned to this event');
    err.status = 403;
    throw err;
  }
};

const assertEventExists = async (eventId) => {
  const event = await Event.findByPk(eventId, { attributes: ['id'] });

  if (!event) {
    const err = new Error('Event not found');
    err.status = 404;
    throw err;
  }
};

const upsertScores = async (eventId, teamId, judgeId, scores, comment) => {
  await assertEventExists(eventId);
  await assertJudgeAssigned(eventId, judgeId);

  const criteria = await Criterion.findAll({
    where: { event_id: eventId },
    attributes: ['id'],
  });

  const eventCriterionIds = new Set(criteria.map((c) => c.id));

  if (eventCriterionIds.size === 0) {
    const err = new Error('This event has no scoring criteria');
    err.status = 422;
    throw err;
  }

  const submittedCriterionIds = new Set(scores.map((s) => s.criterionId));

  for (const criterionId of submittedCriterionIds) {
    if (!eventCriterionIds.has(criterionId)) {
      const err = new Error(`Criterion ${criterionId} does not belong to this event`);
      err.status = 422;
      throw err;
    }
  }

  for (const criterionId of eventCriterionIds) {
    if (!submittedCriterionIds.has(criterionId)) {
      const err = new Error('All criteria must be scored');
      err.status = 422;
      throw err;
    }
  }

  const t = await sequelize.transaction();

  try {
    for (const { criterionId, value } of scores) {
      await Score.upsert(
        {
          event_id: eventId,
          team_id: teamId,
          criterion_id: criterionId,
          judge_id: judgeId,
          value,
        },
        { transaction: t }
      );
    }

    if (comment && comment.trim()) {
      await TeamComment.upsert(
        {
          event_id: eventId,
          team_id: teamId,
          judge_id: judgeId,
          comment: comment.trim(),
        },
        { transaction: t }
      );
    } else {
      await TeamComment.destroy({
        where: { team_id: teamId, judge_id: judgeId },
        transaction: t,
      });
    }

    await t.commit();
  } catch (err) {
    await t.rollback();
    throw err;
  }

  const savedScores = await Score.findAll({
    attributes: SCORE_ATTRIBUTES,
    where: { team_id: teamId, judge_id: judgeId, event_id: eventId },
  });

  const savedComment = await TeamComment.findOne({
    attributes: COMMENT_ATTRIBUTES,
    where: { team_id: teamId, judge_id: judgeId },
  });

  return {
    scores: savedScores.map((s) => ({ criterionId: s.criterion_id, value: s.value })),
    comment: savedComment ? savedComment.comment : null,
  };
};

const getScores = async (eventId, teamId, judgeId) => {
  await assertEventExists(eventId);
  await assertJudgeAssigned(eventId, judgeId);

  const scores = await Score.findAll({
    attributes: SCORE_ATTRIBUTES,
    where: { event_id: eventId, team_id: teamId, judge_id: judgeId },
  });

  const teamComment = await TeamComment.findOne({
    attributes: COMMENT_ATTRIBUTES,
    where: { team_id: teamId, judge_id: judgeId },
  });

  return {
    scores: scores.map((s) => ({ criterionId: s.criterion_id, value: s.value })),
    comment: teamComment ? teamComment.comment : null,
  };
};

const getScoresSummary = async (eventId, judgeId) => {
  await assertEventExists(eventId);
  await assertJudgeAssigned(eventId, judgeId);

  const scores = await Score.findAll({
    attributes: ['team_id'],
    where: { event_id: eventId, judge_id: judgeId },
    group: ['team_id'],
  });

  const summary = {};
  for (const s of scores) {
    summary[s.team_id] = true;
  }

  return summary;
};

const getScoringsSummaryAdmin = async (eventId) => {
  const event = await Event.findByPk(eventId, { attributes: ['id', 'name'] });

  if (!event) {
    const err = new Error('Event not found');
    err.status = 404;
    throw err;
  }

  const [criteria, eventWithJudges, teams, allScores, allComments] = await Promise.all([
    Criterion.findAll({
      where: { event_id: eventId },
      attributes: ['id', 'name', 'sort_order'],
      order: [['sort_order', 'ASC']],
    }),
    Event.findByPk(eventId, {
      include: [{ model: User, as: 'judges', attributes: ['id', 'name'], through: { attributes: [] } }],
    }),
    Team.findAll({
      where: { event_id: eventId },
      attributes: ['id', 'name'],
      order: [['name', 'ASC']],
    }),
    Score.findAll({
      where: { event_id: eventId },
      attributes: ['team_id', 'criterion_id', 'judge_id', 'value'],
    }),
    TeamComment.findAll({
      where: { event_id: eventId },
      attributes: ['team_id', 'judge_id', 'comment'],
    }),
  ]);

  const judges = eventWithJudges.judges || [];
  const expectedPerTeam = criteria.length * judges.length;

  const teamsData = teams.map((team) => {
    const teamScores = allScores.filter((s) => s.team_id === team.id);
    const teamComments = allComments.filter((c) => c.team_id === team.id);
    const totalScores = teamScores.length;
    const sum = teamScores.reduce((acc, s) => acc + s.value, 0);
    const averageScore = totalScores > 0 ? Math.round((sum / totalScores) * 10) / 10 : null;

    return {
      id: team.id,
      name: team.name,
      averageScore,
      totalScores,
      expectedScores: expectedPerTeam,
      isComplete: expectedPerTeam > 0 && totalScores === expectedPerTeam,
      scores: teamScores.map((s) => ({
        criterionId: s.criterion_id,
        judgeId: s.judge_id,
        value: s.value,
      })),
      comments: teamComments.map((c) => ({
        judgeId: c.judge_id,
        comment: c.comment,
      })),
    };
  });

  teamsData.sort((a, b) => {
    if (a.averageScore === null && b.averageScore === null) return 0;
    if (a.averageScore === null) return 1;
    if (b.averageScore === null) return -1;
    return b.averageScore - a.averageScore;
  });

  return {
    event: { id: event.id, name: event.name },
    criteria: criteria.map((c) => ({ id: c.id, name: c.name, sortOrder: c.sort_order })),
    judges: judges.map((j) => ({ id: j.id, name: j.name })),
    teams: teamsData,
  };
};

module.exports = { upsertScores, getScores, getScoresSummary, getScoringsSummaryAdmin };
