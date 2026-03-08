const fs = require('fs');
const file = 'recepten.json';
let data = JSON.parse(fs.readFileSync(file, 'utf8'));

const noise = [
  'informatie',
  'Onze pakketten',
  'Deze week in je box',
  'Afhaalpunten',
  'Word coöperant',
  'snelle links',
  'Webshop',
  'Over de boerderij',
  'Recepten',
  'Openingsuren winkel',
  'klantenservice',
  'Veelgestelde Vragen pakket',
  'Contact',
  'Algemene voorwaarden pakket',
  'Privacyverklaring',
  'Nieuwsbrief',
  'Blijf op de hoogte van De Wassende Maan! Schrijf je in voor onze nieuwsbrief en mis niets!',
  'Copyright © 2025 door De Wassende Maan. Alle rechten voorbehouden.',
  'Betaalmethoden'
];

data = data.map(r => {
  let content = r.content;
  noise.forEach(n => {
    // Remove the noise item and everything after it if it looks like a footer
    const idx = content.indexOf(n);
    if (idx !== -1 && idx > content.length * 0.5) {
      content = content.substring(0, idx).trim();
    }
  });
  return { ...r, content };
});

fs.writeFileSync(file, JSON.stringify(data, null, 2));
console.log('recepten.json opgeschoond.');
