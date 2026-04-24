import { render } from 'preact';
import { ContinueReadingApp } from './ContinueReadingApp';

const container = document.getElementById('app');

if (!container) {
	throw new Error('Could not find the continue reading container.');
}

render(<ContinueReadingApp />, container);
