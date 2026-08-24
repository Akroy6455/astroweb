const FormData = require('form-data');
const form = new FormData();
form.append('name', 'Current Transit');
form.append('date', '2026-08-24');
form.append('time', '15:52:04');
form.append('lat', '25.78');
form.append('lon', '87.48');
form.append('ianaTz', 'Asia/Kolkata');
form.append('ayanamsha', 'Raman');

form.submit({
  host: 'localhost',
  port: 3000,
  path: '/',
  headers: {
    'Next-Action': '40b8029484e3a65921e9544e043901342a35084bc7',
    'Accept': 'text/x-component'
  }
}, function(err, res) {
  if (err) {
    console.error(err);
    return;
  }
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Response:', data));
});
