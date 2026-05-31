const fs = require('fs');
const https = require('https');
const path = require('path');

const files = ['sepl_18.se1', 'semo_18.se1', 'seas_18.se1'];
const baseUrl = 'https://raw.githubusercontent.com/aloistr/swisseph/master/ephe/';
const dir = path.join(__dirname, 'ephe');

if (!fs.existsSync(dir)) fs.mkdirSync(dir);

async function download() {
  for (const file of files) {
    const dest = path.join(dir, file);
    if (fs.existsSync(dest)) continue;
    console.log('Downloading', file);
    await new Promise((resolve, reject) => {
      https.get(baseUrl + file, (response) => {
        if (response.statusCode !== 200) {
           return reject(new Error(`Failed to get '${file}' (${response.statusCode})`));
        }
        const fileStream = fs.createWriteStream(dest);
        response.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });
      }).on('error', err => {
        fs.unlink(dest, () => reject(err));
      });
    });
  }
  console.log('Done downloading ephe files.');
}

download().catch(console.error);
