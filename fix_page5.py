with open('src/app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("setError(SERVER HTTP ERROR  + apiRes.status + :  + text.substring(0, 100));", "setError('SERVER HTTP ERROR ' + apiRes.status + ': ' + text.substring(0, 100));")
content = content.replace("setError(SERVER HTTP ERROR : );", "setError('SERVER HTTP ERROR ' + apiRes.status + ': ' + text.substring(0, 100));")

with open('src/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
