const https = require('https');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const URL = 'https://download.geonames.org/export/dump/cities15000.zip';
const ZIP_PATH = path.join(__dirname, 'cities15000.zip');
const DEST_JSON_PATH = path.join(__dirname, '..', 'src', 'lib', 'cities.json');

console.log('Downloading GeoNames cities15000.zip...');

const file = fs.createWriteStream(ZIP_PATH);
https.get(URL, (response) => {
  response.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log('Download complete. Extracting and parsing...');
    
    try {
      const zip = new AdmZip(ZIP_PATH);
      const zipEntries = zip.getEntries();
      const txtEntry = zipEntries.find(entry => entry.entryName === 'cities15000.txt');
      
      if (!txtEntry) {
        throw new Error('cities15000.txt not found inside the zip file.');
      }

      const content = txtEntry.getData().toString('utf8');
      const lines = content.split('\n');
      
      const cities = [];
      
      lines.forEach(line => {
        if (!line.trim()) return;
        const cols = line.split('\t');
        
        // GeoNames format:
        // 0: geonameid, 1: name, 2: asciiname, 3: alternatenames, 4: latitude, 5: longitude
        // 6: feature class, 7: feature code, 8: country code, 9: cc2, 10: admin1 code
        // ... 17: timezone
        
        const name = cols[1];
        const admin1 = cols[10] || '';
        const country = cols[8];
        const lat = parseFloat(cols[4]);
        const lon = parseFloat(cols[5]);
        const tz = cols[17];
        
        if (name && !isNaN(lat) && !isNaN(lon) && tz) {
          cities.push([name, admin1, country, lat, lon, tz]);
        }
      });
      
      // Sort alphabetically for better basic search UX if needed
      cities.sort((a, b) => a[0].localeCompare(b[0]));
      
      // Save to JSON
      fs.writeFileSync(DEST_JSON_PATH, JSON.stringify(cities));
      console.log(`Successfully generated ${DEST_JSON_PATH} with ${cities.length} cities.`);
      
      // Clean up zip
      fs.unlinkSync(ZIP_PATH);
      console.log('Cleanup complete.');
      
    } catch (err) {
      console.error('Error during extraction/parsing:', err);
    }
  });
}).on('error', (err) => {
  fs.unlink(ZIP_PATH, () => {});
  console.error('Download error:', err.message);
});
