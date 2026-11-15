import { test, expect } from '@playwright/test';

// Spec: specs/features/20261115-1728-winner-selection.md
// Written before the implementation: these tests are expected to fail until the feature exists.

const ADMIN = { email: 'admin@demoday.com', password: 'Admin123!' };

// ASSUMPTION (the spec names no path): the select-winner API call is
//   PUT /api/events/:eventId/winner   body { teamId }
// Keep every use of this path in the two helpers below so it is a one-line fix.
const winnerPath = (eventId) => `/api/events/${eventId}/winner`;
const isWinnerWrite = (req) => /\/api\/.*winner/i.test(req.url()) && req.method() !== 'GET';

const FAIL_TEXT = "Couldn't select winner. Try again.";
const DIALOG_MESSAGE =
  "This team doesn't have the highest score. Are you sure you want to select it as the winner?";

// ---------- API helpers (test data setup) ----------

const unique = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const bearer = (token) => ({ Authorization: `Bearer ${token}` });

async function adminLoginApi(request) {
  const res = await request.post('/api/auth/login', { data: ADMIN });
  expect(res.status()).toBe(200);
  return (await res.json()).data.token;
}

async function createEventApi(request, adminToken, label) {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const res = await request.post('/api/events', {
    headers: bearer(adminToken),
    data: { name: `Winner ${label} ${unique()}`, date: tomorrow },
  });
  expect(res.status()).toBe(201);
  return (await res.json()).data;
}

async function createTeamApi(request, adminToken, eventId, name) {
  const res = await request.post(`/api/events/${eventId}/teams`, {
    headers: bearer(adminToken),
    data: { name, members: 'Test members' },
  });
  expect(res.status()).toBe(201);
  return (await res.json()).data;
}

async function joinJudgeApi(request, adminToken, eventId) {
  const inviteRes = await request.post(`/api/events/${eventId}/judge-invite`, {
    headers: bearer(adminToken),
  });
  expect(inviteRes.status()).toBe(200);
  const inviteToken = (await inviteRes.json()).data.judge_invite_token;
  const joinRes = await request.post(`/api/judge-invite/${inviteToken}/join`, {
    data: { name: `Judge ${unique()}`, title: 'Tester', company: 'QA Corp' },
  });
  expect(joinRes.status()).toBe(201);
  return { inviteToken, judgeToken: (await joinRes.json()).data.token };
}

async function scoreTeamApi(request, judgeToken, eventId, teamId, value) {
  const criteriaRes = await request.get(`/api/events/${eventId}/criteria`, {
    headers: bearer(judgeToken),
  });
  expect(criteriaRes.status()).toBe(200);
  const criteria = (await criteriaRes.json()).data;
  const res = await request.put(`/api/events/${eventId}/teams/${teamId}/scores`, {
    headers: bearer(judgeToken),
    data: { scores: criteria.map((c) => ({ criterionId: c.id, value })) },
  });
  expect(res.status()).toBe(200);
}

async function selectWinnerApi(request, token, eventId, teamId) {
  return request.put(winnerPath(eventId), {
    headers: token ? bearer(token) : {},
    data: { teamId },
  });
}

// Draft event, 4 teams. Alpha avg 5.0, Gamma avg 5.0 (tie for top), Beta avg 3.0, Delta has no scores.
async function seedScoredEvent(request, { score = true } = {}) {
  const adminToken = await adminLoginApi(request);
  const event = await createEventApi(request, adminToken, 'Event');
  const run = unique();
  const names = {
    alpha: `Team Alpha ${run}`,
    beta: `Team Beta ${run}`,
    gamma: `Team Gamma ${run}`,
    delta: `Team Delta ${run}`,
  };
  const teams = {};
  for (const [key, name] of Object.entries(names)) {
    teams[key] = await createTeamApi(request, adminToken, event.id, name);
  }
  const { inviteToken, judgeToken } = await joinJudgeApi(request, adminToken, event.id);
  if (score) {
    await scoreTeamApi(request, judgeToken, event.id, teams.alpha.id, 5);
    await scoreTeamApi(request, judgeToken, event.id, teams.beta.id, 3);
    await scoreTeamApi(request, judgeToken, event.id, teams.gamma.id, 5);
  }
  return { adminToken, judgeToken, inviteToken, event, teams, names };
}

// ---------- UI helpers ----------

async function loginAsAdmin(page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(ADMIN.email);
  await page.getByLabel('Password').fill(ADMIN.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL('/');
}

async function openSummary(page, eventId) {
  await page.goto(`/events/${eventId}/scoring-summary`);
  await expect(page.getByRole('heading', { name: 'Scoring Summary' })).toBeVisible();
}

const summaryRow = (page, name) =>
  page.getByRole('list', { name: 'Teams ranked by score' }).getByRole('listitem').filter({ hasText: name });

const eventRow = (page, name) => page.getByRole('listitem').filter({ hasText: name });

const selectControl = (row, name) => row.getByRole('button', { name: `Select ${name} as winner` });

const badge = (row) => row.getByText('Winner', { exact: true });

// Click a control and wait for the (non-GET) winner request to complete.
async function selectAndWait(page, row, name) {
  const [response] = await Promise.all([
    page.waitForResponse((r) => isWinnerWrite(r.request())),
    selectControl(row, name).click(),
  ]);
  return response;
}

// Record winner writes sent by the page.
function trackWinnerRequests(page) {
  const requests = [];
  page.on('request', (req) => {
    if (isWinnerWrite(req)) requests.push(req);
  });
  return requests;
}

// Make winner writes wait until release() is called, then continue to the real server.
async function holdWinnerRequests(page) {
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  await page.route(/\/api\/.*winner/i, async (route) => {
    if (route.request().method() === 'GET') return route.continue();
    await gate;
    return route.continue();
  });
  return release;
}

async function failWinnerRequests(page) {
  await page.route(/\/api\/.*winner/i, (route) => {
    if (route.request().method() === 'GET') return route.continue();
    return route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ data: null, error: 'Server error' }),
    });
  });
}

// =====================================================================
// Admin on the scoring summary
// =====================================================================

test.describe('winner selection: admin, summary page', () => {
  test('AC1: every team row has a Select as Winner control and no badge before any selection', async ({ page, request }) => {
    const { event, names } = await seedScoredEvent(request);
    await loginAsAdmin(page);
    await openSummary(page, event.id);

    for (const name of Object.values(names)) {
      const row = summaryRow(page, name);
      await expect(row).toBeVisible();
      await expect(selectControl(row, name)).toBeVisible();
      await expect(selectControl(row, name)).toHaveText('Select as Winner');
    }
    await expect(page.getByText('Winner', { exact: true })).toHaveCount(0);
  });

  test('AC2 + AC4 + AC7: selecting a top scorer needs no dialog, shows the badge at once and changes nothing else', async ({ page, request }) => {
    const { event, names } = await seedScoredEvent(request);
    await loginAsAdmin(page);
    await openSummary(page, event.id);

    const list = page.getByRole('list', { name: 'Teams ranked by score' });
    const rowsBefore = await list.getByRole('listitem').allInnerTexts();
    const rowTextBefore = rowsBefore.map((t) => t.replace(/Select as Winner/g, '').replace(/\s+/g, ' ').trim());

    const row = summaryRow(page, names.alpha);
    const response = await selectAndWait(page, row, names.alpha);

    expect(response.status()).toBe(200);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(badge(row)).toBeVisible();
    await expect(selectControl(row, names.alpha)).toHaveCount(0);
    // AC4: all other rows keep the control, only one badge
    for (const key of ['beta', 'gamma', 'delta']) {
      await expect(selectControl(summaryRow(page, names[key]), names[key])).toBeVisible();
    }
    await expect(page.getByText('Winner', { exact: true })).toHaveCount(1);

    // AC7: order, averages and completeness unchanged (ignoring the control / badge text)
    const rowsAfter = await list.getByRole('listitem').allInnerTexts();
    const rowTextAfter = rowsAfter.map((t) =>
      t.replace(/Select as Winner/g, '').replace(/Winner/g, '').replace(/\s+/g, ' ').trim(),
    );
    expect(rowTextAfter).toEqual(rowTextBefore);
  });

  test('AC4: the winner row shows the badge instead of the control, other rows keep the control', async ({ page, request }) => {
    const { event, names, adminToken, teams } = await seedScoredEvent(request);
    expect((await selectWinnerApi(request, adminToken, event.id, teams.alpha.id)).status()).toBe(200);
    await loginAsAdmin(page);
    await openSummary(page, event.id);

    const winnerRow = summaryRow(page, names.alpha);
    await expect(badge(winnerRow)).toBeVisible();
    await expect(winnerRow.getByRole('button', { name: /as winner/i })).toHaveCount(0);
    for (const key of ['beta', 'gamma', 'delta']) {
      await expect(selectControl(summaryRow(page, names[key]), names[key])).toBeVisible();
    }
  });

  test('AC5: selecting another top team moves the badge on both pages, never two badges', async ({ page, request }) => {
    const { event, names, adminToken, teams } = await seedScoredEvent(request);
    expect((await selectWinnerApi(request, adminToken, event.id, teams.alpha.id)).status()).toBe(200);
    await loginAsAdmin(page);
    await openSummary(page, event.id);

    const response = await selectAndWait(page, summaryRow(page, names.gamma), names.gamma);
    expect(response.status()).toBe(200);

    await expect(badge(summaryRow(page, names.gamma))).toBeVisible();
    await expect(badge(summaryRow(page, names.alpha))).toHaveCount(0);
    await expect(selectControl(summaryRow(page, names.alpha), names.alpha)).toBeVisible();
    await expect(page.getByText('Winner', { exact: true })).toHaveCount(1);

    await page.goto(`/events/${event.id}`);
    await expect(page.getByRole('heading', { name: /^Teams \(\d+\)$/ })).toBeVisible();
    await expect(badge(eventRow(page, names.gamma))).toBeVisible();
    await expect(badge(eventRow(page, names.alpha))).toHaveCount(0);
    await expect(page.getByText('Winner', { exact: true })).toHaveCount(1);
  });

  test('AC6: selecting the current winner again returns 200 and keeps one winner', async ({ page, request }) => {
    const { event, names, adminToken, teams } = await seedScoredEvent(request);
    expect((await selectWinnerApi(request, adminToken, event.id, teams.alpha.id)).status()).toBe(200);
    expect((await selectWinnerApi(request, adminToken, event.id, teams.alpha.id)).status()).toBe(200);

    await loginAsAdmin(page);
    await openSummary(page, event.id);
    await expect(badge(summaryRow(page, names.alpha))).toBeVisible();
    await expect(page.getByText('Winner', { exact: true })).toHaveCount(1);
  });

  test('AC11: while the request runs the row control is disabled and aria-busy', async ({ page, request }) => {
    const { event, names } = await seedScoredEvent(request);
    await loginAsAdmin(page);
    await openSummary(page, event.id);

    const release = await holdWinnerRequests(page);
    const row = summaryRow(page, names.alpha);
    const control = selectControl(row, names.alpha);
    await control.click();

    await expect(control).toBeDisabled();
    await expect(control).toHaveAttribute('aria-busy', 'true');
    // the rest of the page stays usable: other rows still have an enabled control
    await expect(selectControl(summaryRow(page, names.gamma), names.gamma)).toBeEnabled();

    release();
    await expect(badge(row)).toBeVisible();
  });

  test('AC10: a failed request keeps the previous state, shows the alert next to the control, and can be retried', async ({ page, request }) => {
    const { event, names, adminToken, teams } = await seedScoredEvent(request);
    expect((await selectWinnerApi(request, adminToken, event.id, teams.alpha.id)).status()).toBe(200);
    await loginAsAdmin(page);
    await openSummary(page, event.id);

    await failWinnerRequests(page);
    const gammaRow = summaryRow(page, names.gamma);
    await selectControl(gammaRow, names.gamma).click();

    await expect(gammaRow.getByRole('alert')).toHaveText(FAIL_TEXT);
    await expect(badge(gammaRow)).toHaveCount(0);
    await expect(badge(summaryRow(page, names.alpha))).toBeVisible();
    await expect(page.getByText('Winner', { exact: true })).toHaveCount(1);
    await expect(selectControl(gammaRow, names.gamma)).toBeEnabled();

    // retry succeeds once the server works again
    await page.unroute(/\/api\/.*winner/i);
    const response = await selectAndWait(page, gammaRow, names.gamma);
    expect(response.status()).toBe(200);
    await expect(badge(gammaRow)).toBeVisible();
  });

  test('AC14: each event has its own winner', async ({ page, request }) => {
    const a = await seedScoredEvent(request);
    const b = await seedScoredEvent(request);

    await loginAsAdmin(page);
    await openSummary(page, a.event.id);
    const response = await selectAndWait(page, summaryRow(page, a.names.alpha), a.names.alpha);
    expect(response.status()).toBe(200);

    await openSummary(page, b.event.id);
    await expect(page.getByText('Winner', { exact: true })).toHaveCount(0);
    await page.goto(`/events/${b.event.id}`);
    await expect(page.getByRole('heading', { name: /^Teams \(\d+\)$/ })).toBeVisible();
    await expect(page.getByText('Winner', { exact: true })).toHaveCount(0);

    // selecting in B does not change A
    await openSummary(page, b.event.id);
    await selectAndWait(page, summaryRow(page, b.names.gamma), b.names.gamma);
    await page.goto(`/events/${a.event.id}`);
    await expect(badge(eventRow(page, a.names.alpha))).toBeVisible();
    await expect(page.getByText('Winner', { exact: true })).toHaveCount(1);
  });

  test('UI contract (empty summary): no scores means no controls', async ({ page, request }) => {
    const { event } = await seedScoredEvent(request, { score: false });
    await loginAsAdmin(page);
    await openSummary(page, event.id);

    await expect(
      page.getByText('No scores have been submitted yet. Judges need to complete scoring first.'),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /as winner/i })).toHaveCount(0);
  });
});

// =====================================================================
// Confirmation dialog for non-top scorers
// =====================================================================

test.describe('winner selection: confirmation dialog', () => {
  test('AC15: a non-top team opens the dialog with the exact wording, focus on Cancel, and sends no request yet', async ({ page, request }) => {
    const { event, names } = await seedScoredEvent(request);
    await loginAsAdmin(page);
    await openSummary(page, event.id);
    const requests = trackWinnerRequests(page);

    await selectControl(summaryRow(page, names.beta), names.beta).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: `Select ${names.beta} as winner?` })).toBeVisible();
    await expect(dialog.getByText(DIALOG_MESSAGE)).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Select Winner', exact: true })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Cancel', exact: true })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Cancel', exact: true })).toBeFocused();
    expect(requests).toHaveLength(0);
    await expect(page.getByText('Winner', { exact: true })).toHaveCount(0);
  });

  test('AC16: Select Winner in the dialog sends the request, closes the dialog and moves the badge', async ({ page, request }) => {
    const { event, names, adminToken, teams } = await seedScoredEvent(request);
    expect((await selectWinnerApi(request, adminToken, event.id, teams.alpha.id)).status()).toBe(200);
    await loginAsAdmin(page);
    await openSummary(page, event.id);

    await selectControl(summaryRow(page, names.beta), names.beta).click();
    const [response] = await Promise.all([
      page.waitForResponse((r) => isWinnerWrite(r.request())),
      page.getByRole('dialog').getByRole('button', { name: 'Select Winner', exact: true }).click(),
    ]);

    expect(response.status()).toBe(200);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(badge(summaryRow(page, names.beta))).toBeVisible();
    await expect(badge(summaryRow(page, names.alpha))).toHaveCount(0);
    await expect(page.getByText('Winner', { exact: true })).toHaveCount(1);
  });

  test('UI contract (Confirming): while the request runs the dialog confirm button shows the loading state', async ({ page, request }) => {
    const { event, names } = await seedScoredEvent(request);
    await loginAsAdmin(page);
    await openSummary(page, event.id);

    const release = await holdWinnerRequests(page);
    await selectControl(summaryRow(page, names.beta), names.beta).click();
    const confirm = page.getByRole('dialog').getByRole('button', { name: 'Select Winner', exact: true });
    await confirm.click();

    await expect(confirm).toHaveAttribute('aria-busy', 'true');
    await expect(confirm).toBeDisabled();

    release();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(badge(summaryRow(page, names.beta))).toBeVisible();
  });

  for (const how of ['Cancel button', 'Escape', 'backdrop click']) {
    test(`AC16: ${how} closes the dialog, sends no request and changes nothing`, async ({ page, request }) => {
      const { event, names, adminToken, teams } = await seedScoredEvent(request);
      expect((await selectWinnerApi(request, adminToken, event.id, teams.alpha.id)).status()).toBe(200);
      await loginAsAdmin(page);
      await openSummary(page, event.id);
      const requests = trackWinnerRequests(page);

      await selectControl(summaryRow(page, names.beta), names.beta).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      if (how === 'Cancel button') {
        await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click();
      } else if (how === 'Escape') {
        await page.keyboard.press('Escape');
      } else {
        await page.mouse.click(5, 5);
      }

      await expect(page.getByRole('dialog')).toHaveCount(0);
      expect(requests).toHaveLength(0);
      await expect(badge(summaryRow(page, names.alpha))).toBeVisible();
      await expect(badge(summaryRow(page, names.beta))).toHaveCount(0);
      await expect(page.getByText('Winner', { exact: true })).toHaveCount(1);
    });
  }

  test('AC10: a failure after confirming closes the dialog first and shows the alert next to the control', async ({ page, request }) => {
    const { event, names } = await seedScoredEvent(request);
    await loginAsAdmin(page);
    await openSummary(page, event.id);

    await failWinnerRequests(page);
    const betaRow = summaryRow(page, names.beta);
    await selectControl(betaRow, names.beta).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Select Winner', exact: true }).click();

    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(betaRow.getByRole('alert')).toHaveText(FAIL_TEXT);
    await expect(badge(betaRow)).toHaveCount(0);
    await expect(page.getByText('Winner', { exact: true })).toHaveCount(0);
    await expect(selectControl(betaRow, names.beta)).toBeEnabled();
  });

  test('AC17: a team tied for the highest average gets no dialog', async ({ page, request }) => {
    const { event, names } = await seedScoredEvent(request);
    await loginAsAdmin(page);
    await openSummary(page, event.id);

    // Gamma ties with Alpha at 5 / 5 (listed after Alpha, so rank 2)
    const row = summaryRow(page, names.gamma);
    const response = await selectAndWait(page, row, names.gamma);
    expect(response.status()).toBe(200);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(badge(row)).toBeVisible();
  });

  test('AC17: a team with "No scores" gets the dialog while other teams have scores', async ({ page, request }) => {
    const { event, names } = await seedScoredEvent(request);
    await loginAsAdmin(page);
    await openSummary(page, event.id);

    const row = summaryRow(page, names.delta);
    await expect(row.getByText('No scores', { exact: true })).toBeVisible();
    await selectControl(row, names.delta).click();
    await expect(page.getByRole('dialog').getByRole('heading', { name: `Select ${names.delta} as winner?` })).toBeVisible();
  });

  test('AC18: the dialog depends on the score, not on the current winner', async ({ page, request }) => {
    const { event, names, adminToken, teams } = await seedScoredEvent(request);
    expect((await selectWinnerApi(request, adminToken, event.id, teams.alpha.id)).status()).toBe(200);
    await loginAsAdmin(page);
    await openSummary(page, event.id);

    // Beta is not a top scorer: dialog, even though a (different) winner exists
    await selectControl(summaryRow(page, names.beta), names.beta).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    // Gamma is a top scorer: no dialog
    const response = await selectAndWait(page, summaryRow(page, names.gamma), names.gamma);
    expect(response.status()).toBe(200);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(badge(summaryRow(page, names.gamma))).toBeVisible();
  });
});

// =====================================================================
// Event page
// =====================================================================

test.describe('winner selection: event page', () => {
  test('AC3: admin sees the badge on the winning team row only, and it survives a reload; status stays Draft (AC7)', async ({ page, request }) => {
    const { event, names } = await seedScoredEvent(request);
    await loginAsAdmin(page);
    await openSummary(page, event.id);
    await selectAndWait(page, summaryRow(page, names.alpha), names.alpha);

    await page.goto(`/events/${event.id}`);
    await expect(page.getByRole('heading', { name: /^Teams \(4\)$/ })).toBeVisible();
    await expect(badge(eventRow(page, names.alpha))).toBeVisible();
    for (const key of ['beta', 'gamma', 'delta']) {
      await expect(badge(eventRow(page, names[key]))).toHaveCount(0);
    }
    await expect(page.getByText('Draft', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Live', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Completed', { exact: true })).toHaveCount(0);

    await page.reload();
    await expect(page.getByRole('heading', { name: /^Teams \(4\)$/ })).toBeVisible();
    await expect(badge(eventRow(page, names.alpha))).toBeVisible();
    await expect(page.getByText('Winner', { exact: true })).toHaveCount(1);
  });

  test('AC7: the summary is unchanged after a winner is selected and the page is reloaded', async ({ page, request }) => {
    const { event, names, adminToken, teams } = await seedScoredEvent(request);
    await loginAsAdmin(page);
    await openSummary(page, event.id);
    const list = page.getByRole('list', { name: 'Teams ranked by score' });
    const before = (await list.getByRole('listitem').allInnerTexts()).map((t) =>
      t.replace(/Select as Winner/g, '').replace(/\s+/g, ' ').trim(),
    );

    expect((await selectWinnerApi(request, adminToken, event.id, teams.beta.id)).status()).toBe(200);
    await page.reload();
    await expect(badge(summaryRow(page, names.beta))).toBeVisible();
    const after = (await list.getByRole('listitem').allInnerTexts()).map((t) =>
      t.replace(/Select as Winner/g, '').replace(/Winner/g, '').replace(/\s+/g, ' ').trim(),
    );
    expect(after).toEqual(before);
  });

  test('AC12: removing the winning team leaves the event with no winner and no error', async ({ page, request }) => {
    const { event, names, adminToken, teams } = await seedScoredEvent(request);
    expect((await selectWinnerApi(request, adminToken, event.id, teams.alpha.id)).status()).toBe(200);
    const del = await request.delete(`/api/events/${event.id}/teams/${teams.alpha.id}`, {
      headers: bearer(adminToken),
    });
    expect(del.status()).toBe(204);

    await loginAsAdmin(page);
    await page.goto(`/events/${event.id}`);
    await expect(page.getByRole('heading', { name: /^Teams \(3\)$/ })).toBeVisible();
    await expect(page.getByText('Winner', { exact: true })).toHaveCount(0);
    await expect(page.getByText(names.alpha)).toHaveCount(0);

    await openSummary(page, event.id);
    await expect(page.getByText('Winner', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Failed to load scoring summary')).toHaveCount(0);
    await expect(page.getByRole('alert')).toHaveCount(0);
  });
});

// =====================================================================
// Judge
// =====================================================================

test.describe('winner selection: judge', () => {
  test('AC13: a judge sees the badge on the event page, no controls, and is redirected away from the summary', async ({ page, request }) => {
    const { event, names, adminToken, teams, inviteToken } = await seedScoredEvent(request);
    expect((await selectWinnerApi(request, adminToken, event.id, teams.alpha.id)).status()).toBe(200);

    // join through the invite link in the UI
    await page.goto(`/judge-invite/${inviteToken}`);
    await page.getByLabel('Name').fill(`Viewer ${unique()}`);
    await page.getByLabel('Role').fill('Tester');
    await page.getByLabel('Company').fill('QA Corp');
    await page.getByRole('button', { name: 'Join as Judge' }).click();

    await expect(page).toHaveURL(`/events/${event.id}`);
    await expect(page.getByRole('heading', { name: /^Teams \(4\)$/ })).toBeVisible();
    await expect(badge(eventRow(page, names.alpha))).toBeVisible();
    await expect(page.getByText('Winner', { exact: true })).toHaveCount(1);
    await expect(page.getByRole('button', { name: /as winner/i })).toHaveCount(0);
    await expect(page.getByText('Select as Winner')).toHaveCount(0);

    await page.goto(`/events/${event.id}/scoring-summary`);
    await expect(page).toHaveURL(`/events/${event.id}`);
    await expect(page.getByRole('heading', { name: 'Scoring Summary' })).toHaveCount(0);
  });
});

// =====================================================================
// API permissions and not-found cases
// =====================================================================

test.describe('winner selection: API', () => {
  test('AC8: a judge token gets 403 and the winner is unchanged', async ({ page, request }) => {
    const { event, names, adminToken, judgeToken, teams } = await seedScoredEvent(request);
    expect((await selectWinnerApi(request, adminToken, event.id, teams.alpha.id)).status()).toBe(200);

    const res = await selectWinnerApi(request, judgeToken, event.id, teams.beta.id);
    expect(res.status()).toBe(403);

    await loginAsAdmin(page);
    await page.goto(`/events/${event.id}`);
    await expect(page.getByRole('heading', { name: /^Teams \(4\)$/ })).toBeVisible();
    await expect(badge(eventRow(page, names.alpha))).toBeVisible();
    await expect(page.getByText('Winner', { exact: true })).toHaveCount(1);
  });

  test('AC8: an unauthenticated call gets 401 and the winner is unchanged', async ({ page, request }) => {
    const { event, names, teams } = await seedScoredEvent(request);

    const res = await selectWinnerApi(request, null, event.id, teams.alpha.id);
    expect(res.status()).toBe(401);

    await loginAsAdmin(page);
    await page.goto(`/events/${event.id}`);
    await expect(page.getByRole('heading', { name: /^Teams \(4\)$/ })).toBeVisible();
    await expect(page.getByText(names.alpha)).toBeVisible();
    await expect(page.getByText('Winner', { exact: true })).toHaveCount(0);
  });

  test('AC9: unknown team, team of another event and unknown event all return 404 and change nothing', async ({ page, request }) => {
    const a = await seedScoredEvent(request);
    const b = await seedScoredEvent(request);
    expect((await selectWinnerApi(request, a.adminToken, a.event.id, a.teams.alpha.id)).status()).toBe(200);

    const unknownId = '00000000-0000-4000-8000-000000000000';
    expect((await selectWinnerApi(request, a.adminToken, a.event.id, unknownId)).status()).toBe(404);
    expect((await selectWinnerApi(request, a.adminToken, a.event.id, b.teams.alpha.id)).status()).toBe(404);
    expect((await selectWinnerApi(request, a.adminToken, unknownId, a.teams.alpha.id)).status()).toBe(404);

    await loginAsAdmin(page);
    await page.goto(`/events/${a.event.id}`);
    await expect(page.getByRole('heading', { name: /^Teams \(4\)$/ })).toBeVisible();
    await expect(badge(eventRow(page, a.names.alpha))).toBeVisible();
    await expect(page.getByText('Winner', { exact: true })).toHaveCount(1);

    await page.goto(`/events/${b.event.id}`);
    await expect(page.getByRole('heading', { name: /^Teams \(4\)$/ })).toBeVisible();
    await expect(page.getByText('Winner', { exact: true })).toHaveCount(0);
  });
});
