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
	actions: MappingActions;
	createdAt: number;
	updatedAt: number;
};

export type MappingState = {
	version: number;
	entries: MappingEntry[];
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
	};
	[key: string]: unknown;
};

export type ReaderMessage = {
	type: string;
	[key: string]: unknown;
};
