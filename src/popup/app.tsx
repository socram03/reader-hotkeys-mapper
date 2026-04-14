import { render } from 'preact';
import { PopupApp } from './PopupApp';

const container = document.getElementById('app');

if (!container) {
	throw new Error('No encontre el contenedor del popup.');
}

render(<PopupApp />, container);
