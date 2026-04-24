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

	const parts = raw.split('+').map(part => part.trim()).filter(Boolean);
	if (parts.length > 1) {
		const key = normalizeShortcutKey(parts[parts.length - 1], true);
		if (!key) return fallback;

		const modifiers = normalizeShortcutModifiers(parts.slice(0, -1));
		return [...modifiers, key].join('+');
	}

	return normalizeShortcutKey(raw, false) || fallback;
}

export function formatShortcutKey(value: string): string {
	return normalizeShortcutKeyInput(value, value) === ' ' ? 'Space' : normalizeShortcutKeyInput(value, value);
}

export function shortcutFromKeyboardEvent(event: KeyboardEvent): string {
	const key = normalizeShortcutKey(event.key, hasShortcutModifier(event));
	if (!key || isModifierKey(key)) return '';

	const modifiers = [
		event.ctrlKey ? 'Ctrl' : '',
		event.altKey ? 'Alt' : '',
		event.shiftKey ? 'Shift' : '',
		event.metaKey ? 'Meta' : ''
	].filter(Boolean);

	return [...modifiers, key].join('+');
}

function normalizeShortcutModifiers(values: string[]): string[] {
	const seen = new Set<string>();

	values.forEach(value => {
		const modifier = normalizeShortcutModifier(value);
		if (modifier) seen.add(modifier);
	});

	return ['Ctrl', 'Alt', 'Shift', 'Meta'].filter(modifier => seen.has(modifier));
}

function normalizeShortcutModifier(value: string): string {
	const normalized = value.toLowerCase();
	if (normalized === 'ctrl' || normalized === 'control') return 'Ctrl';
	if (normalized === 'alt' || normalized === 'option') return 'Alt';
	if (normalized === 'shift') return 'Shift';
	if (normalized === 'meta' || normalized === 'cmd' || normalized === 'command') return 'Meta';
	return '';
}

function normalizeShortcutKey(value: string, inCombination: boolean): string {
	const text = String(value || '');
	if (text === ' ') return inCombination ? 'Space' : ' ';

	const raw = text.trim();
	if (!raw) return '';

	const lower = raw.toLowerCase();
	if (lower === 'space') return inCombination ? 'Space' : ' ';
	if (lower === 'esc') return 'Escape';
	if (lower === 'arrowright') return 'ArrowRight';
	if (lower === 'arrowleft') return 'ArrowLeft';
	if (lower === 'arrowup') return 'ArrowUp';
	if (lower === 'arrowdown') return 'ArrowDown';
	if (lower === 'control') return 'Ctrl';
	if (lower === 'meta') return 'Meta';
	if (lower === 'alt') return 'Alt';
	if (lower === 'shift') return 'Shift';
	if (raw.length === 1) return inCombination ? raw.toUpperCase() : raw.toLowerCase();
	return raw;
}

function hasShortcutModifier(event: KeyboardEvent): boolean {
	return event.ctrlKey || event.altKey || event.shiftKey || event.metaKey;
}

function isModifierKey(key: string): boolean {
	return key === 'Ctrl' || key === 'Alt' || key === 'Shift' || key === 'Meta';
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
