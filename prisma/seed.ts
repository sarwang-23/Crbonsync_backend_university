import { prisma } from '../src/config/prisma';
import bcrypt from 'bcryptjs';

async function seedIndiaEmissionFactors() {
  console.log('🌱 Seeding India Fixed Emission Factors...');

  const indiaFixedEFs = [
    {
      name: 'India Grid Electricity — CEA V21.0',
      category: 'PURCHASED_ELECTRICITY' as const,
      scope: 'SCOPE_2' as const,
      factor: 0.7117,
      unit: 'kgCO2e/kWh',
      source: 'CEA' as const,
      sourceName: 'Central Electricity Authority',
      sourceVersion: 'V21.0',
      sourceUrl: 'https://cea.nic.in/emission-factor/',
      country: 'IN',
      year: 2024,
      isFixed: true,
      notes: 'India national grid emission factor. CEA CO2 Baseline Database V21.0 (2024).'
    },
    {
      name: 'India Diesel Combustion — INCCA',
      category: 'DIESEL' as const,
      scope: 'SCOPE_1' as const,
      factor: 2.68,
      unit: 'kgCO2e/L',
      source: 'INCCA' as const,
      sourceName: 'India Greenhouse Gas Inventory — INCCA',
      sourceVersion: '3rd National Communication',
      sourceUrl: 'https://moef.gov.in/moef/division/environment-division/climate-change/india-s-third-national-communication.html',
      country: 'IN',
      year: 2023,
      isFixed: true,
      notes: 'Diesel combustion emission factor for India (Scope 1). Source: INCCA / MoEFCC 3rd National Communication.'
    },
    {
      name: 'India Petrol Combustion — INCCA',
      category: 'PETROL' as const,
      scope: 'SCOPE_1' as const,
      factor: 2.31,
      unit: 'kgCO2e/L',
      source: 'INCCA' as const,
      sourceName: 'India Greenhouse Gas Inventory — INCCA',
      sourceVersion: '3rd National Communication',
      sourceUrl: 'https://moef.gov.in/moef/division/environment-division/climate-change/india-s-third-national-communication.html',
      country: 'IN',
      year: 2023,
      isFixed: true,
      notes: 'Petrol combustion emission factor for India (Scope 1). Source: INCCA / MoEFCC 3rd National Communication.'
    },
    {
      name: 'India LPG Combustion — INCCA',
      category: 'LPG' as const,
      scope: 'SCOPE_1' as const,
      factor: 1.51,
      unit: 'kgCO2e/kg',
      source: 'INCCA' as const,
      sourceName: 'India Greenhouse Gas Inventory — INCCA',
      sourceVersion: '3rd National Communication',
      sourceUrl: 'https://moef.gov.in/moef/division/environment-division/climate-change/india-s-third-national-communication.html',
      country: 'IN',
      year: 2023,
      isFixed: true,
      notes: 'LPG combustion emission factor for India (Scope 1). Source: INCCA / MoEFCC 3rd National Communication.'
    },
    {
      name: 'India CNG Combustion — INCCA',
      category: 'CNG' as const,
      scope: 'SCOPE_1' as const,
      factor: 2.21,
      unit: 'kgCO2e/kg',
      source: 'INCCA' as const,
      sourceName: 'India Greenhouse Gas Inventory — INCCA',
      sourceVersion: '3rd National Communication',
      sourceUrl: 'https://moef.gov.in/moef/division/environment-division/climate-change/india-s-third-national-communication.html',
      country: 'IN',
      year: 2023,
      isFixed: true,
      notes: 'CNG combustion emission factor for India (Scope 1). Source: INCCA / MoEFCC.'
    },
    {
      name: 'India Generator Diesel — INCCA',
      category: 'GENERATOR_FUEL' as const,
      scope: 'SCOPE_1' as const,
      factor: 2.68,
      unit: 'kgCO2e/L',
      source: 'INCCA' as const,
      sourceName: 'India Greenhouse Gas Inventory — INCCA',
      sourceVersion: '3rd National Communication',
      country: 'IN',
      year: 2023,
      isFixed: true,
      notes: 'Generator fuel (diesel) emission factor for India. Same as diesel factor.'
    },
    {
      name: 'India Boiler Fuel (Diesel) — INCCA',
      category: 'BOILER_FUEL' as const,
      scope: 'SCOPE_1' as const,
      factor: 2.68,
      unit: 'kgCO2e/L',
      source: 'INCCA' as const,
      sourceName: 'India Greenhouse Gas Inventory — INCCA',
      sourceVersion: '3rd National Communication',
      country: 'IN',
      year: 2023,
      isFixed: true,
      notes: 'Boiler fuel (diesel) emission factor for India (Scope 1).'
    }
  ];

  let created = 0;
  let skipped = 0;

  for (const ef of indiaFixedEFs) {
    const existing = await prisma.emissionFactor.findFirst({
      where: {
        category: ef.category,
        country: ef.country,
        isFixed: true,
        year: ef.year
      }
    });

    if (existing) {
      console.log(`  ⏭  Skipped (already exists): ${ef.name}`);
      skipped++;
      continue;
    }

    await prisma.emissionFactor.create({
      data: {
        name: ef.name,
        category: ef.category,
        scope: ef.scope,
        factor: ef.factor,
        unit: ef.unit,
        source: ef.source,
        sourceName: ef.sourceName ?? null,
        sourceVersion: ef.sourceVersion ?? null,
        sourceUrl: ef.sourceUrl ?? null,
        country: ef.country,
        year: ef.year,
        isFixed: ef.isFixed,
        status: 'ACTIVE',
        notes: ef.notes ?? null
      }
    });
    console.log(`  ✅ Created: ${ef.name}`);
    created++;
  }

  console.log(`\n📊 India EFs: ${created} created, ${skipped} skipped.`);
}

async function seedDefaultUniversity() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@gsu.edu';
  
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error("SEED_ADMIN_PASSWORD is required for production seeding");
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  const university = await prisma.university.upsert({
    where: { code: 'UNI-001' },
    update: {},
    create: {
      name: 'Global Sustainability University',
      code: 'UNI-001',
      email: adminEmail,
      status: 'ACTIVE',
      users: existingAdmin ? undefined : {
        create: {
          firstName: 'Super',
          lastName: 'Admin',
          email: adminEmail,
          passwordHash: hashedPassword,
          role: 'SUPER_ADMIN',
          status: 'ACTIVE'
        }
      }
    }
  });

  console.log(`\n🏛  University: ${university.name}`);
  console.log(`👤 Admin: ${adminEmail} (Password from ENV)`);
}

async function main() {
  console.log('🚀 Starting seed...\n');
  await seedDefaultUniversity();
  await seedIndiaEmissionFactors();
  console.log('\n✨ Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
