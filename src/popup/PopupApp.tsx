import { useEffect, useState } from 'preact/hooks';
import {
	ensureReaderScript,
	getBestTargetTab,
	getMessage,
	loadLanguage,
	loadLatestReadExport,
	loadPrivacySettings,
	sendReaderMessage
} from '../shared';
import type { Language, LatestReadExportEntry, ReaderStatus } from '../shared';

type TargetTab = chrome.tabs.Tab | null;

export function PopupApp() {
	const [targetTab, setTargetTab] = useState<TargetTab>(null);
	const [status, setStatus] = useState<ReaderStatus | null>(null);
	const [continueReading, setContinueReading] = useState<LatestReadExportEntry[]>([]);
	const [language, setLanguage] = useState<Language>('es');
	const [streamerMode, setStreamerMode] = useState(false);
	const [error, setError] = useState('');
	const [notice, setNotice] = useState('');
	const t = (key: Parameters<typeof getMessage>[1], values?: Parameters<typeof getMessage>[2]) => getMessage(language, key, values);

	useEffect(() => {
		void initialize();
	}, []);

	async function initialize() {
		try {
			const [nextLanguage, nextPrivacySettings] = await Promise.all([loadLanguage(), loadPrivacySettings()]);
			setLanguage(nextLanguage);
			setStreamerMode(nextPrivacySettings.streamerMode);
			const tab = await getBestTargetTab();
			setTargetTab(tab);
			if (!tab?.id) {
				setError(t('popup.noCompatibleTab'));
				return;
			}

			const nextStatus = await ensureReaderScript(tab.id);
			setStatus(nextStatus);
			await refreshContinueReading();
			setError('');
		} catch (nextError) {
			setError(t('popup.prepareError', { error: getErrorMessage(nextError) }));
		}
	}

	async function refreshContinueReading() {
		const latestReads = await loadLatestReadExport();
		setContinueReading(latestReads.entries.slice(0, 1));
	}

	async function runTabAction(type: string, options?: { closeAfter?: boolean }) {
		if (!targetTab?.id) return;

		try {
			const nextStatus = await sendReaderMessage(targetTab.id, { type });
			setStatus(nextStatus);
			setError('');
			setNotice('');
			if (options?.closeAfter) window.close();
		} catch (nextError) {
			setError(t('popup.messageError', { error: getErrorMessage(nextError) }));
		}
	}

	async function runResumeAction() {
		if (!targetTab?.id || !status?.lastReadHref) return;

		try {
			if (status.lastReadIsCurrentChapter) {
				await sendReaderMessage(targetTab.id, { type: 'reader:resume-last-read' });
			} else {
				await chrome.tabs.update(targetTab.id, { url: String(status.lastReadHref) });
			}

			setError('');
			setNotice('');
			window.close();
		} catch (nextError) {
			setError(t('popup.resumeError', { error: getErrorMessage(nextError) }));
		}
	}

	function openContinueReadingPage() {
		chrome.tabs.create({ url: chrome.runtime.getURL('continue.html') });
		window.close();
	}

	const hasReader = Boolean(status?.siteDetected);
	const hasSupportedSite = Boolean(status?.supportedSiteDetected || hasReader);
	const hasCandidateMapping = Boolean(status?.canToggleActivation);
	const hasMappingCandidate = Boolean(status?.mappingCandidateDetected);
	const isBuiltInSite = Boolean(status?.isBuiltInSite);
	const matchedMappingEnabled = status?.matchedMappingEnabled !== false;
	const zenActive = Boolean(status?.settings?.focusMode);
	const autoNextActive = Boolean(status?.settings?.autoNext);
	const autoScrollSpeed = Number(status?.settings?.autoScrollSpeed) || 0;
	const hasLastRead = Boolean(status?.lastReadAvailable && status?.lastReadHref);
	const lastReadLabel = streamerMode && hasLastRead ? t('privacy.hiddenReading') : status?.lastReadTitle || t('popup.noProgress');

	const activationMessage = hasCandidateMapping && !matchedMappingEnabled
		? t('popup.customSiteDisabled')
			: hasReader
				? streamerMode ? t('privacy.hiddenContext') : status?.siteLabel || t('popup.readerDetected')
			: hasMappingCandidate
				? t('popup.probableReader')
			: hasSupportedSite
				? streamerMode ? t('privacy.hiddenContext') : t('popup.supportedOutsideReader', { site: status?.siteLabel || t('popup.statusSupported') })
				: t('popup.noActiveMapping');
	const displayHost = streamerMode ? t('privacy.hiddenSite') : status?.host || '—';
	const displayPath = streamerMode ? t('privacy.hiddenPath') : status?.pathname || '';
	const latestRead = continueReading[0];
	const displayContinueTitle = streamerMode
		? t('privacy.hiddenReading')
		: latestRead?.chapterTitle || latestRead?.workTitle || latestRead?.host || '';
	const displayContinueMeta = streamerMode
		? `${t('privacy.hiddenSite')} · ${Math.round(latestRead?.progressPercent || 0)}%`
		: `${latestRead?.host || ''} · ${Math.round(latestRead?.progressPercent || 0)}%`;

	return (
		<main class="popup">
			{/* ── Header ── */}
			<header class="hero">
				<div class="brand">
					<div class="brand-icon">
						<svg viewBox="0 0 24 24"><path d="M15 7.5V2H9v5.5l3 3 3-3zM7.5 9H2v6h5.5l3-3-3-3zM9 16.5V22h6v-5.5l-3-3-3 3zM16.5 9l-3 3 3 3H22V9h-5.5z"/></svg>
					</div>
					<div class="brand-text">
						<p class="eyebrow">{t('app.name')}</p>
						<h1>{t('popup.control')}</h1>
					</div>
				</div>
				<button class="btn-options" type="button" onClick={() => chrome.runtime.openOptionsPage()}>
					{t('popup.config')}
				</button>
			</header>

			{/* ── Status ── */}
			{error ? (
				<div class="error-msg">{error}</div>
			) : (
				<section class="status-card">
					<div class="status-header">
						<div>
							<div class="status-host">{displayHost}</div>
							{displayPath && <div class="status-path">{displayPath}</div>}
						</div>
						<span class={`led ${hasSupportedSite ? 'on' : 'off'}`}>
							{hasReader ? t('popup.statusActive') : hasSupportedSite ? t('popup.statusSupported') : t('popup.statusInactive')}
						</span>
					</div>
					<div class="status-meta">
						<div class="meta-row">
							<span class="meta-label">{t('popup.context')}</span>
							<span class="meta-value">{activationMessage}</span>
						</div>
						<div class="meta-row">
							<span class="meta-label">{t('popup.mappings')}</span>
							<span class={`meta-value ${!status?.hostMappingCount ? 'dim' : ''}`}>
								{t('popup.mappingsInHost', { count: status?.hostMappingCount || 0 })}
								{!streamerMode && status?.matchedMappingLabel ? ` · ${status.matchedMappingLabel}` : ''}
							</span>
						</div>
						<div class="meta-row">
							<span class="meta-label">{t('popup.modes')}</span>
							<span class="meta-value">
								Zen {zenActive ? '●' : '○'} &nbsp; Scroll {autoNextActive ? '●' : '○'}
								{autoScrollSpeed ? ` · ${autoScrollSpeed} px/s` : ''}
							</span>
						</div>
						<div class="meta-row">
							<span class="meta-label">{t('popup.last')}</span>
							<span class={`meta-value ${hasLastRead ? '' : 'dim'}`}>{lastReadLabel}</span>
						</div>
					</div>
				</section>
			)}
			{notice ? <div class="popup-notice">{notice}</div> : null}

			{/* ── Actions ── */}
			<section class="actions">
				<button
					id="start-mapper"
					class={`key-btn primary full-width`}
					type="button"
					disabled={Boolean(error) || !targetTab?.id}
					onClick={() => runTabAction('reader:start-mapper', { closeAfter: true })}
				>
					{hasCandidateMapping
						? t('popup.adjustMapping')
						: hasMappingCandidate
							? t('popup.mapReader')
							: t('popup.startMapping')}
				</button>
				<button
					id="toggle-site-activation"
					class={`key-btn ${matchedMappingEnabled && hasCandidateMapping ? 'active' : ''}`}
					type="button"
					disabled={Boolean(error) || !hasCandidateMapping || isBuiltInSite}
					onClick={() => runTabAction('reader:toggle-current-mapping')}
				>
					{matchedMappingEnabled ? t('popup.disableSite') : t('popup.enableSite')}
				</button>
				<button
					id="toggle-focus"
					class={`key-btn ${zenActive ? 'active' : ''}`}
					type="button"
					disabled={!hasReader}
					onClick={() => runTabAction('reader:toggle-focus')}
				>
					{zenActive ? t('popup.zenOn') : t('popup.zen')}
					<span class="key-label">z</span>
				</button>
				<button
					id="toggle-auto-next"
					class={`key-btn ${autoNextActive ? 'active' : ''}`}
					type="button"
					disabled={!hasReader}
					onClick={() => runTabAction('reader:toggle-auto-next')}
				>
					{autoNextActive ? t('popup.scrollOn') : t('popup.autoScroll')}
					<span class="key-label">a</span>
				</button>
				<button
					id="resume-last-read"
					class="key-btn"
					type="button"
					disabled={!hasLastRead}
					onClick={() => void runResumeAction()}
				>
					{t('popup.resume')}
					<span class="key-label">l</span>
				</button>
				<button
					id="open-help"
					class="key-btn"
					type="button"
					disabled={!hasReader}
					onClick={() => runTabAction('reader:open-help', { closeAfter: true })}
				>
					{t('popup.help')}
					<span class="key-label">?</span>
				</button>
			</section>

			{latestRead ? (
				<section class="continue-reading">
					<div class="continue-reading-title">{t('popup.continueReading')}</div>
					<div id="continue-reading-list" class="continue-reading-summary">
						<span class="continue-reading-main">{displayContinueTitle}</span>
						<span class="continue-reading-meta">{displayContinueMeta}</span>
					</div>
					<button id="open-continue-reading" class="key-btn full-width" type="button" onClick={openContinueReadingPage}>
						{t('popup.openContinueReading')}
					</button>
				</section>
			) : null}

			{/* ── Shortcuts ── */}
			<footer class="shortcuts">
				<div class="shortcuts-title">{t('popup.quickShortcuts')}</div>
				<div class="shortcut-grid">
					<div class="shortcut-pill">
						<span class="key">m</span>
						<span>{t('popup.work')}</span>
					</div>
					<div class="shortcut-pill">
						<span class="key">l</span>
						<span>{t('popup.resume')}</span>
					</div>
					<div class="shortcut-pill">
						<span class="key">z</span>
						<span>{t('popup.zen')}</span>
					</div>
					<div class="shortcut-pill">
						<span class="key">j/k</span>
						<span>{t('popup.scroll')}</span>
					</div>
				</div>
			</footer>
		</main>
	);
}

function getErrorMessage(error: unknown) {
	return error instanceof Error ? error.message : String(error || 'Unknown error');
}
