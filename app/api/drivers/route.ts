import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { query } from '@/lib/db';

interface DriverRow extends Record<string, unknown> {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'offline' | 'on_break';
  active_shipments: number;
  created_at: string;
  updated_at: string;
}

function authenticate(req: Request): { error: NextResponse } | null {
  const apiKey = req.headers.get('x-api-key');
  const allowedKeys = (process.env.API_KEYS ?? 'fleetpulse2024').split(',');
  if (!apiKey || !allowedKeys.includes(apiKey)) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return null;
}

/**
 * GET /api/drivers — List all drivers with active shipment count
 */
export async function GET(): Promise<NextResponse> {
  try {
    const headersList = await headers();
    const region = headersList.get('x-dsql-region') ?? 'us';

    const sql = `
      SELECT
        d.id,
        d.name,
        d.email,
        d.phone,
        d.status,
        (
          SELECT COUNT(*)
          FROM shipments s
          WHERE s.driver_id = d.id
            AND s.status = 'in_transit'
        ) AS active_shipments,
        d.created_at,
        d.updated_at
      FROM drivers d
      ORDER BY d.name ASC
    `;

    const rows = await query<DriverRow>(sql, [], region);
    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error('GET /api/drivers failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch drivers' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/drivers — Create a new driver
 */
export async function POST(req: Request): Promise<NextResponse> {
  const auth = authenticate(req);
  if (auth) return auth.error;

  try {
    const headersList = await headers();
    const region = headersList.get('x-dsql-region') ?? 'us';
    const body = await req.json();

    if (!body.name || !body.email || !body.phone) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, phone' },
        { status: 400 },
      );
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 },
      );
    }

    const sql = `
      INSERT INTO drivers (name, email, phone, status)
      VALUES ($1, $2, $3, 'active')
      RETURNING id, name, email, phone, status, created_at, updated_at
    `;

    const rows = await query<DriverRow>(sql, [body.name, body.email, body.phone], region);
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/drivers failed:', error);
    const msg = (error as { message?: string }).message ?? 'Unknown error';
    if (msg.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'A driver with this email already exists' },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: 'Failed to create driver' },
      { status: 500 },
    );
  }
}