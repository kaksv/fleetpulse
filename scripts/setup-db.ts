/**
 * Database setup & seed script for FleetPulse.
 *
 * Connects to the US Aurora DSQL endpoint using AuroraDSQLClient (not Pool,
 * since this is a one-off migration script). Creates tables if they do not
 * exist, then seeds 5 realistic drivers and 5 shipments idempotently.
 *
 * Usage: npx tsx scripts/setup-db.ts
 */
import { AuroraDSQLClient } from '@aws/aurora-dsql-node-postgres-connector';

/* ------------------------------------------------------------------ */
/*  Schema — single CREATE TABLE per query (DSQL limitation)          */
/* ------------------------------------------------------------------ */

const CREATE_DRIVERS_SQL = `
  CREATE TABLE IF NOT EXISTS drivers (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE,
    phone       TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'offline', 'on_break')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  );
`;

const CREATE_SHIPMENTS_SQL = `
  CREATE TABLE IF NOT EXISTS shipments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- NOTE: Aurora DSQL does not support FOREIGN KEY constraints.
    -- Referential integrity is enforced at the application layer.
    driver_id   UUID,
    origin      TEXT NOT NULL,
    destination TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'in_transit', 'delivered', 'delayed')),
    progress    INTEGER NOT NULL DEFAULT 0
                  CHECK (progress >= 0 AND progress <= 100),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  );
`;

/* ------------------------------------------------------------------ */
/*  Seed helpers — single INSERT per query (DSQL limitation)          */
/* ------------------------------------------------------------------ */

const COUNT_DRIVERS_SQL = 'SELECT COUNT(*)::int AS cnt FROM drivers';
const COUNT_SHIPMENTS_SQL = 'SELECT COUNT(*)::int AS cnt FROM shipments';

const INSERT_DRIVERS_SQL = `
  INSERT INTO drivers (name, email, phone, status) VALUES
    ($1, $2, $3, $4)
`;

interface DriverSeed {
  name: string;
  email: string;
  phone: string;
  status: string;
}

const DRIVER_SEEDS: DriverSeed[] = [
  { name: 'Alice Mbabazi',   email: 'alice.mbabazi@fleetpulse.io',   phone: '+256-700-111-111', status: 'active' },
  { name: 'Bob Kato',        email: 'bob.kato@fleetpulse.io',        phone: '+256-700-222-222', status: 'active' },
  { name: 'Carol Nambi',     email: 'carol.nambi@fleetpulse.io',     phone: '+256-700-333-333', status: 'offline' },
  { name: 'David Ssenyonga', email: 'david.ssenyonga@fleetpulse.io', phone: '+256-700-444-444', status: 'active' },
  { name: 'Eva Nakato',      email: 'eva.nakato@fleetpulse.io',      phone: '+256-700-555-555', status: 'on_break' },
];

interface ShipmentSeed {
  driverEmail: string | null;
  origin: string;
  destination: string;
  status: string;
  progress: number;
}

const SHIPMENT_SEEDS: ShipmentSeed[] = [
  { driverEmail: 'alice.mbabazi@fleetpulse.io',   origin: 'Kampala, Uganda',        destination: 'Nairobi, Kenya',         status: 'in_transit',  progress: 65 },
  { driverEmail: 'bob.kato@fleetpulse.io',        origin: 'Kampala, Uganda',        destination: 'Kigali, Rwanda',         status: 'delivered',   progress: 100 },
  { driverEmail: 'david.ssenyonga@fleetpulse.io', origin: 'Mombasa, Kenya',         destination: 'Dar es Salaam, Tanzania', status: 'in_transit',  progress: 30 },
  { driverEmail: 'alice.mbabazi@fleetpulse.io',   origin: 'Juba, South Sudan',      destination: 'Kampala, Uganda',        status: 'delayed',     progress: 45 },
  { driverEmail: null,                             origin: 'Nairobi, Kenya',         destination: 'Addis Ababa, Ethiopia',  status: 'pending',     progress: 0 },
];

/**
 * Seed drivers one by one. Each row is a separate INSERT so DSQL can execute it.
 */
async function seedDrivers(client: AuroraDSQLClient): Promise<void> {
  const { rows: [{ cnt }] } = await client.query<{ cnt: number }>(COUNT_DRIVERS_SQL);
  if (cnt > 0) {
    console.log('⏭️  Drivers already seeded, skipping.');
    return;
  }

  for (const d of DRIVER_SEEDS) {
    await client.query(INSERT_DRIVERS_SQL, [d.name, d.email, d.phone, d.status]);
  }
  console.log('✅ Drivers seeded.');
}

/**
 * Seed shipments one by one. Driver ID is resolved via subquery for each row.
 */
async function seedShipments(client: AuroraDSQLClient): Promise<void> {
  const { rows: [{ cnt }] } = await client.query<{ cnt: number }>(COUNT_SHIPMENTS_SQL);
  if (cnt > 0) {
    console.log('⏭️  Shipments already seeded, skipping.');
    return;
  }

  for (const s of SHIPMENT_SEEDS) {
    if (s.driverEmail) {
      await client.query(
        `INSERT INTO shipments (driver_id, origin, destination, status, progress)
         VALUES (
           (SELECT id FROM drivers WHERE email = $1),
           $2, $3, $4, $5
         )`,
        [s.driverEmail, s.origin, s.destination, s.status, s.progress],
      );
    } else {
      await client.query(
        `INSERT INTO shipments (driver_id, origin, destination, status, progress)
         VALUES (NULL, $1, $2, $3, $4)`,
        [s.origin, s.destination, s.status, s.progress],
      );
    }
  }
  console.log('✅ Shipments seeded.');
}

/* ------------------------------------------------------------------ */
/*  Main                                                              */
/* ------------------------------------------------------------------ */

async function main(): Promise<void> {
  const endpoint = process.env.DSQL_ENDPOINT_US;
  if (!endpoint) {
    console.error('❌ DSQL_ENDPOINT_US environment variable is not set.');
    process.exit(1);
  }

  console.log(`🔌 Connecting to Aurora DSQL at ${endpoint} …`);

  const client = new AuroraDSQLClient({
    host: endpoint,
    port: 5432,
    database: process.env.DSQL_DATABASE ?? 'postgres',
    ssl: { rejectUnauthorized: true },
    region: process.env.AWS_REGION ?? 'us-east-1',
    tokenDurationSecs: 900,
  });

  try {
    await client.connect();
    console.log('✅ Connected.');

    console.log('📦 Creating drivers table …');
    await client.query(CREATE_DRIVERS_SQL);
    console.log('✅ Drivers table ready.');

    console.log('📦 Creating shipments table …');
    await client.query(CREATE_SHIPMENTS_SQL);
    console.log('✅ Shipments table ready.');

    console.log('🌱 Seeding drivers …');
    await seedDrivers(client);

    console.log('🌱 Seeding shipments …');
    await seedShipments(client);

    console.log('🎉 Setup complete.');
  } catch (err) {
    console.error('❌ Setup failed:', err);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Disconnected.');
  }
}

main();