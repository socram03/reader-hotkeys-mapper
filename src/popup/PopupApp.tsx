import { useEffect, useState } from 'preact/hooks';
import {
	ensureReaderScript,
	getBestTargetTab,
	sendReaderMessage
} from '../shared';
import type { ReaderStatus } from '../shared';

type TargetTab = chrome.tabs.Tab | null;

export function PopupApp() {
	const [targetTab, setTargetTab] = useState<TargetTab>(null);
	const [status, setStatus] = useState<ReaderStatus | null>(null);
	const [error, setError] = useState('');

	useEffect(() => {
		void initialize();
	}, []);

	async function initialize() {
		try {
			const tab = await getBestTargetTab();
			setTargetTab(tab);
			if (!tab?.id) {
				setError('No encontre una pestana web compatible en esta ventana.');
				return;
			}

			const nextStatus = await ensureReaderScript(tab.id);
			setStatus(nextStatus);
			setError('');
		} catch (nextError) {
			setError(`No pude preparar la extension en la pestana objetivo: ${getErrorMessage(nextError)}`);
		}
	}

	async function runTabAction(type: string, options?: { closeAfter?: boolean }) {
		if (!targetTab?.id) return;

		try {
			const nextStatus = await sendReaderMessage(targetTab.id, { type });
			setStatus(nextStatus);
			setError('');
			if (options?.closeAfter) window.close();
		} catch (nextError) {
			setError(`No pude comunicarme con la pestana objetivo: ${getErrorMessage(nextError)}`);
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
			window.close();
		} catch (nextError) {
			setError(`No pude retomar la lectura: ${getErrorMessage(nextError)}`);
		}
	}

	const hasReader = Boolean(status?.siteDetected);
	const hasCandidateMapping = Boolean(status?.canToggleActivation);
	const isBuiltInSite = Boolean(status?.isBuiltInSite);
	const matchedMappingEnabled = status?.matchedMappingEnabled !== false;
	const zenActive = Boolean(status?.settings?.focusMode);
	const autoNextActive = Boolean(status?.settings?.autoNext);
	const hasLastRead = Boolean(status?.lastReadAvailable && status?.lastReadHref);
	const lastReadLabel = status?.lastReadTitle || 'Sin progreso guardado';

	const activationMessage = hasCandidateMapping && !matchedMappingEnabled
		? 'Sitio personalizado desactivado'
		: hasReader
			? status?.siteLabel || 'Lector detectado'
			: 'Sin mapeo activo';

	return (
		<main class="popup">
			{/* ── Header ── */}
			<header class="hero">
				<div class="brand">
					<div class="brand-icon">
						<svg viewBox="0 0 24 24"><path d="M15 7.5V2H9v5.5l3 3 3-3zM7.5 9H2v6h5.5l3-3-3-3zM9 16.5V22h6v-5.5l-3-3-3 3zM16.5 9l-3 3 3 3H22V9h-5.5z"/></svg>
					</div>
					<div class="brand-text">
						<p class="eyebrow">Reader Hotkeys</p>
						<h1>Control</h1>
					</div>
				</div>
				<button class="btn-options" type="button" onClick={() => chrome.runtime.openOptionsPage()}>
					Config
				</button>
			</header>

			{/* ── Status ── */}
			{error ? (
				<div class="error-msg">{error}</div>
			) : (
				<section class="status-card">
					<div class="status-header">
						<div>
							<div class="status-host">{status?.host || '—'}</div>
							{status?.pathname && <div class="status-path">{status.pathname}</div>}
						</div>
						<span class={`led ${hasReader ? 'on' : 'off'}`}>
							{hasReader ? 'Activo' : 'Inactivo'}
						</span>
					</div>
					<div class="status-meta">
						<div class="meta-row">
							<span class="meta-label">Contexto</span>
							<span class="meta-value">{activationMessage}</span>
						</div>
						<div class="meta-row">
							<span class="meta-label">Mapeos</span>
							<span class={`meta-value ${!status?.hostMappingCount ? 'dim' : ''}`}>
								{status?.hostMappingCount || 0} en host
								{status?.matchedMappingLabel ? ` · ${status.matchedMappingLabel}` : ''}
							</span>
						</div>
						<div class="meta-row">
							<span class="meta-label">Modos</span>
							<span class="meta-value">
								Zen {zenActive ? '●' : '○'} &nbsp; Scroll {autoNextActive ? '●' : '○'}
							</span>
						</div>
						<div class="meta-row">
							<span class="meta-label">Ultimo</span>
							<span class={`meta-value ${hasLastRead ? '' : 'dim'}`}>{lastReadLabel}</span>
						</div>
					</div>
				</section>
			)}

			{/* ── Actions ── */}
			<section class="actions">
				<button
					id="start-mapper"
					class={`key-btn primary full-width`}
					type="button"
					disabled={Boolean(error) || !targetTab?.id}
					onClick={() => runTabAction('reader:start-mapper', { closeAfter: true })}
				>
					{hasCandidateMapping ? '⌥ Ajustar mapeo' : '⌥ Iniciar mapeo'}
				</button>
				<button
					id="toggle-site-activation"
					class={`key-btn ${matchedMappingEnabled && hasCandidateMapping ? 'active' : ''}`}
					type="button"
					disabled={Boolean(error) || !hasCandidateMapping || isBuiltInSite}
					onClick={() => runTabAction('reader:toggle-current-mapping')}
				>
					{matchedMappingEnabled ? 'Desactivar sitio' : 'Activar sitio'}
				</button>
				<button
					id="toggle-focus"
					class={`key-btn ${zenActive ? 'active' : ''}`}
					type="button"
					disabled={!hasReader}
					onClick={() => runTabAction('reader:toggle-focus')}
				>
					{zenActive ? 'Zen ON' : 'Zen'}
					<span class="key-label">z</span>
				</button>
				<button
					id="toggle-auto-next"
					class={`key-btn ${autoNextActive ? 'active' : ''}`}
					type="button"
					disabled={!hasReader}
					onClick={() => runTabAction('reader:toggle-auto-next')}
				>
					{autoNextActive ? 'Scroll ON' : 'Auto-scroll'}
					<span class="key-label">a</span>
				</button>
				<button
					id="resume-last-read"
					class="key-btn"
					type="button"
					disabled={!hasLastRead}
					onClick={() => void runResumeAction()}
				>
					Retomar
					<span class="key-label">l</span>
				</button>
				<button
					id="open-help"
					class="key-btn"
					type="button"
					disabled={!hasReader}
					onClick={() => runTabAction('reader:open-help', { closeAfter: true })}
				>
					Ayuda
					<span class="key-label">?</span>
				</button>
			</section>

			{/* ── Shortcuts ── */}
			<footer class="shortcuts">
				<div class="shortcuts-title">Atajos rapidos</div>
				<div class="shortcut-row">
					<span class="key">m</span>
					<span>Volver a la obra</span>
				</div>
				<div class="shortcut-row">
					<span class="key">l</span>
					<span>Retomar ultimo capitulo</span>
				</div>
				<div class="shortcut-row">
					<span class="key">z</span>
					<span>Alternar modo zen</span>
				</div>
				<div class="shortcut-row">
					<span class="key">j/k</span>
					<span>Siguiente / anterior</span>
				</div>
			</footer>
		</main>
	);
}

function getErrorMessage(error: unknown) {
	return error instanceof Error ? error.message : String(error || 'Error desconocido');
}
