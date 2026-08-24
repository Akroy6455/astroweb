import re

with open('src/app/actions.ts', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = r"  \} catch \(err: any\) \{\n    console\.error\(\"CRITICAL ERROR IN getKundliData:\", err\);\n    return \{ __error: err\.message, stack: err\.stack \};\n  \}\n\}\n  \} catch \(err: any\) \{\n    console\.error\(\"CRITICAL ERROR IN getKundliData:\", err\);\n    return \{ __error: err\.message, stack: err\.stack \};\n  \}"
replacement = r"  } catch (err: any) {\n    console.error(\"CRITICAL ERROR IN getKundliData:\", err);\n    return { __error: err.message, stack: err.stack };\n  }\n}"
content = re.sub(pattern, replacement, content)

with open('src/app/actions.ts', 'w', encoding='utf-8') as f:
    f.write(content)
