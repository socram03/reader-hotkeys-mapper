import { useState } from 'preact/hooks';
import { formatShortcutKey, shortcutFromKeyboardEvent } from '../shared';

type ShortcutCaptureInputProps = {
	id?: string;
	value: string;
	placeholder?: string;
	dataAttribute: string;
	action: string;
	onChange: (value: string) => void;
};

export function ShortcutCaptureInput(props: ShortcutCaptureInputProps) {
	const [escapeCount, setEscapeCount] = useState(0);

	function handleKeyDown(event: KeyboardEvent) {
		event.preventDefault();
		event.stopPropagation();

		if (event.key === 'Escape') {
			if (escapeCount === 0) {
				setEscapeCount(1);
				return;
			}

			props.onChange('');
			setEscapeCount(0);
			return;
		}

		const shortcut = shortcutFromKeyboardEvent(event);
		if (!shortcut) return;

		props.onChange(shortcut);
		setEscapeCount(0);
	}

	return (
		<input
			id={props.id}
			type="text"
			readOnly
			data-shortcut-capture="true"
			{...{ [props.dataAttribute]: props.action }}
			value={props.value ? formatShortcutKey(props.value) : ''}
			placeholder={props.placeholder}
			onFocus={() => setEscapeCount(0)}
			onBlur={() => setEscapeCount(0)}
			onKeyDown={handleKeyDown}
		/>
	);
}
