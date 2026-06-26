'use client'

import { Truck, CheckCircle, AlertTriangle, Activity, TrendingUp, TrendingDown } from 'lucide-react'

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

interface KPICardsProps {
  shipments: Shipment[]
  drivers: Driver[]
}

export function KPICards({ shipments, drivers }: KPICardsProps) {
  const activeDrivers = drivers.filter((d) => d.status === 'active').length
  const totalDeliveries = shipments.length
  const onTime = shipments.filter((s) => s.status === 'delivered').length
  const onTimePct = totalDeliveries > 0 ? Math.round((onTime / totalDeliveries) * 1000) / 10 : 0
  const delayed = shipments.filter((s) => s.status === 'delayed').length
  const activeWithShipments = drivers.filter((d) => d.active_shipments > 0).length
  const utilization = drivers.length > 0 ? Math.round((activeWithShipments / drivers.length) * 100) : 0

  const metrics = [
    {
      label: 'Active Drivers',
      value: activeDrivers.toLocaleString(),
      trend: `out of ${drivers.length} total`,
      isPositive: true,
      icon: Truck,
      color: 'from-emerald-500/20 to-teal-600/20',
      iconColor: 'text-emerald-500',
    },
    {
      label: 'On-Time Deliveries',
      value: `${onTimePct}%`,
      trend: `${onTime} of ${totalDeliveries} shipments`,
      isPositive: true,
      icon: CheckCircle,
      color: 'from-blue-500/20 to-cyan-600/20',
      iconColor: 'text-blue-500',
    },
    {
      label: 'Delayed Shipments',
      value: delayed.toString(),
      trend: `${delayed > 0 ? '+' : ''}${delayed} delayed`,
      isPositive: delayed === 0,
      icon: AlertTriangle,
      color: 'from-orange-500/20 to-amber-600/20',
      iconColor: 'text-amber-500',
    },
    {
      label: 'Fleet Utilization',
      value: `${utilization}%`,
      trend: `${activeWithShipments} drivers on route`,
      isPositive: utilization >= 50,
      icon: Activity,
      color: 'from-purple-500/20 to-pink-600/20',
      iconColor: 'text-purple-500',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {metrics.map((metric) => {
        const Icon = metric.icon
        const TrendIcon = metric.isPositive ? TrendingUp : TrendingDown
        const trendColor = metric.isPositive ? 'text-emerald-500' : 'text-red-500'

        return (
          <div
            key={metric.label}
            className={`bg-gradient-to-br ${metric.color} backdrop-blur-sm border border-border rounded-xl p-6 hover:border-border/80 transition-all`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2.5 rounded-lg bg-card/50 border border-border`}>
                <Icon className={`w-5 h-5 ${metric.iconColor}`} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-semibold ${trendColor}`}>
                <TrendIcon className="w-4 h-4" />
                {metric.trend}
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">{metric.label}</p>
            <p className="text-3xl font-bold text-foreground">{metric.value}</p>
          </div>
        )
      })}
    </div>
  )
}