import { extensionStorage } from './extensionStorage';
import { normalizeShortcutOverrides } from './shortcuts';
import { STORAGE_KEYS } from './storageKeys';
import { listToMultilineText, multilineTextToList, toLineArray, uniqueStrings } from './textLists';
import type { MappingAction, MappingEntry, MappingState } from './types';

type VersionedMappingState = {
	version: number;
	entries: unknown[];
};

type RawMappingEntry = Record<string, unknown>;

export async function loadUserMappings(): Promise<MappingState> {
	const data = await extensionStorage.get([STORAGE_KEYS.userMappings]);
	return normalizeUserMappings(data[STORAGE_KEYS.userMappings]);
}

export async function saveUserMappings(state: MappingState): Promise<void> {
	await extensionStorage.set({
		[STORAGE_KEYS.userMappings]: normalizeUserMappings(state)
	});
}

export function normalizeUserMappings(rawMappings: unknown): MappingState {
	if (isVersionedMappingState(rawMappings) && (rawMappings.version === 2 || rawMappings.version === 3)) {
		return {
			version: 3,
			entries: rawMappings.entries
				.map(entry => normalizeUserMappingEntry(entry))
				.filter((entry): entry is MappingEntry => Boolean(entry))
		};
	}

	const entries: MappingEntry[] = [];
	if (isRecord(rawMappings)) {
		Object.entries(rawMappings).forEach(([host, value]) => {
			const mappings = Array.isArray(value) ? value : [value];
			mappings.forEach((mapping, index) => {
				const mappingRecord = isRecord(mapping) ? mapping : {};
				const normalized = normalizeUserMappingEntry({
					...mappingRecord,
					host: mappingRecord.host || host,
					id: mappingRecord.id || `${host}::legacy-${index + 1}`
				});

				if (normalized) entries.push(normalized);
			});
		});
	}

	return {
		version: 3,
		entries
	};
}

export function normalizeUserMappingEntry(entry: unknown): MappingEntry | null {
	if (!isRecord(entry) || !entry.host || !entry.readingPrefix) {
		return null;
	}

	const actions = normalizeMappingActions(entry.actions);
	if (!actions.next || !actions.main) {
		return null;
	}

	const host = normalizeHost(entry.host);
	const readingPrefix = normalizePrefix(entry.readingPrefix);
	const createdAt = toTimestamp(entry.createdAt);
	const updatedAt = toTimestamp(entry.updatedAt) || createdAt;

	return {
		id: stringOrFallback(entry.id, buildMappingId(host, readingPrefix)),
		host,
		label: stringOrFallback(entry.label, host),
		enabled: entry.enabled !== false,
		hostAliases: normalizeHostList(entry.hostAliases ?? entry.hosts, host),
		readingPrefix,
		readingPrefixes: normalizePrefixList(entry.readingPrefixes ?? entry.paths, readingPrefix),
		shortcuts: normalizeShortcutOverrides(entry.shortcuts),
		actions: {
			next: actions.next,
			prev: actions.prev ?? createEmptyMappingAction(),
			main: actions.main
		},
		createdAt,
		updatedAt
	};
}

export function buildMappingId(host: string, readingPrefix: string): string {
	return `${normalizeHost(host)}::${normalizePrefix(readingPrefix)}`;
}

export function normalizeHost(host: unknown): string {
	return String(host ?? '').trim().toLowerCase();
}

export function normalizePrefix(prefix: unknown): string {
	const value = String(prefix ?? '/').trim();
	if (!value.startsWith('/')) return `/${value}`;
	return value;
}

export function normalizeHostList(values: unknown, primaryHost: string): string[] {
	return uniqueStrings(toLineArray(values).map(normalizeHost))
		.filter(Boolean)
		.filter(host => host !== primaryHost);
}

export function normalizePrefixList(values: unknown, primaryPrefix: string): string[] {
	return uniqueStrings(toLineArray(values).map(normalizePrefix))
		.filter(Boolean)
		.filter(prefix => prefix !== primaryPrefix);
}

export function createBlankMapping(host: string): MappingEntry {
	const safeHost = normalizeHost(host);

	return {
		id: buildMappingId(safeHost || 'example.com', '/leer/'),
		host: safeHost,
		label: safeHost || 'New mapping',
		enabled: false,
		hostAliases: [],
		readingPrefix: '/leer/',
		readingPrefixes: [],
		shortcuts: {},
		actions: {
			next: createEmptyMappingAction(),
			prev: createEmptyMappingAction(),
			main: createEmptyMappingAction()
		},
		createdAt: Date.now(),
		updatedAt: Date.now()
	};
}

export function upsertMappingEntry(state: MappingState, entry: MappingEntry): MappingState {
	const normalizedState = normalizeUserMappings(state);
	const normalizedEntry = normalizeUserMappingEntry({
		...entry,
		id: buildMappingId(entry.host, entry.readingPrefix),
		updatedAt: Date.now()
	});

	if (!normalizedEntry) {
		throw new Error('The mapping needs host, readingPrefix, next action, and main action.');
	}

	const entries = normalizedState.entries.filter(item => item.id !== normalizedEntry.id);
	entries.push(normalizedEntry);
	entries.sort((left, right) => {
		return left.host.localeCompare(right.host) || left.readingPrefix.localeCompare(right.readingPrefix);
	});

	return {
		version: 3,
		entries
	};
}

export function removeMappingEntry(state: MappingState, mappingId: string): MappingState {
	const normalizedState = normalizeUserMappings(state);
	return {
		version: 3,
		entries: normalizedState.entries.filter(entry => entry.id !== mappingId)
	};
}

export function getAllMappingHosts(entry: Pick<MappingEntry, 'host' | 'hostAliases'> | null | undefined): string[] {
	return uniqueStrings([
		normalizeHost(entry?.host),
		...(entry?.hostAliases ?? []).map(normalizeHost)
	]).filter(Boolean);
}

export function getAllMappingPrefixes(entry: Pick<MappingEntry, 'readingPrefix' | 'readingPrefixes'> | null | undefined): string[] {
	return uniqueStrings([
		normalizePrefix(entry?.readingPrefix),
		...(entry?.readingPrefixes ?? []).map(normalizePrefix)
	]).filter(Boolean);
}

export function actionSelectorsToText(action: Pick<MappingAction, 'selectors'> | null | undefined): string {
	return listToMultilineText(action?.selectors ?? []);
}

export function textToSelectors(value: unknown): string[] {
	return multilineTextToList(value);
}

function normalizeMappingActions(actions: unknown): {
	next: MappingAction | null;
	prev: MappingAction | null;
	main: MappingAction | null;
} {
	const actionRecord = isRecord(actions) ? actions : {};

	return {
		next: normalizeMappingAction(actionRecord.next),
		prev: normalizeMappingAction(actionRecord.prev),
		main: normalizeMappingAction(actionRecord.main)
	};
}

function normalizeMappingAction(action: unknown): MappingAction | null {
	if (!isRecord(action)) return null;

	return {
		selectors: Array.isArray(action.selectors)
			? action.selectors.map(value => String(value).trim()).filter(Boolean)
			: [],
		text: String(action.text ?? '').trim(),
		tagName: String(action.tagName ?? '').trim(),
		sampleHref: String(action.sampleHref ?? '').trim()
	};
}

function createEmptyMappingAction(): MappingAction {
	return {
		selectors: [],
		text: '',
		tagName: 'a',
		sampleHref: ''
	};
}

function isRecord(value: unknown): value is RawMappingEntry {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isVersionedMappingState(value: unknown): value is VersionedMappingState {
	return isRecord(value) && typeof value.version === 'number' && Array.isArray(value.entries);
}

function stringOrFallback(value: unknown, fallback: string): string {
	const normalized = String(value ?? '').trim();
	return normalized || fallback;
}

function toTimestamp(value: unknown): number {
	const numeric = Number(value);
	return Number.isFinite(numeric) && numeric > 0 ? numeric : Date.now();
}
