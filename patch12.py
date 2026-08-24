import re

with open('src/app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

new_handlesubmit = '''
      const payload = {
        dateStr: formData.get('date'),
        timeStr: formData.get('time'),
        lat: parseFloat(formData.get('lat') as string),
        lon: parseFloat(formData.get('lon') as string),
        tzOffset: parseFloat(formData.get('tzOffset') as string),
        ianaTz: formData.get('ianaTz'),
        ayanamsha: formData.get('ayanamsha') || 'Raman'
      };
      
      const apiRes = await fetch('/api/chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!apiRes.ok) {
        const text = await apiRes.text();
        setError(SERVER HTTP ERROR \: \);
        return;
      }
      
      const rawRes = await apiRes.json();
      
      if (rawRes && ("__error" in rawRes ? rawRes.__error : undefined)) {
        setError("SERVER ERROR: " + ("__error" in rawRes ? rawRes.__error : undefined));
        return;
      }
      
      const res = rawRes.__success ? rawRes.__success : rawRes;
      setData(res);
'''

pattern = r"const payload = \{.*?setData\(res\);"
content = re.sub(pattern, new_handlesubmit.strip(), content, flags=re.DOTALL)

with open('src/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
