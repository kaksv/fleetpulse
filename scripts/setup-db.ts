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
/*  Schema                                                            */
/* ------------------------------------------------------------------ */

const CREATE_TABLES_SQL = `
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

  CREATE TABLE IF NOT EXISTS shipments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id   UUID REFERENCES drivers(id) ON DELETE SET NULL,
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
/*  Seed data (idempotent – only inserts when tables are empty)       */
/* ------------------------------------------------------------------ */

const SEED_SQL = `
  DO $$
  DECLARE
    driver_count INTEGER;
  BEGIN
    SELECT COUNT(*) INTO driver_count FROM drivers;

    IF driver_count = 0 THEN
      INSERT INTO drivers (name, email, phone, status) VALUES
        ('Alice Mbabazi',  'alice.mbabazi@fleetpulse.io',  '+256-700-111-111', 'active'),
        ('Bob Kato',       'bob.kato@fleetpulse.io',       '+256-700-222-222', 'active'),
        ('Carol Nambi',    'carol.nambi@fleetpulse.io',    '+256-700-333-333', 'offline'),
        ('David Ssenyonga','david.ssenyonga@fleetpulse.io','+256-700-444-444', 'active'),
        ('Eva Nakato',     'eva.nakato@fleetpulse.io',     '+256-700-555-555', 'on_break');
    END IF;
  END $$;

  DO $$
  DECLARE
    shipment_count INTEGER;
  BEGIN
    SELECT COUNT(*) INTO shipment_count FROM shipments;

    IF shipment_count = 0 THEN
      INSERT INTO shipments (driver_id, origin, destination, status, progress)
      VALUES
        ((SELECT id FROM drivers WHERE email = 'alice.mbabazi@fleetpulse.io'),
         'Kampala, Uganda',        'Nairobi, Kenya',         'in_transit',  65),
        ((SELECT id FROM drivers WHERE email = 'bob.kato@fleetpulse.io'),
         'Kampala, Uganda',        'Kigali, Rwanda',         'delivered',   100),
        ((SELECT id FROM drivers WHERE email = 'david.ssenyonga@fleetpulse.io'),
         'Mombasa, Kenya',         'Dar es Salaam, Tanzania','in_transit',  30),
        ((SELECT id FROM drivers WHERE email = 'alice.mbabazi@fleetpulse.io'),
         'Juba, South Sudan',      'Kampala, Uganda',        'delayed',     45),
        (NULL,
         'Nairobi, Kenya',         'Addis Ababa, Ethiopia',  'pending',     0);
    END IF;
  END $$;
`;

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

    console.log('📦 Creating tables …');
    await client.query(CREATE_TABLES_SQL);
    console.log('✅ Tables ready.');

    console.log('🌱 Seeding data …');
    await client.query(SEED_SQL);
    console.log('✅ Seed complete.');
  } catch (err) {
    console.error('❌ Setup failed:', err);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Disconnected.');
  }
}

main();