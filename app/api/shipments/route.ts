import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { query, getDbPool } from '@/lib/db';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ShipmentRow extends Record<string, unknown> {
  id: string;
  driver_id: string | null;
  driver_name: string | null;
  origin: string;
  destination: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'delayed';
  progress: number;
  created_at: string;
  updated_at: string;
}

interface CreateShipmentBody {
  driver_id: string;
  origin: string;
  destination: string;
}

/* ------------------------------------------------------------------ */
/*  GET /api/shipments — List all shipments with driver names          */
/* ------------------------------------------------------------------ */

/**
 * GET /api/shipments
 *
 * Returns all shipments joined with the driver name.
 * Supports multi-region via the `x-dsql-region` header set by middleware.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const headersList = await headers();
    const region = headersList.get('x-dsql-region') ?? 'us';

    const sql = `
      SELECT
        s.id,
        s.driver_id,
        d.name AS driver_name,
        s.origin,
        s.destination,
        s.status,
        s.progress,
        s.created_at,
        s.updated_at
      FROM shipments s
      LEFT JOIN drivers d ON d.id = s.driver_id
      ORDER BY s.created_at DESC
    `;

    const rows = await query<ShipmentRow>(sql, [], region);

    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error('GET /api/shipments failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipments' },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/shipments — Create a new shipment (with OCC retry)      */
/* ------------------------------------------------------------------ */

/**
 * POST /api/shipments
 *
 * Creates a new shipment using `pool.transaction()` for automatic OCC
 * retry handling. Returns the created row with a 201 status.
 *
 * Body: { driver_id: string, origin: string, destination: string }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const headersList = await headers();
    const region = headersList.get('x-dsql-region') ?? 'us';

    const body: CreateShipmentBody = await request.json();

    // ── Validation ────────────────────────────────────────────────
    if (!body.driver_id || !body.origin || !body.destination) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: driver_id, origin, destination',
        },
        { status: 400 },
      );
    }

    if (typeof body.origin !== 'string' || typeof body.destination !== 'string') {
      return NextResponse.json(
        { error: 'origin and destination must be strings' },
        { status: 400 },
      );
    }

    // ── Insert via OCC-safe transaction ───────────────────────────
    const pool = getDbPool(region);
    const rows = await pool.transaction<ShipmentRow[]>(async (client) => {
      const result = await client.query<ShipmentRow>(
        `INSERT INTO shipments (driver_id, origin, destination)
         VALUES ($1, $2, $3)
         RETURNING
           id,
           driver_id,
           (SELECT name FROM drivers WHERE id = $1) AS driver_name,
           origin,
           destination,
           status,
           progress,
           created_at,
           updated_at`,
        [body.driver_id, body.origin, body.destination],
      );
      return result.rows;
    });

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error('POST /api/shipments failed:', error);
    return NextResponse.json(
      { error: 'Failed to create shipment' },
      { status: 500 },
    );
  }
}