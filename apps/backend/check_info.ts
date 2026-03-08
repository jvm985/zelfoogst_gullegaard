
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CROPS = [
  'Aardappel (Vroeg)',
  'Wortel (Nantes)',
  'Bloemkool',
  'Sla (Kropsla)',
  'Uien (Pootui)',
  'Prei (Herfst)',
  'Stokboon',
  'Courgette',
  'Spinazie',
  'Rode Biet',
  'Pompoen',
  'Basilicum',
  'Peterselie',
  'Boerenkool',
  'Venkel (Knol)'
];

async function main() {
  const crops = await prisma.crop.findMany({
    where: {
      name: {
        in: CROPS
      }
    }
  });

  console.log('Found crops:');
  crops.forEach(c => console.log(`${c.name}: ${c.id}`));

  const missing = CROPS.filter(name => !crops.find(c => c.name === name));
  console.log('\nMissing crops:', missing);

  const admin = await prisma.user.findUnique({ where: { email: 'admin@mijn-csa.be' } });
  console.log(`Admin user: ${admin ? admin.email : 'NOT FOUND'}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
