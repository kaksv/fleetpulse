'use client'

import { useState, useEffect } from 'react'
import { UserPlus } from 'lucide-react'
import { NewDriverModal } from '@/components/new-driver-modal'

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

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-emerald-500/10 text-emerald-400' },
  offline: { label: 'Offline', color: 'bg-muted text-muted-foreground' },
  on_break: { label: 'On Break', color: 'bg-amber-500/10 text-amber-400' },
}

export function DriversClient() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const fetchDrivers = () => {
    fetch('/api/drivers')
      .then((res) => res.json())
      .then((data) => {
        setDrivers(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchDrivers()
  }, [])

  return (
    <main className="flex-1 p-6 overflow-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Drivers</h1>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-foreground text-background hover:opacity-90 transition-opacity text-sm font-medium"
          >
            <UserPlus className="w-4 h-4" />
            Add Driver
          </button>
        </div>

        {loading ? (
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="h-6 w-40 bg-muted rounded mb-6 animate-pulse" />
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Phone</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Active Shipments</th>
                </tr>
              </thead>
              <tbody>
                {drivers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                      No drivers found. Click "Add Driver" to create one.
                    </td>
                  </tr>
                ) : (
                  drivers.map((driver) => {
                    const badge = STATUS_BADGE[driver.status] ?? STATUS_BADGE.offline
                    return (
                      <tr key={driver.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                        <td className="py-4 px-4 font-medium text-foreground">{driver.name}</td>
                        <td className="py-4 px-4 text-muted-foreground">{driver.email}</td>
                        <td className="py-4 px-4 text-muted-foreground">{driver.phone}</td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-foreground">{driver.active_shipments}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {showModal && (
          <NewDriverModal
            onClose={() => setShowModal(false)}
            onCreated={() => {
              setShowModal(false)
              fetchDrivers()
            }}
          />
        )}
      </div>
    </main>
  )
}