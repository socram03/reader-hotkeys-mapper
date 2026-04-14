import { render } from 'preact';
import { OptionsApp } from './OptionsApp';

const container = document.getElementById('app');

if (!container) {
	throw new Error('No encontre el contenedor de opciones.');
}

render(<OptionsApp />, container);
