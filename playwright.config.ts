import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'src/e2e', // где лежат тесты
  timeout: 120_000,
  expect: { timeout: 10_000 },
  retries: 0,
  use: {
    headless: false, // пока ставим false для визуальной отладки; в CI ставят true
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10_000,
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  reporter: [['list'], ['html', { outputFolder: 'playwright-report' }]]
});
