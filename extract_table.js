const fs = require('fs');
const transcriptPath = String.raw`C:\Users\lalit\.gemini\antigravity-ide\brain\1e3cb9eb-02df-4758-bd0f-37878f3e4484\.system_generated\logs\transcript.jsonl`;
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');

for (const line of lines) {
    if (!line.trim()) continue;
    if (line.includes('Historial de actualizaciones') && line.includes('TargetFile')) {
        const json = JSON.parse(line);
        if (json.tool_calls) {
            for (const call of json.tool_calls) {
                if (call.name === 'multi_replace_file_content') {
                    console.log("Found it!");
                    fs.writeFileSync('table_code.json', JSON.stringify(call.args, null, 2), 'utf8');
                    process.exit(0);
                }
            }
        }
    }
}
console.log("Not found.");
