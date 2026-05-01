import { extensionStorage } from './extensionStorage';
import { STORAGE_KEYS } from './storageKeys';
import type { LatestReadExport, LatestReadExportEntry, ResumeEntry } from './types';

type RawRecord = Record<string, unknown>;

export async function loadResumeEntries(): Promise<ResumeEntry[]> {
	const data = await extensionStorage.get([STORAGE_KEYS.resume]);
	return normalizeResumeEntries(data[STORAGE_KEYS.resume]);
}

export async function loadLatestReadExport(): Promise<LatestReadExport> {
	return buildLatestReadExport(await loadResumeEntries());
}

export async function loadReadingHistoryExport(): Promise<LatestReadExport> {
	return buildReadingHistoryExport(await loadResumeEntries());
}

export async function removeLatestReadWork(workId: string): Promise<LatestReadExport> {
	const entries = await loadResumeEntries();
	const retainedEntries = entries.filter(entry => getResumeWorkId(entry) !== workId);
	await extensionStorage.set({ [STORAGE_KEYS.resume]: resumeEntriesToStorageRecord(retainedEntries) });
	return buildLatestReadExport(retainedEntries);
}

export async function clearLatestReads(): Promise<LatestReadExport> {
	await extensionStorage.set({ [STORAGE_KEYS.resume]: {} });
	return buildLatestReadExport([]);
}

export function buildLatestReadsFilename(date = new Date()): string {
	const timestamp = date.toISOString().replace(/[:.]/g, '-');
	return `chapterpilot-latest-reads-${timestamp}.json`;
}

export function buildLatestReadExport(entries: ResumeEntry[]): LatestReadExport {
	const normalizedEntries = normalizeResumeEntries(entries).filter(isMeaningfulResumeEntry);
	const chapterEntries = normalizedEntries.filter(entry => normalizeResumeEntryType(entry.entryType) === 'chapter');
	const workEntries = normalizedEntries.filter(entry => normalizeResumeEntryType(entry.entryType) === 'work');
	const trackedEntriesByWork = new Map<string, number>();
	const latestChapterEntriesByWork = new Map<string, ResumeEntry>();
	const latestEntriesByWork = new Map<string, { entry: ResumeEntry; trackedEntries: number }>();

	chapterEntries.forEach(entry => {
		const workId = getResumeWorkId(entry);
		trackedEntriesByWork.set(workId, (trackedEntriesByWork.get(workId) || 0) + 1);

		const existingEntry = latestChapterEntriesByWork.get(workId);
		if (!existingEntry || entry.updatedAt > existingEntry.updatedAt) {
			latestChapterEntriesByWork.set(workId, entry);
		}
	});

	latestChapterEntriesByWork.forEach((entry, workId) => {
		latestEntriesByWork.set(workId, {
			entry,
			trackedEntries: trackedEntriesByWork.get(workId) || 1
		});
	});

	workEntries.forEach(entry => {
		const workId = getResumeWorkId(entry);
		const existing = latestEntriesByWork.get(workId);
		const trackedEntries = trackedEntriesByWork.get(workId) || existing?.trackedEntries || 1;

		if (!existing || entry.updatedAt > existing.entry.updatedAt || normalizeResumeEntryType(existing.entry.entryType) !== 'work') {
			latestEntriesByWork.set(workId, { entry, trackedEntries });
			return;
		}

		existing.trackedEntries = trackedEntries;
	});

	const exportedAt = Date.now();
	const exportedEntries: LatestReadExportEntry[] = [...latestEntriesByWork.entries()]
		.map(([workId, value]) => {
			return {
				workId,
				siteId: value.entry.siteId,
				host: value.entry.host,
				workHref: value.entry.mainHref,
				workKey: value.entry.workKey,
				chapterHref: value.entry.chapterHref,
				chapterTitle: value.entry.title,
				workTitle: value.entry.workTitle,
				trackedEntries: value.trackedEntries,
				progressPercent: roundProgressPercent(value.entry.percent),
				scrollY: value.entry.scrollY,
				updatedAt: value.entry.updatedAt,
				updatedAtIso: new Date(value.entry.updatedAt).toISOString(),
				storageKey: value.entry.storageKey
			};
		})
		.sort((left, right) => right.updatedAt - left.updatedAt);

	return {
		exportedAt,
		exportedAtIso: new Date(exportedAt).toISOString(),
		totalWorks: exportedEntries.length,
		totalEntries: normalizedEntries.length,
		entries: exportedEntries
	};
}

export function buildReadingHistoryExport(entries: ResumeEntry[]): LatestReadExport {
	const normalizedEntries = normalizeResumeEntries(entries).filter(isMeaningfulResumeEntry);
	const chapterEntries = normalizedEntries.filter(entry => normalizeResumeEntryType(entry.entryType) === 'chapter');
	const trackedEntriesByWork = getTrackedEntriesByWork(chapterEntries);
	const historyEntries = (chapterEntries.length ? chapterEntries : normalizedEntries)
		.map(entry => {
			const workId = getResumeWorkId(entry);
			return resumeEntryToLatestReadExportEntry(
				workId,
				entry,
				trackedEntriesByWork.get(workId) || 1
			);
		})
		.sort((left, right) => right.updatedAt - left.updatedAt);
	const exportedAt = Date.now();

	return {
		exportedAt,
		exportedAtIso: new Date(exportedAt).toISOString(),
		totalWorks: new Set(historyEntries.map(entry => entry.workId)).size,
		totalEntries: historyEntries.length,
		entries: historyEntries
	};
}

function normalizeResumeEntries(rawResumeState: unknown): ResumeEntry[] {
	if (Array.isArray(rawResumeState)) {
		return rawResumeState
			.map(entry => normalizeResumeEntry((entry as ResumeEntry).storageKey || '', entry))
			.filter((entry): entry is ResumeEntry => Boolean(entry))
			.sort((left, right) => right.updatedAt - left.updatedAt);
	}

	if (!isRecord(rawResumeState)) return [];

	return Object.entries(rawResumeState)
		.map(([storageKey, entry]) => normalizeResumeEntry(storageKey, entry))
		.filter((entry): entry is ResumeEntry => Boolean(entry))
		.sort((left, right) => right.updatedAt - left.updatedAt);
}

function resumeEntriesToStorageRecord(entries: ResumeEntry[]): Record<string, ResumeEntry> {
	return entries.reduce<Record<string, ResumeEntry>>((record, entry) => {
		record[entry.storageKey || entry.chapterHref] = entry;
		return record;
	}, {});
}

function normalizeResumeEntry(storageKey: string, value: unknown): ResumeEntry | null {
	if (!isRecord(value)) return null;

	const chapterHref = normalizeComparableHref(value.chapterHref);
	if (!chapterHref) return null;

	return {
		storageKey: String(storageKey || '').trim() || chapterHref,
		entryType: normalizeResumeEntryType(value.entryType),
		scrollY: toNumber(value.scrollY),
		percent: clampPercent(toNumber(value.percent)),
		updatedAt: toTimestamp(value.updatedAt),
		title: String(value.title || '').trim(),
		workTitle: String(value.workTitle || '').trim(),
		host: String(value.host || '').trim().toLowerCase(),
		siteId: String(value.siteId || '').trim(),
		mainHref: normalizeComparableHref(value.mainHref),
		workKey: normalizeWorkKey(value.workKey),
		chapterHref
	};
}

function getResumeWorkId(entry: ResumeEntry): string {
	if (entry.mainHref) return `href:${entry.mainHref}`;
	if (entry.workKey) return `work:${entry.siteId || entry.host}:${entry.workKey}`;
	return `chapter:${entry.chapterHref}`;
}

function getTrackedEntriesByWork(entries: ResumeEntry[]): Map<string, number> {
	const trackedEntriesByWork = new Map<string, number>();
	entries.forEach(entry => {
		const workId = getResumeWorkId(entry);
		trackedEntriesByWork.set(workId, (trackedEntriesByWork.get(workId) || 0) + 1);
	});
	return trackedEntriesByWork;
}

function resumeEntryToLatestReadExportEntry(workId: string, entry: ResumeEntry, trackedEntries: number): LatestReadExportEntry {
	return {
		workId,
		siteId: entry.siteId,
		host: entry.host,
		workHref: entry.mainHref,
		workKey: entry.workKey,
		chapterHref: entry.chapterHref,
		chapterTitle: entry.title,
		workTitle: entry.workTitle,
		trackedEntries,
		progressPercent: roundProgressPercent(entry.percent),
		scrollY: entry.scrollY,
		updatedAt: entry.updatedAt,
		updatedAtIso: new Date(entry.updatedAt).toISOString(),
		storageKey: entry.storageKey
	};
}

function normalizeResumeEntryType(value: unknown): ResumeEntry['entryType'] {
	return value === 'work' ? 'work' : 'chapter';
}

function isMeaningfulResumeEntry(entry: ResumeEntry): boolean {
	return entry.scrollY >= 180 || entry.percent >= 0.05;
}

function normalizeComparableHref(value: unknown): string {
	const href = String(value || '').trim();
	if (!href) return '';

	try {
		const url = new URL(href);
		url.hash = '';
		return url.href;
	} catch {
		return href;
	}
}

function normalizeWorkKey(value: unknown): string {
	return String(value || '').trim().toLowerCase();
}

function roundProgressPercent(value: number): number {
	return Math.round(clampPercent(value) * 10000) / 100;
}

function clampPercent(value: number): number {
	if (!Number.isFinite(value)) return 0;
	return Math.min(1, Math.max(0, value));
}

function toNumber(value: unknown): number {
	const numeric = Number(value);
	return Number.isFinite(numeric) ? numeric : 0;
}

function toTimestamp(value: unknown): number {
	const numeric = Number(value);
	return Number.isFinite(numeric) && numeric > 0 ? numeric : Date.now();
}

function isRecord(value: unknown): value is RawRecord {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
