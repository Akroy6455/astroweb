const form = new FormData();
form.append('name', 'Current Transit');
form.append('date', '2026-08-24');
form.append('time', '15:52:04');
form.append('lat', '25.78');
form.append('lon', '87.48');
form.append('ianaTz', 'Asia/Kolkata');
form.append('ayanamsha', 'Raman');

fetch('http://localhost:3000/', {
  method: 'POST',
  headers: {
    'Next-Action': '40b8029484e3a65921e9544e043901342a35084bc7',
    'Accept': 'text/x-component'
  },
  body: form
}).then(res => res.text()).then(console.log).catch(console.error);
