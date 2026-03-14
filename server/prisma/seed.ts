import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function generateQrCode(): string {
  return `EQ-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
}

const facilities = [
  {
    name: 'Badminton Court 1',
    slug: 'badminton-court-1',
    category: 'Badminton',
    description: 'Standard badminton court with synthetic surface. Nets and shuttlecocks available at desk.',
    capacity: 4,
    imageUrl: '/images/facilities/Badminton.png',
    rules: 'Non-marking shoes only. 60 min max per booking during peak.',
    equipmentInfo: 'Nets, posts, shuttlecocks available.',
    slotDurationMinutes: 30,
    minBookingSlots: 1,
    maxBookingSlots: 4,
    peakStartTime: '17:00',
    peakEndTime: '21:00',
    pricePerSlotOffPeak: 200,
    pricePerSlotPeak: 300,
    isActive: true,
  },
  {
    name: 'Badminton Court 2',
    slug: 'badminton-court-2',
    category: 'Badminton',
    description: 'Second badminton court, same standards as Court 1.',
    capacity: 4,
    imageUrl: '/images/facilities/Badminton.png',
    rules: 'Non-marking shoes only.',
    equipmentInfo: 'Nets, posts, shuttlecocks.',
    slotDurationMinutes: 30,
    minBookingSlots: 1,
    maxBookingSlots: 4,
    peakStartTime: '17:00',
    peakEndTime: '21:00',
    pricePerSlotOffPeak: 200,
    pricePerSlotPeak: 300,
    isActive: true,
  },
  {
    name: 'Football Ground',
    slug: 'football-ground',
    category: 'Football',
    description: 'Full-size football ground with grass surface. Suitable for 5-a-side or full match.',
    capacity: 22,
    imageUrl: '/images/facilities/Football.png',
    rules: 'Studs allowed. No food on pitch. Book in 1hr slots.',
    equipmentInfo: 'Goals, corner flags. Bring own balls or rent at desk.',
    slotDurationMinutes: 60,
    minBookingSlots: 1,
    maxBookingSlots: 3,
    peakStartTime: '16:00',
    peakEndTime: '20:00',
    pricePerSlotOffPeak: 1500,
    pricePerSlotPeak: 2000,
    isActive: true,
  },
  {
    name: 'Basketball Court',
    slug: 'basketball-court',
    category: 'Basketball',
    description: 'Indoor basketball court with wooden floor. Full court with hooks.',
    capacity: 20,
    imageUrl: '/images/facilities/Basketball.png',
    rules: 'Indoor shoes only. No food or drinks on court.',
    equipmentInfo: 'Basketballs available at sports desk.',
    slotDurationMinutes: 60,
    minBookingSlots: 1,
    maxBookingSlots: 2,
    peakStartTime: '17:00',
    peakEndTime: '21:00',
    pricePerSlotOffPeak: 800,
    pricePerSlotPeak: 1200,
    isActive: true,
  },
  {
    name: 'Table Tennis Table 1',
    slug: 'table-tennis-1',
    category: 'Table Tennis',
    description: 'Professional table tennis table. Paddles and balls at desk.',
    capacity: 4,
    imageUrl: '/images/facilities/Tabletenis.png',
    rules: '30 min slots. Maximum 4 players per booking.',
    equipmentInfo: 'Paddles, balls, nets.',
    slotDurationMinutes: 30,
    minBookingSlots: 1,
    maxBookingSlots: 2,
    peakStartTime: '17:00',
    peakEndTime: '21:00',
    pricePerSlotOffPeak: 100,
    pricePerSlotPeak: 150,
    isActive: true,
  },
  {
    name: 'Table Tennis Table 2',
    slug: 'table-tennis-2',
    category: 'Table Tennis',
    description: 'Second table tennis table.',
    capacity: 4,
    imageUrl: '/images/facilities/Tabletenis.png',
    rules: '30 min slots.',
    equipmentInfo: 'Paddles, balls, nets.',
    slotDurationMinutes: 30,
    minBookingSlots: 1,
    maxBookingSlots: 2,
    peakStartTime: '17:00',
    peakEndTime: '21:00',
    pricePerSlotOffPeak: 100,
    pricePerSlotPeak: 150,
    isActive: true,
  },
  {
    name: 'Pool Table 1',
    slug: 'pool-table-1',
    category: 'Pool',
    description: 'Standard pool/snooker table. Cues and balls at desk.',
    capacity: 4,
    imageUrl: '/images/facilities/pool_table.png',
    rules: '30 min slots. No food on table.',
    equipmentInfo: 'Cues, balls, chalk.',
    slotDurationMinutes: 30,
    minBookingSlots: 1,
    maxBookingSlots: 4,
    peakStartTime: '18:00',
    peakEndTime: '22:00',
    pricePerSlotOffPeak: 150,
    pricePerSlotPeak: 200,
    isActive: true,
  },
  {
    name: 'Pool Table 2',
    slug: 'pool-table-2',
    category: 'Pool',
    description: 'Second pool table.',
    capacity: 4,
    imageUrl: '/images/facilities/pool_table.png',
    rules: '30 min slots.',
    equipmentInfo: 'Cues, balls, chalk.',
    slotDurationMinutes: 30,
    minBookingSlots: 1,
    maxBookingSlots: 4,
    peakStartTime: '18:00',
    peakEndTime: '22:00',
    pricePerSlotOffPeak: 150,
    pricePerSlotPeak: 200,
    isActive: true,
  },
];

const equipmentCategories = [
  { name: 'Sports – Balls', code: 'BALLS', description: 'Football, Basketball, Volleyball, etc.' },
  { name: 'Sports – Bats & Rackets', code: 'BATS', description: 'Cricket bats, Tennis/Badminton rackets' },
  { name: 'Sports – Nets', code: 'NETS', description: 'Badminton, Volleyball, Tennis nets' },
  { name: 'Fitness', code: 'FITNESS', description: 'Dumbbells, Resistance bands, Yoga mats' },
  { name: 'Indoor Games', code: 'INDOOR', description: 'Ludo, Chess, Uno Cards, etc.' },
];

const equipmentItems = [
  { categoryCode: 'BALLS', name: 'Football', sportType: 'Football', brand: 'Nike', quantity: 10, lowStockThreshold: 2, photos: ['/images/equipments/football.png'] },
  { categoryCode: 'BALLS', name: 'Basketball', sportType: 'Basketball', brand: 'Spalding', quantity: 8, lowStockThreshold: 2, photos: ['/images/equipments/basketball.png'] },
  { categoryCode: 'BATS', name: 'Badminton Racket', sportType: 'Badminton', brand: 'Yonex', quantity: 6, lowStockThreshold: 1, photos: ['/images/equipments/badminton.png'] },
  { categoryCode: 'BATS', name: 'Bat-ball', sportType: 'Cricket', brand: 'Spartan', quantity: 12, lowStockThreshold: 2, photos: ['/images/equipments/bat_ball.png'] },
  { categoryCode: 'INDOOR', name: 'Ludo', sportType: null, brand: 'Generic', quantity: 10, lowStockThreshold: 2, photos: ['/images/equipments/ludo.png'] },
  { categoryCode: 'INDOOR', name: 'Chess board', sportType: null, brand: 'Generic', quantity: 10, lowStockThreshold: 2, photos: ['/images/equipments/chess.png'] },
  { categoryCode: 'INDOOR', name: 'Uno cards game', sportType: null, brand: 'Generic', quantity: 15, lowStockThreshold: 3, photos: ['/images/equipments/uno_cards.png'] },
];

async function main() {
  for (const f of facilities) {
    await prisma.facility.upsert({
      where: { slug: f.slug },
      create: f as any,
      update: f as any,
    });
  }
  console.log('Seeded facilities:', facilities.length);

  for (const c of equipmentCategories) {
    await prisma.equipmentCategory.upsert({
      where: { code: c.code },
      create: c,
      update: { name: c.name, description: c.description ?? undefined },
    });
  }
  
  await prisma.equipmentItem.deleteMany({
    where: {
      name: { in: ['Yoga Mat', 'First-aid Kit'] }
    }
  });

  const categories = await prisma.equipmentCategory.findMany();
  for (const e of equipmentItems) {
    const cat = categories.find((c) => c.code === e.categoryCode);
    if (!cat) continue;
    const existingItem = await prisma.equipmentItem.findFirst({
      where: { categoryId: cat.id, name: e.name },
    });
    if (existingItem) {
      await prisma.equipmentItem.update({
        where: { id: existingItem.id },
        data: { 
          quantity: e.quantity, 
          lowStockThreshold: e.lowStockThreshold,
          photos: e.photos,
          brand: e.brand ?? undefined,
          sportType: e.sportType ?? undefined,
        },
      });
    } else {
      await prisma.equipmentItem.create({
        data: {
          categoryId: cat.id,
          name: e.name,
          sportType: e.sportType ?? undefined,
          brand: e.brand ?? undefined,
          quantity: e.quantity,
          lowStockThreshold: e.lowStockThreshold,
          photos: e.photos,
          qrCode: generateQrCode(),
        },
      });
    }
  }
  console.log('Seeded equipment categories and items');

  const existingEvent = await prisma.event.findFirst({ where: { title: 'Sports Day 2025' } });
  if (!existingEvent) {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const start = new Date(nextMonth);
    start.setHours(9, 0, 0, 0);
    const end = new Date(nextMonth);
    end.setHours(17, 0, 0, 0);
    await prisma.event.create({
      data: {
        type: 'SportsDay',
        title: 'Sports Day 2025',
        description: 'Annual sports day with track and field events, team games, and awards.',
        startTime: start,
        endTime: end,
        venue: 'Main Ground',
        registrationRequired: true,
        capacity: 200,
        entryFee: 0,
        status: 'Published',
      },
    });
    console.log('Seeded sample event');
  }

  // Seed Coaches
  const coaches = [
    {
      email: 'abdulsalam@fscm.com',
      fastId: 'S-COACH-1',
      name: 'Abdul Salam',
      specializations: ['Table Tennis'],
      bio: 'Professional Table Tennis coach with over 10 years of experience in training students for national levels.',
      hourlyRate: 500,
    },
    {
      email: 'jawadahmed@fscm.com',
      fastId: 'S-COACH-2',
      name: 'Jawad Ahmed',
      specializations: ['Pool Table'],
      bio: 'Expert Pool and Snooker strategist focusing on precision, cue control, and tactical game planning.',
      hourlyRate: 400,
    }
  ];

  for (const c of coaches) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: { name: c.name, role: 'Coach' },
      create: {
        email: c.email,
        fastId: c.fastId,
        name: c.name,
        passwordHash: '$2b$10$EpjXWzO2W6G.29.Xp.jR.e9W.QpS.F/S.X.e.X.e.X.e.X.e.X.e.X', // placeholder
        role: 'Coach',
      },
    });

    await prisma.coachProfile.upsert({
      where: { userId: user.id },
      update: {
        specializations: c.specializations,
        bio: c.bio,
        hourlyRate: c.hourlyRate,
        isActive: true,
      },
      create: {
        userId: user.id,
        specializations: c.specializations,
        bio: c.bio,
        hourlyRate: c.hourlyRate,
        isActive: true,
      },
    });
  }
  console.log('Seeded coaches:', coaches.length);

  // —— Phase 6: Admin & Tournaments ———
  const admin = await prisma.user.upsert({
    where: { email: 'admin@fscm.com' },
    update: { role: 'Admin' },
    create: {
      email: 'admin@fscm.com',
      fastId: 'ADMIN-001',
      name: 'System Admin',
      passwordHash: '$2b$10$EpjXWzO2W6G.29.Xp.jR.e9W.QpS.F/S.X.e.X.e.X.e.X.e.X.e.X', // placeholder
      role: 'Admin',
    },
  });

  const fastOpen = await prisma.tournament.findFirst({
    where: { name: 'FAST Open 2026' }
  });

  if (!fastOpen) {
    await prisma.tournament.create({
      data: {
        name: 'FAST Open 2026',
        sport: 'Table Tennis',
        startDate: new Date('2026-11-20T10:00:00Z'),
        endDate: new Date('2026-11-25T18:00:00Z'),
        format: 'SingleElimination',
        status: 'RegistrationOpen',
        registrationOpen: true,
        registrationDeadline: new Date('2026-11-15T23:59:59Z'),
        maxTeams: 32,
        entryFee: 500,
        rules: '1. Standard ITTF rules. 2. Best of 5 sets. 3. Professional paddles allowed. 4. Non-marking shoes compulsory.',
        createdById: admin.id,
      }
    });
    console.log('Seeded FAST Open tournament');
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
  });
