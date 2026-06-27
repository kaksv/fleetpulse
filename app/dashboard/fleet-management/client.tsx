'use client'

import { useState, useEffect } from 'react'
import { ActivityTable } from '@/components/activity-table'

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

export function ActivityTableClient() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/shipments')
      .then((res) => res.json())
      .then((data) => {
        setShipments(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleUpdate = async (id: string, patch: Partial<Shipment>) => {
    const res = await fetch(`/api/shipments/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.NEXT_PUBLIC_API_KEY ?? 'fleetpulse2024',
      },
      body: JSON.stringify(patch),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      alert(data.error || 'Failed to update shipment')
      return
    }
    alert('Shipment updated')
    // Refetch
    fetch('/api/shipments')
      .then((res) => res.json())
      .then(setShipments)
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="h-6 w-40 bg-muted rounded mb-6 animate-pulse" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="font-semibold text-foreground mb-6">Fleet Management</h3>
      <ActivityTable shipments={shipments} onUpdate={handleUpdate} />
    </div>
  )
}