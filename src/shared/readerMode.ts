export type ReaderModeSettings = {
	backgroundColor: string;
	maxWidth: number;
	imageGap: number;
	brightness: number;
};

export const DEFAULT_READER_MODE: ReaderModeSettings = {
	backgroundColor: '#000000',
	maxWidth: 0,
	imageGap: 18,
	brightness: 100
};

export function normalizeReaderModeSettings(value: unknown): ReaderModeSettings {
	const record = isRecord(value) ? value : {};

	return {
		backgroundColor: normalizeColor(record.backgroundColor, DEFAULT_READER_MODE.backgroundColor),
		maxWidth: clampNumber(record.maxWidth, 0, 1600, DEFAULT_READER_MODE.maxWidth),
		imageGap: clampNumber(record.imageGap, 0, 120, DEFAULT_READER_MODE.imageGap),
		brightness: clampNumber(record.brightness, 40, 140, DEFAULT_READER_MODE.brightness)
	};
}

function normalizeColor(value: unknown, fallback: string): string {
	const color = String(value ?? '').trim();
	return /^#[0-9a-fA-F]{6}$/.test(color) ? color.toLowerCase() : fallback;
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
	const numeric = Number(value);
	if (!Number.isFinite(numeric)) return fallback;
	return Math.min(max, Math.max(min, Math.round(numeric)));
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
