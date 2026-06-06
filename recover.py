import json
import re

transcript_path = r"C:\Users\lalit\.gemini\antigravity-ide\brain\1e3cb9eb-02df-4758-bd0f-37878f3e4484\.system_generated\logs\transcript.jsonl"

file_content = []
found_first = False

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        step = json.loads(line)
        if step.get('type') == 'TOOL_RESPONSE':
            content = str(step.get('content', ''))
            if 'Showing lines 1 to 800' in content:
                lines = content.split('\n')
                for l in lines:
                    if re.match(r'^\d+:', l):
                        code_line = re.sub(r'^\d+: ?', '', l)
                        file_content.append(code_line)
                found_first = True
                break

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        step = json.loads(line)
        if step.get('type') == 'TOOL_RESPONSE':
            content = str(step.get('content', ''))
            if 'Showing lines 800 to 803' in content:
                lines = content.split('\n')
                for l in lines:
                    if re.match(r'^\d+:', l):
                        if l.startswith('800:'): continue
                        code_line = re.sub(r'^\d+: ?', '', l)
                        file_content.append(code_line)
                break

with open(r"C:\Users\lalit\Documentos\BUSINESS-CONTROL\business-control\business-control\frontend\src\pages\home\ProductDetail.jsx", 'w', encoding='utf-8') as out:
    out.write('\n'.join(file_content))
print("File recovered. Lines:", len(file_content))
