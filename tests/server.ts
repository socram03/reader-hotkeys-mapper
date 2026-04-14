import fs from 'fs';
import http from 'http';
import path from 'path';

const ROOT = path.join(__dirname, 'fixtures');
const PORT = Number(process.env.PORT || 4173);

const MIME_TYPES: Record<string, string> = {
	'.html': 'text/html; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.js': 'application/javascript; charset=utf-8',
	'.json': 'application/json; charset=utf-8'
};

http.createServer((request, response) => {
	const requestPath = decodeURIComponent((request.url || '/').split('?')[0]);
	const safePath = requestPath === '/' ? '/index.html' : requestPath;
	const absolutePath = path.join(ROOT, safePath);

	if (!absolutePath.startsWith(ROOT)) {
		response.writeHead(403);
		response.end('Forbidden');
		return;
	}

	fs.readFile(absolutePath, (error, content) => {
		if (error) {
			response.writeHead(404);
			response.end('Not found');
			return;
		}

		const ext = path.extname(absolutePath).toLowerCase();
		response.writeHead(200, {
			'Content-Type': MIME_TYPES[ext] || 'text/plain; charset=utf-8'
		});
		response.end(content);
	});
}).listen(PORT, '127.0.0.1', () => {
	console.log(`Fixture server listening on http://127.0.0.1:${PORT}`);
});
