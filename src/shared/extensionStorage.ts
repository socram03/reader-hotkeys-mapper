import { STORAGE_KEYS } from './storageKeys';

type StorageResult = Record<string, unknown>;
export type StorageMode = 'local' | 'sync';

const SYNCABLE_KEYS = [STORAGE_KEYS.settings, STORAGE_KEYS.userMappings] as const;
const SYNCABLE_KEY_SET = new Set<string>(SYNCABLE_KEYS);

type ExtensionStorage = {
	get(keys: string[]): Promise<StorageResult>;
	set(values: Record<string, unknown>): Promise<void>;
};

export const extensionStorage = createExtensionStorage();

export function createExtensionStorage(): ExtensionStorage {
	return {
		async get(keys) {
			const localValues = await chrome.storage.local.get(keys) as StorageResult;
			const mode = await loadStorageMode();
			const syncKeys = mode === 'sync' ? keys.filter(key => SYNCABLE_KEY_SET.has(key)) : [];
			if (!syncKeys.length || !canUseSyncStorage()) return localValues;

			const syncValues = await chrome.storage.sync.get(syncKeys) as StorageResult;
			return {
				...localValues,
				...syncValues
			};
		},
		async set(values) {
			const mode = await loadStorageMode();
			const localValues: Record<string, unknown> = {};
			const syncValues: Record<string, unknown> = {};

			Object.entries(values).forEach(([key, value]) => {
				if (mode === 'sync' && SYNCABLE_KEY_SET.has(key) && canUseSyncStorage()) {
					syncValues[key] = value;
					return;
				}

				localValues[key] = value;
			});

			if (Object.keys(localValues).length) await chrome.storage.local.set(localValues);
			if (Object.keys(syncValues).length) await chrome.storage.sync.set(syncValues);
		}
	};
}

export async function loadStorageMode(): Promise<StorageMode> {
	if (!canUseSyncStorage()) return 'local';
	const data = await chrome.storage.local.get([STORAGE_KEYS.storageMode]) as StorageResult;
	return data[STORAGE_KEYS.storageMode] === 'sync' ? 'sync' : 'local';
}

export async function setStorageMode(mode: StorageMode): Promise<void> {
	await chrome.storage.local.set({ [STORAGE_KEYS.storageMode]: mode });
}

export async function copySyncableStorageTo(mode: StorageMode): Promise<void> {
	if (!canUseSyncStorage()) {
		await setStorageMode('local');
		return;
	}

	const source = mode === 'sync' ? chrome.storage.local : chrome.storage.sync;
	const target = mode === 'sync' ? chrome.storage.sync : chrome.storage.local;
	const data = await source.get([...SYNCABLE_KEYS]) as StorageResult;
	await target.set(data);
	await setStorageMode(mode);
}

function canUseSyncStorage(): boolean {
	return typeof chrome !== 'undefined' && Boolean(chrome.storage?.sync);
}
