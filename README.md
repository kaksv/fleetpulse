# FleetPulse 🚛

> Real-time logistics and fleet management dashboard powered by Amazon Aurora DSQL.

FleetPulse is a globally-distributed logistics dashboard. It demonstrates a **single-cluster-now, multi-region-ready** architecture: the application runs on one Aurora DSQL cluster in `us-east-1` today, but adding an EU cluster tomorrow requires only setting an environment variable — **zero code changes**.

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                  Vercel Edge                     │
│                                                  │
│  middleware.ts ─→ detects country (req.geo)      │
│       │                                          │
│       │ sets x-dsql-region: us | eu              │
│       ▼                                          │
│  Next.js API Route ─→ lib/db.ts                  │
│                           │                      │
│                           │ resolveEndpoint()    │
│                           ▼                      │
│                   Aurora DSQL Pool                │
│                    (us-east-1)                    │
│                                                  │
│  ┌─────────────┐   ┌─────────────────────┐       │
│  │  drivers    │   │  shipments           │       │
│  ├─────────────┤   ├─────────────────────┤       │
│  │ id (UUID)   │───│ id (UUID)           │       │
│  │ name        │   │ driver_id (FK)      │       │
│  │ email       │   │ origin              │       │
│  │ phone       │   │ destination         │       │
│  │ status      │   │ status              │       │
│  └─────────────┘   │ progress            │       │
│                    └─────────────────────┘       │
└─────────────────────────────────────────────────┘
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Edge Middleware** | Geo-routing happens before the request hits the API — zero latency overhead for the user. |
| **Singleton Pool** | `getDbPool()` caches the `AuroraDSQLPool` globally, preventing connection exhaustion on serverless cold starts. |
| **OCC Transactions** | All writes use `pool.transaction()` from the AWS connector, which automatically retries on Optimistic Concurrency Control conflicts — essential for DSQL's distributed architecture. |
| **`query()` helper** | Simple read-only queries use `query()`, which acquires/releases a client from the pool. Writes use `pool.transaction()` directly for OCC safety. |
| **Multi-region header** | The `x-dsql-region` header is the single seam for regional routing. Adding an APAC cluster later = one env var + one `if` branch. |

## Tech Stack

- **Framework:** Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Database:** Amazon Aurora DSQL (PostgreSQL-compatible, serverless, IAM auth)
- **Connector:** [`@aws/aurora-dsql-node-postgres-connector`](https://github.com/awslabs/aurora-dsql-connectors) — official AWS library with IAM auth, connection pooling, and **automatic OCC retry**
- **Deployment:** Vercel (Edge Network for middleware)
- **Icons:** lucide-react

## Getting Started

### Prerequisites

- Node.js 18+
- AWS account with Aurora DSQL cluster provisioned
- AWS credentials configured locally (via `~/.aws/credentials` or environment variables)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-org/fleetpulse.git
cd fleetpulse

# 2. Install dependencies
npm install

# 3. Copy environment variables
cp .env.example .env.local

# 4. Edit .env.local with your Aurora DSQL endpoint
#    DSQL_ENDPOINT_US=your-cluster-endpoint-us-east-1.dsql.aws.com
```

### Database Setup

```bash
# Run schema creation and seed data
npm run setup-db
```

This script:
1. Connects to Aurora DSQL using `AuroraDSQLClient` (admin mode, no pool).
2. Creates `drivers` and `shipments` tables (idempotent — `CREATE TABLE IF NOT EXISTS`).
3. Seeds 5 realistic drivers and 5 shipments (idempotent — `DO $$ ... $$` blocks check for existing rows).

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## API Reference

All routes are prefixed with `/api` and support the `x-dsql-region` header for multi-region routing.

### `GET /api/shipments`

Returns all shipments joined with driver names.

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "driver_id": "uuid",
    "driver_name": "Alice Mbabazi",
    "origin": "Kampala, Uganda",
    "destination": "Nairobi, Kenya",
    "status": "in_transit",
    "progress": 65,
    "created_at": "2026-06-26T12:00:00Z",
    "updated_at": "2026-06-26T12:00:00Z"
  }
]
```

### `POST /api/shipments`

Creates a new shipment. Uses `pool.transaction()` for OCC-safe writes.

**Body:**
```json
{
  "driver_id": "uuid",
  "origin": "Kampala, Uganda",
  "destination": "Kigali, Rwanda"
}
```

**Response:** `201 Created`

### `PATCH /api/shipments/:id`

Updates shipment status and/or progress. Uses `pool.transaction()`.

**Body:**
```json
{
  "status": "delivered",
  "progress": 100
}
```

**Response:** `200 OK`

### `DELETE /api/shipments/:id`

Deletes a shipment.

**Response:** `204 No Content`

### `GET /api/drivers`

Returns all drivers with active (in_transit) shipment count via correlated subquery.

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "name": "Alice Mbabazi",
    "email": "alice.mbabazi@fleetpulse.io",
    "phone": "+256-700-111-111",
    "status": "active",
    "active_shipments": 2,
    "created_at": "...",
    "updated_at": "..."
  }
]
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `AWS_REGION` | Yes | AWS region for IAM auth (e.g. `us-east-1`) |
| `DSQL_ENDPOINT_US` | Yes | Aurora DSQL cluster endpoint (US) |
| `DSQL_ENDPOINT_EU` | No | Aurora DSQL cluster endpoint (EU — uncomment to enable) |
| `DSQL_DATABASE` | No | Database name (default: `postgres`) |
| `DSQL_TOKEN_DURATION_SECS` | No | IAM token lifetime in seconds (default: `900`) |
| `NEXT_PUBLIC_BASE_URL` | No | Public base URL for server-side fetch (default: `http://localhost:3000`) |

## Multi-Region Roadmap

The architecture is designed to be **single-cluster-now, multi-region-ready**. Here's how to add an EU cluster:

### 1. Provision an Aurora DSQL cluster in `eu-west-1`

Create the cluster through AWS Console, CLI, or Terraform.

### 2. Set the environment variable

```ini
# .env.local
DSQL_ENDPOINT_EU=your-cluster-endpoint-eu-west-1.dsql.aws.com
```

### 3. Verify routing

The middleware already detects EU countries and sets `x-dsql-region: eu`. The `resolveEndpoint()` function in `lib/db.ts` already handles the `eu` case:

```typescript
function resolveEndpoint(region: string): string {
  if (region === 'eu' && process.env.DSQL_ENDPOINT_EU) {
    return process.env.DSQL_ENDPOINT_EU;
  }
  // ...
}
```

### 4. (Optional) Cross-region replication

For production, set up DSQL cross-region replication so EU users read from the closer cluster. This is a DSQL-level configuration, not a code change.

### Adding APAC

Repeat the same pattern:
1. Add `DSQL_ENDPOINT_APAC` env var.
2. Add `APAC` country codes to the middleware set.
3. Add an `if (region === 'apac' && process.env.DSQL_ENDPOINT_APAC)` branch in `resolveEndpoint()`.

**No API route code needs to change** — the region is always read from the header.

## Project Structure

```
fleet-pulse-dashboard-design/
├── app/
│   ├── api/
│   │   ├── drivers/
│   │   │   └── route.ts          # GET /api/drivers
│   │   └── shipments/
│   │       ├── route.ts          # GET, POST /api/shipments
│   │       └── [id]/
│   │           └── route.ts      # PATCH, DELETE /api/shipments/:id
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                  # Dashboard (Server Component)
├── components/
│   ├── activity-table.tsx        # Recent Fleet Activity table
│   ├── header.tsx                # Top navigation bar
│   ├── kpi-cards.tsx             # Metric cards (active drivers, on-time %, etc.)
│   ├── live-operations.tsx       # Map + Active Shipments feed
│   ├── sidebar.tsx               # Navigation sidebar
│   └── ui/                       # Shared UI primitives (shadcn)
├── lib/
│   └── db.ts                     # Singleton pool + query() helper
├── scripts/
│   └── setup-db.ts               # Schema creation + seed data
├── middleware.ts                 # Edge geo-routing middleware
├── .env.example                  # Environment variable template
└── package.json
```

## License

MIT