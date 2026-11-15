// Creates the test database (if missing), then migrates and seeds it with the
// existing npm scripts under NODE_ENV=test. Safe to re-run.
const path = require('path');
const { spawnSync } = require('child_process');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { Client } = require('pg');

const run = (script) =>
  spawnSync('npm', ['run', script], {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, NODE_ENV: 'test' },
    encoding: 'utf8',
  });

(async () => {
  const testUrl = process.env.DATABASE_URL_TEST;
  if (!testUrl) {
    // Without this check the test config would silently fall back to the dev DB.
    console.error('DATABASE_URL_TEST is not set in the root .env. Aborting.');
    process.exit(1);
  }

  const url = new URL(testUrl);
  const dbName = decodeURIComponent(url.pathname.slice(1));
  url.pathname = '/postgres';

  const client = new Client({ connectionString: url.toString() });
  await client.connect();
  try {
    const { rowCount } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (rowCount === 0) {
      // Identifiers cannot be parameterized; quote it.
      await client.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`);
      console.log(`Created database ${dbName}`);
    } else {
      console.log(`Database ${dbName} already exists`);
    }
  } finally {
    await client.end();
  }

  const migrate = run('db:migrate');
  if (migrate.status !== 0) {
    console.error(migrate.stdout, migrate.stderr);
    process.exit(1);
  }
  console.log('Migrations applied');

  const seed = run('db:seed');
  if (seed.status !== 0) {
    // The admin seeder fails harmlessly when the admin user already exists.
    console.warn('Seed failed (expected if already seeded):');
    console.warn((seed.stderr || seed.stdout).split('\n').filter((l) => /error/i.test(l)).join('\n'));
  } else {
    console.log('Seed applied');
  }
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
