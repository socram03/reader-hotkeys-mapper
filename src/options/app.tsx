import { render } from 'preact';
import { OptionsApp } from './OptionsApp';

const container = document.getElementById('app');

if (!container) {
	throw new Error('Could not find the options container.');
}

render(<OptionsApp />, container);
