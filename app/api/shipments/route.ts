import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { query, getDbPool } from '@/lib/db';

/* ------------------------------------------------------------------ */
/*  CORS — mirrors the env pattern already used in the PATCH route     */
/* ------------------------------------------------------------------ */

const corsHeaders = {
  'Access-Control-Allow-Origin':  process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
  'Access-Control-Max-Age':      '86400',
};

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

function isValidApiKey(raw: string | null): boolean {
  if (!raw) return false
  const allowed = (process.env.API_KEYS ?? process.env.API_KEY ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
  return allowed.length === 0 || allowed.includes(raw)
}

function badMethod(method: string) {
  return NextResponse.json({ error: `Method ${method} not allowed` }, { status: 405, headers: corsHeaders })
}

/* ------------------------------------------------------------------ */
/*  GET /api/shipments — List all shipments with driver names          */
/* ------------------------------------------------------------------ */

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

    return NextResponse.json(rows, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error('GET /api/shipments failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipments' },
      { status: 500, headers: corsHeaders },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/shipments — Create a new shipment (with OCC retry)      */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const headersList = await headers()
    const region = headersList.get('x-dsql-region') ?? 'us'

    // Auth required for writes
    const apiKey = request.headers.get('x-api-key') ?? request.headers.get('authorization')?.replace('Bearer ', '') ?? ''
    if (!isValidApiKey(apiKey)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders })
    }

    const body: CreateShipmentBody = await request.json();

    if (!body.driver_id || !body.origin || !body.destination) {
      return NextResponse.json(
        { error: 'Missing required fields: driver_id, origin, destination' },
        { status: 400, headers: corsHeaders },
      );
    }

    // Insert via OCC-safe transaction
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

    return NextResponse.json(rows[0], { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error('POST /api/shipments failed:', error);
    return NextResponse.json(
      { error: 'Failed to create shipment' },
      { status: 500, headers: corsHeaders },
    );
  }
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders })
}