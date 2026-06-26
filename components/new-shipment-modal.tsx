'use client'

import { useState } from 'react'
import { X, Truck } from 'lucide-react'

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

interface NewShipmentModalProps {
  drivers: Driver[]
  onClose: () => void
  onSubmit: () => void
}

export function NewShipmentModal({ drivers, onClose, onSubmit }: NewShipmentModalProps) {
  const [formData, setFormData] = useState({
    driver_id: '',
    origin: '',
    destination: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const res = await fetch('/api/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create shipment')
        return
      }

      onSubmit()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const activeDrivers = drivers.filter((d) => d.status === 'active')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Truck className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-foreground">New Shipment</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Driver Select */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Assign Driver
            </label>
            <select
              value={formData.driver_id}
              onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              required
            >
              <option value="">Select a driver…</option>
              {activeDrivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.name} {driver.active_shipments > 0 ? `(${driver.active_shipments} active)` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Origin */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Origin
            </label>
            <input
              type="text"
              placeholder="e.g. Kampala, Uganda"
              value={formData.origin}
              onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              required
            />
          </div>

          {/* Destination */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Destination
            </label>
            <input
              type="text"
              placeholder="e.g. Nairobi, Kenya"
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              required
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {submitting ? 'Creating…' : 'Create Shipment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}