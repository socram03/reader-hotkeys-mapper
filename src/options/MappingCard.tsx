import type { JSX } from 'preact';
import { useState } from 'preact/hooks';
import { formatShortcutKey, getMessage, normalizeShortcutKeyInput } from '../shared';
import type { Language, ShortcutAction } from '../shared';
import type { MappingEntry } from './types';

type MappingCardProps = {
	entry: MappingEntry;
	language: Language;
	onFieldChange: (mappingId: string, field: string, value: string | boolean) => void;
	onSave: (mappingId: string) => void;
	onDelete: (mappingId: string) => void;
	onDuplicate: (mappingId: string) => void;
	onMigrate: (mappingId: string) => void;
	onValidate: (mappingId: string) => void;
};

export function MappingCard(props: MappingCardProps) {
	const { entry, language, onFieldChange, onSave, onDelete, onDuplicate, onMigrate, onValidate } = props;
	const [collapsed, setCollapsed] = useState(true);
	const t = (key: Parameters<typeof getMessage>[1], values?: Parameters<typeof getMessage>[2]) => getMessage(language, key, values);

	return (
		<article class={`mapping-card ${collapsed ? 'collapsed' : ''}`} data-mapping-id={entry.id}>
			{/* ── Head (always visible, clickable to toggle) ── */}
			<div class="mapping-card-head" onClick={() => setCollapsed(!collapsed)}>
				<div class="mapping-card-head-left">
					<button
						type="button"
						class="collapse-toggle"
						onClick={event => { event.stopPropagation(); setCollapsed(!collapsed); }}
						aria-label={collapsed ? t('mapping.expand') : t('mapping.collapse')}
					>
						<span class={`collapse-chevron ${collapsed ? '' : 'open'}`}>›</span>
					</button>
					<div>
						<h2>
							<span class={`mapping-status-dot ${entry.enabled !== false ? 'on' : 'off'}`} />
							{entry.label}
						</h2>
						<p class="mapping-card-subtitle">
							{entry.host} · {entry.readingPrefix}
							{collapsed && (
								<span class="mapping-card-summary">
									{' · '}{entry.enabled !== false ? t('mapping.statusActive') : t('mapping.statusInactive')}
									{entry.actions.next.selectors.length > 0 && ` · ${t('mapping.selectorCount', { count: entry.actions.next.selectors.length })}`}
								</span>
							)}
						</p>
					</div>
				</div>
				<div class="mapping-card-head-actions" onClick={event => event.stopPropagation()}>
					{collapsed ? (
						<button type="button" class="primary" data-action="save" onClick={() => onSave(entry.id)}>
							{t('mapping.save')}
						</button>
					) : (
						<>
							<button type="button" class="ghost" data-action="validate" onClick={() => onValidate(entry.id)}>
								{t('mapping.test')}
							</button>
							<button type="button" class="ghost" data-action="migrate" onClick={() => onMigrate(entry.id)}>
								{t('mapping.migrate')}
							</button>
							<button type="button" class="ghost" data-action="duplicate" onClick={() => onDuplicate(entry.id)}>
								{t('mapping.duplicate')}
							</button>
							<button type="button" class="danger" data-action="delete" onClick={() => onDelete(entry.id)}>
								{t('mapping.delete')}
							</button>
						</>
					)}
				</div>
			</div>

			{/* ── Body (collapsible via CSS) ── */}
			<div class="mapping-card-body">
				{/* Identity fields */}
				<div class="field-grid cols-2">
					<Field label={t('mapping.label')}>
						<input type="text" data-input="label" value={entry.label} onInput={handleText(entry.id, 'label', onFieldChange)} />
					</Field>
					<Field label={t('mapping.mainHost')}>
						<input type="text" data-input="host" value={entry.host} placeholder="example.com" onInput={handleText(entry.id, 'host', onFieldChange)} />
					</Field>
				</div>

				<div class="field-grid cols-2">
					<Field label={t('mapping.readingPrefix')}>
						<input
							type="text"
							data-input="readingPrefix"
							value={entry.readingPrefix}
							placeholder="/leer/"
							onInput={handleText(entry.id, 'readingPrefix', onFieldChange)}
						/>
					</Field>
					<Field label={t('mapping.internalId')}>
						<input type="text" data-input="id" value={entry.id} disabled />
					</Field>
				</div>

				{/* Toggle + hint */}
				<div class="field-grid cols-2">
					<label class="toggle-row">
						<span class="field-label">{t('mapping.enable')}</span>
						<div class="toggle-switch">
							<input
								type="checkbox"
								data-input="enabled"
								checked={entry.enabled !== false}
								onChange={handleCheckbox(entry.id, 'enabled', onFieldChange)}
							/>
						</div>
					</label>
					<div class="hint-card">
						<strong>{t('mapping.migrations')}</strong>
						<p>{t('mapping.migrationHint')}</p>
					</div>
				</div>

				{/* Migration aliases */}
				<ActionSection title={t('mapping.compatibility')} arrow="~">
					<div class="field-grid cols-2">
						<Field label={t('mapping.compatibleHosts')}>
							<textarea
								data-input="hostAliases"
								value={entry.hostAliases.join('\n')}
								placeholder={'www.example.com\nreadermirror.net'}
								onInput={handleText(entry.id, 'hostAliases', onFieldChange)}
							/>
						</Field>
						<Field label={t('mapping.compatiblePrefixes')}>
							<textarea
								data-input="readingPrefixes"
								value={entry.readingPrefixes.join('\n')}
								placeholder={'/chapter/\n/capitulo/'}
								onInput={handleText(entry.id, 'readingPrefixes', onFieldChange)}
							/>
						</Field>
					</div>
				</ActionSection>

				<ActionSection title={t('mapping.shortcuts')} arrow="⌘">
					<div class="field-grid cols-3">
						<ShortcutField action="next" entry={entry} language={language} onFieldChange={onFieldChange} />
						<ShortcutField action="prev" entry={entry} language={language} onFieldChange={onFieldChange} />
						<ShortcutField action="main" entry={entry} language={language} onFieldChange={onFieldChange} />
					</div>
				</ActionSection>

				{/* Action sections */}
				<ActionBlock
					title={t('mapping.next')}
					arrow="→"
					prefix="next"
					action={entry.actions.next}
					mappingId={entry.id}
					language={language}
					onFieldChange={onFieldChange}
				/>
				<ActionBlock
					title={t('mapping.prev')}
					arrow="←"
					prefix="prev"
					action={entry.actions.prev}
					mappingId={entry.id}
					language={language}
					onFieldChange={onFieldChange}
				/>
				<ActionBlock
					title={t('mapping.main')}
					arrow="↑"
					prefix="main"
					action={entry.actions.main}
					mappingId={entry.id}
					language={language}
					onFieldChange={onFieldChange}
				/>
			</div>

			{/* ── Footer ── */}
			<div class="card-footer">
				<span class="timestamp">{t('mapping.updatedAt', { date: new Date(entry.updatedAt).toLocaleString() })}</span>
				<button type="button" data-action="validate" class="ghost" onClick={() => onValidate(entry.id)}>
					{t('mapping.testInTab')}
				</button>
				<button type="button" data-action="save" class="primary" onClick={() => onSave(entry.id)}>
					{t('mapping.saveMapping')}
				</button>
			</div>
		</article>
	);
}

function ShortcutField(props: {
	action: 'next' | 'prev' | 'main';
	entry: MappingEntry;
	language: Language;
	onFieldChange: MappingCardProps['onFieldChange'];
}) {
	const value = props.entry.shortcuts?.[props.action] || '';

	return (
		<Field label={getShortcutLabel(props.language, props.action)}>
			<input
				type="text"
				data-domain-shortcut-action={props.action}
				value={value ? formatShortcutKey(normalizeShortcutKeyInput(value)) : ''}
				placeholder={getMessage(props.language, 'mapping.useGlobal')}
				onInput={handleText(props.entry.id, `shortcuts.${props.action}`, props.onFieldChange)}
			/>
		</Field>
	);
}

function ActionSection(props: { title: string; arrow: string; children: any }) {
	return (
		<section class="action-section">
			<div class="action-section-head">
				<span class="action-arrow">{props.arrow}</span>
				<h3>{props.title}</h3>
			</div>
			<div class="action-section-body">
				{props.children}
			</div>
		</section>
	);
}

function ActionBlock(props: {
	title: string;
	arrow: string;
	prefix: 'next' | 'prev' | 'main';
	action: MappingEntry['actions']['next'];
	mappingId: string;
	language: Language;
	onFieldChange: MappingCardProps['onFieldChange'];
}) {
	const { title, arrow, prefix, action, mappingId, language, onFieldChange } = props;

	return (
		<ActionSection title={title} arrow={arrow}>
			<div class="field-grid cols-2">
				<Field label={getMessage(language, 'mapping.cssSelectors')}>
					<textarea
						data-input={`${prefix}.selectors`}
						value={action.selectors.join('\n')}
						onInput={handleText(mappingId, `${prefix}.selectors`, onFieldChange)}
					/>
				</Field>
				<div class="field-grid">
					<Field label={getMessage(language, 'mapping.fallbackText')}>
						<input
							type="text"
							data-input={`${prefix}.text`}
							value={action.text}
							onInput={handleText(mappingId, `${prefix}.text`, onFieldChange)}
						/>
					</Field>
					<Field label={getMessage(language, 'mapping.sampleHref')}>
						<input
							type="text"
							data-input={`${prefix}.sampleHref`}
							value={action.sampleHref}
							placeholder={getMessage(language, 'mapping.sampleHrefPlaceholder')}
							onInput={handleText(mappingId, `${prefix}.sampleHref`, onFieldChange)}
						/>
					</Field>
				</div>
			</div>
		</ActionSection>
	);
}

function getShortcutLabel(language: Language, action: ShortcutAction) {
	const key = `shortcuts.${action}` as Parameters<typeof getMessage>[1];
	return getMessage(language, key);
}

function Field(props: { label: string; children: JSX.Element }) {
	return (
		<div class="field">
			<span class="field-label">{props.label}</span>
			{props.children}
		</div>
	);
}

function handleText(
	mappingId: string,
	field: string,
	onFieldChange: MappingCardProps['onFieldChange']
) {
	return (event: JSX.TargetedEvent<HTMLInputElement | HTMLTextAreaElement, Event>) => {
		onFieldChange(mappingId, field, event.currentTarget.value);
	};
}

function handleCheckbox(
	mappingId: string,
	field: string,
	onFieldChange: MappingCardProps['onFieldChange']
) {
	return (event: JSX.TargetedEvent<HTMLInputElement, Event>) => {
		onFieldChange(mappingId, field, event.currentTarget.checked);
	};
}
