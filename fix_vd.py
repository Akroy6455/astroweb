import re

file_path = "src/lib/vargaDevtas.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

replacement_names = """const D150_NAMES = [
  "Vasudha", "Vaishnavi", "Brahmi", "Kalakuta", "Shankari", "Sudhakari", "Sama", "Saumya", "Sura", "Maya",
  "Manohara", "Madhavi", "Manjuswana", "Ghora", "Kumbhini", "Kutila", "Prabha", "Para", "Payaswini", "Mala",
  "Jagati", "Jarjhara", "Dhruva", "Musala", "Mudgara", "Pasha", "Champaka", "Damaka", "Mahi", "Kalusha",
  "Kamala", "Kanta", "Kala", "Karikara", "Kshama", "Durdhara", "Durbhaga", "Vishva", "Vishirna", "Vikata",
  "Avila", "Viprabha", "Sukhada", "Snigdha", "Sodara", "Surasundari", "Amrutaplavini", "Kala", "Kamadhuk", "Karavirini",
  "Gahvara", "Kundini", "Raudra", "Vishakhya", "Vishanashini", "Nirmada", "Sheetala", "Nimna", "Preeta", "Priyavardhini",
  "Managhna", "Durbhaga", "Chitra", "Chitrini", "Chiranjivini", "Bhupa", "Gadahara", "Nala", "Nalini", "Nirmala",
  "Nadi", "Sudhamritamshu", "Kalika", "Kalushankura", "Trailokyamohanakar", "Mahamari", "Sushitala", "Sukhada", "Suprabha", "Shobha",
  "Shobhana", "Shivada", "Shiva", "Bala", "Jvala", "Gada", "Gadhadhara", "Nutana", "Sumanohara", "Somavalli",
  "Somalata", "Mangala", "Mudrika", "Kshudha", "Mokshapavarga", "Balaya", "Navaneeta", "Nishachari", "Nirritti", "Nigada",
  "Sara", "Sangeeta", "Samada", "Sama", "Vishwambhara", "Kumari", "Kokila", "Kunjarakriti", "Aindra", "Swaha",
  "Swara", "Vahni", "Preeta", "Rakshajalaplava", "Varuni", "Madira", "Maitri", "Harini", "Harini", "Marut",
  "Dhananjaya", "Dhanakari", "Dhanada", "Kachhapambuja", "Mamshani", "Shoolini", "Raudri", "Shiva", "Shivakari", "Kala",
  "Kunda", "Mukunda", "Bharata", "Harita", "Kadali", "Smara", "Kandala", "Kokila", "Papa", "Kamini",
  "Kalashodbhava", "Veeraprasu", "Sangara", "Shatayajna", "Shatavari", "Prahvi", "Patalini", "Naga", "Pankaja", "Parameshwari"
];"""

content = re.sub(r'const D150_NAMES = \[.*?\];', replacement_names, content, flags=re.DOTALL)

def replace_div_sign_150(text):
    # Find getDivisionalSign function
    func_start = text.find('export function getDivisionalSign(')
    func_end = text.find('export function getDivPart(')
    func_body = text[func_start:func_end]
    
    old_case = """    case 150: {
      const p = Math.min(Math.floor(degInSign / 0.2), 149);
      if (isMovable) return (0 + p) % 12;
      if (isFixed) return (4 + p) % 12;
      return (8 + p) % 12;
    }"""
    
    new_case = """    case 150: {
      const p = Math.min(Math.floor(degInSign / 0.2), 149);
      let index = p;
      if (isFixed) {
        index = 149 - p;
      } else if (!isMovable && !isFixed) {
        index = p < 75 ? p + 75 : p - 75;
      }
      if (isMovable) return (0 + index) % 12;
      if (isFixed) return (4 + index) % 12;
      return (8 + index) % 12;
    }"""
    
    func_body = func_body.replace(old_case, new_case)
    return text[:func_start] + func_body + text[func_end:]

content = replace_div_sign_150(content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Done vargaDevtas.ts")
