const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up database...');
  await prisma.familyMember.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.crop.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding admin user...');
  const adminPassword = await bcrypt.hash('Karekiet1', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@gullegaard.be',
      name: 'Admin Boer',
      password: adminPassword,
      role: 'ADMIN',
      isVerified: true,
    },
  });

  console.log('Seeding test users...');
  const userPassword = await bcrypt.hash('test1234', 10);
  const user1 = await prisma.user.create({
    data: {
      email: 'jan@voorbeeld.be',
      name: 'Jan Janssen',
      password: userPassword,
      role: 'USER',
      isVerified: true,
    },
  });

  console.log('Seeding crops...');
  const cropsData = [
    { name: 'Wortelen', description: 'Sappige oranje wortelen', isHarvestable: true, fieldLocation: 'Blok 1' },
    { name: 'Kropsla', description: 'Malse groene kropsla', isHarvestable: true, fieldLocation: 'Blok 2' },
    { name: 'Bloemkool', description: 'Witte bloemkool in wording', isHarvestable: false, fieldLocation: 'Blok 3' },
    { name: 'Aardappelen', description: 'Vroege Nicola aardappelen', isHarvestable: true, fieldLocation: 'Blok 4' },
    { name: 'Prei', description: 'Wintervaste prei', isHarvestable: true, fieldLocation: 'Blok 5' },
    { name: 'Rode Bieten', description: 'Rode bieten voor salades', isHarvestable: false, fieldLocation: 'Blok 6' },
    { name: 'Spinazie', description: 'Frisse jonge spinazie', isHarvestable: true, fieldLocation: 'Tunnel 1' },
  ];

  const createdCrops = [];
  for (const crop of cropsData) {
    const c = await prisma.crop.create({ data: crop });
    createdCrops.push(c);
  }

  console.log('Seeding recipes...');
  // Find crops for recipes
  const wortelen = createdCrops.find(c => c.name === 'Wortelen');
  const spinazie = createdCrops.find(c => c.name === 'Spinazie');
  const sla = createdCrops.find(c => c.name === 'Kropsla');

  await prisma.recipe.create({
    data: {
      title: 'Wortel-Gember Soep',
      harvestableCrops: {
        connect: [{ id: wortelen.id }]
      },
      otherIngredients: 'Gember, Ui, Bouillon',
      content: '1. Snij de wortelen en ui. 2. Fruit de ui met gember. 3. Voeg wortelen en bouillon toe. 4. Kook 20 min en pureer.',
      authorId: admin.id,
    },
  });

  await prisma.recipe.create({
    data: {
      title: 'Verse Spinazie-Sla Mix',
      harvestableCrops: {
        connect: [{ id: spinazie.id }, { id: sla.id }]
      },
      otherIngredients: 'Radijsjes, Olijfolie, Azijn',
      content: 'Was de spinazie en sla grondig. Meng met radijsjes en een simpele vinaigrette.',
      authorId: user1.id,
    },
  });

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
