'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'

interface Shipment {
  id: string
  driver_id: string | null
  driver_name: string | null
  origin: string
  destination: string
  status: 'pending' | 'in_transit' | 'delivered' | 'delayed'
  progress: number
  created_at: string
  updated_at: string
}

/* ------------------------------------------------------------------ */
/*  City coordinates for seeded demo data                              */
/* ------------------------------------------------------------------ */

const CITY_COORDS: Record<string, [number, number]> = {
  'kampala, uganda':       [0.3476, 32.5825],
  'nairobi, kenya':        [-1.2921, 36.8219],
  'addis ababa, ethiopia': [9.0239, 38.7469],
  'juba, south sudan':     [4.8594, 31.5713],
  'mombasa, kenya':        [-4.0435, 39.6682],
  'dar es salaam, tanzania': [-6.7870, 39.2083],
  'kigali, rwanda':        [-1.9403, 29.8739],
  'dubai, uae':            [25.2048, 55.2708],
  'london, uk':            [51.5074, -0.1278],
  'paris, france':         [48.8566, 2.3522],
  'lagos, nigeria':        [6.5244, 3.3792],
  'accra, ghana':          [5.6037, -0.1870],
}

function toCoord(name: string): [number, number] {
  return CITY_COORDS[name.toLowerCase().trim()] ?? [20, 0]
}

/* ------------------------------------------------------------------ */
/*  SVG pin icons (no global L.Icon.Default mutation)                  */
/* ------------------------------------------------------------------ */

const STATUS_COLORS: Record<string, string> = {
  in_transit: '#10b981',
  delayed:    '#f59e0b',
  pending:    '#64748b',
  delivered:  '#3b82f6',
}

function pinIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<svg width="28" height="36" viewBox="0 0 32 42" fill="none" style="filter:drop-shadow(0 2px 2px rgba(0,0,0,0.5))">
      <path d="M16 40C16 40 2 22 2 14C2 6.268 8.268 0 16 0C23.732 0 30 6.268 30 14C30 22 16 40 16 40Z"
            fill="${color}" stroke="#fff" stroke-width="2"/>
      <circle cx="16" cy="13" r="6" fill="#fff" opacity="0.9"/>
    </svg>`,
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -36],
  })
}

function destIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:14px;height:14px;border-radius:50%;
      background:#fff;border:3px solid #3b82f6;
      box-shadow:0 2px 4px rgba(0,0,0,0.4);
    " />`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })
}

/* ------------------------------------------------------------------ */
/*  Auto-fit bounds                                                    */
/* ------------------------------------------------------------------ */

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (!points.length) return
    map.fitBounds(L.latLngBounds(points), { padding: [80, 80], maxZoom: 5 })
  }, [points, map])
  return null
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface FleetMapProps {
  shipments: Shipment[]
}

export function FleetMap({ shipments }: FleetMapProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="w-full h-full bg-slate-950/50 animate-pulse" />
  }

  const active = shipments.filter(
    (s) => s.status === 'in_transit' || s.status === 'delayed',
  )

  const polylines: [number, number][][] = []
  const markerPoints: [number, number][] = []

  active.forEach((s) => {
    const o = toCoord(s.origin)
    const d = toCoord(s.destination)
    if ((o[0] !== 0 || o[1] !== 0) && (d[0] !== 0 || d[1] !== 0)) {
      polylines.push([o, d])
      markerPoints.push(o, d)
    }
  })

  const center: [number, number] = markerPoints.length > 0
    ? markerPoints[0]
    : [0.3476, 32.5825]

  return (
    <MapContainer
      center={center}
      zoom={2}
      className="w-full h-full z-0"
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        subdomains={['a', 'b', 'c', 'd']}
      />
      <FitBounds points={markerPoints} />

      {/* Route lines */}
      {polylines.map((line, idx) => (
        <Polyline
          key={`route-${idx}`}
          positions={line}
          pathOptions={{
            color: '#3b82f6',
            weight: 2,
            opacity: 0.6,
            dashArray: '6 6',
          }}
        />
      ))}

      {/* Origin markers */}
      {active.map((s) => {
        const origin = toCoord(s.origin)
        if (origin[0] === 0 && origin[1] === 0) return null
        const color = STATUS_COLORS[s.status] ?? STATUS_COLORS.pending
        return (
          <Marker key={`o-${s.id}`} position={origin} icon={pinIcon(color)}>
            <Popup>
              <div className="text-xs space-y-1 min-w-[140px]">
                <p className="font-semibold text-foreground">🚚 {s.driver_name ?? 'Unassigned'}</p>
                <p className="text-muted-foreground">From: {s.origin}</p>
                <p className="text-muted-foreground">To: {s.destination}</p>
                <p className="text-emerald-400 font-semibold">{s.progress}% complete</p>
              </div>
            </Popup>
          </Marker>
        )
      })}

      {/* Destination markers */}
      {active.map((s) => {
        const dest = toCoord(s.destination)
        if (dest[0] === 0 && dest[1] === 0) return null
        return (
          <Marker key={`d-${s.id}`} position={dest} icon={destIcon()}>
            <Popup>
              <div className="text-xs space-y-1 min-w-[120px]">
                <p className="font-semibold text-blue-500">🏁 Destination</p>
                <p className="text-foreground">{s.destination}</p>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}