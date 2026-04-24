import { extensionStorage } from './extensionStorage';
import { GLOBAL_SETTINGS_KEY } from './shortcuts';
import { STORAGE_KEYS } from './storageKeys';

export type Language = 'es' | 'en';

type MessageKey =
	| 'options.title'
	| 'options.description'
	| 'language.title'
	| 'language.label'
	| 'language.save'
	| 'language.saved'
	| 'popup.adjustMapping'
	| 'popup.mapReader'
	| 'popup.startMapping'
	| 'popup.probableReader';

const MESSAGES: Record<Language, Record<MessageKey, string>> = {
	es: {
		'options.title': 'Opciones y mapeos',
		'options.description': 'Gestiona dominios, prefijos de lectura, alias de migracion y selectores CSS. Los sitios personalizados quedan inactivos hasta que los actives.',
		'language.title': 'Idioma',
		'language.label': 'Idioma de la extension',
		'language.save': 'Guardar idioma',
		'language.saved': 'Idioma guardado.',
		'popup.adjustMapping': '⌥ Ajustar mapeo',
		'popup.mapReader': '⌥ Mapear lector',
		'popup.startMapping': '⌥ Iniciar mapeo',
		'popup.probableReader': 'Lector probable'
	},
	en: {
		'options.title': 'Options and mappings',
		'options.description': 'Manage domains, reading prefixes, migration aliases, and CSS selectors. Custom sites stay inactive until you enable them.',
		'language.title': 'Language',
		'language.label': 'Extension language',
		'language.save': 'Save language',
		'language.saved': 'Language saved.',
		'popup.adjustMapping': '⌥ Adjust mapping',
		'popup.mapReader': '⌥ Map reader',
		'popup.startMapping': '⌥ Start mapping',
		'popup.probableReader': 'Probable reader'
	}
};

export function getMessage(language: Language, key: MessageKey): string {
	return MESSAGES[language]?.[key] || MESSAGES.es[key] || key;
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
