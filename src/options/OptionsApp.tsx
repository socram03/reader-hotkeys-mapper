import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import {
	actionSelectorsToText,
	buildFullBackupFilename,
	buildLatestReadsFilename,
	buildMappingId,
	copySyncableStorageTo,
	createBlankMapping,
	ensureReaderScript,
	extensionStorage,
	formatShortcutKey,
	getAllMappingHosts,
	getBestTargetTab,
	getMessage,
	GLOBAL_SETTINGS_KEY,
	inferPathPrefix,
	importFullBackup,
	isFullBackup,
	loadFullBackup,
	loadLanguage,
	loadLatestReadExport,
	loadPrivacySettings,
	loadStorageMode,
	loadUserMappings,
	multilineTextToList,
	normalizeHost,
	normalizeHostList,
	normalizePrefix,
	normalizePrefixList,
	normalizeReaderModeSettings,
	normalizeShortcutOverrides,
	normalizeShortcutSettings,
	normalizeUserMappings,
	removeMappingEntry,
	saveUserMappings,
	sendReaderMessage,
	SHORTCUT_ACTIONS,
	STORAGE_KEYS,
	textToSelectors,
	upsertMappingEntry
} from '../shared';
import { MappingCard } from './MappingCard';
import { ShortcutCaptureInput } from './ShortcutCaptureInput';
import type { Language, PrivacySettings, ReaderModeSettings, ShortcutAction, ShortcutSettings, StorageMode } from '../shared';
import type { MappingEntry, MappingState } from './types';

type ValidationResult = {
	mappingLabel: string;
	target: string;
	summary: string;
	error: boolean;
	rows: Array<{ action: 'next' | 'prev' | 'main'; label: string; ok: boolean }>;
};

(globalThis as any).__readerHotkeysTest = {
	getBestTargetTab,
	ensureReaderScript
};

export function OptionsApp() {
	const [mappingState, setMappingState] = useState<MappingState>({ version: 3, entries: [] });
	const [shortcutSettings, setShortcutSettings] = useState<ShortcutSettings>(normalizeShortcutSettings(null));
	const [readerModeSettings, setReaderModeSettings] = useState<ReaderModeSettings>(normalizeReaderModeSettings(null));
	const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({ streamerMode: false });
	const [storageMode, setStorageModeState] = useState<StorageMode>('local');
	const [language, setLanguage] = useState<Language>('es');
	const [savedSettingsSnapshot, setSavedSettingsSnapshot] = useState('');
	const [resumeSummary, setResumeSummary] = useState({ totalWorks: 0, totalEntries: 0 });
	const [message, setMessageState] = useState<{ text: string; error: boolean }>({ text: '', error: false });
	const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
	const importFileRef = useRef<HTMLInputElement>(null);
	const t = (key: Parameters<typeof getMessage>[1], values?: Parameters<typeof getMessage>[2]) => getMessage(language, key, values);

	useEffect(() => {
		void initialize();

		const handleFocus = () => {
			void refreshResumeSummary();
		};

		const handleVisibilityChange = () => {
			if (document.visibilityState === 'visible') {
				void refreshResumeSummary();
			}
		};

		window.addEventListener('focus', handleFocus);
		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			window.removeEventListener('focus', handleFocus);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	}, []);

	const entries = useMemo(() => {
		return [...mappingState.entries].sort((left, right) => {
			return left.host.localeCompare(right.host) || left.readingPrefix.localeCompare(right.readingPrefix);
		});
	}, [mappingState]);

	const currentSettingsSnapshot = useMemo(() => {
		return createSettingsSnapshot({
			language,
			shortcuts: shortcutSettings,
			readerMode: readerModeSettings,
			privacy: privacySettings,
			storageMode
		});
	}, [language, shortcutSettings, readerModeSettings, privacySettings, storageMode]);

	const hasUnsavedSettings = Boolean(savedSettingsSnapshot) && currentSettingsSnapshot !== savedSettingsSnapshot;

	async function initialize() {
		try {
			const [nextMappingState, latestReads, nextShortcutSettings, nextReaderModeSettings, nextPrivacySettings, nextStorageMode, nextLanguage] = await Promise.all([
				loadUserMappings(),
				loadLatestReadExport(),
				loadGlobalShortcutSettings(),
				loadReaderModeSettings(),
				loadPrivacySettings(),
				loadStorageMode(),
				loadLanguage()
			]);

			setMappingState(nextMappingState);
			setShortcutSettings(nextShortcutSettings);
			setReaderModeSettings(nextReaderModeSettings);
			setPrivacySettings(nextPrivacySettings);
			setStorageModeState(nextStorageMode);
			setLanguage(nextLanguage);
			setSavedSettingsSnapshot(createSettingsSnapshot({
				language: nextLanguage,
				shortcuts: nextShortcutSettings,
				readerMode: nextReaderModeSettings,
				privacy: nextPrivacySettings,
				storageMode: nextStorageMode
			}));
			setResumeSummary({
				totalWorks: latestReads.totalWorks,
				totalEntries: latestReads.totalEntries
			});
		} catch (error) {
			setMessage(t('options.loadError', { error: getErrorMessage(error) }), true);
		}
	}

	async function refreshResumeSummary() {
		try {
			const latestReads = await loadLatestReadExport();
			setResumeSummary({
				totalWorks: latestReads.totalWorks,
				totalEntries: latestReads.totalEntries
			});
		} catch {
			return;
		}
	}

	function setMessage(text: string, error = false) {
		setMessageState({ text, error });
	}

	function updateEntryField(mappingId: string, field: string, value: string | boolean) {
		setMappingState(current => ({
			...current,
			entries: current.entries.map(entry => entry.id === mappingId ? patchEntry(entry, field, value) : entry)
		}));
	}

	function updateShortcut(action: keyof ShortcutSettings, value: string) {
		setShortcutSettings(current => ({
			...current,
			[action]: value
		}));
	}

	function updateReaderMode(field: keyof ReaderModeSettings, value: string) {
		setReaderModeSettings(current => ({
			...current,
			[field]: field === 'backgroundColor' ? value : Number(value)
		}));
	}

	async function saveSettings() {
		try {
			const normalizedShortcuts = normalizeShortcutSettings(shortcutSettings);
			const normalizedReaderMode = normalizeReaderModeSettings(readerModeSettings);
			const normalizedPrivacy = { streamerMode: Boolean(privacySettings.streamerMode) };
			const normalizedStorageMode: StorageMode = storageMode === 'sync' ? 'sync' : 'local';
			const usedShortcuts = new Map<string, string>();
			for (const action of SHORTCUT_ACTIONS) {
				const key = normalizedShortcuts[action];
				if (usedShortcuts.has(key)) {
					throw new Error(t('options.shortcutDuplicate', {
						key: formatShortcutKey(key),
						first: usedShortcuts.get(key) || '',
						second: getShortcutLabel(language, action)
					}));
				}
				usedShortcuts.set(key, getShortcutLabel(language, action));
			}

			const savedStorageMode = getStorageModeFromSnapshot(savedSettingsSnapshot);
			if (savedStorageMode && normalizedStorageMode !== savedStorageMode) {
				await copySyncableStorageTo(normalizedStorageMode);
			}

			const data = await extensionStorage.get([STORAGE_KEYS.settings]);
			const settings: Record<string, unknown> = isRecord(data[STORAGE_KEYS.settings])
				? Object.assign({}, data[STORAGE_KEYS.settings])
				: {};
			const globalSettings: Record<string, unknown> = isRecord(settings[GLOBAL_SETTINGS_KEY]) ? { ...settings[GLOBAL_SETTINGS_KEY] } : {};
			settings[GLOBAL_SETTINGS_KEY] = {
				...globalSettings,
				language,
				shortcuts: normalizedShortcuts,
				readerMode: normalizedReaderMode,
				streamerMode: normalizedPrivacy.streamerMode
			};

			await extensionStorage.set({ [STORAGE_KEYS.settings]: settings });
			setShortcutSettings(normalizedShortcuts);
			setReaderModeSettings(normalizedReaderMode);
			setPrivacySettings(normalizedPrivacy);
			setStorageModeState(normalizedStorageMode);
			setSavedSettingsSnapshot(createSettingsSnapshot({
				language,
				shortcuts: normalizedShortcuts,
				readerMode: normalizedReaderMode,
				privacy: normalizedPrivacy,
				storageMode: normalizedStorageMode
			}));
			setMessage(t('settings.saved'));
		} catch (error) {
			setMessage(getErrorMessage(error), true);
		}
	}

	async function saveEntry(mappingId: string) {
		try {
			const entry = mappingState.entries.find(item => item.id === mappingId);
			if (!entry) throw new Error(t('options.mappingNotFoundSave'));

			const normalizedEntry = normalizeEntryForSave(entry);
			if (!normalizedEntry.host) throw new Error(t('options.mappingMissingHost'));
			if (!normalizedEntry.actions.next.selectors.length && !normalizedEntry.actions.next.text) {
				throw new Error(t('options.mappingMissingNext'));
			}
			if (!normalizedEntry.actions.main.selectors.length && !normalizedEntry.actions.main.text) {
				throw new Error(t('options.mappingMissingMain'));
			}

			let nextState = mappingState;
			if (normalizedEntry.id !== entry.id) {
				nextState = removeMappingEntry(nextState, entry.id);
			}

			const updatedState = upsertMappingEntry(nextState, normalizedEntry);
			setMappingState(updatedState);
			await saveUserMappings(updatedState);
			setMessage(t('options.mappingSaved', { label: normalizedEntry.label }));
		} catch (error) {
			setMessage(getErrorMessage(error), true);
		}
	}

	async function deleteEntry(mappingId: string) {
		if (!confirm(t('options.mappingDeleteConfirm'))) return;

		const nextState = removeMappingEntry(mappingState, mappingId);
		setMappingState(nextState);
		await saveUserMappings(nextState);
		setMessage(t('options.mappingDeleted'));
	}

	async function duplicateEntry(mappingId: string) {
		try {
			const entry = mappingState.entries.find(item => item.id === mappingId);
			if (!entry) throw new Error(t('options.mappingNotFoundDuplicate'));

			const duplicated = normalizeEntryForSave({
				...entry,
				label: `${entry.label} copia`,
				enabled: false,
				readingPrefix: `${entry.readingPrefix.replace(/\/$/, '')}-copia/`,
				readingPrefixes: []
			});

			const nextState = upsertMappingEntry(mappingState, duplicated);
			setMappingState(nextState);
			await saveUserMappings(nextState);
			setMessage(t('options.mappingDuplicated'));
		} catch (error) {
			setMessage(getErrorMessage(error), true);
		}
	}

	async function addMapping() {
		try {
			const targetTab = await getBestTargetTab().catch(() => null);
			const host = targetTab?.url ? new URL(targetTab.url).host : '';
			if (!host) {
				setMessage(t('options.needTargetTab'), true);
				return;
			}

			const blank = createBlankMapping(host);
			const nextState = upsertMappingEntry(mappingState, blank);
			setMappingState(nextState);
			await saveUserMappings(nextState);
			setMessage(t('options.mappingCreated', { host }));
		} catch (error) {
			setMessage(getErrorMessage(error), true);
		}
	}

	async function startPickerOnTargetTab() {
		try {
			const targetTab = await getBestTargetTab();
			if (!targetTab?.id) {
				setMessage(t('options.noCompatibleTab'), true);
				return;
			}

			await sendReaderMessage(targetTab.id, { type: 'reader:start-mapper' });
			setMessage(t('options.pickerStarted', { target: targetTab.title || targetTab.url || '' }));
		} catch (error) {
			setMessage(t('options.pickerStartError', { error: getErrorMessage(error) }), true);
		}
	}

async function migrateFromTargetTab(mappingId: string) {
		try {
			const targetTab = await getBestTargetTab();
			if (!targetTab?.url) throw new Error(t('options.noTabForMigration'));

			const url = new URL(targetTab.url);
			const host = normalizeHost(url.host);
			const prefix = inferPathPrefix(url.pathname);

			setMappingState(current => ({
				...current,
				entries: current.entries.map(entry => {
					if (entry.id !== mappingId) return entry;

					const aliasHosts = normalizeHostList([...entry.hostAliases, host], normalizeHost(entry.host)) as string[];
					const aliasPrefixes = normalizePrefixList([...entry.readingPrefixes, prefix], normalizePrefix(entry.readingPrefix)) as string[];

					return {
						...entry,
						hostAliases: aliasHosts,
						readingPrefixes: aliasPrefixes
					};
				})
			}));

			setMessage(t('options.migrationAdded', { host, prefix }));
		} catch (error) {
			setMessage(getErrorMessage(error), true);
		}
	}

	async function validateMapping(mappingId: string) {
		try {
			const entry = mappingState.entries.find(item => item.id === mappingId);
			if (!entry) throw new Error(t('options.mappingNotFoundValidate'));

			const targetTab = await getBestTargetTab();
			if (!targetTab?.id) throw new Error(t('options.noTabForValidate'));

			const result = await sendReaderMessage<{
				ok?: boolean;
				results?: Record<'next' | 'prev' | 'main', boolean>;
			}>(targetTab.id, {
				type: 'reader:validate-mapping',
				mapping: normalizeEntryForSave(entry)
			});

			if (!result?.ok || !result.results) {
				throw new Error(t('options.validateFailedTab'));
			}

			const labels = [
				t('options.validateNext', { status: result.results.next ? t('options.validateOk') : t('options.validateFail') }),
				t('options.validatePrev', { status: result.results.prev ? t('options.validateOk') : t('options.validateFail') }),
				t('options.validateMain', { status: result.results.main ? t('options.validateOk') : t('options.validateFail') })
			];
			const rows: ValidationResult['rows'] = [
				{ action: 'next', label: labels[0], ok: result.results.next },
				{ action: 'prev', label: labels[1], ok: result.results.prev },
				{ action: 'main', label: labels[2], ok: result.results.main }
			];
			const summary = labels.join(' · ');

			setValidationResult({
				mappingLabel: privacySettings.streamerMode ? t('privacy.hiddenMapping') : entry.label,
				target: privacySettings.streamerMode ? t('privacy.hiddenSite') : formatTargetTab(targetTab),
				summary,
				error: !result.results.next || !result.results.main,
				rows
			});
			setMessage(t('options.validateCompleted', { summary }), !result.results.next || !result.results.main);
		} catch (error) {
			setMessage(t('options.validateFailed', { error: getErrorMessage(error) }), true);
		}
	}

	function exportMappings() {
		const blob = new Blob([JSON.stringify(mappingState, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = 'chapterpilot-mappings.json';
		anchor.click();
		URL.revokeObjectURL(url);
		setMessage(t('options.exportReady'));
	}

	async function exportBackup() {
		try {
			const backup = await loadFullBackup();
			downloadJsonFile(backup, buildFullBackupFilename());
			setMessage(t('options.backupExported'));
		} catch (error) {
			setMessage(t('options.backupExportFailed', { error: getErrorMessage(error) }), true);
		}
	}

	async function exportLatestReads() {
		try {
			const latestReads = await loadLatestReadExport();
			if (!latestReads.totalWorks) {
				throw new Error(t('options.noReadsToExport'));
			}

			setResumeSummary({
				totalWorks: latestReads.totalWorks,
				totalEntries: latestReads.totalEntries
			});

			downloadJsonFile(latestReads, buildLatestReadsFilename());
			setMessage(t('options.readsExported', { count: latestReads.totalWorks }));
		} catch (error) {
			setMessage(getErrorMessage(error), true);
		}
	}

	async function handleImportFile(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		try {
			const text = await file.text();
			const parsed = JSON.parse(text);
			if (isFullBackup(parsed)) {
				const backup = await importFullBackup(parsed);
				setMappingState(backup.userMappings);
				await refreshResumeSummary();
				setMessage(t('options.backupImported'));
				return;
			}

			const imported = normalizeUserMappings(parsed);
			setMappingState(imported);
			await saveUserMappings(imported);
			setMessage(t('options.importCompleted'));
		} catch (error) {
			setMessage(t('options.importFailed', { error: getErrorMessage(error) }), true);
		} finally {
			input.value = '';
		}
	}

	return (
		<main class="layout">
			{/* ── Hero ── */}
			<header class="hero">
				<div>
					<div class="hero-brand">
						<div class="hero-icon">
							<svg viewBox="0 0 24 24"><path d="M15 7.5V2H9v5.5l3 3 3-3zM7.5 9H2v6h5.5l3-3-3-3zM9 16.5V22h6v-5.5l-3-3-3 3zM16.5 9l-3 3 3 3H22V9h-5.5z"/></svg>
						</div>
							<div class="hero-titles">
								<p class="eyebrow">{t('app.name')}</p>
								<h1>{getMessage(language, 'options.title')}</h1>
							</div>
						</div>
						<p class="hero-desc">{getMessage(language, 'options.description')}</p>
					</div>
				<div class="hero-actions">
					<button id="start-picker" class="primary" type="button" onClick={startPickerOnTargetTab}>
						{t('options.pickerTab')}
					</button>
					<button id="add-mapping" type="button" onClick={addMapping}>
						{t('options.newMapping')}
					</button>
					<button id="export-mappings" class="ghost" type="button" onClick={exportMappings}>
						{t('options.exportMappings')}
					</button>
					<button id="export-latest-reads" class="ghost" type="button" onClick={() => void exportLatestReads()}>
						{t('options.exportReads')}
					</button>
					<button id="export-backup" class="ghost" type="button" onClick={() => void exportBackup()}>
						{t('options.exportBackup')}
					</button>
					<button id="import-mappings" class="ghost" type="button" onClick={() => importFileRef.current?.click()}>
						{t('options.importMappings')}
					</button>
					<input
						id="import-json-file"
						ref={importFileRef}
						type="file"
						accept="application/json"
						hidden
						onChange={handleImportFile}
					/>
				</div>
			</header>

			{/* ── Message ── */}
			{message.text && (
				<section class={`notice ${message.error ? 'error' : 'ok'}`}>
					{message.text}
				</section>
			)}

			{hasUnsavedSettings ? (
				<div class="settings-save-bar">
					<span>{t('settings.unsaved')}</span>
					<button id="save-settings" type="button" class="primary" onClick={() => void saveSettings()}>
						{t('settings.saveAll')}
					</button>
				</div>
			) : null}

			{validationResult ? (
				<div class="modal-backdrop" data-validation-modal="true" onClick={() => setValidationResult(null)}>
					<section class="validation-modal" role="dialog" aria-modal="true" aria-labelledby="validation-modal-title" onClick={event => event.stopPropagation()}>
						<div class="validation-modal-head">
							<div>
								<p class="eyebrow">{t('options.validateModalTitle')}</p>
								<h2 id="validation-modal-title">{validationResult.mappingLabel}</h2>
							</div>
							<button type="button" class="ghost" data-validation-close="true" onClick={() => setValidationResult(null)}>
								{t('options.validateModalClose')}
							</button>
						</div>
						<div class="validation-modal-meta">
							<div>
								<span>{t('options.validateModalTarget')}</span>
								<strong>{validationResult.target}</strong>
							</div>
							<div>
								<span>{t('options.validateModalSummary')}</span>
								<strong class={validationResult.error ? 'fail' : 'ok'}>{validationResult.summary}</strong>
							</div>
						</div>
						<div class="validation-result-list">
							{validationResult.rows.map(row => (
								<div key={row.action} class={`validation-result-row ${row.ok ? 'ok' : 'fail'}`}>
									<span>{row.label}</span>
									<strong>{row.ok ? t('options.validateOk') : t('options.validateFail')}</strong>
								</div>
							))}
						</div>
					</section>
				</div>
			) : null}

			<section class="shortcut-settings">
				<div class="shortcut-settings-head">
					<div>
						<h2>{getMessage(language, 'language.title')}</h2>
					</div>
				</div>
				<label class="shortcut-field">
					<span class="field-label">{getMessage(language, 'language.label')}</span>
					<select
						id="language-select"
						value={language}
						onChange={event => setLanguage(event.currentTarget.value === 'en' ? 'en' : 'es')}
					>
						<option value="es">Español</option>
						<option value="en">English</option>
					</select>
				</label>
			</section>

			<section class="shortcut-settings">
				<div class="shortcut-settings-head">
					<div>
						<h2>{t('shortcuts.title')}</h2>
					</div>
				</div>
				<div class="shortcut-settings-grid">
					{SHORTCUT_ACTIONS.map(action => (
						<label class="shortcut-field" key={action} htmlFor={`shortcut-${action}`}>
							<span class="field-label">{getShortcutLabel(language, action)}</span>
							<ShortcutCaptureInput
								id={`shortcut-${action}`}
								dataAttribute="data-shortcut-action"
								action={action}
								value={shortcutSettings[action]}
								onChange={value => updateShortcut(action, value)}
							/>
						</label>
					))}
				</div>
			</section>

			<section class="shortcut-settings">
				<div class="shortcut-settings-head">
					<div>
						<h2>{t('readingMode.title')}</h2>
					</div>
				</div>
				<div class="shortcut-settings-grid">
					<label class="shortcut-field">
						<span class="field-label">{t('readingMode.background')}</span>
						<input
							type="text"
							data-reading-setting="backgroundColor"
							value={readerModeSettings.backgroundColor}
							onInput={event => updateReaderMode('backgroundColor', event.currentTarget.value)}
						/>
					</label>
					<label class="shortcut-field">
						<span class="field-label">{t('readingMode.maxWidth')}</span>
						<input
							type="text"
							data-reading-setting="maxWidth"
							value={String(readerModeSettings.maxWidth)}
							onInput={event => updateReaderMode('maxWidth', event.currentTarget.value)}
						/>
					</label>
					<label class="shortcut-field">
						<span class="field-label">{t('readingMode.gap')}</span>
						<input
							type="text"
							data-reading-setting="imageGap"
							value={String(readerModeSettings.imageGap)}
							onInput={event => updateReaderMode('imageGap', event.currentTarget.value)}
						/>
					</label>
					<label class="shortcut-field">
						<span class="field-label">{t('readingMode.brightness')}</span>
						<input
							type="text"
							data-reading-setting="brightness"
							value={String(readerModeSettings.brightness)}
							onInput={event => updateReaderMode('brightness', event.currentTarget.value)}
						/>
					</label>
				</div>
			</section>

			<section class="shortcut-settings">
				<div class="shortcut-settings-head">
					<div>
						<h2>{t('privacy.title')}</h2>
					</div>
				</div>
				<label class="toggle-row">
					<span class="field-label">{t('privacy.streamerMode')}</span>
					<div class="toggle-switch">
						<input
							id="streamer-mode-enabled"
							type="checkbox"
							checked={privacySettings.streamerMode}
							onChange={event => setPrivacySettings({ streamerMode: event.currentTarget.checked })}
						/>
					</div>
				</label>
			</section>

			<section class="shortcut-settings">
				<div class="shortcut-settings-head">
					<div>
						<h2>{t('sync.title')}</h2>
					</div>
				</div>
				<label class="toggle-row">
					<span class="field-label">{t('sync.label')}</span>
					<div class="toggle-switch">
						<input
							id="sync-storage-enabled"
							type="checkbox"
							checked={storageMode === 'sync'}
							onChange={event => setStorageModeState(event.currentTarget.checked ? 'sync' : 'local')}
						/>
					</div>
				</label>
			</section>

			{/* ── Summary ── */}
			<section class="summary">
				<div class="stat-card">
					<div class="stat-label">{t('options.totalMappings')}</div>
					<div class="stat-value" id="mapping-count">{entries.length}</div>
				</div>
				<div class="stat-card">
					<div class="stat-label">{t('options.distinctHosts')}</div>
					<div class="stat-value" id="host-count">{new Set(entries.flatMap(entry => getAllMappingHosts(entry))).size}</div>
				</div>
				<div class="stat-card">
					<div class="stat-label">{t('options.worksWithProgress')}</div>
					<div class="stat-value" id="resume-work-count">{resumeSummary.totalWorks}</div>
				</div>
				<div class="stat-card">
					<div class="stat-label">{t('options.savedChapters')}</div>
					<div class="stat-value" id="resume-entry-count">{resumeSummary.totalEntries}</div>
				</div>
			</section>

			{/* ── Mapping List ── */}
			<section class="mapping-list">
				{entries.length ? entries.map(entry => (
					<MappingCard
						key={entry.id}
						entry={entry}
						language={language}
						streamerMode={privacySettings.streamerMode}
						onFieldChange={updateEntryField}
						onSave={mappingId => void saveEntry(mappingId)}
						onDelete={mappingId => void deleteEntry(mappingId)}
						onDuplicate={mappingId => void duplicateEntry(mappingId)}
						onMigrate={mappingId => void migrateFromTargetTab(mappingId)}
						onValidate={mappingId => void validateMapping(mappingId)}
					/>
				)) : (
					<div class="empty-state">
						<div class="empty-icon">⌨</div>
						<p>{t('options.emptyMappings')}</p>
					</div>
				)}
			</section>
		</main>
	);
}

function patchEntry(entry: MappingEntry, field: string, value: string | boolean): MappingEntry {
	if (field === 'label') return { ...entry, label: String(value) };
	if (field === 'host') return { ...entry, host: String(value) };
	if (field === 'readingPrefix') return { ...entry, readingPrefix: String(value) };
	if (field === 'enabled') return { ...entry, enabled: Boolean(value) };
	if (field === 'hostAliases') return { ...entry, hostAliases: multilineTextToList(String(value)) };
	if (field === 'readingPrefixes') return { ...entry, readingPrefixes: multilineTextToList(String(value)) };
	if (field.startsWith('shortcuts.')) {
		const action = field.replace('shortcuts.', '');
		return {
			...entry,
			shortcuts: {
				...(entry.shortcuts || {}),
				[action]: String(value)
			}
		};
	}

	const [section, key] = field.split('.');
	if (!section || !key || !['next', 'prev', 'main'].includes(section)) return entry;

	const action = entry.actions[section as 'next' | 'prev' | 'main'];
	const nextAction = key === 'selectors'
		? { ...action, selectors: textToSelectors(String(value)) }
		: { ...action, [key]: String(value) };

	return {
		...entry,
		actions: {
			...entry.actions,
			[section]: nextAction
		}
	};
}

function normalizeEntryForSave(entry: MappingEntry): MappingEntry {
	const host = normalizeHost(entry.host);
	const readingPrefix = normalizePrefix(entry.readingPrefix || '/');

	return {
		...entry,
		id: buildMappingId(host, readingPrefix),
		host,
		label: entry.label.trim() || host,
		hostAliases: normalizeHostList(entry.hostAliases, host) as string[],
		readingPrefix,
		readingPrefixes: normalizePrefixList(entry.readingPrefixes, readingPrefix) as string[],
		shortcuts: normalizeShortcutOverrides(entry.shortcuts),
		actions: {
			next: {
				...entry.actions.next,
				selectors: textToSelectors(actionSelectorsToText(entry.actions.next)),
				text: entry.actions.next.text.trim(),
				sampleHref: entry.actions.next.sampleHref.trim()
			},
			prev: {
				...entry.actions.prev,
				selectors: textToSelectors(actionSelectorsToText(entry.actions.prev)),
				text: entry.actions.prev.text.trim(),
				sampleHref: entry.actions.prev.sampleHref.trim()
			},
			main: {
				...entry.actions.main,
				selectors: textToSelectors(actionSelectorsToText(entry.actions.main)),
				text: entry.actions.main.text.trim(),
				sampleHref: entry.actions.main.sampleHref.trim()
			}
		}
	};
}

function formatTargetTab(tab: chrome.tabs.Tab): string {
	const rawUrl = tab.url || '';
	if (!rawUrl) return tab.title || '';

	try {
		const url = new URL(rawUrl);
		return `${url.host}${url.pathname}`;
	} catch {
		return rawUrl;
	}
}

function getErrorMessage(error: unknown) {
	return error instanceof Error ? error.message : String(error || 'Unknown error');
}

function getShortcutLabel(language: Language, action: ShortcutAction) {
	const key = `shortcuts.${action}` as Parameters<typeof getMessage>[1];
	return getMessage(language, key);
}

function createSettingsSnapshot(settings: {
	language: Language;
	shortcuts: ShortcutSettings;
	readerMode: ReaderModeSettings;
	privacy: PrivacySettings;
	storageMode: StorageMode;
}): string {
	return JSON.stringify({
		language: settings.language,
		shortcuts: normalizeShortcutSettings(settings.shortcuts),
		readerMode: normalizeReaderModeSettings(settings.readerMode),
		privacy: {
			streamerMode: Boolean(settings.privacy.streamerMode)
		},
		storageMode: settings.storageMode === 'sync' ? 'sync' : 'local'
	});
}

function getStorageModeFromSnapshot(snapshot: string): StorageMode | null {
	try {
		const parsed = JSON.parse(snapshot) as { storageMode?: unknown };
		return parsed.storageMode === 'sync' || parsed.storageMode === 'local' ? parsed.storageMode : null;
	} catch {
		return null;
	}
}

async function loadGlobalShortcutSettings(): Promise<ShortcutSettings> {
	const data = await extensionStorage.get([STORAGE_KEYS.settings]);
	const settings = isRecord(data[STORAGE_KEYS.settings]) ? data[STORAGE_KEYS.settings] : {};
	const globalSettings = isRecord(settings[GLOBAL_SETTINGS_KEY]) ? settings[GLOBAL_SETTINGS_KEY] : {};
	return normalizeShortcutSettings(globalSettings.shortcuts);
}

async function loadReaderModeSettings(): Promise<ReaderModeSettings> {
	const data = await extensionStorage.get([STORAGE_KEYS.settings]);
	const settings = isRecord(data[STORAGE_KEYS.settings]) ? data[STORAGE_KEYS.settings] : {};
	const globalSettings = isRecord(settings[GLOBAL_SETTINGS_KEY]) ? settings[GLOBAL_SETTINGS_KEY] : {};
	return normalizeReaderModeSettings(globalSettings.readerMode);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function downloadJsonFile(data: unknown, filename: string) {
	const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = filename;
	anchor.click();
	URL.revokeObjectURL(url);
}
