const fs = require('fs');
const file = 'apps/backend/prisma/schema.prisma';
let content = fs.readFileSync(file, 'utf8');

// Update Block model
content = content.replace(
  /model Block \{([\s\S]*?)length\s+Float\s+@default\(10\)/,
  'model Block {$1length         Float           @default(10)\n  bedWidth       Float           @default(0.75)'
);

// Update Crop model
content = content.replace(
  /model Crop \{([\s\S]*?)rowSpacing\s+Float\s+@default\(30\)/,
  'model Crop {$1rowSpacing      Float          @default(30)\n  seedsPerSqm     Float          @default(0)\n  pricePerSeedSqm Float          @default(0)'
);

fs.writeFileSync(file, content);
