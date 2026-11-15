import { defineConfig, devices } from '@playwright/test';

// E2E starts its own API (against the test database) and client.
// reuseExistingServer is false on purpose: if a dev server is already running,
// the run fails loudly instead of silently testing against the dev database.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npm start',
      cwd: '../server',
      env: { NODE_ENV: 'test' },
      port: 3000,
      reuseExistingServer: false,
    },
    {
      command: 'npm run dev -- --port 5173 --strictPort',
      port: 5173,
      reuseExistingServer: false,
    },
  ],
});
