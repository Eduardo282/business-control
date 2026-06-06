const fs = require('fs');

const line1 = fs.readFileSync('line1.jsonl', 'utf8').trim();
const line2 = fs.readFileSync('line2.jsonl', 'utf8').trim();

const json1 = JSON.parse(line1);
const json2 = JSON.parse(line2);

const content1 = json1.content;
const content2 = json2.content;

const fileContent = [];

for (const l of content1.split('\n')) {
    const match = l.match(/^\d+:(.*)/);
    if (match) {
        fileContent.push(match[1].replace(/^ /, ''));
    }
}

for (const l of content2.split('\n')) {
    if (l.startsWith('800:')) continue;
    const match = l.match(/^\d+:(.*)/);
    if (match) {
        fileContent.push(match[1].replace(/^ /, ''));
    }
}

fs.writeFileSync(`frontend/src/pages/home/ProductDetail.jsx`, fileContent.join('\n'), 'utf8');
console.log('Recovered lines:', fileContent.length);
