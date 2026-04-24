import { extensionStorage } from './extensionStorage';
import { normalizeUserMappings } from './mappings';
import { STORAGE_KEYS } from './storageKeys';
import type { MappingState } from './types';

type RawRecord = Record<string, unknown>;

export type FullBackup = {
	version: 1;
	exportedAt: number;
	exportedAtIso: string;
	settings: RawRecord;
	resume: RawRecord;
	userMappings: MappingState;
};

export async function loadFullBackup(date = new Date()): Promise<FullBackup> {
	const data = await extensionStorage.get([
		STORAGE_KEYS.settings,
		STORAGE_KEYS.resume,
		STORAGE_KEYS.userMappings
	]);

	return {
		version: 1,
		exportedAt: date.getTime(),
		exportedAtIso: date.toISOString(),
		settings: normalizeRecord(data[STORAGE_KEYS.settings]),
		resume: normalizeRecord(data[STORAGE_KEYS.resume]),
		userMappings: normalizeUserMappings(data[STORAGE_KEYS.userMappings])
	};
}

export async function importFullBackup(rawBackup: unknown): Promise<FullBackup> {
	const backup = normalizeFullBackup(rawBackup);
	if (!backup) {
		throw new Error('The file is not a valid full backup.');
	}

	await extensionStorage.set({
		[STORAGE_KEYS.settings]: backup.settings,
		[STORAGE_KEYS.resume]: backup.resume,
		[STORAGE_KEYS.userMappings]: backup.userMappings
	});

	return backup;
}

export function normalizeFullBackup(rawBackup: unknown): FullBackup | null {
	if (!isRecord(rawBackup) || rawBackup.version !== 1) return null;

	const userMappings = normalizeUserMappings(rawBackup.userMappings);
	const exportedAt = toTimestamp(rawBackup.exportedAt);

	return {
		version: 1,
		exportedAt,
		exportedAtIso: new Date(exportedAt).toISOString(),
		settings: normalizeRecord(rawBackup.settings),
		resume: normalizeRecord(rawBackup.resume),
		userMappings
	};
}

export function isFullBackup(rawBackup: unknown): rawBackup is FullBackup {
	return Boolean(normalizeFullBackup(rawBackup));
}

export function buildFullBackupFilename(date = new Date()): string {
	const timestamp = date.toISOString().replace(/[:.]/g, '-');
	return `reader-hotkeys-backup-${timestamp}.json`;
}

function normalizeRecord(value: unknown): RawRecord {
	return isRecord(value) ? value : {};
}

function isRecord(value: unknown): value is RawRecord {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function toTimestamp(value: unknown): number {
	const numeric = Number(value);
	return Number.isFinite(numeric) && numeric > 0 ? numeric : Date.now();
}
