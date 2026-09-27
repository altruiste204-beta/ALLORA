import os, re
from collections import defaultdict

file_counts = defaultdict(int)
file_issues = defaultdict(list)

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            for line_idx, line in enumerate(content.split('\n'), 1):
                # Search for dark text without dark:
                if re.search(r'text-\[#(?:19344A|0D1B2A|111315)\](?!.*?dark:text-)', line):
                    file_counts[path] += 1
                    file_issues[path].append((line_idx, line.strip()))
                elif re.search(r'text-slate-[89]00(?!.*?dark:text-)', line) or re.search(r'text-gray-[89]00(?!.*?dark:text-)', line):
                    file_counts[path] += 1
                    file_issues[path].append((line_idx, line.strip()))

for p, c in sorted(file_counts.items(), key=lambda x: -x[1]):
    print(f"{p}: {c} instances")
