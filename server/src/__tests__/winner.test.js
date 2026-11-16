const request = require('supertest');
const crypto = require('crypto');
const app = require('../app');
const { sequelize } = require('../models');

// Credentials come from server/src/seeders/20260323000001-admin-user.js
const ADMIN = { email: 'admin@demoday.com', password: 'Admin123!' };
const NIL_UUID = '00000000-0000-4000-8000-000000000000';

let adminToken;
let judgeToken;

const unique = () => crypto.randomBytes(4).toString('hex');
const bearer = (t) => ({ Authorization: `Bearer ${t}` });
const admin = () => bearer(adminToken);

const createEvent = async () => {
  const res = await request(app)
    .post('/api/events')
    .set(admin())
    .send({ name: `Winner event ${unique()}`, date: '2099-01-01' });
  expect(res.status).toBe(201);
  return res.body.data.id;
};

const createTeam = async (eventId, label = 'Team') => {
  const res = await request(app)
    .post(`/api/events/${eventId}/teams`)
    .set(admin())
    .send({ name: `${label} ${unique()}`, members: 'A, B' });
  expect(res.status).toBe(201);
  return res.body.data.id;
};

const putWinner = (eventId, teamId, headers = admin()) =>
  request(app).put(`/api/events/${eventId}/winner`).set(headers).send({ teamId });

const getEvent = async (eventId) => (await request(app).get(`/api/events/${eventId}`).set(admin())).body.data;
const getSummary = (eventId) => request(app).get(`/api/events/${eventId}/scoring-summary`).set(admin());

beforeAll(async () => {
  const login = await request(app).post('/api/auth/login').send(ADMIN);
  adminToken = login.body.data.token;

  // A judge, joined through the invite link of a throwaway event.
  const eventId = await createEvent();
  const invite = await request(app).post(`/api/events/${eventId}/judge-invite`).set(admin());
  const join = await request(app)
    .post(`/api/judge-invite/${invite.body.data.judge_invite_token}/join`)
    .send({ name: `Judge ${unique()}`, title: 'Tester', company: 'QA Corp' });
  judgeToken = join.body.data.token;
});

afterAll(async () => {
  await sequelize.close();
});

describe('PUT /api/events/:id/winner', () => {
  it('sets the winner as admin and exposes it on GET /events/:id but not on the list', async () => {
    const eventId = await createEvent();
    const teamId = await createTeam(eventId);

    const res = await putWinner(eventId, teamId);

    expect(res.status).toBe(200);
    expect(res.body.error).toBeNull();
    expect(res.body.data).toEqual({ id: eventId, winner_team_id: teamId });

    const event = await getEvent(eventId);
    expect(event.winner_team_id).toBe(teamId);

    const list = await request(app).get('/api/events').set(admin());
    const listed = list.body.data.find((e) => e.id === eventId);
    expect(listed).toBeDefined();
    expect(listed).not.toHaveProperty('winner_team_id');
  });

  it('has no winner by default', async () => {
    const eventId = await createEvent();
    expect((await getEvent(eventId)).winner_team_id).toBeNull();
  });

  it('moves the winner when another team is selected', async () => {
    const eventId = await createEvent();
    const a = await createTeam(eventId, 'A');
    const b = await createTeam(eventId, 'B');

    await putWinner(eventId, a);
    const res = await putWinner(eventId, b);

    expect(res.status).toBe(200);
    expect((await getEvent(eventId)).winner_team_id).toBe(b);
  });

  it('is idempotent when the same team is selected twice', async () => {
    const eventId = await createEvent();
    const a = await createTeam(eventId);

    expect((await putWinner(eventId, a)).status).toBe(200);
    expect((await putWinner(eventId, a)).status).toBe(200);
    expect((await getEvent(eventId)).winner_team_id).toBe(a);
  });

  it('returns 403 for a judge and leaves the winner unchanged', async () => {
    const eventId = await createEvent();
    const a = await createTeam(eventId, 'A');
    const b = await createTeam(eventId, 'B');
    await putWinner(eventId, a);

    const res = await putWinner(eventId, b, bearer(judgeToken));

    expect(res.status).toBe(403);
    expect((await getEvent(eventId)).winner_team_id).toBe(a);
  });

  it('returns 401 without a token', async () => {
    const eventId = await createEvent();
    const a = await createTeam(eventId);

    const res = await putWinner(eventId, a, {});

    expect(res.status).toBe(401);
    expect((await getEvent(eventId)).winner_team_id).toBeNull();
  });

  it('returns 404 for an unknown team and leaves the winner unchanged', async () => {
    const eventId = await createEvent();
    const a = await createTeam(eventId);
    await putWinner(eventId, a);

    const res = await putWinner(eventId, NIL_UUID);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Team not found');
    expect((await getEvent(eventId)).winner_team_id).toBe(a);
  });

  it('returns 404 for a team from another event and leaves the winner unchanged', async () => {
    const eventId = await createEvent();
    const otherEventId = await createEvent();
    const foreignTeam = await createTeam(otherEventId);

    const res = await putWinner(eventId, foreignTeam);

    expect(res.status).toBe(404);
    expect((await getEvent(eventId)).winner_team_id).toBeNull();
    expect((await getEvent(otherEventId)).winner_team_id).toBeNull();
  });

  it('returns 404 for an unknown event', async () => {
    const eventId = await createEvent();
    const teamId = await createTeam(eventId);

    const res = await putWinner(NIL_UUID, teamId);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Event not found');
  });

  it('returns 400 with field errors for a missing or non-UUID teamId, and a non-UUID event id', async () => {
    const eventId = await createEvent();

    const missing = await request(app).put(`/api/events/${eventId}/winner`).set(admin()).send({});
    expect(missing.status).toBe(400);
    expect(missing.body.error).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'teamId' })]));

    const badTeam = await putWinner(eventId, 'not-a-uuid');
    expect(badTeam.status).toBe(400);
    expect(badTeam.body.error).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'teamId' })]));

    const badEvent = await putWinner('not-a-uuid', NIL_UUID);
    expect(badEvent.status).toBe(400);
    expect(badEvent.body.error).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'id' })]));
  });

  it('keeps separate winners per event', async () => {
    const eventA = await createEvent();
    const eventB = await createEvent();
    const teamA = await createTeam(eventA);
    const teamB = await createTeam(eventB);

    await putWinner(eventA, teamA);
    await putWinner(eventB, teamB);

    expect((await getEvent(eventA)).winner_team_id).toBe(teamA);
    expect((await getEvent(eventB)).winner_team_id).toBe(teamB);
  });

  it('does not change the event status', async () => {
    const eventId = await createEvent();
    const teamId = await createTeam(eventId);

    await putWinner(eventId, teamId);

    expect((await getEvent(eventId)).status).toBe('draft');
  });
});

describe('winner and team/event removal', () => {
  it('clears the winner when the winning team is deleted', async () => {
    const eventId = await createEvent();
    const teamId = await createTeam(eventId);
    await putWinner(eventId, teamId);

    const del = await request(app).delete(`/api/events/${eventId}/teams/${teamId}`).set(admin());
    expect(del.status).toBe(204);

    expect((await getEvent(eventId)).winner_team_id).toBeNull();
    const summary = await getSummary(eventId);
    expect(summary.status).toBe(200);
    expect(summary.body.data.event.winnerTeamId).toBeNull();
  });

  it('deletes an event that has a winner (circular foreign key)', async () => {
    const eventId = await createEvent();
    const teamId = await createTeam(eventId);
    await putWinner(eventId, teamId);

    const del = await request(app).delete(`/api/events/${eventId}`).set(admin());

    expect(del.status).toBe(200);
    expect((await request(app).get(`/api/events/${eventId}`).set(admin())).status).toBe(404);
  });
});

describe('GET /api/events/:eventId/scoring-summary winner', () => {
  it('returns event.winnerTeamId (null by default, the team id after selection) without changing the team order', async () => {
    const eventId = await createEvent();
    const a = await createTeam(eventId, 'A');
    const b = await createTeam(eventId, 'B');

    const before = await getSummary(eventId);
    expect(before.status).toBe(200);
    expect(before.body.data.event.winnerTeamId).toBeNull();

    await putWinner(eventId, b);

    const after = await getSummary(eventId);
    expect(after.body.data.event.winnerTeamId).toBe(b);
    expect(after.body.data.teams.map((t) => t.id)).toEqual(before.body.data.teams.map((t) => t.id));
    expect(after.body.data.teams.map((t) => t.averageScore)).toEqual(before.body.data.teams.map((t) => t.averageScore));
    expect([a, b]).toEqual(expect.arrayContaining(after.body.data.teams.map((t) => t.id)));
  });
});
