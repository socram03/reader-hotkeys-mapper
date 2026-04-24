import { extensionStorage } from './extensionStorage';
import { EN_MESSAGES } from './i18n/en';
import { ES_MESSAGES } from './i18n/es';
import { GLOBAL_SETTINGS_KEY } from './shortcuts';
import { STORAGE_KEYS } from './storageKeys';

export type Language = 'es' | 'en';
export type MessageKey = keyof typeof EN_MESSAGES;

const MESSAGES: Record<Language, Record<MessageKey, string>> = {
	en: EN_MESSAGES,
	es: ES_MESSAGES
};

export function getMessage(language: Language, key: MessageKey, values: Record<string, string | number> = {}): string {
	const template = MESSAGES[language]?.[key] || EN_MESSAGES[key] || key;
	return Object.entries(values).reduce((text, [name, value]) => {
		return text.replaceAll(`{${name}}`, String(value));
	}, template);
}

export function normalizeLanguage(value: unknown): Language {
	return value === 'en' ? 'en' : 'es';
}

export async function loadLanguage(): Promise<Language> {
	const data = await extensionStorage.get([STORAGE_KEYS.settings]);
	const settings = isRecord(data[STORAGE_KEYS.settings]) ? data[STORAGE_KEYS.settings] : {};
	const globalSettings = isRecord(settings[GLOBAL_SETTINGS_KEY]) ? settings[GLOBAL_SETTINGS_KEY] : {};
	return normalizeLanguage(globalSettings.language);
}

export async function saveLanguage(language: Language): Promise<void> {
	const data = await extensionStorage.get([STORAGE_KEYS.settings]);
	const settings: Record<string, unknown> = isRecord(data[STORAGE_KEYS.settings])
		? Object.assign({}, data[STORAGE_KEYS.settings])
		: {};
	const globalSettings: Record<string, unknown> = isRecord(settings[GLOBAL_SETTINGS_KEY]) ? { ...settings[GLOBAL_SETTINGS_KEY] } : {};
	settings[GLOBAL_SETTINGS_KEY] = {
		...globalSettings,
		language
	};
	await extensionStorage.set({ [STORAGE_KEYS.settings]: settings });
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
