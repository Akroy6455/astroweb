import re

with open('src/app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

new_handlesubmit = '''
      const resData = await getKundliData(formData);
      
      if (resData && ("__error" in resData ? resData.__error : undefined)) {
        setError("SERVER ERROR: " + ("__error" in resData ? resData.__error : undefined));
        return;
      }
      
      const res = resData.__success ? JSON.parse(resData.__success) : resData;
      setData(res);
'''

pattern = r"const payload = \{.*?setData\(res\);"
content = re.sub(pattern, new_handlesubmit.strip(), content, flags=re.DOTALL)

with open('src/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
