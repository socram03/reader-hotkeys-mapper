export type ShortcutAction =
	| 'next'
	| 'prev'
	| 'main'
	| 'scrollDown'
	| 'scrollUp'
	| 'resume'
	| 'restore'
	| 'focus'
	| 'autoNext'
	| 'pauseAutoScroll'
	| 'speedUp'
	| 'speedDown'
	| 'chapterMap'
	| 'mapper'
	| 'help';

export type ShortcutSettings = Record<ShortcutAction, string>;

export const GLOBAL_SETTINGS_KEY = '_global';

export const DEFAULT_SHORTCUTS: ShortcutSettings = {
	next: 'ArrowRight',
	prev: 'ArrowLeft',
	main: 'm',
	scrollDown: 'j',
	scrollUp: 'k',
	resume: 'l',
	restore: 'r',
	focus: 'z',
	autoNext: 'a',
	pauseAutoScroll: ' ',
	speedUp: '+',
	speedDown: '-',
	chapterMap: 'c',
	mapper: 'u',
	help: '?'
};

export const SHORTCUT_LABELS: Record<ShortcutAction, string> = {
	next: 'Siguiente capitulo',
	prev: 'Capitulo anterior',
	main: 'Pagina de la obra',
	scrollDown: 'Scroll abajo',
	scrollUp: 'Scroll arriba',
	resume: 'Retomar lectura',
	restore: 'Restaurar posicion',
	focus: 'Modo zen',
	autoNext: 'Auto-scroll',
	pauseAutoScroll: 'Pausar auto-scroll',
	speedUp: 'Subir velocidad',
	speedDown: 'Bajar velocidad',
	chapterMap: 'Mapa de capitulos',
	mapper: 'Picker visual',
	help: 'Ayuda'
};

export const SHORTCUT_ACTIONS = Object.keys(DEFAULT_SHORTCUTS) as ShortcutAction[];

export function normalizeShortcutSettings(value: unknown): ShortcutSettings {
	const record = isRecord(value) ? value : {};

	return SHORTCUT_ACTIONS.reduce((settings, action) => {
		settings[action] = normalizeShortcutKeyInput(record[action], DEFAULT_SHORTCUTS[action]);
		return settings;
	}, {} as ShortcutSettings);
}

export function normalizeShortcutOverrides(value: unknown): Partial<ShortcutSettings> {
	const record = isRecord(value) ? value : {};

	return SHORTCUT_ACTIONS.reduce((settings, action) => {
		const raw = record[action];
		if (raw === undefined || raw === null || String(raw).trim() === '') return settings;
		settings[action] = normalizeShortcutKeyInput(raw, DEFAULT_SHORTCUTS[action]);
		return settings;
	}, {} as Partial<ShortcutSettings>);
}

export function normalizeShortcutKeyInput(value: unknown, fallback = ''): string {
	const raw = String(value ?? '').trim();
	if (!raw) return fallback;

	const lower = raw.toLowerCase();
	if (lower === 'space') return ' ';
	if (lower === 'arrowright') return 'ArrowRight';
	if (lower === 'arrowleft') return 'ArrowLeft';
	if (lower === 'arrowup') return 'ArrowUp';
	if (lower === 'arrowdown') return 'ArrowDown';
	if (raw.length === 1) return raw.toLowerCase();
	return raw;
}

export function formatShortcutKey(value: string): string {
	return value === ' ' ? 'Space' : value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
