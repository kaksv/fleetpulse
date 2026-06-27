import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { query, getDbPool } from '@/lib/db';

/* ------------------------------------------------------------------ */
/*  CORS                                                               */
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

interface PatchShipmentBody {
  status?: 'pending' | 'in_transit' | 'delivered' | 'delayed';
  progress?: number;
}

function isValidApiKey(raw: string | null): boolean {
  if (!raw) return false
  const allowed = (process.env.API_KEYS ?? process.env.API_KEY ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
  return allowed.length === 0 || allowed.includes(raw)
}

/* ------------------------------------------------------------------ */
/*  PATCH /api/shipments/[id] — Update a shipment (with OCC retry)    */
/* ------------------------------------------------------------------ */

/**
 * PATCH /api/shipments/[id]
 *
 * Updates the status and/or progress of a specific shipment.
 * Uses `pool.transaction()` for automatic OCC retry handling.
 *
 * Body: { status?: string, progress?: number }
 * Returns the updated shipment row.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const headersList = await headers();
    const region = headersList.get('x-dsql-region') ?? 'us';
    const { id } = await params;

    const body: PatchShipmentBody = await request.json();

    // ── Auth required for writes ────────────────────────────────────
    const apiKey = request.headers.get('x-api-key') ?? request.headers.get('authorization')?.replace('Bearer ', '') ?? ''
    if (!isValidApiKey(apiKey)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders })
    }

    // ── Ensure at least one field is provided ──────────────────────
    if (body.status === undefined && body.progress === undefined) {
      return NextResponse.json(
        { error: 'At least one of status or progress must be provided' },
        { status: 400, headers: corsHeaders },
      );
    }

    // ── Validate status if provided ────────────────────────────────
    const validStatuses = ['pending', 'in_transit', 'delivered', 'delayed'] as const;
    if (body.status && !validStatuses.includes(body.status as typeof validStatuses[number])) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        },
        { status: 400, headers: corsHeaders },
      );
    }

    // ── Validate progress if provided ──────────────────────────────
    if (body.progress !== undefined) {
      if (typeof body.progress !== 'number' || body.progress < 0 || body.progress > 100) {
        return NextResponse.json(
          { error: 'progress must be a number between 0 and 100' },
          { status: 400, headers: corsHeaders },
        );
      }
    }

    // ── Build dynamic UPDATE query ─────────────────────────────────
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (body.status !== undefined) {
      setClauses.push(`status = $${paramIndex++}`);
      values.push(body.status);
    }
    if (body.progress !== undefined) {
      setClauses.push(`progress = $${paramIndex++}`);
      values.push(body.progress);
    }

    // Always bump updated_at
    setClauses.push(`updated_at = now()`);

    values.push(id); // last param = WHERE id

    const sql = `
      UPDATE shipments
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING
        id,
        driver_id,
        (SELECT name FROM drivers WHERE id = shipments.driver_id) AS driver_name,
        origin,
        destination,
        status,
        progress,
        created_at,
        updated_at
    `;

    // ── Update via OCC-safe transaction ────────────────────────────
    const pool = getDbPool(region);
    const rows = await pool.transaction<ShipmentRow[]>(async (client) => {
      const result = await client.query<ShipmentRow>(sql, values);
      return result.rows;
    });

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404, headers: corsHeaders },
      );
    }

    return NextResponse.json(rows[0], { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error('PATCH /api/shipments/[id] failed:', error);
    return NextResponse.json(
      { error: 'Failed to update shipment' },
      { status: 500, headers: corsHeaders },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE /api/shipments/[id] — Delete a shipment                    */
/* ------------------------------------------------------------------ */

/**
 * DELETE /api/shipments/[id]
 *
 * Deletes a shipment by ID. Returns 204 with no content on success.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const headersList = await headers();
    const region = headersList.get('x-dsql-region') ?? 'us';

    // ── Auth required for deletes ──────────────────────────────────
    const apiKey = _request.headers.get('x-api-key') ?? _request.headers.get('authorization')?.replace('Bearer ', '') ?? ''
    if (!isValidApiKey(apiKey)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders })
    }

    const { id } = await params;

    const rows = await query<ShipmentRow>(
      `DELETE FROM shipments WHERE id = $1
       RETURNING id`,
      [id],
      region,
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404, headers: corsHeaders },
      );
    }

    return new NextResponse(null, { status: 204, headers: corsHeaders });
  } catch (error) {
    console.error('DELETE /api/shipments/[id] failed:', error);
    return NextResponse.json(
      { error: 'Failed to delete shipment' },
      { status: 500, headers: corsHeaders },
    );
  }
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders })
}