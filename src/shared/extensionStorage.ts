type StorageResult = Record<string, unknown>;

type ExtensionStorage = {
	get(keys: string[]): Promise<StorageResult>;
	set(values: Record<string, unknown>): Promise<void>;
};

export const extensionStorage = createExtensionStorage();

export function createExtensionStorage(): ExtensionStorage {
	return {
		get(keys) {
			return chrome.storage.local.get(keys) as Promise<StorageResult>;
		},
		async set(values) {
			await chrome.storage.local.set(values);
		}
	};
}
