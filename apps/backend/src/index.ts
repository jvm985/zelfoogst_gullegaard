import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

dotenv.config();

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
});

const app = express();
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL as string,
    },
  },
});
const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

app.use(cors());
app.use(express.json());

// --- Email Setup ---
let transporter: nodemailer.Transporter;

async function setupEmail() {
    if (process.env.SMTP_HOST) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    } else {
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
        console.log('--- Test Email Account Created ---');
        console.log(`User: ${testAccount.user}`);
        console.log(`Pass: ${testAccount.pass}`);
        console.log('---------------------------------');
    }
}

setupEmail().catch(err => {
    console.error('Failed to setup email transporter:', err);
});

// --- Middleware ---

const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('Auth failed: No token provided');
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      console.log('Auth failed: Invalid or expired token', err.message);
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
};

const isAdmin = (req: any, res: any, next: any) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied: Admins only' });
  }
};

app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', db: 'disconnected' });
  }
});

// --- Auth ---

app.post('/api/signup', async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!email || !name) return res.status(400).json({ error: 'Naam en e-mail zijn verplicht' });

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser && existingUser.isVerified) {
        return res.status(400).json({ error: 'E-mailadres is al in gebruik' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    await prisma.user.upsert({
        where: { email },
        update: {
            name,
            verificationToken: token,
            verificationTokenExpiry: expiry,
            isVerified: false
        },
        create: {
            name,
            email,
            verificationToken: token,
            verificationTokenExpiry: expiry,
            isVerified: false
        }
    });

    const verificationLink = `http://localhost:5173/complete-signup?token=${token}`;
    
    const info = await transporter.sendMail({
        from: '"De Gullegaard" <noreply@gullegaard.be>',
        to: email,
        subject: "Bevestig je account bij De Gullegaard",
        html: `<p>Hallo ${name},</p><p>Klik op de onderstaande link om je account aan te maken en je wachtwoord in te stellen:</p><a href="${verificationLink}">${verificationLink}</a>`
    });

    console.log("Email sent: %s", info.messageId);
    if (nodemailer.getTestMessageUrl(info)) {
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }

    res.status(201).json({ message: 'Bevestigingsmail verzonden. Controleer je inbox.' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Fout bij het verwerken van registratie' });
  }
});

app.post('/api/auth/verify-signup-token', async (req, res) => {
    const { token } = req.body;
    const user = await prisma.user.findFirst({
        where: {
            verificationToken: token,
            verificationTokenExpiry: { gt: new Date() }
        }
    });

    if (!user) return res.status(400).json({ error: 'Ongeldige of verlopen link.' });
    res.json({ email: user.email, name: user.name });
});

app.post('/api/auth/complete-signup', async (req, res) => {
    try {
        const { token, password } = req.body;
        const user = await prisma.user.findFirst({
            where: {
                verificationToken: token,
                verificationTokenExpiry: { gt: new Date() }
            }
        });

        if (!user) return res.status(400).json({ error: 'Ongeldige of verlopen link.' });

        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                isVerified: true,
                verificationToken: null,
                verificationTokenExpiry: null
            }
        });

        res.json({ message: 'Account succesvol aangemaakt! Je kunt nu inloggen.' });
    } catch (error) {
        res.status(500).json({ error: 'Kon account niet voltooien' });
    }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user || !user.password || !user.isVerified) {
        return res.status(401).json({ error: 'Ongeldige inloggegevens of account niet bevestigd.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Ongeldige inloggegevens.' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token });
  } catch (error) {
    res.status(500).json({ error: 'Inlogfout' });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (user && user.isVerified) {
        const token = crypto.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1h

        await prisma.user.update({
            where: { id: user.id },
            data: { resetToken: token, resetTokenExpiry: expiry }
        });

        const resetLink = `http://localhost:5173/reset-password?token=${token}`;
        await transporter.sendMail({
            from: '"De Gullegaard" <noreply@gullegaard.be>',
            to: email,
            subject: "Wachtwoord herstellen - De Gullegaard",
            html: `<p>Klik op de link om je wachtwoord te herstellen:</p><a href="${resetLink}">${resetLink}</a>`
        });
    }
    
    res.json({ message: 'Als dit e-mailadres bij ons bekend is, ontvang je een herstellink.' });
  } catch (error) {
    res.status(500).json({ error: 'Fout bij verwerken verzoek' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;
        const user = await prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: { gt: new Date() }
            }
        });

        if (!user) return res.status(400).json({ error: 'Ongeldige of verlopen herstellink.' });

        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null
            }
        });

        res.json({ message: 'Wachtwoord succesvol gewijzigd.' });
    } catch (error) {
        res.status(500).json({ error: 'Kon wachtwoord niet resetten' });
    }
});

// --- Membership ---

app.get('/api/membership/status', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const membership = await prisma.membership.findUnique({
      where: { userId_year: { userId, year: 2026 } },
      include: { familyMembers: true }
    });

    if (!membership) return res.json({ isRegistered: false });

    res.json({
      isRegistered: true,
      isPaid: membership.isPaid,
      totalFee: membership.totalFee,
      adults: membership.familyMembers.filter(m => m.type === 'ADULT').map(m => ({ id: m.id, tier: m.tier?.toLowerCase(), price: m.price })),
      children: membership.familyMembers.filter(m => m.type === 'CHILD').map(m => ({ id: m.id, age: m.age, price: m.price }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Kon status niet ophalen' });
  }
});

app.post('/api/membership', authenticateToken, async (req: any, res) => {
  try {
    const { adults, children, totalPrice } = req.body;
    const userId = req.user.id;

    const membership = await prisma.$transaction(async (tx) => {
      await tx.membership.deleteMany({ where: { userId, year: 2026 } });
      return await tx.membership.create({
        data: {
          userId,
          year: 2026,
          totalFee: totalPrice,
          familyMembers: {
            create: [
              ...adults.map((a: any) => ({ type: 'ADULT', tier: a.tier.toUpperCase(), price: parseFloat(a.price) })),
              ...children.map((c: any) => ({ type: 'CHILD', age: parseInt(c.age), price: parseFloat(c.price) }))
            ]
          }
        }
      });
    });

    res.status(201).json({ message: 'Inschrijving succesvol', membership });
  } catch (error) {
    res.status(500).json({ error: 'Kon de inschrijving niet verwerken' });
  }
});

// --- Admin ---

app.get('/api/admin/members', authenticateToken, isAdmin, async (req, res) => {
  try {
    const members = await prisma.user.findMany({
      include: { memberships: { where: { year: 2026 }, include: { familyMembers: true } } }
    });
    
    const transformed = members.map(u => {
      const m = u.memberships[0];
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        registrationDate: u.createdAt,
        isMember: !!m,
        hasPaid: m ? m.isPaid : false,
        totalFee: m ? m.totalFee : 0,
        familyComposition: m ? {
          adults: m.familyMembers.filter(f => f.type === 'ADULT').length,
          children: m.familyMembers.filter(f => f.type === 'CHILD').map(c => ({ age: c.age }))
        } : { adults: 0, children: [] }
      };
    });

    res.json(transformed);
  } catch (error) {
    res.status(500).json({ error: 'Kon leden niet ophalen' });
  }
});

app.patch('/api/admin/members/:id/payment', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isPaid } = req.body;
    const membership = await prisma.membership.findFirst({ where: { userId: id, year: 2026 } });
    if (!membership) return res.status(404).json({ error: 'Geen inschrijving gevonden.' });
    await prisma.membership.update({ where: { id: membership.id }, data: { isPaid } });
    res.json({ message: 'Betalingsstatus bijgewerkt' });
  } catch (error) {
      res.status(500).json({ error: 'Fout bij bijwerken status' });
  }
});

app.patch('/api/admin/members/:id/membership', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isMember } = req.body;
    
    if (!isMember) {
      await prisma.membership.deleteMany({ where: { userId: id, year: 2026 } });
    } else {
      await prisma.membership.upsert({
        where: { userId_year: { userId: id, year: 2026 } },
        update: {},
        create: { userId: id, year: 2026, totalFee: 0, isPaid: false }
      });
    }
    res.json({ message: 'Lidmaatschap status bijgewerkt' });
  } catch (error) {
    res.status(500).json({ error: 'Fout bij bijwerken lidmaatschap status' });
  }
});

app.delete('/api/admin/members/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        if (id === (req as any).user.id) return res.status(400).json({ error: 'Je kunt je eigen account niet verwijderen.' });
        await prisma.user.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Fout bij verwijderen van lid' });
    }
});

// --- Crops ---
app.get('/api/crops', async (req, res) => {
  const crops = await prisma.crop.findMany();
  res.json(crops);
});

app.post('/api/crops', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, description, fieldLocation, isHarvestable } = req.body;
    const crop = await prisma.crop.create({ data: { name, description, fieldLocation, isHarvestable: isHarvestable || false } });
    res.status(201).json(crop);
  } catch (error) {
    res.status(500).json({ error: 'Fout bij aanmaken gewas' });
  }
});

app.patch('/api/crops/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isHarvestable, name, description, fieldLocation } = req.body;
    const crop = await prisma.crop.update({ where: { id }, data: { isHarvestable, name, description, fieldLocation } });
    res.json(crop);
  } catch (error) {
    res.status(500).json({ error: 'Fout bij bijwerken gewas' });
  }
});

app.delete('/api/crops/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.crop.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Fout bij verwijderen gewas' });
  }
});

// --- Recipes ---
app.get('/api/recipes', async (req, res) => {
  const recipes = await prisma.recipe.findMany({ 
    include: { 
        author: { select: { name: true } },
        harvestableCrops: true
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json(recipes);
});

app.post('/api/recipes', authenticateToken, async (req: any, res) => {
  try {
    const { title, content, otherIngredients, cropIds } = req.body;
    
    console.log('Creating recipe:', { title, cropIds });

    const recipe = await prisma.recipe.create({ 
        data: { 
            title, 
            content, 
            otherIngredients: otherIngredients || "", 
            authorId: req.user.id,
            harvestableCrops: {
                connect: (Array.isArray(cropIds) ? cropIds : []).map((id: string) => ({ id }))
            }
        },
        include: { harvestableCrops: true }
    });
    res.status(201).json(recipe);
  } catch (error) {
    console.error('Create recipe error details:', error);
    if (error instanceof Error && error.message.includes('Recipe_authorId_fkey')) {
        return res.status(401).json({ error: 'Je sessie is verlopen of ongeldig. Log opnieuw in om een recept toe te voegen.' });
    }
    res.status(500).json({ error: 'Kon recept niet opslaan: ' + (error instanceof Error ? error.message : String(error)) });
  }
});

app.patch('/api/recipes/:id', authenticateToken, async (req: any, res) => {
    try {
        const { id } = req.params;
        const { title, content, otherIngredients, cropIds } = req.body;
        const userId = req.user.id;

        // Check if recipe exists and belongs to user
        const existingRecipe = await prisma.recipe.findUnique({ where: { id } });
        if (!existingRecipe) return res.status(404).json({ error: 'Recept niet gevonden.' });
        if (existingRecipe.authorId !== userId) return res.status(403).json({ error: 'Je kunt alleen je eigen recepten wijzigen.' });

        const recipe = await prisma.recipe.update({
            where: { id },
            data: {
                title,
                content,
                otherIngredients: otherIngredients || "",
                harvestableCrops: {
                    set: [], // Clear existing
                    connect: (Array.isArray(cropIds) ? cropIds : []).map((id: string) => ({ id }))
                }
            },
            include: { harvestableCrops: true }
        });

        res.json(recipe);
    } catch (error) {
        console.error('Update recipe error:', error);
        res.status(500).json({ error: 'Kon recept niet bijwerken.' });
    }
});

app.delete('/api/recipes/:id', authenticateToken, async (req: any, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        const existingRecipe = await prisma.recipe.findUnique({ where: { id } });
        if (!existingRecipe) return res.status(404).json({ error: 'Recept niet gevonden.' });
        if (existingRecipe.authorId !== userId && req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Je kunt alleen je eigen recepten verwijderen.' });
        }

        await prisma.recipe.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        console.error('Delete recipe error:', error);
        res.status(500).json({ error: 'Kon recept niet verwijderen.' });
    }
});

// Special ranked endpoint
app.get('/api/recipes/ranked', async (req, res) => {
    try {
        const recipes = await prisma.recipe.findMany({
            include: {
                author: { select: { name: true } },
                harvestableCrops: true
            }
        });

        const ranked = recipes.map(recipe => {
            const harvestableCount = recipe.harvestableCrops.filter(c => c.isHarvestable).length;
            return { ...recipe, harvestableCount };
        }).sort((a, b) => b.harvestableCount - a.harvestableCount);

        res.json(ranked);
    } catch (error) {
        res.status(500).json({ error: 'Kon recepten niet rangschikken' });
    }
});

// --- Newsletter ---
app.post('/api/newsletter', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { subject, body } = req.body;
        await prisma.newsletter.create({ data: { subject, body, sentAt: new Date() } });
        
        const members = await prisma.user.findMany({
            where: { isVerified: true },
            select: { email: true }
        });
        
        const bccList = members.map(m => m.email).join(',');
        
        if (bccList) {
            await transporter.sendMail({
                from: '"De Gullegaard" <noreply@gullegaard.be>',
                bcc: bccList,
                subject: subject,
                text: body,
                html: `<p>${body.replace(/\n/g, '<br/>')}</p>`
            });
        }
        
        res.json({ message: 'Nieuwsbrief verstuurd' });
    } catch (error) {
        console.error('Nieuwsbrief error:', error);
        res.status(500).json({ error: 'Kon nieuwsbrief niet versturen' });
    }
});

// --- News Posts ---
app.get('/api/news', async (req, res) => {
    try {
        const news = await prisma.newsPost.findMany({
            orderBy: { createdAt: 'desc' }
        });
        console.log(`Fetched ${news.length} news posts`);
        res.json(news);
    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).json({ error: 'Kon nieuwsberichten niet ophalen' });
    }
});

app.post('/api/news', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { title, content, imageUrl } = req.body;
        const post = await prisma.newsPost.create({
            data: { title, content, imageUrl }
        });
        res.status(201).json(post);
    } catch (error) {
        res.status(500).json({ error: 'Kon nieuwsbericht niet opslaan' });
    }
});

app.delete('/api/news/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.newsPost.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Kon nieuwsbericht niet verwijderen' });
    }
});

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
