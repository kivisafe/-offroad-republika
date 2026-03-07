const path = require('path');
const servePath = path.join(process.env.APPDATA, 'npm', 'node_modules', 'serve', 'build', 'main.js');
process.argv = [process.argv[0], servePath, '.', '-l', '3000', '--no-clipboard'];
require(servePath);
