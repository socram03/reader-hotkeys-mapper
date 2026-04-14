const TARGET_PROTOCOLS = new Set(['http:', 'https:', 'file:']);

export async function getActiveTab(): Promise<chrome.tabs.Tab | null> {
	const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
	return tabs[0] || null;
}

export async function getTargetTabs(): Promise<chrome.tabs.Tab[]> {
	const tabs = await chrome.tabs.query({ currentWindow: true });
	return tabs
		.filter(tab => isTargetableTabUrl(tab.url))
		.sort((left, right) => {
			const activeDelta = Number(right.active) - Number(left.active);
			if (activeDelta !== 0) return activeDelta;
			return (right.lastAccessed || 0) - (left.lastAccessed || 0);
		});
}

export async function getBestTargetTab(): Promise<chrome.tabs.Tab | null> {
	const tabs = await getTargetTabs();
	return tabs[0] || null;
}

export function isTargetableTabUrl(url: string | undefined | null): boolean {
	if (!url) return false;

	try {
		const parsed = new URL(url);
		return TARGET_PROTOCOLS.has(parsed.protocol);
	} catch {
		return false;
	}
}
