import { render } from 'preact';
import { PopupApp } from './PopupApp';

const container = document.getElementById('app');

if (!container) {
	throw new Error('Could not find the popup container.');
}

render(<PopupApp />, container);
