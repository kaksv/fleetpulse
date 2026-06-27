'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface Shipment {
  id: string
  origin: string
  destination: string
  status: 'pending' | 'in_transit' | 'delivered' | 'delayed'
  progress: number
}

interface UpdateShipmentModalProps {
  shipment: Shipment
  onClose: () => void
  onUpdate: (patch: Partial<Shipment>) => void
}

export function UpdateShipmentModal({ shipment, onClose, onUpdate }: UpdateShipmentModalProps) {
  const [status, setStatus] = useState(shipment.status)
  const [progress, setProgress] = useState(shipment.progress)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch(`/api/shipments/${shipment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY ?? 'fleetpulse2024',
        },
        body: JSON.stringify({ status, progress }),
      })
      if (!res.ok) throw new Error('Failed to update shipment')
      onUpdate({ status, progress })
      onClose()
    } catch {
      alert('Update failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Update Shipment</h3>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Shipment['status'])}
              className="w-full px-3 py-2 rounded-lg border border-border bg-input text-foreground"
            >
              <option value="pending">Pending</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="delayed">Delayed</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Progress</label>
            <input
              type="number"
              min={0}
              max={100}
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-border bg-input text-foreground"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full px-4 py-2 rounded-lg bg-foreground text-background hover:opacity-90 text-sm font-medium disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}