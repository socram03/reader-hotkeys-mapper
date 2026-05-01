import { extensionStorage } from './extensionStorage';
import { GLOBAL_SETTINGS_KEY } from './shortcuts';
import { STORAGE_KEYS } from './storageKeys';
import type { LatestReadExportEntry } from './types';

export type HistorySettings = {
	completedThresholdPercent: number;
};

export const DEFAULT_HISTORY_SETTINGS: HistorySettings = {
	completedThresholdPercent: 97
};

export function normalizeHistorySettings(value: unknown): HistorySettings {
	const record = isRecord(value) ? value : {};
	return {
		completedThresholdPercent: normalizeCompletedThresholdPercent(record.completedThresholdPercent)
	};
}

export async function loadHistorySettings(): Promise<HistorySettings> {
	const data = await extensionStorage.get([STORAGE_KEYS.settings]);
	const settings = isRecord(data[STORAGE_KEYS.settings]) ? data[STORAGE_KEYS.settings] : {};
	const globalSettings = isRecord(settings[GLOBAL_SETTINGS_KEY]) ? settings[GLOBAL_SETTINGS_KEY] : {};
	return normalizeHistorySettings(globalSettings);
}

export function isContinueReadingEntry(entry: LatestReadExportEntry, settings: HistorySettings): boolean {
	return entry.progressPercent < settings.completedThresholdPercent;
}

function normalizeCompletedThresholdPercent(value: unknown): number {
	const numeric = Number(value);
	if (!Number.isFinite(numeric)) return DEFAULT_HISTORY_SETTINGS.completedThresholdPercent;
	return Math.min(100, Math.max(1, Math.round(numeric)));
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
