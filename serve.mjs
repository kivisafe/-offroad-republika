import { createRequire } from 'module';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const servePath = require.resolve('serve/build/main.js');
process.argv = [process.argv[0], servePath, __dirname, '-l', '3000', '--no-clipboard'];
await import('file:///' + servePath.replace(/\\/g, '/'));
