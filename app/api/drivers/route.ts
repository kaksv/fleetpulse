import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { query } from '@/lib/db';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  GET /api/drivers — List all drivers with active shipment count    */
/* ------------------------------------------------------------------ */

/**
 * GET /api/drivers
 *
 * Returns all drivers along with a count of their active (in_transit)
 * shipments. Uses a correlated subquery for the count.
 * Supports multi-region via the `x-dsql-region` header set by middleware.
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