const request = require('supertest');
const app = require('../app');
const { sequelize } = require('../models');

// Credentials come from server/src/seeders/20260323000001-admin-user.js
const ADMIN = { email: 'admin@demoday.com', password: 'Admin123!' };

afterAll(async () => {
  await sequelize.close();
});

describe('auth smoke', () => {
  it('logs in the seeded admin', async () => {
    const res = await request(app).post('/api/auth/login').send(ADMIN);

    expect(res.status).toBe(200);
    expect(res.body.error).toBeNull();
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user).toMatchObject({ email: ADMIN.email, role: 'admin' });
  });

  it('is connected to the test database, not the dev one', () => {
    expect(sequelize.config.database).toBe('demoday_test');
  });
});
