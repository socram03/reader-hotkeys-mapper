import { useEffect, useMemo, useState } from 'preact/hooks';
import {
	ensureReaderScript,
	clearLatestReads,
	getBestTargetTab,
	getMessage,
	isContinueReadingEntry,
	loadHistorySettings,
	loadLanguage,
	loadLatestReadExport,
	loadPrivacySettings,
	loadReadingHistoryExport,
	removeLatestReadWork,
	sendReaderMessage
} from '../shared';
import type { HistorySettings, Language, LatestReadExportEntry, ReaderStatus } from '../shared';

type TargetTab = chrome.tabs.Tab | null;
type ContinueTab = 'continue' | 'history';

export function ContinueReadingApp() {
	const [targetTab, setTargetTab] = useState<TargetTab>(null);
	const [status, setStatus] = useState<ReaderStatus | null>(null);
	const [continueEntries, setContinueEntries] = useState<LatestReadExportEntry[]>([]);
	const [historyEntries, setHistoryEntries] = useState<LatestReadExportEntry[]>([]);
	const [historySettings, setHistorySettings] = useState<HistorySettings | null>(null);
	const [language, setLanguage] = useState<Language>('es');
	const [streamerMode, setStreamerMode] = useState(false);
	const [activeTab, setActiveTab] = useState<ContinueTab>('continue');
	const [query, setQuery] = useState('');
	const [error, setError] = useState('');
	const [notice, setNotice] = useState('');
	const t = (key: Parameters<typeof getMessage>[1], values?: Parameters<typeof getMessage>[2]) => getMessage(language, key, values);

	useEffect(() => {
		void initialize();
	}, []);

	const activeEntries = activeTab === 'history' ? historyEntries : continueEntries;
	const filteredEntries = useMemo(() => {
		const normalizedQuery = query.trim().toLowerCase();
		if (!normalizedQuery) return activeEntries;

		return activeEntries.filter(entry => {
			const searchableText = [
				entry.workTitle,
				entry.chapterTitle,
				entry.host,
				entry.chapterHref,
				entry.workHref
			].join(' ').toLowerCase();

			return searchableText.includes(normalizedQuery);
		});
	}, [activeEntries, query]);

	async function initialize() {
		try {
			const [nextLanguage, nextPrivacySettings] = await Promise.all([loadLanguage(), loadPrivacySettings()]);
			setLanguage(nextLanguage);
			setStreamerMode(nextPrivacySettings.streamerMode);
			await refreshEntries();

			const tab = await getBestTargetTab();
			setTargetTab(tab);
			if (tab?.id) {
				const nextStatus = await ensureReaderScript(tab.id);
				setStatus(nextStatus);
			}
			setError('');
		} catch (nextError) {
			setError(t('continue.loadError', { error: getErrorMessage(nextError) }));
		}
	}

	async function refreshEntries() {
		const [latestReads, readingHistory, nextHistorySettings] = await Promise.all([
			loadLatestReadExport(),
			loadReadingHistoryExport(),
			loadHistorySettings()
		]);
		setHistorySettings(nextHistorySettings);
		setContinueEntries(latestReads.entries.filter(entry => isContinueReadingEntry(entry, nextHistorySettings)));
		setHistoryEntries(readingHistory.entries);
	}

	async function removeEntry(entry: LatestReadExportEntry) {
		if (!confirm(t('continue.removeConfirm', { title: streamerMode ? t('privacy.hiddenReading') : getEntryTitle(entry) }))) return;

		try {
			const latestReads = await removeLatestReadWork(entry.workId);
			const [readingHistory, nextHistorySettings] = await Promise.all([loadReadingHistoryExport(), loadHistorySettings()]);
			setHistorySettings(nextHistorySettings);
			setContinueEntries(latestReads.entries.filter(item => isContinueReadingEntry(item, nextHistorySettings)));
			setHistoryEntries(readingHistory.entries);
			setNotice(t('continue.removed'));
			setError('');
		} catch (nextError) {
			setNotice('');
			setError(t('continue.removeError', { error: getErrorMessage(nextError) }));
		}
	}

	async function wipeEntries() {
		if (!historyEntries.length) return;
		if (!confirm(t('continue.wipeConfirm'))) return;

		try {
			const latestReads = await clearLatestReads();
			setContinueEntries(latestReads.entries);
			setHistoryEntries([]);
			setNotice(t('continue.wiped'));
			setError('');
		} catch (nextError) {
			setNotice('');
			setError(t('continue.wipeError', { error: getErrorMessage(nextError) }));
		}
	}

	async function openEntry(entry: LatestReadExportEntry) {
		if (!entry.chapterHref) return;

		try {
			await chrome.tabs.create({ url: entry.chapterHref });

			setNotice(t('continue.opened', { title: streamerMode ? t('privacy.hiddenReading') : getEntryTitle(entry) }));
			setError('');
		} catch (nextError) {
			setNotice('');
			setError(t('popup.resumeError', { error: getErrorMessage(nextError) }));
		}
	}

	async function repairEntry(entry: LatestReadExportEntry) {
		if (!targetTab?.id) return;

		try {
			const result = await sendReaderMessage<{ ok: boolean; status?: ReaderStatus }>(targetTab.id, {
				type: 'reader:repair-latest-read',
				entry
			});

			if (!result?.ok) {
				throw new Error(t('popup.repairNoMatch'));
			}

			if (result.status) setStatus(result.status);
			await refreshEntries();
			setNotice(t('popup.repairSaved'));
			setError('');
		} catch (nextError) {
			setNotice('');
			setError(t('popup.repairError', { error: getErrorMessage(nextError) }));
		}
	}

	return (
		<main class="continue-page">
			<header class="continue-hero">
				<div class="brand">
					<div class="brand-icon">
						<svg viewBox="0 0 24 24"><path d="M15 7.5V2H9v5.5l3 3 3-3zM7.5 9H2v6h5.5l3-3-3-3zM9 16.5V22h6v-5.5l-3-3-3 3zM16.5 9l-3 3 3 3H22V9h-5.5z"/></svg>
					</div>
					<div>
						<p class="eyebrow">{t('app.name')}</p>
						<h1>{t('continue.title')}</h1>
					</div>
				</div>
				<div class="continue-stats">
					<span>{t('continue.totalWorks', { count: activeEntries.length })}</span>
					{historySettings ? <span>{t('continue.threshold', { percent: historySettings.completedThresholdPercent })}</span> : null}
					<span>{targetTab?.url ? t('continue.targetReady') : t('continue.targetMissing')}</span>
				</div>
			</header>

			<section class="continue-toolbar">
				<label class="search-field">
					<span>{t('continue.search')}</span>
					<input
						id="continue-search"
						type="search"
						value={query}
						placeholder={t('continue.searchPlaceholder')}
						onInput={event => setQuery(event.currentTarget.value)}
					/>
				</label>
				<button id="refresh-continue-reading" type="button" class="ghost" onClick={() => void refreshEntries()}>
					{t('continue.refresh')}
				</button>
				<button
					id="wipe-continue-reading"
					type="button"
					class="danger"
					disabled={!historyEntries.length}
					onClick={() => void wipeEntries()}
				>
					{t('continue.wipe')}
				</button>
			</section>

			<div class="continue-tabs" aria-label={t('continue.tabsLabel')} role="tablist">
				<button
					type="button"
					role="tab"
					class={activeTab === 'continue' ? 'active' : ''}
					data-continue-tab="continue"
					aria-selected={activeTab === 'continue' ? 'true' : 'false'}
					onClick={() => setActiveTab('continue')}
				>
					{t('continue.tabContinue')}
				</button>
				<button
					type="button"
					role="tab"
					class={activeTab === 'history' ? 'active' : ''}
					data-continue-tab="history"
					aria-selected={activeTab === 'history' ? 'true' : 'false'}
					onClick={() => setActiveTab('history')}
				>
					{t('continue.tabHistory')}
				</button>
			</div>

			{error ? (
				<div class="modal-backdrop" data-feedback-modal="true" onClick={() => setError('')}>
					<section class="feedback-modal" role="alertdialog" aria-modal="true" aria-labelledby="feedback-modal-title" onClick={event => event.stopPropagation()}>
						<div class="feedback-modal-head">
							<div>
								<p class="eyebrow">{t('common.errorUnknown')}</p>
								<h2 id="feedback-modal-title">{t('continue.feedbackTitle')}</h2>
							</div>
							<button type="button" class="ghost" data-feedback-close="true" onClick={() => setError('')}>
								{t('options.validateModalClose')}
							</button>
						</div>
						<p>{error}</p>
					</section>
				</div>
			) : null}
			{notice ? <div class="message ok">{notice}</div> : null}

			<section id="continue-reading-list" class="continue-list">
				{filteredEntries.length ? filteredEntries.map(entry => (
					<article key={`${entry.workId}:${entry.storageKey}`} class="continue-card">
						<div class="continue-card-main">
							<div>
								<h2>{streamerMode ? t('privacy.hiddenReading') : getEntryTitle(entry)}</h2>
								<p>{streamerMode ? t('privacy.hiddenSite') : entry.host} · {formatDate(entry.updatedAt)}</p>
							</div>
							<span class="progress-value">{Math.round(entry.progressPercent)}%</span>
						</div>
						<div class="progress-track" aria-hidden="true">
							<div class="progress-fill" style={{ width: `${Math.max(2, Math.min(100, entry.progressPercent))}%` }} />
						</div>
						<div class="continue-card-meta">
							<span>{entry.trackedEntries} {t('continue.savedEntries')}</span>
							<span>{streamerMode ? t('privacy.hiddenUrl') : entry.chapterHref}</span>
						</div>
						<div class="continue-card-actions">
							<button
								type="button"
								class="primary"
								data-continue-reading-href={entry.chapterHref}
								onClick={() => void openEntry(entry)}
							>
								{t('continue.open')}
							</button>
							<button
								type="button"
								class="ghost"
								data-repair-continue-reading-href={entry.chapterHref}
								disabled={!targetTab?.id || !status?.siteDetected}
								onClick={() => void repairEntry(entry)}
							>
								{t('popup.repairHere')}
							</button>
							<button
								type="button"
								class="danger"
								data-remove-continue-reading-work={entry.workId}
								onClick={() => void removeEntry(entry)}
							>
								{t('continue.remove')}
							</button>
						</div>
					</article>
				)) : (
					<div class="empty-state">
						<h2>{activeEntries.length ? t('continue.noMatches') : activeTab === 'history' ? t('continue.historyEmpty') : t('continue.empty')}</h2>
						<p>{activeEntries.length ? t('continue.noMatchesHint') : activeTab === 'history' ? t('continue.historyEmptyHint') : t('continue.emptyHint')}</p>
					</div>
				)}
			</section>
		</main>
	);
}

function getEntryTitle(entry: LatestReadExportEntry) {
	return entry.chapterTitle || entry.workTitle || entry.host;
}

function formatDate(timestamp: number) {
	return new Date(timestamp).toLocaleString();
}

function getErrorMessage(error: unknown) {
	return error instanceof Error ? error.message : String(error || 'Unknown error');
}
