import type { ShortcutSettings } from './shortcuts';

export type MappingActionKey = 'next' | 'prev' | 'main';

export type MappingAction = {
	selectors: string[];
	text: string;
	tagName: string;
	sampleHref: string;
};

export type MappingActions = Record<MappingActionKey, MappingAction>;

export type MappingEntry = {
	id: string;
	host: string;
	label: string;
	enabled: boolean;
	hostAliases: string[];
	readingPrefix: string;
	readingPrefixes: string[];
	shortcuts?: Partial<ShortcutSettings>;
	actions: MappingActions;
	createdAt: number;
	updatedAt: number;
};

export type MappingState = {
	version: number;
	entries: MappingEntry[];
};

export type ResumeEntry = {
	storageKey: string;
	entryType?: 'chapter' | 'work';
	scrollY: number;
	percent: number;
	updatedAt: number;
	title: string;
	workTitle: string;
	host: string;
	siteId: string;
	mainHref: string;
	workKey: string;
	chapterHref: string;
};

export type LatestReadExportEntry = {
	workId: string;
	siteId: string;
	host: string;
	workHref: string;
	workKey: string;
	chapterHref: string;
	chapterTitle: string;
	workTitle: string;
	trackedEntries: number;
	progressPercent: number;
	scrollY: number;
	updatedAt: number;
	updatedAtIso: string;
	storageKey: string;
};

export type LatestReadExport = {
	exportedAt: number;
	exportedAtIso: string;
	totalWorks: number;
	totalEntries: number;
	entries: LatestReadExportEntry[];
};

export type ReaderStatus = {
	readyState?: string;
	host?: string;
	pathname?: string;
	siteDetected?: boolean;
	supportedSiteDetected?: boolean;
	siteLabel?: string;
	isBuiltInSite?: boolean;
	canToggleActivation?: boolean;
	mappingCandidateDetected?: boolean;
	mappingCandidateReason?: string;
	matchedMappingEnabled?: boolean | null;
	matchedMappingLabel?: string;
	hostMappingCount?: number;
	currentChapterHref?: string;
	currentWorkHref?: string;
	lastReadAvailable?: boolean;
	lastReadTitle?: string;
	lastReadHref?: string;
	lastReadUpdatedAt?: number;
	lastReadScope?: string;
	lastReadIsCurrentChapter?: boolean;
	settings?: {
		focusMode?: boolean;
		autoNext?: boolean;
		autoScrollSpeed?: number;
		streamerMode?: boolean;
	};
	[key: string]: unknown;
};

export type ReaderMessage = {
	type: string;
	[key: string]: unknown;
};
