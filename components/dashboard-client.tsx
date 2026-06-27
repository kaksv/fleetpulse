'use client'

import { useState, useEffect } from 'react'
import { KPICards } from '@/components/kpi-cards'
import { LiveOperations } from '@/components/live-operations'
import { ActivityTable } from '@/components/activity-table'
import { useToast } from '@/components/toast'
import dynamic from 'next/dynamic'

// Leaflet touches window during module init; load only on client
// @ts-ignore
const FleetMap = dynamic(() => import('@/components/fleet-map').then((m) => m.FleetMap), { ssr: false })

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

interface Driver {
  id: string
  name: string
  email: string
  phone: string
  status: 'active' | 'offline' | 'on_break'
  active_shipments: number
  created_at: string
  updated_at: string
}

export function DashboardClient() {
  const { toast } = useToast()
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  async function handleDelete(id: string) {
    const res = await fetch(`/api/shipments/${id}`, {
      method: 'DELETE',
      headers: { 'x-api-key': process.env.NEXT_PUBLIC_API_KEY ?? '' },
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast(data.error || 'Failed to delete shipment', 'error')
      throw new Error(data.error || 'Failed to delete shipment')
    }
    toast('Shipment deleted', 'success')
    await fetchData()
  }

  async function fetchData() {
    try {
      const [shipRes, driverRes] = await Promise.all([
        fetch('/api/shipments'),
        fetch('/api/drivers'),
      ])

      if (!shipRes.ok || !driverRes.ok) {
        throw new Error('Failed to fetch')
      }

      const [shipData, driverData]: [Shipment[], Driver[]] = await Promise.all([
        shipRes.json(),
        driverRes.json(),
      ])

      setShipments(shipData)
      setDrivers(driverData)
      setLastUpdated(new Date().toLocaleTimeString())
      setError(null)
    } catch {
      setError('Failed to fetch dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30_000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return <DashboardSkeletonInner />
  if (error) return <DashboardError error={error} onRetry={fetchData} />

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-muted-foreground">
          Last updated: {lastUpdated} · Auto-refreshes every 30s
        </p>
      </div>
      <KPICards shipments={shipments} drivers={drivers} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <FleetMap shipments={shipments} />
        </div>
        <LiveOperations shipments={shipments} refetch={fetchData} />
      </div>
      <ActivityTable shipments={shipments} onDelete={handleDelete} />
    </div>
  )
}

function DashboardSkeletonInner() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-6">
            <div className="h-4 w-24 bg-muted rounded mb-4" />
            <div className="h-8 w-16 bg-muted rounded" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card h-96" />
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="h-5 w-32 bg-muted rounded mb-4" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded mb-3" />
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="h-5 w-40 bg-muted rounded mb-6" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-muted rounded mb-2" />
        ))}
      </div>
    </div>
  )
}

function DashboardError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-96 gap-4">
      <div className="text-center">
        <p className="text-sm text-red-500">{error}</p>
      </div>
      <button
        onClick={onRetry}
        className="px-4 py-2 rounded-lg bg-foreground text-background hover:opacity-90 text-sm font-medium"
      >
        Retry
      </button>
    </div>
  )
}