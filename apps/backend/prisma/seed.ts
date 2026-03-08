const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('Database opschonen...');
  await prisma.familyMember.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.cultivationTask.deleteMany();
  await prisma.cultivation.deleteMany();
  await prisma.bed.deleteMany();
  await prisma.block.deleteMany();
  await prisma.field.deleteMany();
  await prisma.newsPost.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.crop.deleteMany();
  await prisma.cropFamily.deleteMany();
  await prisma.rotationGroup.deleteMany();
  await prisma.user.deleteMany();

  const gewassenPath = path.join(__dirname, '../gewassen.json');
  const receptenPath = path.join(__dirname, '../recepten.json');

  const gewassenData = JSON.parse(fs.readFileSync(gewassenPath, 'utf8'));
  const receptenData = JSON.parse(fs.readFileSync(receptenPath, 'utf8'));

  const adminPassword = await bcrypt.hash('Karekiet1', 10);
  const admin = await prisma.user.create({
    data: { email: 'admin@mijn-csa.be', name: 'Admin Boer', password: adminPassword, role: 'ADMIN', isVerified: true },
  });

  const janPassword = await bcrypt.hash('test1234', 10);
  const jan = await prisma.user.create({
    data: { email: 'jan@voorbeeld.be', name: 'Jan de Deelnemer', password: janPassword, role: 'USER', isVerified: true },
  });

  // Create memberships for 2026
  await prisma.membership.create({
    data: {
      userId: jan.id,
      year: 2026,
      totalFee: 450,
      isPaid: true,
      familyMembers: {
        create: [
          { type: 'ADULT', price: 200 },
          { type: 'ADULT', price: 200 },
          { type: 'CHILD', age: 8, price: 50 }
        ]
      }
    }
  });

  await prisma.membership.create({
    data: {
      userId: admin.id,
      year: 2026,
      totalFee: 600,
      isPaid: false,
      familyMembers: {
        create: [
          { type: 'ADULT', price: 200 }
        ]
      }
    }
  });

  const rgMap = new Map(), famMap = new Map();
  for (const item of gewassenData) {
    if (!rgMap.has(item.rotatie_groep)) rgMap.set(item.rotatie_groep, (await prisma.rotationGroup.create({ data: { name: item.rotatie_groep } })).id);
    if (!famMap.has(item.botanische_familie)) famMap.set(item.botanische_familie, (await prisma.cropFamily.create({ data: { name: item.botanische_familie } })).id);
  }

  const nutrientMap: any = { 'Laag': 1, 'Medium': 2, 'Hoog': 3, 'Geen': 1 };
  const cropMap = new Map();
  for (const item of gewassenData) {
    const crop = await prisma.crop.create({
      data: {
        name: item.naam_gewas, familyId: famMap.get(item.botanische_familie), rotationGroupId: rgMap.get(item.rotatie_groep),
        nutrientLevel: nutrientMap[item.voedingsbehoefte] || 2, daysToMaturity: item.groeiduur_dagen,
        minTemp: item.min_temp_c, rowSpacing: item.rijafstand_cm, plantSpacing: item.plantafstand_cm,
        seedsPerSqm: 10, pricePerSeedSqm: 0.5,
        sowStart: '03-01', sowEnd: '07-01'
      }
    });
    cropMap.set(crop.name, crop.id);
  }

  const field = await prisma.field.create({ data: { name: 'Hoofdveld De Zelfoogsttuin' } });
  const blockConfigs = [
    { name: 'Blok 1', rg: 'Aardappelen', r: 0, c: 0 }, { name: 'Blok 2', rg: 'Wortels', r: 0, c: 1 },
    { name: 'Blok 3', rg: 'Kool', r: 0, c: 2 }, { name: 'Blok 4', rg: 'Blad', r: 0, c: 3 },
    { name: 'Blok 5', rg: 'Look', r: 1, c: 0 }, { name: 'Blok 6', rg: 'Peul', r: 1, c: 1 },
    { name: 'Blok 7', rg: 'Vruchtgewas', r: 1, c: 2 }, { name: 'Blok 8', rg: 'Kruiden', r: 1, c: 3 }
  ];

  for (const bc of blockConfigs) {
    const block = await prisma.block.create({ data: { name: bc.name, fieldId: field.id, row: bc.r, col: bc.c, length: 10, rotationGroups: { connect: [{ id: rgMap.get(bc.rg) }] } } });
    for (let j = 1; j <= 5; j++) {
      const bed = await prisma.bed.create({ data: { name: `Bed ${j}`, width: 0.75, length: 10, blockId: block.id } });
    }
  }

  console.log(`Seeding ${receptenData.length} recipes from local JSON...`);
  const normalize = (s: any) => s.toLowerCase().replace(/\((vroeg|laat|zomer|winter|herfst|knol|pootui|kropsla|stamtomaat|bewaar)\)/g, '').replace(/vroeg|laat/g, '').trim();

  for (const r of receptenData) {
    const matched = [];
    for (const rCropName of r.crops) {
        const normRCrop = normalize(rCropName);
        for (const [dbCropName, id] of cropMap.entries()) {
            const normDbCrop = normalize(dbCropName);
            if (normDbCrop === normRCrop || normDbCrop.includes(normRCrop) || normRCrop.includes(normDbCrop)) {
                matched.push({ id });
            }
        }
    }
    // Remove duplicate matches for the same recipe
    const uniqueMatched = Array.from(new Set(matched.map(m => m.id))).map(id => ({ id }));
    
    await prisma.recipe.create({ 
      data: { 
        title: r.title, 
        content: r.content, 
        otherIngredients: r.otherIngredients, 
        authorId: admin.id, 
        harvestableCrops: { connect: uniqueMatched } 
      } 
    });
  }

  await prisma.systemSetting.create({ data: { key: 'active_year', value: '2026' } });
  console.log('Seeding voltooid!');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
