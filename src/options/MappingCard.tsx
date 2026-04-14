import type { JSX } from 'preact';
import { useState } from 'preact/hooks';
import type { MappingEntry } from './types';

type MappingCardProps = {
	entry: MappingEntry;
	onFieldChange: (mappingId: string, field: string, value: string | boolean) => void;
	onSave: (mappingId: string) => void;
	onDelete: (mappingId: string) => void;
	onDuplicate: (mappingId: string) => void;
	onMigrate: (mappingId: string) => void;
};

export function MappingCard(props: MappingCardProps) {
	const { entry, onFieldChange, onSave, onDelete, onDuplicate, onMigrate } = props;
	const [collapsed, setCollapsed] = useState(true);

	return (
		<article class={`mapping-card ${collapsed ? 'collapsed' : ''}`} data-mapping-id={entry.id}>
			{/* ── Head (always visible, clickable to toggle) ── */}
			<div class="mapping-card-head" onClick={() => setCollapsed(!collapsed)}>
				<div class="mapping-card-head-left">
					<button
						type="button"
						class="collapse-toggle"
						onClick={event => { event.stopPropagation(); setCollapsed(!collapsed); }}
						aria-label={collapsed ? 'Expandir' : 'Minimizar'}
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
									{' · '}{entry.enabled !== false ? 'Activo' : 'Inactivo'}
									{entry.actions.next.selectors.length > 0 && ` · ${entry.actions.next.selectors.length} sel.`}
								</span>
							)}
						</p>
					</div>
				</div>
				<div class="mapping-card-head-actions" onClick={event => event.stopPropagation()}>
					{collapsed ? (
						<button type="button" class="primary" data-action="save" onClick={() => onSave(entry.id)}>
							Guardar
						</button>
					) : (
						<>
							<button type="button" class="ghost" data-action="migrate" onClick={() => onMigrate(entry.id)}>
								Migrar
							</button>
							<button type="button" class="ghost" data-action="duplicate" onClick={() => onDuplicate(entry.id)}>
								Duplicar
							</button>
							<button type="button" class="danger" data-action="delete" onClick={() => onDelete(entry.id)}>
								Borrar
							</button>
						</>
					)}
				</div>
			</div>

			{/* ── Body (collapsible via CSS) ── */}
			<div class="mapping-card-body">
				{/* Identity fields */}
				<div class="field-grid cols-2">
					<Field label="Etiqueta">
						<input type="text" data-input="label" value={entry.label} onInput={handleText(entry.id, 'label', onFieldChange)} />
					</Field>
					<Field label="Host principal">
						<input type="text" data-input="host" value={entry.host} placeholder="ejemplo.com" onInput={handleText(entry.id, 'host', onFieldChange)} />
					</Field>
				</div>

				<div class="field-grid cols-2">
					<Field label="Prefijo de lectura">
						<input
							type="text"
							data-input="readingPrefix"
							value={entry.readingPrefix}
							placeholder="/leer/"
							onInput={handleText(entry.id, 'readingPrefix', onFieldChange)}
						/>
					</Field>
					<Field label="ID interno">
						<input type="text" data-input="id" value={entry.id} disabled />
					</Field>
				</div>

				{/* Toggle + hint */}
				<div class="field-grid cols-2">
					<label class="toggle-row">
						<span class="field-label">Activar este mapeo</span>
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
						<strong>Migraciones</strong>
						<p>Usa alias de host y prefijos para sobrevivir cambios de dominio o rutas.</p>
					</div>
				</div>

				{/* Migration aliases */}
				<ActionSection title="Compatibilidad" arrow="~">
					<div class="field-grid cols-2">
						<Field label="Hosts compatibles (uno por linea)">
							<textarea
								data-input="hostAliases"
								value={entry.hostAliases.join('\n')}
								placeholder={'www.ejemplo.com\nlectormirror.net'}
								onInput={handleText(entry.id, 'hostAliases', onFieldChange)}
							/>
						</Field>
						<Field label="Prefijos compatibles (uno por linea)">
							<textarea
								data-input="readingPrefixes"
								value={entry.readingPrefixes.join('\n')}
								placeholder={'/chapter/\n/capitulo/'}
								onInput={handleText(entry.id, 'readingPrefixes', onFieldChange)}
							/>
						</Field>
					</div>
				</ActionSection>

				{/* Action sections */}
				<ActionBlock
					title="Siguiente"
					arrow="→"
					prefix="next"
					action={entry.actions.next}
					mappingId={entry.id}
					onFieldChange={onFieldChange}
				/>
				<ActionBlock
					title="Anterior"
					arrow="←"
					prefix="prev"
					action={entry.actions.prev}
					mappingId={entry.id}
					onFieldChange={onFieldChange}
				/>
				<ActionBlock
					title="Principal"
					arrow="↑"
					prefix="main"
					action={entry.actions.main}
					mappingId={entry.id}
					onFieldChange={onFieldChange}
				/>
			</div>

			{/* ── Footer ── */}
			<div class="card-footer">
				<span class="timestamp">{`Actualizado ${new Date(entry.updatedAt).toLocaleString()}`}</span>
				<button type="button" data-action="save" class="primary" onClick={() => onSave(entry.id)}>
					Guardar mapeo
				</button>
			</div>
		</article>
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
	onFieldChange: MappingCardProps['onFieldChange'];
}) {
	const { title, arrow, prefix, action, mappingId, onFieldChange } = props;

	return (
		<ActionSection title={title} arrow={arrow}>
			<div class="field-grid cols-2">
				<Field label="Selectores CSS (uno por linea)">
					<textarea
						data-input={`${prefix}.selectors`}
						value={action.selectors.join('\n')}
						onInput={handleText(mappingId, `${prefix}.selectors`, onFieldChange)}
					/>
				</Field>
				<div class="field-grid">
					<Field label="Texto fallback">
						<input
							type="text"
							data-input={`${prefix}.text`}
							value={action.text}
							onInput={handleText(mappingId, `${prefix}.text`, onFieldChange)}
						/>
					</Field>
					<Field label="Href fallback">
						<input
							type="text"
							data-input={`${prefix}.sampleHref`}
							value={action.sampleHref}
							onInput={handleText(mappingId, `${prefix}.sampleHref`, onFieldChange)}
						/>
					</Field>
				</div>
			</div>
		</ActionSection>
	);
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
