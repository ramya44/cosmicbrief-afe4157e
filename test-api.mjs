// Test the deployed API
const response = await fetch('https://dmzpgwsxrcesfmhkcmkd.supabase.co/functions/v1/get-kundli-data', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtenBnd3N4cmNlc2ZtaGtjbWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4OTU0NjQsImV4cCI6MjA1MjQ3MTQ2NH0.zmUvRTVao0y7iLCUHHIixq_KMvFSRnn3YqQZMDxshlE'
  },
  body: JSON.stringify({
    datetime: '1986-12-27T07:50:00Z',
    latitude: 33.7879,
    longitude: -117.8531
  })
});

const data = await response.json();

console.log('Ascendant:', data.ascendant_sign, '(sign_id:', data.ascendant_sign_id + ')');
console.log('\nPlanetary Positions:');
console.log('Planet     | Sign        | sign_id | full_degree');
console.log('-'.repeat(55));

for (const p of data.planetary_positions) {
  console.log(`${p.name.padEnd(10)} | ${p.sign.padEnd(11)} | ${String(p.sign_id).padStart(7)} | ${p.full_degree.toFixed(2)}°`);
}

// Calculate expected houses with whole-sign system
console.log('\nExpected House Placements (whole-sign):');
const ascSignId = data.ascendant_sign_id;
for (const p of data.planetary_positions) {
  const house = ((p.sign_id - ascSignId + 12) % 12) + 1;
  console.log(`${p.name.padEnd(10)} in ${p.sign.padEnd(11)} → House ${house}`);
}
