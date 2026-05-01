import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium, expect, test, type BrowserContext, type Page } from '@playwright/test';

const EXTENSION_PATH = path.resolve(__dirname, '..');

test.describe.serial('ChapterPilot extension', () => {
	let context: BrowserContext;
	let extensionId = '';
	let userDataDir = '';

	test.beforeAll(async () => {
		userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reader-hotkeys-'));
		context = await chromium.launchPersistentContext(userDataDir, {
			channel: 'chromium',
			headless: false,
			args: [
				`--disable-extensions-except=${EXTENSION_PATH}`,
				`--load-extension=${EXTENSION_PATH}`
			]
		});

		let [worker] = context.serviceWorkers();
		if (!worker) worker = await context.waitForEvent('serviceworker');
		extensionId = worker.url().split('/')[2];
	});

	test.afterAll(async () => {
		await context?.close();
		if (userDataDir) fs.rmSync(userDataDir, { recursive: true, force: true });
	});

	test('maps a custom site and enables navigation shortcuts', async ({ baseURL }) => {
		const readerPage = await context.newPage();
		readerPage.on('dialog', dialog => dialog.accept('Custom Local'));

		await readerPage.goto(`${baseURL}/custom/reader-1.html`);
		await readerPage.keyboard.press('ArrowRight');
		await expect(readerPage).toHaveURL(/reader-1\.html$/);

		const i18nOptionsPage = await context.newPage();
		await i18nOptionsPage.goto(`chrome-extension://${extensionId}/options.html`);
		await expect(i18nOptionsPage.locator('#save-settings')).toHaveCount(0);
		await expect(i18nOptionsPage.locator('#save-language')).toHaveCount(0);
		await expect(i18nOptionsPage.locator('#save-shortcuts')).toHaveCount(0);
		await expect(i18nOptionsPage.locator('#save-reading-mode')).toHaveCount(0);
		await expect(i18nOptionsPage.locator('#save-privacy')).toHaveCount(0);
		await expect(i18nOptionsPage.locator('#save-storage-sync')).toHaveCount(0);
		await i18nOptionsPage.selectOption('#language-select', 'en');
		await expect(i18nOptionsPage.locator('#save-settings')).toBeVisible();
		await expect(i18nOptionsPage.locator('.settings-save-bar')).toHaveCSS('position', 'fixed');
		await i18nOptionsPage.click('#save-settings');
		await expect(i18nOptionsPage.locator('#save-settings')).toHaveCount(0);
		await expect(i18nOptionsPage.locator('h1')).toContainText('Options and mappings');
		await expect(i18nOptionsPage.locator('.eyebrow')).toContainText('ChapterPilot');
		await expect(i18nOptionsPage.locator('.hero-desc')).toContainText('Keep chapter reading flowing');
		const manifest = await i18nOptionsPage.evaluate(() => chrome.runtime.getManifest());
		expect(manifest.name).toBe('ChapterPilot');
		expect(manifest.description.toLowerCase()).toContain('chapter navigation');

		const englishPopup = await context.newPage();
		await englishPopup.goto(`chrome-extension://${extensionId}/popup.html`);
		await expect(englishPopup.locator('.eyebrow')).toContainText('ChapterPilot');
		await expect(englishPopup.locator('#start-mapper')).toContainText('Map reader');
		const popupMetrics = await englishPopup.locator('.popup').evaluate(element => ({
			width: element.getBoundingClientRect().width,
			clientHeight: element.clientHeight,
			scrollHeight: element.scrollHeight
		}));
		expect(popupMetrics.width).toBeGreaterThanOrEqual(430);
		expect(popupMetrics.scrollHeight).toBeLessThanOrEqual(popupMetrics.clientHeight);
		await englishPopup.close();

		await i18nOptionsPage.selectOption('#language-select', 'es');
		await i18nOptionsPage.click('#save-settings');
		await expect(i18nOptionsPage.locator('h1')).toContainText('Opciones y mapeos');
		await i18nOptionsPage.close();

		const nonReaderPage = await context.newPage();
		const nonReaderErrors: string[] = [];
		nonReaderPage.on('pageerror', error => nonReaderErrors.push(error.message));
		await nonReaderPage.goto(`${baseURL}/`);
		await waitForExtensionIdle(nonReaderPage);
		await nonReaderPage.evaluate(() => {
			window.dispatchEvent(new KeyboardEvent('keydown'));
		});
		await nonReaderPage.waitForTimeout(100);
		expect(nonReaderErrors).toEqual([]);
		await nonReaderPage.close();

		const candidatePopup = await context.newPage();
		await candidatePopup.goto(`chrome-extension://${extensionId}/popup.html`);
		await expect(candidatePopup.locator('.status-card')).toContainText('Lector probable');
		await expect(candidatePopup.locator('#start-mapper')).toContainText('Mapear lector');
		await candidatePopup.close();

		const optionsPage = await context.newPage();
		await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);
		await optionsPage.click('#start-picker');

		const targetTabId = await getTargetTabId(optionsPage);
		await readerPage.bringToFront();
		await expect(readerPage.locator('[data-mapper-save="true"]')).toBeVisible();

		await readerPage.click('#next-link');
		await readerPage.click('#prev-link');
		await readerPage.click('#main-link');
		await readerPage.click('[data-mapper-save="true"]');
		await waitForExtensionReady(readerPage);

		await optionsPage.bringToFront();
		await optionsPage.selectOption('#language-select', 'en');
		await optionsPage.click('#save-settings');
		await expect(optionsPage.locator('h1')).toContainText('Options and mappings');
		await readerPage.reload();
		await waitForExtensionReady(readerPage);
		await readerPage.keyboard.press('h');
		await expect(readerPage.locator('#reader-hotkeys-help')).toContainText('Shortcuts');
		await expect(readerPage.locator('#reader-hotkeys-help')).toContainText('Show or hide help');
		await readerPage.keyboard.press('Escape');

		await optionsPage.bringToFront();
		await optionsPage.selectOption('#language-select', 'es');
		await optionsPage.click('#save-settings');
		await expect(optionsPage.locator('h1')).toContainText('Opciones y mapeos');
		await readerPage.reload();
		await waitForExtensionReady(readerPage);

		await readerPage.keyboard.press('ArrowRight');
		await expect(readerPage).toHaveURL(/reader-2\.html$/);

		await ensureReaderInTab(optionsPage, targetTabId);
		await readerPage.bringToFront();
		await waitForExtensionReady(readerPage);
		await readerPage.keyboard.press('ArrowLeft');
		await expect(readerPage).toHaveURL(/reader-1\.html$/);
		await readerPage.evaluate(() => {
			window.scrollTo({ top: 900, behavior: 'auto' });
		});
		await readerPage.waitForTimeout(600);

		await ensureReaderInTab(optionsPage, targetTabId);
		await readerPage.bringToFront();
		await waitForExtensionReady(readerPage);
		await readerPage.keyboard.press('c');
		await expect(readerPage.locator('[data-chapter-results="true"] [data-chapter-href]')).toHaveCount(1);
		await expect(readerPage.locator('[data-chapter-results="true"]')).toContainText('Custom Reader 1');
		await expect(readerPage.locator('[data-chapter-results="true"]')).not.toContainText('Capitulo 1');
		await expect(readerPage.locator('[data-chapter-results="true"]')).not.toContainText('Capitulo 2');
		await readerPage.keyboard.press('Escape');

		await ensureReaderInTab(optionsPage, targetTabId);
		await readerPage.bringToFront();
		await waitForExtensionReady(readerPage);
		await readerPage.keyboard.press('m');
		await expect(readerPage).toHaveURL(/series\.html$/);

		await readerPage.goto(`${baseURL}/custom/reader-1.html`);
		await ensureReaderInTab(optionsPage, targetTabId);
		await readerPage.bringToFront();
		await waitForExtensionReady(readerPage);
		await readerPage.keyboard.press('z');
		await expect(readerPage.locator('header')).toBeHidden();
		await readerPage.keyboard.press('z');
		await expect(readerPage.locator('header')).toBeVisible();

		await readerPage.keyboard.press('a');
		await readerPage.keyboard.press('+');
		await readerPage.reload();
		await waitForExtensionReady(readerPage);

		const autoScrollPopup = await context.newPage();
		await autoScrollPopup.goto(`chrome-extension://${extensionId}/popup.html`);
		await expect(autoScrollPopup.locator('.status-card')).toContainText('140 px/s');
		await autoScrollPopup.close();
		await readerPage.bringToFront();
		await readerPage.keyboard.press('a');

		await readerPage.evaluate(() => {
			window.scrollTo({ top: 900, behavior: 'auto' });
		});
		await readerPage.keyboard.press('m');
		await expect(readerPage).toHaveURL(/series\.html$/);

		await readerPage.bringToFront();
		const resumePopup = await context.newPage();
		await resumePopup.goto(`chrome-extension://${extensionId}/popup.html`);
		await expect(resumePopup.locator('#resume-last-read')).toBeEnabled();
		await expect(resumePopup.locator('.status-card')).toContainText('Custom Reader 1');
		await resumePopup.click('#resume-last-read');

		await expect(readerPage).toHaveURL(/reader-1\.html$/);
		await waitForExtensionReady(readerPage);
		await readerPage.waitForFunction(() => {
			return (window.scrollY || 0) > 500;
		});

		await readerPage.goto(`${baseURL}/custom/reader-0.html`);
		await ensureReaderInTab(optionsPage, targetTabId);
		await readerPage.bringToFront();
		await waitForExtensionReady(readerPage);
		await readerPage.evaluate(() => {
			window.scrollTo({ top: 900, behavior: 'auto' });
		});
		await readerPage.keyboard.press('m');
		await expect(readerPage).toHaveURL(/series\.html$/);

		const latestReadPopup = await context.newPage();
		await latestReadPopup.goto(`chrome-extension://${extensionId}/popup.html`);
		await expect(latestReadPopup.locator('#resume-last-read')).toBeEnabled();
		await expect(latestReadPopup.locator('#open-continue-reading')).toBeVisible();
		await expect(latestReadPopup.locator('.status-card')).toContainText('Custom Reader 1');
		const continuePagePromise = context.waitForEvent('page');
		await latestReadPopup.click('#open-continue-reading');
		const continuePage = await continuePagePromise;
		await continuePage.waitForLoadState();
		await expect(continuePage.locator('h1')).toContainText('Seguir leyendo');
		await expect(continuePage.locator('#continue-search')).toBeVisible();
		await expect(continuePage.locator('#continue-reading-list')).toContainText('Custom Reader 1');
		await continuePage.locator('#continue-search').fill('custom');
		await expect(continuePage.locator('[data-continue-reading-href*="/custom/reader-1.html"]')).toBeVisible();
		const openedContinueChapterPromise = context.waitForEvent('page');
		await continuePage.click('[data-continue-reading-href*="/custom/reader-1.html"]');
		const openedContinueChapter = await openedContinueChapterPromise;
		await openedContinueChapter.waitForLoadState();
		await continuePage.close();
		await latestReadPopup.close();

		await expect(openedContinueChapter).toHaveURL(/reader-1\.html$/);
		await openedContinueChapter.close();
		await readerPage.goto(`${baseURL}/custom/reader-1.html`);
		await ensureReaderInTab(optionsPage, targetTabId);
		await waitForExtensionReady(readerPage);

		await optionsPage.bringToFront();
		const latestReadsDownload = optionsPage.waitForEvent('download');
		await optionsPage.click('#export-latest-reads');
		const latestReadsFile = await latestReadsDownload;
		const latestReadsPath = path.join(userDataDir, 'latest-reads-export.json');
		await latestReadsFile.saveAs(latestReadsPath);
		await expect(optionsPage.locator('#resume-work-count')).toHaveText('1');

		const exportedLatestReads = JSON.parse(fs.readFileSync(latestReadsPath, 'utf8'));
		expect(exportedLatestReads.totalWorks).toBe(1);
		expect(exportedLatestReads.totalEntries).toBeGreaterThanOrEqual(1);
		expect(exportedLatestReads.entries).toHaveLength(1);
		expect(String(exportedLatestReads.entries[0].chapterHref)).toContain('/custom/reader-1.html');
		expect(Number(exportedLatestReads.entries[0].trackedEntries)).toBeGreaterThanOrEqual(1);

		const backupDownload = optionsPage.waitForEvent('download');
		await optionsPage.click('#export-backup');
		const backupFile = await backupDownload;
		const backupPath = path.join(userDataDir, 'reader-hotkeys-backup.json');
		await backupFile.saveAs(backupPath);

		const exportedBackup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
		expect(exportedBackup.version).toBe(1);
		expect(exportedBackup.userMappings.entries).toHaveLength(1);
		expect(Object.keys(exportedBackup.resume).length).toBeGreaterThanOrEqual(1);
		expect(exportedBackup.settings['mapped:127.0.0.1:4173::/custom/'].autoScrollSpeed).toBe(140);

		await optionsPage.evaluate(async () => {
			await chrome.storage.local.clear();
		});
		await optionsPage.reload();
		await expect(optionsPage.locator('#mapping-count')).toHaveText('0');
		await expect(optionsPage.locator('#resume-work-count')).toHaveText('0');

		await optionsPage.locator('#import-json-file').setInputFiles(backupPath);
		await expect(optionsPage.locator('#mapping-count')).toHaveText('1');
		await expect(optionsPage.locator('#resume-work-count')).toHaveText('1');
		await expect(optionsPage.locator('.notice')).toContainText('Backup importado');

		await optionsPage.click('#streamer-mode-enabled');
		await optionsPage.click('#save-settings');
		await expect(optionsPage.locator('.notice')).toContainText('Ajustes guardados');
		const privateMappingCard = optionsPage.locator('.mapping-card').first();
		await expect(privateMappingCard).toContainText('Sitio oculto');
		await expect(privateMappingCard).not.toContainText('Custom Local');
		await expect(privateMappingCard).not.toContainText('127.0.0.1');

		await readerPage.bringToFront();
		await waitForExtensionReady(readerPage);
		await readerPage.keyboard.press('h');
		await expect(readerPage.locator('#reader-hotkeys-help')).toContainText('Sitio oculto');
		await expect(readerPage.locator('#reader-hotkeys-help')).not.toContainText('Custom Local');
		await expect(readerPage.locator('#reader-hotkeys-help')).not.toContainText('127.0.0.1');
		await readerPage.keyboard.press('Escape');

		const privatePopup = await context.newPage();
		await privatePopup.goto(`chrome-extension://${extensionId}/popup.html`);
		await expect(privatePopup.locator('.status-card')).toContainText('Sitio oculto');
		await expect(privatePopup.locator('.status-card')).not.toContainText('127.0.0.1');
		await expect(privatePopup.locator('.status-card')).not.toContainText('Custom Reader');
		const privateContinuePromise = context.waitForEvent('page');
		await privatePopup.click('#open-continue-reading');
		const privateContinuePage = await privateContinuePromise;
		await privateContinuePage.waitForLoadState();
		await expect(privateContinuePage.locator('#continue-reading-list')).toContainText('Lectura oculta');
		await expect(privateContinuePage.locator('#continue-reading-list')).not.toContainText('Custom Reader');
		await expect(privateContinuePage.locator('#continue-reading-list')).not.toContainText('127.0.0.1');
		await privateContinuePage.close();
		await privatePopup.close();

		await optionsPage.click('#streamer-mode-enabled');
		await optionsPage.click('#save-settings');
		await expect(optionsPage.locator('.notice')).toContainText('Ajustes guardados');

		await readerPage.bringToFront();
		await optionsPage.bringToFront();
		await optionsPage.click('.mapping-card-head');
		await optionsPage.click('[data-action="validate"]');
		const validationModal = optionsPage.locator('[data-validation-modal="true"]');
		await expect(validationModal).toBeVisible();
		await expect(validationModal).toContainText('Resultado del test');
		await expect(validationModal).toContainText('Custom Local');
		await expect(validationModal).toContainText('/custom/reader-1.html');
		await expect(validationModal).toContainText('Siguiente OK');
		await expect(validationModal).toContainText('Anterior OK');
		await expect(validationModal).toContainText('Principal OK');
		await expect(optionsPage.locator('.notice')).toContainText('Siguiente OK');
		await expect(optionsPage.locator('.notice')).toContainText('Anterior OK');
		await expect(optionsPage.locator('.notice')).toContainText('Principal OK');
		await validationModal.locator('[data-validation-close="true"]').click();
		await expect(validationModal).toBeHidden();

		await optionsPage.click('[data-shortcut-action="next"]');
		await optionsPage.keyboard.press('Control+ArrowRight');
		await expect(optionsPage.locator('[data-shortcut-action="next"]')).toHaveValue('Ctrl+ArrowRight');
		await optionsPage.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'auto' }));
		await expect(optionsPage.locator('#save-settings')).toBeVisible();
		await optionsPage.click('[data-shortcut-action="prev"]');
		await optionsPage.keyboard.press('Control+ArrowRight');
		await optionsPage.click('#save-settings');
		const duplicateShortcutModal = optionsPage.locator('[data-feedback-modal="true"]');
		await expect(duplicateShortcutModal).toBeVisible();
		await expect(duplicateShortcutModal).toContainText('Atajo duplicado');
		await duplicateShortcutModal.locator('[data-feedback-close="true"]').click();
		await expect(duplicateShortcutModal).toBeHidden();
		await optionsPage.click('[data-shortcut-action="prev"]');
		await optionsPage.keyboard.press('ArrowLeft');
		await optionsPage.click('#save-settings');
		await expect(optionsPage.locator('.notice')).toContainText('Ajustes guardados');

		await readerPage.goto(`${baseURL}/custom/reader-1.html`);
		await ensureReaderInActiveTab(optionsPage, readerPage);
		await waitForExtensionReady(readerPage);
		await readerPage.keyboard.press('ArrowRight');
		await expect(readerPage).toHaveURL(/reader-1\.html$/);
		await readerPage.keyboard.press('Control+ArrowRight');
		await expect(readerPage).toHaveURL(/reader-2\.html$/);

		await optionsPage.bringToFront();
		await optionsPage.click('[data-shortcut-action="next"]');
		await optionsPage.keyboard.press('ArrowRight');
		await expect(optionsPage.locator('[data-shortcut-action="next"]')).toHaveValue('ArrowRight');
		await optionsPage.click('#save-settings');
		await expect(optionsPage.locator('.notice')).toContainText('Ajustes guardados');

		await optionsPage.click('[data-domain-shortcut-action="next"]');
		await optionsPage.keyboard.press('Alt+X');
		await expect(optionsPage.locator('[data-domain-shortcut-action="next"]')).toHaveValue('Alt+X');
		await optionsPage.click('.card-footer [data-action="save"]');
		await expect(optionsPage.locator('.notice')).toContainText('Guardado');

		await readerPage.goto(`${baseURL}/custom/reader-1.html`);
		await ensureReaderInActiveTab(optionsPage, readerPage);
		await waitForExtensionReady(readerPage);
		await readerPage.keyboard.press('ArrowRight');
		await expect(readerPage).toHaveURL(/reader-1\.html$/);
		await readerPage.keyboard.press('Alt+X');
		await expect(readerPage).toHaveURL(/reader-2\.html$/);

		await optionsPage.bringToFront();
		await optionsPage.click('[data-domain-shortcut-action="next"]');
		await optionsPage.keyboard.press('Escape');
		await expect(optionsPage.locator('[data-domain-shortcut-action="next"]')).toHaveValue('Alt+X');
		await optionsPage.keyboard.press('Escape');
		await expect(optionsPage.locator('[data-domain-shortcut-action="next"]')).toHaveValue('');
		await optionsPage.click('.card-footer [data-action="save"]');
		await expect(optionsPage.locator('.notice')).toContainText('Guardado');

		await optionsPage.fill('[data-reading-setting="backgroundColor"]', '#101010');
		await optionsPage.fill('[data-reading-setting="maxWidth"]', '720');
		await optionsPage.fill('[data-history-setting="completedThresholdPercent"]', '97');
		await optionsPage.click('#save-settings');
		await expect(optionsPage.locator('.notice')).toContainText('Ajustes guardados');

		await readerPage.goto(`${baseURL}/custom/reader-1.html`);
		await ensureReaderInActiveTab(optionsPage, readerPage);
		await waitForExtensionReady(readerPage);
		await readerPage.keyboard.press('z');
		await expect(readerPage.locator('body')).toHaveCSS('background-color', 'rgb(16, 16, 16)');
		await expect(readerPage.locator('main')).toHaveCSS('max-width', '720px');
		await readerPage.keyboard.press('z');

		await optionsPage.bringToFront();
		await optionsPage.fill('[data-reading-setting="backgroundColor"]', '#000000');
		await optionsPage.fill('[data-reading-setting="maxWidth"]', '0');
		await optionsPage.click('#save-settings');
		await expect(optionsPage.locator('.notice')).toContainText('Ajustes guardados');

		await optionsPage.check('#sync-storage-enabled');
		await optionsPage.click('#save-settings');
		await expect(optionsPage.locator('.notice')).toContainText('Ajustes guardados');
		const syncedData = await optionsPage.evaluate(async () => {
			return chrome.storage.sync.get(['readerHotkeysSettings', 'readerHotkeysUserMappings']);
		}) as {
			readerHotkeysSettings: { _global?: unknown };
			readerHotkeysUserMappings: { entries?: unknown[] };
		};
		expect(syncedData.readerHotkeysUserMappings.entries).toHaveLength(1);
		expect(syncedData.readerHotkeysSettings._global).toBeTruthy();

		await optionsPage.uncheck('#sync-storage-enabled');
		await optionsPage.click('#save-settings');
		await expect(optionsPage.locator('.notice')).toContainText('Ajustes guardados');

		const cleanupContinuePage = await context.newPage();
		await cleanupContinuePage.goto(`chrome-extension://${extensionId}/continue.html`);
		await expect(cleanupContinuePage.locator('#continue-reading-list .continue-card')).toHaveCount(1);

		cleanupContinuePage.once('dialog', dialog => dialog.dismiss());
		await cleanupContinuePage.click('[data-remove-continue-reading-work]');
		await expect(cleanupContinuePage.locator('#continue-reading-list .continue-card')).toHaveCount(1);

		cleanupContinuePage.once('dialog', dialog => dialog.accept());
		await cleanupContinuePage.click('[data-remove-continue-reading-work]');
		await expect(cleanupContinuePage.locator('.message.ok')).toContainText('Lectura retirada');
		await expect(cleanupContinuePage.locator('#continue-reading-list .continue-card')).toHaveCount(0);

		await cleanupContinuePage.evaluate(async resume => {
			await chrome.storage.local.set({ readerHotkeysResume: resume });
		}, exportedBackup.resume);
		await cleanupContinuePage.click('#refresh-continue-reading');
		await expect(cleanupContinuePage.locator('#continue-reading-list .continue-card')).toHaveCount(1);

		cleanupContinuePage.once('dialog', dialog => dialog.accept());
		await cleanupContinuePage.click('#wipe-continue-reading');
		await expect(cleanupContinuePage.locator('.message.ok')).toContainText('Historial de lectura borrado');
		await expect(cleanupContinuePage.locator('#continue-reading-list .continue-card')).toHaveCount(0);
		await expect(cleanupContinuePage.locator('.continue-stats')).toContainText('0 obra(s)');
		await cleanupContinuePage.close();

		await optionsPage.close();
	});

	test('separates continue reading from full history at the saved threshold', async ({ baseURL }) => {
		const continuePage = await context.newPage();
		await continuePage.goto(`chrome-extension://${extensionId}/continue.html`);
		await continuePage.evaluate(async hrefs => {
			await chrome.storage.local.set({
				readerHotkeysSettings: {
					_global: {
						completedThresholdPercent: 97
					}
				},
				readerHotkeysResume: {
					pending: {
						storageKey: 'pending',
						entryType: 'chapter',
						scrollY: 500,
						percent: 0.5,
						updatedAt: Date.now(),
						title: 'Pending Chapter',
						workTitle: 'Pending Work',
						host: '127.0.0.1:4173',
						siteId: 'custom',
						mainHref: hrefs.pendingWork,
						workKey: 'pending-work',
						chapterHref: hrefs.pendingChapter
					},
					completed: {
						storageKey: 'completed',
						entryType: 'chapter',
						scrollY: 970,
						percent: 0.97,
						updatedAt: Date.now() + 1,
						title: 'Completed Chapter',
						workTitle: 'Pending Work',
						host: '127.0.0.1:4173',
						siteId: 'custom',
						mainHref: hrefs.pendingWork,
						workKey: 'pending-work',
						chapterHref: hrefs.completedChapter
					},
					otherPending: {
						storageKey: 'otherPending',
						entryType: 'chapter',
						scrollY: 400,
						percent: 0.4,
						updatedAt: Date.now() + 2,
						title: 'Open Chapter',
						workTitle: 'Open Work',
						host: '127.0.0.1:4173',
						siteId: 'custom',
						mainHref: hrefs.otherPendingWork,
						workKey: 'other-pending-work',
						chapterHref: hrefs.otherPendingChapter
					}
				}
			});
		}, {
			pendingWork: `${baseURL}/custom/series.html`,
			pendingChapter: `${baseURL}/custom/reader-1.html`,
			completedChapter: `${baseURL}/custom/reader-2.html`,
			otherPendingWork: `${baseURL}/alt/series.html`,
			otherPendingChapter: `${baseURL}/alt/reader-1.html`
		});

		await continuePage.reload();
		await expect(continuePage.locator('[data-continue-tab="continue"]')).toHaveAttribute('aria-selected', 'true');
		await expect(continuePage.locator('#continue-reading-list .continue-card')).toHaveCount(1);
		await expect(continuePage.locator('#continue-reading-list')).toContainText('Open Chapter');
		await expect(continuePage.locator('#continue-reading-list')).not.toContainText('Pending Chapter');
		await expect(continuePage.locator('#continue-reading-list')).not.toContainText('Completed Chapter');
		await continuePage.click('[data-continue-tab="history"]');
		await expect(continuePage.locator('[data-continue-tab="history"]')).toHaveAttribute('aria-selected', 'true');
		await expect(continuePage.locator('#continue-reading-list .continue-card')).toHaveCount(3);
		await expect(continuePage.locator('#continue-reading-list')).toContainText('Pending Chapter');
		await expect(continuePage.locator('#continue-reading-list')).toContainText('Completed Chapter');
		await expect(continuePage.locator('#continue-reading-list')).toContainText('Open Chapter');
		await continuePage.close();
	});

	test('supports explicit activation and migration aliases from options', async ({ baseURL }) => {
		const optionsPage = await context.newPage();
		await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);

		await expect(optionsPage.locator('h1')).toContainText('Opciones y mapeos');
		await expect(optionsPage.locator('#mapping-count')).toHaveText('1');
		await expect(optionsPage.locator('.mapping-card')).toContainText('Custom Local');

		await optionsPage.click('.mapping-card-head');
		await optionsPage.fill('[data-input="label"]', 'Custom Local Edited');
		await optionsPage.fill('[data-input="hostAliases"]', 'localhost:4173');
		await optionsPage.fill('[data-input="readingPrefixes"]', '/alt/');
		await optionsPage.uncheck('[data-input="enabled"]');
		await optionsPage.click('[data-action="save"]');
		await expect(optionsPage.locator('.mapping-card h2')).toContainText('Custom Local Edited');
		await expect(optionsPage.locator('[data-input="enabled"]')).not.toBeChecked();

		const inactivePage = await context.newPage();
		await inactivePage.goto(`${baseURL}/custom/reader-1.html`);
		await ensureReaderInActiveTab(optionsPage, inactivePage);
		await waitForExtensionIdle(inactivePage);
		await inactivePage.keyboard.press('ArrowRight');
		await expect(inactivePage).toHaveURL(/reader-1\.html$/);

		const popupPage = await context.newPage();
		await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
		await expect(popupPage.locator('#toggle-site-activation')).toHaveText('Activar sitio');
		await popupPage.click('#toggle-site-activation');
		await popupPage.close();

		await inactivePage.bringToFront();
		await waitForExtensionReady(inactivePage);
		await inactivePage.keyboard.press('ArrowRight');
		await expect(inactivePage).toHaveURL(/reader-2\.html$/);

		const unreadAliasSeriesPage = await context.newPage();
		await unreadAliasSeriesPage.goto('http://localhost:4173/alt/series.html');
		await unreadAliasSeriesPage.bringToFront();

		const unreadAliasPopup = await context.newPage();
		await unreadAliasPopup.goto(`chrome-extension://${extensionId}/popup.html`);
		await expect(unreadAliasPopup.locator('#resume-last-read')).toBeDisabled();
		await unreadAliasPopup.close();
		await unreadAliasSeriesPage.close();

		const migratedPage = await context.newPage();
		await migratedPage.goto('http://localhost:4173/alt/reader-1.html');
		await ensureReaderInActiveTab(optionsPage, migratedPage);
		await waitForExtensionReady(migratedPage);
		await migratedPage.keyboard.press('ArrowRight');
		await expect(migratedPage).toHaveURL(/localhost:4173\/alt\/reader-2\.html$/);
	});

	test('runs mapped button-only reader controls', async ({ baseURL }) => {
		const readerPage = await context.newPage();
		readerPage.on('dialog', dialog => dialog.accept('Button Local'));

		await readerPage.goto(`${baseURL}/button/reader-1.html`);
		await waitForExtensionIdle(readerPage);

		const optionsPage = await context.newPage();
		await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);
		await optionsPage.click('#start-picker');

		const targetTabId = await getTargetTabId(optionsPage);
		await readerPage.bringToFront();
		await expect(readerPage.locator('[data-mapper-save="true"]')).toBeVisible();

		await readerPage.click('#next-button');
		await readerPage.click('#prev-button');
		await readerPage.click('#main-button');
		await readerPage.click('[data-mapper-save="true"]');
		await waitForExtensionReady(readerPage);

		await ensureReaderInTab(optionsPage, targetTabId);
		await readerPage.bringToFront();
		await readerPage.keyboard.press('ArrowRight');
		await expect(readerPage).toHaveURL(/button\/reader-2\.html$/);

		await waitForExtensionReady(readerPage);
		await readerPage.keyboard.press('ArrowLeft');
		await expect(readerPage).toHaveURL(/button\/reader-1\.html$/);

		await waitForExtensionReady(readerPage);
		await readerPage.keyboard.press('m');
		await expect(readerPage).toHaveURL(/button\/series\.html$/);

		await optionsPage.close();
		await readerPage.close();
	});

	test('keeps last read in SPA chapter flows without requiring a reload', async ({ baseURL }) => {
		const spaPage = await context.newPage();
		spaPage.on('dialog', dialog => dialog.accept('SPA Local'));

		await spaPage.goto(`${baseURL}/spa/reader-1.html`);
		await spaPage.keyboard.press('ArrowRight');
		await expect(spaPage).toHaveURL(/spa\/reader-1\.html$/);

		const optionsPage = await context.newPage();
		await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);
		await optionsPage.click('#start-picker');

		await getTargetTabId(optionsPage);
		await spaPage.bringToFront();
		await expect(spaPage.locator('[data-mapper-save="true"]')).toBeVisible();

		await spaPage.click('#next-link');
		await spaPage.click('#prev-link');
		await spaPage.click('#main-link');
		await spaPage.click('[data-mapper-save="true"]');
		await waitForExtensionReady(spaPage);

		await optionsPage.reload();
		const spaMappingCard = optionsPage.locator('.mapping-card').filter({ hasText: 'SPA Local' });
		await expect(spaMappingCard).toHaveCount(1);
		await spaMappingCard.locator('.mapping-card-head').click();
		await spaMappingCard.locator('[data-input="readingPrefix"]').fill('/spa/reader-');
		await spaMappingCard.locator('[data-action="save"]').click();
		await spaPage.reload();
		await waitForExtensionReady(spaPage);

		await spaPage.click('#next-link');
		await expect(spaPage).toHaveURL(/spa\/reader-2\.html$/);
		await waitForExtensionReady(spaPage);
		await spaPage.keyboard.press('ArrowLeft');
		await expect(spaPage).toHaveURL(/spa\/reader-1\.html$/);

		await spaPage.evaluate(() => {
			window.scrollTo({ top: 900, behavior: 'auto' });
		});
		await spaPage.waitForTimeout(600);
		await spaPage.click('#main-link');
		await expect(spaPage).toHaveURL(/spa\/series\.html$/);
		await waitForExtensionIdle(spaPage);

		await spaPage.bringToFront();
		const popupPage = await context.newPage();
		await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
		await expect(popupPage.locator('#resume-last-read')).toBeEnabled();
		await expect(popupPage.locator('.status-card')).toContainText('SPA Reader 1');
		await popupPage.click('#resume-last-read');
		await popupPage.close();

		await expect(spaPage).toHaveURL(/spa\/reader-1\.html$/);
		await waitForExtensionReady(spaPage);

		await optionsPage.close();
	});

	test('infers route-level prefixes for work-scoped reader URLs', async ({ baseURL }) => {
		const readerPage = await context.newPage();
		readerPage.on('dialog', dialog => dialog.accept('Route Work Local'));

		await readerPage.goto(`${baseURL}/series/route-work/chapter-2.html`);

		const optionsPage = await context.newPage();
		await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);
		await optionsPage.click('#start-picker');

		await readerPage.bringToFront();
		await expect(readerPage.locator('[data-mapper-save="true"]')).toBeVisible();

		await readerPage.click('#next-link');
		await readerPage.click('#prev-link');
		await readerPage.click('#main-link');
		await readerPage.click('[data-mapper-save="true"]');
		await waitForExtensionReady(readerPage);

		await optionsPage.reload();
		const mappingCard = optionsPage.locator('.mapping-card').filter({ hasText: 'Route Work Local' });
		await expect(mappingCard).toHaveCount(1);
		await mappingCard.locator('.mapping-card-head').click();
		await expect(mappingCard.locator('[data-input="readingPrefix"]')).toHaveValue('/series/');

		await readerPage.bringToFront();
		await waitForExtensionReady(readerPage);
		await readerPage.evaluate(() => {
			window.scrollTo({ top: 900, behavior: 'auto' });
		});
		await readerPage.waitForTimeout(600);
		await readerPage.keyboard.press('c');
		await expect(readerPage.locator('[data-chapter-results="true"] [data-chapter-href]')).toHaveCount(1);
		await expect(readerPage.locator('[data-chapter-results="true"]')).toContainText('Route Work Chapter 2');
		await expect(readerPage.locator('[data-chapter-results="true"]')).not.toContainText('Chapter 1');
		await expect(readerPage.locator('[data-chapter-results="true"]')).not.toContainText('Chapter 3');
		await readerPage.keyboard.press('Escape');

		await optionsPage.close();
		await readerPage.close();
	});

	test('repairs latest read when a work slug changes', async ({ baseURL }) => {
		const readerPage = await context.newPage();
		readerPage.on('dialog', dialog => dialog.accept('Rename Survival Local'));

		await readerPage.goto(`${baseURL}/manga/rename-old/chapter-2.html`);

		const optionsPage = await context.newPage();
		await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);
		await optionsPage.click('#start-picker');

		await readerPage.bringToFront();
		await expect(readerPage.locator('[data-mapper-save="true"]')).toBeVisible();

		await readerPage.click('#next-link');
		await readerPage.click('#prev-link');
		await readerPage.click('#main-link');
		await readerPage.click('[data-mapper-save="true"]');
		await waitForExtensionReady(readerPage);

		await readerPage.evaluate(() => {
			window.scrollTo({ top: 900, behavior: 'auto' });
		});
		await readerPage.waitForTimeout(600);

		await readerPage.goto(`${baseURL}/manga/rename-new/index.html`);
		await waitForExtensionReady(readerPage);

		const popupPage = await context.newPage();
		await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
		await expect(popupPage.locator('#resume-last-read')).toBeEnabled();
		await expect(popupPage.locator('.status-card')).toContainText('Rename Survival Chapter 2');
		const continuePagePromise = context.waitForEvent('page');
		await popupPage.click('#open-continue-reading');
		const continuePage = await continuePagePromise;
		await continuePage.waitForLoadState();
		await expect(continuePage.locator('[data-continue-reading-href*="/manga/rename-old/chapter-2.html"]')).toBeVisible();
		await continuePage.click('[data-repair-continue-reading-href*="/manga/rename-old/chapter-2.html"]');
		await expect(continuePage.locator('[data-continue-reading-href*="/manga/rename-new/chapter-2.html"]')).toBeVisible();
		const openedRepairedChapterPromise = context.waitForEvent('page');
		await continuePage.click('[data-continue-reading-href*="/manga/rename-new/chapter-2.html"]');
		const openedRepairedChapter = await openedRepairedChapterPromise;
		await openedRepairedChapter.waitForLoadState();
		await continuePage.close();
		await popupPage.close();

		await expect(openedRepairedChapter).toHaveURL(/manga\/rename-new\/chapter-2\.html$/);
		await openedRepairedChapter.close();

		await optionsPage.close();
		await readerPage.close();
	});
});

async function getTargetTabId(extensionPage: Page) {
	const targetTabId = await extensionPage.evaluate(async () => {
		const tab = await (globalThis as any).__readerHotkeysTest.getBestTargetTab();
		return tab?.id || null;
	});

	if (!targetTabId) {
		throw new Error('No encontre la pestana objetivo para la prueba.');
	}

	return targetTabId;
}

async function ensureReaderInTab(extensionPage: Page, tabId: number) {
	await extensionPage.evaluate(async currentTabId => {
		await (globalThis as any).__readerHotkeysTest.ensureReaderScript(currentTabId);
	}, tabId);
}

async function ensureReaderInActiveTab(extensionPage: Page, page: Page) {
	await page.bringToFront();
	const tabId = await getTargetTabId(extensionPage);
	await ensureReaderInTab(extensionPage, tabId);
}

async function waitForExtensionReady(page: Page) {
	await page.waitForFunction(() => {
		return document.documentElement.dataset.readerHotkeysReady === 'true';
	});
}

async function waitForExtensionIdle(page: Page) {
	await page.waitForFunction(() => {
		return document.documentElement.dataset.readerHotkeysReady === 'idle';
	});
}
