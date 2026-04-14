import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import {
	actionSelectorsToText,
	buildMappingId,
	createBlankMapping,
	ensureReaderScript,
	getAllMappingHosts,
	getBestTargetTab,
	inferPathPrefix,
	loadUserMappings,
	multilineTextToList,
	normalizeHost,
	normalizeHostList,
	normalizePrefix,
	normalizePrefixList,
	normalizeUserMappings,
	removeMappingEntry,
	saveUserMappings,
	sendReaderMessage,
	textToSelectors,
	upsertMappingEntry
} from '../shared';
import { MappingCard } from './MappingCard';
import type { MappingEntry, MappingState } from './types';

(globalThis as any).__readerHotkeysTest = {
	getBestTargetTab,
	ensureReaderScript
};

export function OptionsApp() {
	const [mappingState, setMappingState] = useState<MappingState>({ version: 3, entries: [] });
	const [message, setMessageState] = useState<{ text: string; error: boolean }>({ text: '', error: false });
	const importFileRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		void initialize();
	}, []);

	const entries = useMemo(() => {
		return [...mappingState.entries].sort((left, right) => {
			return left.host.localeCompare(right.host) || left.readingPrefix.localeCompare(right.readingPrefix);
		});
	}, [mappingState]);

	async function initialize() {
		try {
			setMappingState(await loadUserMappings());
		} catch (error) {
			setMessage(`No pude cargar opciones: ${getErrorMessage(error)}`, true);
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

	async function saveEntry(mappingId: string) {
		try {
			const entry = mappingState.entries.find(item => item.id === mappingId);
			if (!entry) throw new Error('No encontre el mapeo a guardar.');

			const normalizedEntry = normalizeEntryForSave(entry);
			if (!normalizedEntry.host) throw new Error('Falta el host principal.');
			if (!normalizedEntry.actions.next.selectors.length && !normalizedEntry.actions.next.sampleHref && !normalizedEntry.actions.next.text) {
				throw new Error('La accion siguiente necesita selector, texto o href de fallback.');
			}
			if (!normalizedEntry.actions.main.selectors.length && !normalizedEntry.actions.main.sampleHref && !normalizedEntry.actions.main.text) {
				throw new Error('La accion principal necesita selector, texto o href de fallback.');
			}

			let nextState = mappingState;
			if (normalizedEntry.id !== entry.id) {
				nextState = removeMappingEntry(nextState, entry.id);
			}

			const updatedState = upsertMappingEntry(nextState, normalizedEntry);
			setMappingState(updatedState);
			await saveUserMappings(updatedState);
			setMessage(`Guardado ${normalizedEntry.label}`);
		} catch (error) {
			setMessage(getErrorMessage(error), true);
		}
	}

	async function deleteEntry(mappingId: string) {
		if (!confirm('Borrar este mapeo?')) return;

		const nextState = removeMappingEntry(mappingState, mappingId);
		setMappingState(nextState);
		await saveUserMappings(nextState);
		setMessage('Mapeo borrado.');
	}

	async function duplicateEntry(mappingId: string) {
		try {
			const entry = mappingState.entries.find(item => item.id === mappingId);
			if (!entry) throw new Error('No encontre el mapeo a duplicar.');

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
			setMessage('Mapeo duplicado. Quedo desactivado para que revises los cambios antes de usarlo.');
		} catch (error) {
			setMessage(getErrorMessage(error), true);
		}
	}

	async function addMapping() {
		try {
			const targetTab = await getBestTargetTab().catch(() => null);
			const host = targetTab?.url ? new URL(targetTab.url).host : '';
			if (!host) {
				setMessage('Abre una web normal en otra pestana de esta ventana para prefijar el host, o lanza el picker directamente.', true);
				return;
			}

			const blank = createBlankMapping(host);
			const nextState = upsertMappingEntry(mappingState, blank);
			setMappingState(nextState);
			await saveUserMappings(nextState);
			setMessage(`Se creo un mapeo nuevo para ${host}. Quedo desactivado hasta que lo actives.`);
		} catch (error) {
			setMessage(getErrorMessage(error), true);
		}
	}

	async function startPickerOnTargetTab() {
		try {
			const targetTab = await getBestTargetTab();
			if (!targetTab?.id) {
				setMessage('No encontre una pestana web compatible en esta ventana.', true);
				return;
			}

			await sendReaderMessage(targetTab.id, { type: 'reader:start-mapper' });
			setMessage(`Picker iniciado en ${targetTab.title || targetTab.url}. Vuelve a esa pagina y selecciona los botones.`);
		} catch (error) {
			setMessage(`No pude iniciar el picker: ${getErrorMessage(error)}`, true);
		}
	}

	async function migrateFromTargetTab(mappingId: string) {
		try {
			const targetTab = await getBestTargetTab();
			if (!targetTab?.url) throw new Error('No encontre una pestana web compatible para migrar.');

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

			setMessage(`Anadi ${host} y ${prefix} como alias de migracion. Guarda el mapeo para aplicar el cambio.`);
		} catch (error) {
			setMessage(getErrorMessage(error), true);
		}
	}

	function exportMappings() {
		const blob = new Blob([JSON.stringify(mappingState, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = 'reader-hotkeys-mappings.json';
		anchor.click();
		URL.revokeObjectURL(url);
		setMessage('Exportacion lista.');
	}

	async function handleImportFile(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		try {
			const text = await file.text();
			const imported = normalizeUserMappings(JSON.parse(text));
			setMappingState(imported);
			await saveUserMappings(imported);
			setMessage('Importacion completada.');
		} catch (error) {
			setMessage(`Importacion fallida: ${getErrorMessage(error)}`, true);
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
							<p class="eyebrow">Reader Hotkeys</p>
							<h1>Opciones y mapeos</h1>
						</div>
					</div>
					<p class="hero-desc">
						Gestiona dominios, prefijos de lectura, alias de migracion y selectores CSS.
						Los sitios personalizados quedan inactivos hasta que los actives.
					</p>
				</div>
				<div class="hero-actions">
					<button id="start-picker" class="primary" type="button" onClick={startPickerOnTargetTab}>
						Picker en pestana
					</button>
					<button id="add-mapping" type="button" onClick={addMapping}>
						+ Nuevo mapeo
					</button>
					<button id="export-mappings" class="ghost" type="button" onClick={exportMappings}>
						Exportar
					</button>
					<button id="import-mappings" class="ghost" type="button" onClick={() => importFileRef.current?.click()}>
						Importar
					</button>
					<input
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

			{/* ── Summary ── */}
			<section class="summary">
				<div class="stat-card">
					<div class="stat-label">Total mapeos</div>
					<div class="stat-value" id="mapping-count">{entries.length}</div>
				</div>
				<div class="stat-card">
					<div class="stat-label">Hosts distintos</div>
					<div class="stat-value" id="host-count">{new Set(entries.flatMap(entry => getAllMappingHosts(entry))).size}</div>
				</div>
			</section>

			{/* ── Mapping List ── */}
			<section class="mapping-list">
				{entries.length ? entries.map(entry => (
					<MappingCard
						key={entry.id}
						entry={entry}
						onFieldChange={updateEntryField}
						onSave={mappingId => void saveEntry(mappingId)}
						onDelete={mappingId => void deleteEntry(mappingId)}
						onDuplicate={mappingId => void duplicateEntry(mappingId)}
						onMigrate={mappingId => void migrateFromTargetTab(mappingId)}
					/>
				)) : (
					<div class="empty-state">
						<div class="empty-icon">⌨</div>
						<p>Todavia no hay mapeos guardados. Crea uno nuevo o lanza el picker sobre otra pestana web.</p>
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

function getErrorMessage(error: unknown) {
	return error instanceof Error ? error.message : String(error || 'Error desconocido');
}
