# FleetPulse — System Architecture

```mermaid
flowchart TB
    subgraph Client["🖥️ Browser / Vercel Edge"]
        direction TB
        BR["🌐 Browser Request"]
        PW["Vercel Proxy (middleware.ts)
             • Reads req.geo.country
             • Sets x-dsql-region header
               (us / eu)"]
        SP["Static Pages
             • / (Landing)
             • /dashboard/* (pre-rendered)"]
        API["API Routes
             • /api/shipments
             • /api/shipments/[id]
             • /api/drivers"]
    end

    subgraph Frontend["⚛️ Next.js App Router (React)"]
        direction TB
        DASH["/dashboard
             • KPICards
             • FleetMap (Leaflet)
             • LiveOperations
             • ActivityTable"]
        LM["/dashboard/live-map
             • FleetMap (full-screen)
             • LiveOperations"]
        FM["/dashboard/fleet-management
             • ActivityTable
             • UpdateShipmentModal"]
        DRV["/dashboard/drivers
             • DriversTable
             • NewDriverModal"]
        SHIP["/dashboard/shipments
             • ShipmentsList"]
        AN["/dashboard/analytics
             • KPIs + Summary"]
    end

    subgraph AuthLayer["🔑 API Key Authentication"]
        direction LR
        AK["x-api-key header required for:
             • POST /api/shipments
             • PATCH /api/shipments/[id]
             • DELETE /api/shipments/[id]
             • POST /api/drivers"]
    end

    subgraph DSQL["🗄️ Amazon Aurora DSQL"]
        direction TB
        DSQL_US["US Cluster (us-east-1)
             Endpoint: DSQL_ENDPOINT_US"]
        DSQL_EU["EU Cluster (eu-north-1)
             Endpoint: DSQL_ENDPOINT_EU
             (optional)"]
        DB_TABLES["Tables
             • drivers
               - id (UUID)
               - name, email, phone
               - status (active/offline/on_break)
               - created_at, updated_at
             • shipments
               - id (UUID)
               - driver_id (FK → drivers)
               - origin, destination
               - status (pending/in_transit/delivered/delayed)
               - progress (0‑100)
               - created_at, updated_at"]
    end

    subgraph Connector["🔌 @aws/aurora-dsql-node-postgres-connector"]
        direction LR
        POOL["Singleton AuroraDSQLPool
             • getPool() → cached instance
             • IAM auth (no static passwords)
             • OCC retry (max 3 attempts)"]
        ROUTE["Region Routing
             • x-dsql-region header
             → selects endpoint"]
    end

    subgraph AuthIAM["☁️ AWS IAM"]
        IAM_USER["fleetpulse-dev-user
             Permissions:
             • dsql:DbConnect
             • dsql:DbConnectAdmin"]
        IAM_POLICY["Inline Policy
             • dsql:* on cluster ARN"]
    end

    subgraph EnvVars["📋 Environment Variables"]
        direction LR
        EV1["DSQL_ENDPOINT_US
             = qrt4bpg2…dsql.us-east-1.on.aws"]
        EV2["DSQL_DATABASE
             = postgres"]
        EV3["AWS_REGION
             = us-east-1"]
        EV4["NEXT_PUBLIC_API_KEY
             = fleetpulse2024"]
        EV5["CORS_ORIGIN
             = https://fleetpulse-ochre.vercel.app"]
    end

    %% Connections
    BR --> PW
    PW --> SP
    PW --> API
    API --> AuthLayer
    AuthLayer --> Connector
    Connector --> POOL
    POOL --> ROUTE
    ROUTE --> DSQL_US
    ROUTE -.-> DSQL_EU
    DSQL_US --> DB_TABLES
    DSQL_EU --> DB_TABLES

    DASH --> API
    LM --> API
    FM --> API
    DRV --> API
    SHIP --> API
    AN --> API

    IAM_POLICY --> IAM_USER
    IAM_USER -.-> DSQL_US
    IAM_USER -.-> DSQL_EU

    POOL --- EnvVars
    DSQL_US --- EnvVars
    DSQL_EU --- EnvVars
```

## Data Flow

```
User → Browser → Vercel Edge (Proxy)
                      │
                      ├── x-dsql-region: "us" | "eu"
                      │
                      ▼
               Next.js API Route
                      │
                      ├── x-api-key check (writes only)
                      │
                      ▼
               lib/db.ts (getPool)
                      │
                      ├── IAM token generation
                      ├── OCC retry wrapper
                      │
                      ▼
               Aurora DSQL Cluster
                      │
                      ├── query("SELECT …")
                      │
                      ▼
               JSON Response → Browser
```

## Key Design Decisions

| Decision | Rationale |
|---|---|
| **IAM auth** (no passwords) | Aurora DSQL requires IAM-based credentials. Static passwords are not supported. |
| **Singleton pool** | Prevents connection exhaustion on serverless cold starts. The pool is reused across requests. |
| **OCC retry** (3 attempts, 100ms max delay) | Aurora DSQL uses optimistic concurrency control. Writes can fail with serialisation errors and must be retried. |
| **Region routing via header** | Middleware sets `x-dsql-region` based on `req.geo.country`. Adding an EU cluster later only requires setting `DSQL_ENDPOINT_EU` — no code changes. |
| **API key on writes** | Public reads (GET) are unauthenticated. Writes (POST/PATCH/DELETE) require `x-api-key` to prevent abuse. |
| **SSR-safe Leaflet** | Leaflet accesses `window` during module init. Dynamic import with `ssr: false` + mount guard prevents build errors. |
| **30-second polling** | Simple and reliable for hackathon scale. Can be upgraded to WebSockets or Server-Sent Events later. |