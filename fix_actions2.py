import re

with open('src/app/actions.ts', 'r', encoding='utf-8') as f:
    content = f.read()

new_getkundlidata = '''
export async function getKundliData(formData: FormData) {
  try {
    const dateStr = formData.get('date') as string;
    const timeStr = formData.get('time') as string;
    const lat = parseFloat(formData.get('lat') as string);
    const lon = parseFloat(formData.get('lon') as string);
    
    let tzOffset = parseFloat(formData.get('tzOffset') as string);
    const ianaTz = formData.get('ianaTz') as string;
    const ayanamsha = (formData.get('ayanamsha') as string) || 'Raman';
  
    if (!dateStr || !timeStr || isNaN(lat) || isNaN(lon)) {
      return { __error: 'Invalid input data: Missing date, time, lat, or lon' };
    }
  
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hour, minute, second = 0] = timeStr.split(':').map(Number);
  
    if (ianaTz) {
      const dt = DateTime.fromObject({ year, month, day, hour, minute, second }, { zone: ianaTz });
      tzOffset = dt.offset / 60; // offset in minutes -> hours
    } else if (isNaN(tzOffset)) {
      return { __error: 'No Timezone or tzOffset provided' };
    }
  
    let utDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    utDate.setMinutes(utDate.getMinutes() - tzOffset * 60);
  
    const localDate = new Date(year, month - 1, day);
    const localDayOfWeek = localDate.getDay();
  
    const res = calculateChart(
        utDate.getUTCFullYear(), 
        utDate.getUTCMonth() + 1, 
        utDate.getUTCDate(), 
        utDate.getUTCHours() + utDate.getUTCMinutes() / 60 + utDate.getUTCSeconds() / 3600, 
        lat, 
        lon,
        localDayOfWeek,
        ayanamsha
    );
    try {
      const jsonStr = JSON.stringify(res);
      return { __success: jsonStr };
    } catch (stringifyErr: any) {
      return { __error: "JSON Stringify failed: " + stringifyErr.message };
    }
  } catch (err: any) {
    console.error("CRITICAL ERROR IN getKundliData:", err);
    return { __error: err.message, stack: err.stack };
  }
}
'''

pattern = r"export async function getKundliData\(formData: FormData\).*?\} catch \(err: any\) \{.*?return \{ __error: err\.message, stack: err\.stack \};\n  \}\n\}"
content = re.sub(pattern, new_getkundlidata.strip(), content, flags=re.DOTALL)

with open('src/app/actions.ts', 'w', encoding='utf-8') as f:
    f.write(content)
