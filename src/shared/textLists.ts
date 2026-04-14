export function uniqueStrings(values: readonly string[]): string[] {
	return [...new Set(values.filter(Boolean))];
}

export function toLineArray(value: unknown): string[] {
	if (Array.isArray(value)) {
		return value
			.map(item => String(item ?? '').trim())
			.filter(Boolean);
	}

	return String(value ?? '')
		.split(/\r?\n|,/)
		.map(item => item.trim())
		.filter(Boolean);
}

export function listToMultilineText(values: readonly string[] = []): string {
	return values.join('\n');
}

export function multilineTextToList(value: unknown): string[] {
	return toLineArray(value);
}

export function inferPathPrefix(pathname: string | null | undefined): string {
	const segments = String(pathname ?? '').split('/').filter(Boolean);
	if (!segments.length) return '/';
	return `/${segments[0]}/`;
}
