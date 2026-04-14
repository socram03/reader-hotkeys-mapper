import path from 'path';
import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: path.join(__dirname, 'tests'),
	timeout: 60_000,
	reporter: process.env.CI
		? [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]]
		: 'list',
	expect: {
		timeout: 10_000
	},
	use: {
		baseURL: 'http://127.0.0.1:4173',
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure'
	},
	webServer: {
		command: 'bun tests/server.ts',
		url: 'http://127.0.0.1:4173',
		reuseExistingServer: true,
		timeout: 30_000
	}
});
