import { extensionStorage } from './extensionStorage';
import { GLOBAL_SETTINGS_KEY } from './shortcuts';
import { STORAGE_KEYS } from './storageKeys';

export type PrivacySettings = {
	streamerMode: boolean;
};

export function normalizePrivacySettings(value: unknown): PrivacySettings {
	const record = isRecord(value) ? value : {};
	return {
		streamerMode: Boolean(record.streamerMode)
	};
}

export async function loadPrivacySettings(): Promise<PrivacySettings> {
	const data = await extensionStorage.get([STORAGE_KEYS.settings]);
	const settings = isRecord(data[STORAGE_KEYS.settings]) ? data[STORAGE_KEYS.settings] : {};
	const globalSettings = isRecord(settings[GLOBAL_SETTINGS_KEY]) ? settings[GLOBAL_SETTINGS_KEY] : {};
	return normalizePrivacySettings(globalSettings);
}

export async function savePrivacySettings(privacy: PrivacySettings): Promise<void> {
	const data = await extensionStorage.get([STORAGE_KEYS.settings]);
	const settings: Record<string, unknown> = isRecord(data[STORAGE_KEYS.settings])
		? Object.assign({}, data[STORAGE_KEYS.settings])
		: {};
	const globalSettings: Record<string, unknown> = isRecord(settings[GLOBAL_SETTINGS_KEY]) ? { ...settings[GLOBAL_SETTINGS_KEY] } : {};
	settings[GLOBAL_SETTINGS_KEY] = {
		...globalSettings,
		streamerMode: Boolean(privacy.streamerMode)
	};
	await extensionStorage.set({ [STORAGE_KEYS.settings]: settings });
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
