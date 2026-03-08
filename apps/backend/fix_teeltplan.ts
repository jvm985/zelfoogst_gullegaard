import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Oud plan verwijderen...');
  await prisma.cultivationTask.deleteMany();
  await prisma.cultivation.deleteMany();

  const crops = await prisma.crop.findMany();
  const blocks = await prisma.block.findMany({ include: { beds: true, rotationGroups: true } });
  const year = 2026;

  const getCrop = (name: string) => crops.find(c => c.name === name);
  const getBlockByRG = (rgName: string) => blocks.find(b => b.rotationGroups.some(rg => rg.name === rgName));

  const plan: any[] = [];

  // --- BLOK 1: AARDAPPELEN ---
  const b1 = getBlockByRG('Aardappelen');
  if (b1) {
      plan.push({ crop: 'Aardappel (Vroeg)', bed: b1.beds[0], start: '2026-03-15', end: '2026-06-30' });
      plan.push({ crop: 'Aardappel (Vroeg)', bed: b1.beds[1], start: '2026-03-15', end: '2026-06-30' });
      plan.push({ crop: 'Phacelia', bed: b1.beds[0], start: '2026-07-15', end: '2026-11-30' });
      plan.push({ crop: 'Aardappel (Laat)', bed: b1.beds[2], start: '2026-04-15', end: '2026-09-30' });
      plan.push({ crop: 'Aardappel (Laat)', bed: b1.beds[3], start: '2026-04-15', end: '2026-09-30' });
      plan.push({ crop: 'Aardappel (Laat)', bed: b1.beds[4], start: '2026-04-15', end: '2026-09-30' });
  }

  // --- BLOK 2: WORTELS ---
  const b2 = getBlockByRG('Wortels');
  if (b2) {
      plan.push({ crop: 'Wortel (Zomer)', bed: b2.beds[0], start: '2026-03-01', end: '2026-06-15' });
      plan.push({ crop: 'Wortel (Winter)', bed: b2.beds[1], start: '2026-05-01', end: '2026-10-30' });
      plan.push({ crop: 'Pastinaak', bed: b2.beds[2], start: '2026-04-01', end: '2026-11-15' });
      plan.push({ crop: 'Knolselder', bed: b2.beds[3], start: '2026-05-15', end: '2026-11-30' });
      plan.push({ crop: 'Rode Biet', bed: b2.beds[4], start: '2026-04-15', end: '2026-08-30' });
      plan.push({ crop: 'Veldsla', bed: b2.beds[0], start: '2026-09-01', end: '2026-12-31' });
  }

  // --- BLOK 3: KOOL ---
  const b3 = getBlockByRG('Kool');
  if (b3) {
      plan.push({ crop: 'Bloemkool', bed: b3.beds[0], start: '2026-04-01', end: '2026-06-30' });
      plan.push({ crop: 'Broccoli', bed: b3.beds[1], start: '2026-04-15', end: '2026-07-15' });
      plan.push({ crop: 'Rode Kool', bed: b3.beds[2], start: '2026-05-01', end: '2026-10-15' });
      plan.push({ crop: 'Spruiten', bed: b3.beds[3], start: '2026-05-15', end: '2026-12-31' });
      plan.push({ crop: 'Boerenkool', bed: b3.beds[4], start: '2026-06-01', end: '2026-12-31' });
      plan.push({ crop: 'Radijs', bed: b3.beds[0], start: '2026-07-15', end: '2026-08-15' });
  }

  // --- BLOK 4: BLAD ---
  const b4 = getBlockByRG('Blad');
  if (b4) {
      plan.push({ crop: 'Sla (Kropsla)', bed: b4.beds[0], start: '2026-03-15', end: '2026-05-15' });
      plan.push({ crop: 'Spinazie (Zomer)', bed: b4.beds[1], start: '2026-03-01', end: '2026-04-15' });
      plan.push({ crop: 'Andijvie', bed: b4.beds[2], start: '2026-06-15', end: '2026-09-15' });
      plan.push({ crop: 'Warmoes (Snijbiet)', bed: b4.beds[3], start: '2026-04-01', end: '2026-10-30' });
      plan.push({ crop: 'Venkel (Knol)', bed: b4.beds[4], start: '2026-05-01', end: '2026-08-15' });
      plan.push({ crop: 'Winterpostelein', bed: b4.beds[1], start: '2026-09-15', end: '2026-12-31' });
  }

  // --- BLOK 5: LOOK ---
  const b5 = getBlockByRG('Look');
  if (b5) {
      plan.push({ crop: 'Ui (Gele)', bed: b5.beds[0], start: '2026-03-01', end: '2026-08-15' });
      plan.push({ crop: 'Prei (Winter)', bed: b5.beds[1], start: '2026-06-01', end: '2026-12-31' });
      plan.push({ crop: 'Knoflook', bed: b5.beds[2], start: '2026-01-01', end: '2026-07-15' });
      plan.push({ crop: 'Sjalot', bed: b5.beds[3], start: '2026-03-15', end: '2026-08-01' });
  }

  // --- BLOK 6: PEUL ---
  const b6 = getBlockByRG('Peul');
  if (b6) {
      plan.push({ crop: 'Erwt (Doperwt)', bed: b6.beds[0], start: '2026-03-01', end: '2026-06-15' });
      plan.push({ crop: 'Stamboon', bed: b6.beds[1], start: '2026-05-15', end: '2026-08-15' });
      plan.push({ crop: 'Tuinboon', bed: b6.beds[2], start: '2026-02-15', end: '2026-07-01' });
  }

  // --- BLOK 7: VRUCHT ---
  const b7 = getBlockByRG('Vruchtgewas');
  if (b7) {
      plan.push({ crop: 'Tomaat (Stamtomaat)', bed: b7.beds[0], start: '2026-05-15', end: '2026-10-15' });
      plan.push({ crop: 'Paprika', bed: b7.beds[1], start: '2026-05-20', end: '2026-10-15' });
      plan.push({ crop: 'Aubergine', bed: b7.beds[2], start: '2026-05-20', end: '2026-10-15' });
      plan.push({ crop: 'Courgette', bed: b7.beds[3], start: '2026-05-15', end: '2026-09-15' });
      plan.push({ crop: 'Pompoen (Bewaar)', bed: b7.beds[4], start: '2026-05-15', end: '2026-10-30' });
  }

  // --- BLOK 8: KRUIDEN ---
  const b8 = getBlockByRG('Kruiden');
  if (b8) {
      plan.push({ crop: 'Basilicum', bed: b8.beds[0], start: '2026-06-01', end: '2026-09-15' });
      plan.push({ crop: 'Peterselie', bed: b8.beds[1], start: '2026-04-01', end: '2026-10-30' });
      plan.push({ crop: 'Asperge', bed: b8.beds[2], start: '2026-01-01', end: '2026-12-31' });
      plan.push({ crop: 'Rabarber', bed: b8.beds[3], start: '2026-01-01', end: '2026-12-31' });
      plan.push({ crop: 'Tijm', bed: b8.beds[4], start: '2026-01-01', end: '2026-12-31' });
  }

  console.log(`Bezig met invoeren van ${plan.length} teelten...`);

  for (const item of plan) {
    const c = getCrop(item.crop);
    if (!c || !item.bed) continue;
    const startDate = new Date(item.start);
    const sowDate = new Date(startDate.getTime() + (7 * 86400000));
    const harvestDate = new Date(sowDate.getTime() + (c.daysToMaturity * 86400000));
    const endDate = new Date(item.end);

    await prisma.cultivation.create({
      data: { cropId: c.id, bedId: item.bed.id, year, quantity: 10, startDate, sowDate, harvestDate, endDate }
    });
  }

  console.log('Klaar!');
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
