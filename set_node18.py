import json

with open('package.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

data['engines']['node'] = "18.x"

with open('package.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2)
