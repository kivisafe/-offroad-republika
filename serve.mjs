import { createRequire } from 'module';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const servePath = require.resolve('serve/build/main.js');
const port = process.env.PORT || '3000';
process.argv = [process.argv[0], servePath, __dirname, '-l', port, '--no-clipboard'];
await import('file:///' + servePath.replace(/\\/g, '/'));
