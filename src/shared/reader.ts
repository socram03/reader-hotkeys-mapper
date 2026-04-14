import type { ReaderMessage, ReaderStatus } from './types';

const READER_STATUS_MESSAGE: ReaderMessage = { type: 'reader:get-status' };

export async function sendMessageToTab<T>(tabId: number, message: unknown): Promise<T> {
	return chrome.tabs.sendMessage(tabId, message) as Promise<T>;
}

export async function getReaderStatus(tabId: number): Promise<ReaderStatus> {
	return sendMessageToTab<ReaderStatus>(tabId, READER_STATUS_MESSAGE);
}

export async function injectReaderScript(tabId: number): Promise<void> {
	await chrome.scripting.executeScript({
		target: { tabId },
		files: ['content.js']
	});
}

export async function ensureReaderScript(tabId: number): Promise<ReaderStatus> {
	try {
		const status = await getReaderStatus(tabId);
		if (isReaderStatusReady(status)) return status;
		return waitForReaderStatus(tabId);
	} catch {
		await injectReaderScript(tabId);
		return waitForReaderStatus(tabId);
	}
}

export async function sendReaderMessage<T = ReaderStatus>(tabId: number, message: ReaderMessage): Promise<T> {
	await ensureReaderScript(tabId);
	return sendMessageToTab<T>(tabId, message);
}

async function waitForReaderStatus(tabId: number, retries = 6): Promise<ReaderStatus> {
	let lastError: unknown = null;

	for (let attempt = 0; attempt < retries; attempt += 1) {
		try {
			const status = await getReaderStatus(tabId);
			if (isReaderStatusReady(status)) return status;
		} catch (error) {
			lastError = error;
		}

		await delay(150 * (attempt + 1));
	}

	throw lastError || new Error('No pude confirmar el estado del lector.');
}

function delay(ms: number): Promise<void> {
	return new Promise(resolve => {
		setTimeout(resolve, ms);
	});
}

function isReaderStatusReady(status: ReaderStatus | null | undefined): boolean {
	return ['idle', 'true'].includes(String(status?.readyState ?? ''));
}
