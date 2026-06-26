'use client'

import { Truck, CheckCircle, AlertTriangle, Activity, TrendingUp, TrendingDown } from 'lucide-react'

const metrics = [
  {
    label: 'Active Drivers',
    value: '1,284',
    trend: '+4.5%',
    isPositive: true,
    icon: Truck,
    color: 'from-emerald-500/20 to-teal-600/20',
    iconColor: 'text-emerald-500',
  },
  {
    label: 'On-Time Deliveries',
    value: '94.2%',
    trend: '+1.2%',
    isPositive: true,
    icon: CheckCircle,
    color: 'from-blue-500/20 to-cyan-600/20',
    iconColor: 'text-blue-500',
  },
  {
    label: 'Delayed Shipments',
    value: '42',
    trend: '-8%',
    isPositive: true,
    icon: AlertTriangle,
    color: 'from-orange-500/20 to-amber-600/20',
    iconColor: 'text-amber-500',
  },
  {
    label: 'Fleet Utilization',
    value: '87%',
    trend: '+2.1%',
    isPositive: true,
    icon: Activity,
    color: 'from-purple-500/20 to-pink-600/20',
    iconColor: 'text-purple-500',
  },
]

export function KPICards() {
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
