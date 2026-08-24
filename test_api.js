const payload = {
  dateStr: "2026-08-24",
  timeStr: "16:45:34",
  lat: 25.78,
  lon: 87.48,
  tzOffset: 5.5,
  ayanamsha: "Raman"
};
fetch('http://localhost:3000/api/chart', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
}).then(r => r.text()).then(t => console.log(t));
