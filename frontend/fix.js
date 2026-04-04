const fs = require('fs');
let c = fs.readFileSync('src/pages/home/CreateQuote.jsx', 'utf8');
c = c.replace(/<span className=\"text-sm\">Agregar<\/span>\s*\{qty > 0 && <span className=\"text-\[10px\] bg-white\/20 px-1\.5 rounded-full mt-1\">\{qty\} en lista<\/span>\}/g, '{qty > 0 ? <span className=\"text-sm font-medium\">{qty} en lista</span> : <span className=\"text-sm\">Agregar</span>}');
fs.writeFileSync('src/pages/home/CreateQuote.jsx', c);
