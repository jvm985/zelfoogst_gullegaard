import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

app.use(cors());
app.use(express.json());

// --- Email Setup ---
let transporter: nodemailer.Transporter;
async function setupEmail() {
    // For development, use ethereal.email
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
    });
    console.log('Test email account created:', testAccount.user);
}
setupEmail();

// --- Middleware ---
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Geen token' });
  jwt.verify(token, JWT_SECRET, async (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Foutieve token' });
    
    // Extra veiligheid: controleer of de gebruiker nog bestaat in de DB
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) return res.status(401).json({ error: 'Gebruiker niet meer geldig, log opnieuw in' });
    
    req.user = user;
    next();
  });
};

const isAdmin = (req: any, res: any, next: any) => {
  if (req.user && req.user.role === 'ADMIN') next();
  else res.status(403).json({ error: 'Admins only' });
};

// --- Routes ---
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// --- Auth & Signup ---
app.post('/api/signup', async (req, res) => {
    const { name, email } = req.body;
    try {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing && existing.password) return res.status(400).json({ error: 'E-mailadres is al in gebruik' });

        const token = jwt.sign({ name, email }, JWT_SECRET, { expiresIn: '24h' });
        const url = `${req.headers.origin}/complete-signup?token=${token}`;

        await transporter.sendMail({
            from: '"De Zelfoogsttuin" <noreply@mijn-csa.be>',
            to: email,
            subject: 'Activeer je account bij De Zelfoogsttuin',
            html: `<h1>Welkom ${name}!</h1><p>Klik op de onderstaande link om je account te activeren en je wachtwoord in te stellen:</p><a href="${url}">${url}</a>`
        });

        res.json({ message: 'Bevestigingsmail verzonden' });
    } catch (e) { res.status(500).json({ error: 'Fout bij registratie' }); }
});

app.post('/api/auth/verify-signup-token', async (req, res) => {
    const { token } = req.body;
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        res.json({ name: decoded.name, email: decoded.email });
    } catch (e) { res.status(400).json({ error: 'Ongeldige of verlopen link' }); }
});

app.post('/api/auth/complete-signup', async (req, res) => {
    const { token, password } = req.body;
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const user = await prisma.user.upsert({
            where: { email: decoded.email },
            update: { name: decoded.name, password: hashedPassword, isVerified: true },
            create: { email: decoded.email, name: decoded.name, password: hashedPassword, isVerified: true, role: 'USER' }
        });

        res.json({ message: 'Account succesvol geactiveerd' });
    } catch (e) { res.status(400).json({ error: 'Fout bij activeren account' }); }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Ongeldige gegevens' });
  }
  res.json({ user: { id: user.id, name: user.name, role: user.role }, token: jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '8h' }) });
});

// --- Membership ---
app.get('/api/membership/status', authenticateToken, async (req: any, res) => {
    try {
        const activeYearSetting = await prisma.systemSetting.findUnique({ where: { key: 'active_year' } });
        const targetYear = activeYearSetting ? parseInt(activeYearSetting.value) : new Date().getFullYear();

        const membership = await prisma.membership.findFirst({
            where: { userId: req.user.id, year: targetYear },
            include: { familyMembers: true }
        });

        if (!membership) return res.json({ isRegistered: false });

        res.json({
            isRegistered: true,
            isPaid: membership.isPaid,
            totalPrice: membership.totalFee,
            adults: membership.familyMembers.filter(fm => fm.type === 'ADULT'),
            children: membership.familyMembers.filter(fm => fm.type === 'CHILD')
        });
    } catch (e) { res.status(500).json({ error: 'Fout bij ophalen status' }); }
});

app.post('/api/membership', authenticateToken, async (req: any, res) => {
    const { adults, children, totalPrice } = req.body;
    try {
        const activeYearSetting = await prisma.systemSetting.findUnique({ where: { key: 'active_year' } });
        const targetYear = activeYearSetting ? parseInt(activeYearSetting.value) : new Date().getFullYear();

        // Check if already paid
        const existing = await prisma.membership.findFirst({ where: { userId: req.user.id, year: targetYear } });
        if (existing && existing.isPaid) return res.status(400).json({ error: 'Inschrijving is al betaald en kan niet meer gewijzigd worden' });

        await prisma.$transaction(async (tx) => {
            if (existing) {
                await tx.familyMember.deleteMany({ where: { membershipId: existing.id } });
                await tx.membership.delete({ where: { id: existing.id } });
            }

            await tx.membership.create({
                data: {
                    userId: req.user.id,
                    year: targetYear,
                    totalFee: parseFloat(totalPrice.toString()),
                    familyMembers: {
                        create: [
                            ...adults.map((a: any) => ({ 
                                type: 'ADULT', 
                                tier: (a.tier || 'STANDARD').toUpperCase(), 
                                price: parseFloat(a.price.toString()) 
                            })),
                            ...children.map((c: any) => ({ 
                                type: 'CHILD', 
                                age: parseInt(c.age.toString()), 
                                price: parseFloat(c.price.toString()) 
                            }))
                        ]
                    }
                }
            });
        });

        res.json({ message: 'Inschrijving succesvol opgeslagen' });
    } catch (e) { 
        console.error('Membership error:', e);
        res.status(500).json({ error: 'Fout bij opslaan inschrijving', details: e instanceof Error ? e.message : String(e) }); 
    }
});

// --- System Settings ---
app.get('/api/settings', async (req, res) => {
    const settings = await prisma.systemSetting.findMany();
    const map: Record<string, string> = {};
    settings.forEach(s => map[s.key] = s.value);
    res.json(map);
});

app.patch('/api/settings', authenticateToken, isAdmin, async (req, res) => {
    const { key, value } = req.body;
    const setting = await prisma.systemSetting.upsert({
        where: { key }, update: { value: value.toString() }, create: { key, value: value.toString() }
    });
    res.json(setting);
});

// --- Crops ---
app.get('/api/crops', async (req, res) => {
  res.json(await prisma.crop.findMany({ include: { family: true, rotationGroup: true } }));
});

app.post('/api/crops', authenticateToken, isAdmin, async (req, res) => {
  const data = { ...req.body };
  if (data.seedsPerSqm) data.seedsPerSqm = parseFloat(data.seedsPerSqm);
  if (data.pricePerSeedSqm) data.pricePerSeedSqm = parseFloat(data.pricePerSeedSqm);
  const crop = await prisma.crop.create({ data });
  res.status(201).json(crop);
});

app.patch('/api/crops/:id', authenticateToken, isAdmin, async (req, res) => {
  const data = { ...req.body };
  if (data.seedsPerSqm) data.seedsPerSqm = parseFloat(data.seedsPerSqm);
  if (data.pricePerSeedSqm) data.pricePerSeedSqm = parseFloat(data.pricePerSeedSqm);
  Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);
  const crop = await prisma.crop.update({ where: { id: req.params.id }, data });
  res.json(crop);
});

app.delete('/api/crops/:id', authenticateToken, isAdmin, async (req, res) => {
  await prisma.crop.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// --- Teeltplan Fields & Blocks ---
app.get('/api/teeltplan/fields', async (req, res) => {
  const { year } = req.query;
  const activeYearSetting = await prisma.systemSetting.findUnique({ where: { key: 'active_year' } });
  const targetYear = year ? parseInt(year as string) : (activeYearSetting ? parseInt(activeYearSetting.value) : new Date().getFullYear());

  res.json(await prisma.field.findMany({
    include: {
      blocks: {
        include: {
          rotationGroups: true,
          beds: {
            include: {
              cultivations: {
                where: { year: targetYear },
                include: { crop: true }
              }
            }
          }
        },
        orderBy: [{ row: 'asc' }, { col: 'asc' }]
      }
    }
  }));
});

app.post('/api/teeltplan/fields', authenticateToken, isAdmin, async (req, res) => {
    res.status(201).json(await prisma.field.create({ data: { name: req.body.name } }));
});

app.post('/api/teeltplan/blocks', authenticateToken, isAdmin, async (req, res) => {
    const { name, fieldId, row, col, bedCount, length, bedWidth, rotationGroupIds } = req.body;
    const block = await prisma.block.create({
      data: { 
        name, fieldId, row, col, length: parseFloat(length), bedWidth: parseFloat(bedWidth || 0.75),
        rotationGroups: { connect: (rotationGroupIds || []).map((id: string) => ({ id })) },
        beds: { create: Array.from({ length: bedCount || 0 }).map((_, i) => ({ name: `Bed ${i + 1}`, width: parseFloat(bedWidth || 0.75), length: parseFloat(length) })) }
      }
    });
    res.status(201).json(block);
});

app.patch('/api/teeltplan/blocks/:id', authenticateToken, isAdmin, async (req, res) => {
    const { name, row, col, length, bedWidth, rotationGroupIds } = req.body;
    const block = await prisma.$transaction(async (tx) => {
      const data: any = {};
      if (name !== undefined) data.name = name;
      if (row !== undefined) data.row = row;
      if (col !== undefined) data.col = col;
      if (length !== undefined) data.length = parseFloat(length);
      if (bedWidth !== undefined) data.bedWidth = parseFloat(bedWidth);
      if (rotationGroupIds !== undefined) data.rotationGroups = { set: rotationGroupIds.map((id: string) => ({ id })) };

      const updated = await tx.block.update({ where: { id: req.params.id }, data });

      if (length !== undefined || bedWidth !== undefined) {
          const bedData: any = {};
          if (length !== undefined) bedData.length = parseFloat(length);
          if (bedWidth !== undefined) bedData.width = parseFloat(bedWidth);
          await tx.bed.updateMany({ where: { blockId: updated.id }, data: bedData });
      }
      return updated;
    });
    res.json(block);
});

// --- Tasks Generator Helper ---
async function generateTasks(cult: any) {
    const tasks = [
        { type: 'PREPARATION' as any, date: new Date(cult.startDate), desc: 'Bed voorbereiden en bemesten' },
        { type: 'SOW_OUTDOORS' as any, date: cult.sowDate ? new Date(cult.sowDate) : new Date(cult.startDate), desc: 'Gewas zaaien of uitplanten' },
        { type: 'HARVEST' as any, date: cult.harvestDate ? new Date(cult.harvestDate) : new Date(cult.endDate), desc: 'Start van de oogstperiode' }
    ];
    for (const t of tasks) {
        await prisma.cultivationTask.create({
            data: { cultivationId: cult.id, type: t.type, scheduledDate: t.date, description: t.desc, status: 'TODO' }
        });
    }
}

// --- Cultivations ---
app.post('/api/teeltplan/cultivations', authenticateToken, isAdmin, async (req, res) => {
    const { cropId, bedId, year, quantity, startDate, sowDate, harvestDate, endDate } = req.body;
    const bed = await prisma.bed.findUnique({ where: { id: bedId } });
    const overlaps = await prisma.cultivation.findMany({ where: { bedId, OR: [{ startDate: { lte: new Date(endDate) }, endDate: { gte: new Date(startDate) } }] } });
    const used = overlaps.reduce((s, c) => s + c.quantity, 0);
    if (bed && (used + parseFloat(quantity)) > bed.length) return res.status(400).json({ error: `Geen plaats meer (${used}m van ${bed.length}m bezet)` });
    
    const cult = await prisma.cultivation.create({
        data: { cropId, bedId, year, quantity: parseFloat(quantity), startDate: new Date(startDate), sowDate: sowDate ? new Date(sowDate) : null, harvestDate: harvestDate ? new Date(harvestDate) : null, endDate: new Date(endDate) }
    });
    await generateTasks(cult);
    res.status(201).json(cult);
});

app.patch('/api/teeltplan/cultivations/:id', authenticateToken, isAdmin, async (req, res) => {
    const data = { ...req.body };
    if (data.startDate) data.startDate = new Date(data.startDate);
    if (data.endDate) data.endDate = new Date(data.endDate);
    if (data.sowDate) data.sowDate = new Date(data.sowDate);
    if (data.harvestDate) data.harvestDate = new Date(data.harvestDate);
    if (data.quantity) data.quantity = parseFloat(data.quantity);
    Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);
    
    const updated = await prisma.cultivation.update({ where: { id: req.params.id }, data });
    if (data.startDate || data.sowDate || data.harvestDate || data.endDate) {
        await prisma.cultivationTask.deleteMany({ where: { cultivationId: updated.id } });
        await generateTasks(updated);
    }
    res.json(updated);
});

app.delete('/api/teeltplan/cultivations/:id', authenticateToken, isAdmin, async (req, res) => {
    await prisma.cultivation.delete({ where: { id: req.params.id } }); res.status(204).send();
});

// --- Tasks ---
app.get('/api/teeltplan/tasks/weekly', async (req, res) => {
    const { date } = req.query;
    const d = date ? new Date(date as string) : new Date();
    const start = new Date(d); start.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1)); start.setHours(0,0,0,0);
    const end = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23,59,59,999);
    res.json(await prisma.cultivationTask.findMany({ where: { scheduledDate: { gte: start, lte: end } }, include: { cultivation: { include: { crop: true, bed: { include: { block: true } } } } }, orderBy: [{ scheduledDate: 'asc' }] }));
});

app.patch('/api/teeltplan/tasks/:id', authenticateToken, isAdmin, async (req, res) => {
    res.json(await prisma.cultivationTask.update({ where: { id: req.params.id }, data: { status: req.body.status } }));
});

// --- Other ---
app.get('/api/teeltplan/families', async (req, res) => res.json(await prisma.cropFamily.findMany()));
app.get('/api/teeltplan/available-years', async (req, res) => {
    const years = await prisma.cultivation.groupBy({ by: ['year'], orderBy: { year: 'asc' } });
    const list = years.map(y => y.year);
    if (list.length === 0) list.push(new Date().getFullYear());
    res.json(list);
});
app.get('/api/teeltplan/rotation-groups', async (req, res) => res.json(await prisma.rotationGroup.findMany()));

app.post('/api/teeltplan/clone-year', authenticateToken, isAdmin, async (req, res) => {
    const { sourceYear, targetYear, mapping } = req.body;
    await prisma.cultivation.deleteMany({ where: { year: targetYear } });
    const source = await prisma.cultivation.findMany({ where: { year: sourceYear }, include: { bed: true } });
    const blocks = await prisma.block.findMany({ include: { beds: true } });
    for (const c of source) {
        const targetBlockId = mapping[c.bed.blockId];
        if (!targetBlockId) continue;
        const targetBlock = blocks.find(b => b.id === targetBlockId);
        const targetBed = targetBlock?.beds.find(b => b.name === c.bed.name) || targetBlock?.beds[0];
        if (!targetBed) continue;
        const shift = (d: Date | null) => { if (!d) return null; const nd = new Date(d); nd.setFullYear(nd.getFullYear() + (targetYear - sourceYear)); return nd; };
        const newCult = await prisma.cultivation.create({ data: { cropId: c.cropId, bedId: targetBed.id, year: targetYear, quantity: c.quantity, startDate: shift(c.startDate)!, sowDate: shift(c.sowDate), harvestDate: shift(c.harvestDate), endDate: shift(c.endDate) } });
        await generateTasks(newCult);
    }
    res.json({ ok: true });
});

app.get('/api/recipes/ranked', async (req, res) => {
    const now = new Date(), soon = new Date(); soon.setDate(now.getDate() + 14);
    const activeYearSetting = await prisma.systemSetting.findUnique({ where: { key: 'active_year' } });
    const targetYear = activeYearSetting ? parseInt(activeYearSetting.value) : now.getFullYear();
    const active = await prisma.cultivation.findMany({ where: { year: targetYear, startDate: { lte: now }, endDate: { gte: now }, harvestDate: { lte: soon } }, select: { cropId: true } });
    const harvestableIds = new Set(active.map(c => c.cropId));
    const recipes = await prisma.recipe.findMany({ include: { author: { select: { name: true } }, harvestableCrops: true } });
    const ranked = recipes.map(r => {
        const crops = r.harvestableCrops.map(c => ({ ...c, isHarvestable: harvestableIds.has(c.id) }));
        return { ...r, harvestableCrops: crops, harvestableCount: crops.filter(c => c.isHarvestable).length };
    }).sort((a, b) => b.harvestableCount - a.harvestableCount || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const page = parseInt(req.query.page as string) || 1, limit = 12;
    res.json({ recipes: ranked.slice((page-1)*limit, page*limit), pagination: { total: ranked.length, page, totalPages: Math.ceil(ranked.length/limit) } });
});

app.get('/api/news', async (req, res) => res.json(await prisma.newsPost.findMany({ orderBy: { createdAt: 'desc' } })));
app.post('/api/news', authenticateToken, isAdmin, async (req, res) => {
    const post = await prisma.newsPost.create({ data: req.body });
    res.status(201).json(post);
});
app.delete('/api/news/:id', authenticateToken, isAdmin, async (req, res) => {
    await prisma.newsPost.delete({ where: { id: req.params.id } });
    res.status(204).send();
});

// --- Admin Member Management ---
app.get('/api/admin/members', authenticateToken, isAdmin, async (req, res) => {
    try {
        const activeYearSetting = await prisma.systemSetting.findUnique({ where: { key: 'active_year' } });
        const targetYear = activeYearSetting ? parseInt(activeYearSetting.value) : new Date().getFullYear();
        const memberships = await prisma.membership.findMany({ where: { year: targetYear }, include: { user: { select: { id: true, name: true, email: true } }, familyMembers: true } });
        const members = memberships.map(m => ({ id: m.id, name: m.user.name, email: m.user.email, isMember: true, hasPaid: m.isPaid, totalFee: m.totalFee, familyComposition: { adults: m.familyMembers.filter(fm => fm.type === 'ADULT').length, children: m.familyMembers.filter(fm => fm.type === 'CHILD').map(fm => ({ age: fm.age })) }, registrationDate: m.createdAt }));
        res.json(members);
    } catch (e) { res.status(500).json({ error: 'Fout bij ophalen deelnemers' }); }
});

app.patch('/api/admin/members/:id/payment', authenticateToken, isAdmin, async (req, res) => {
    const membership = await prisma.membership.update({ where: { id: req.params.id }, data: { isPaid: req.body.isPaid } });
    res.json(membership);
});

app.listen(port, () => console.log(`Server op ${port}`));
