// Static server for Laravel Cloud: serves the Vite build with SPA fallback.
import express from 'express';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';

const dist = join(dirname(fileURLToPath(import.meta.url)), 'dist');
const app = express();
app.disable('x-powered-by');
app.use(express.static(dist, {maxAge: '1h', index: 'index.html'}));
app.get('/{*splat}', (_req, res) => res.sendFile(join(dist, 'index.html')));

const port = Number(process.env.PORT) || 8080;
const server = app.listen(port, () => console.log(`listening on ${port}`));
process.on('SIGTERM', () => server.close(() => process.exit(0)));
