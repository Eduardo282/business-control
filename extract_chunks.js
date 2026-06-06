const fs = require('fs');
const jsonStr = fs.readFileSync('table_code.json', 'utf8');
const obj = JSON.parse(jsonStr);
const chunksStr = obj.ReplacementChunks;
const chunks = JSON.parse(chunksStr);

// We want chunks[0].ReplacementContent and chunks[1].ReplacementContent
for (let i = 0; i < chunks.length; i++) {
  fs.writeFileSync(`chunk_${i}.txt`, chunks[i].ReplacementContent, 'utf8');
}
console.log("Extracted chunks");
