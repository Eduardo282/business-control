const fs = require('fs');
const json = JSON.parse(fs.readFileSync('table_code.json', 'utf8'));
const chunks = JSON.parse(json.ReplacementChunks);
fs.writeFileSync('table_snippet.txt', chunks[1].ReplacementContent, 'utf8');
console.log("Done");
