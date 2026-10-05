'use client'

import { useState, useMemo } from 'react'
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts'
import { Calendar, TrendingUp, Clock, DollarSign, Package } from 'lucide-react'

interface OrderStat {
  id: string
  due_date: string
  estimated_cost: number
  quantity: number
  hours: number 
}

interface StatsChartProps {
  orders: OrderStat[]
}

export default function StatsChart({ orders }: StatsChartProps) {
  
  const [showCost, setShowCost] = useState(true)
  const [showQuantity, setShowQuantity] = useState(true)
  const [showHours, setShowHours] = useState(false)

  
  const chartData = useMemo(() => {
    const grouped: Record<string, { date: string; cost: number; quantity: number; hours: number }> = {}

    orders.forEach(order => {
      
      const date = new Date(order.due_date).toLocaleDateString('pl-PL', {
        day: '2-digit',
        month: '2-digit'
      })

      if (!grouped[date]) {
        grouped[date] = { date, cost: 0, quantity: 0, hours: 0 }
      }

      grouped[date].cost += Number(order.estimated_cost) || 0
      grouped[date].quantity += Number(order.quantity) || 0
      grouped[date].hours += Number(order.hours) || 0 
    })

    return Object.values(grouped)
  }, [orders])

  
  const totals = useMemo(() => {
    return orders.reduce(
      (acc, curr) => ({
        cost: acc.cost + (Number(curr.estimated_cost) || 0),
        quantity: acc.quantity + (Number(curr.quantity) || 0),
        hours: acc.hours + (Number(curr.hours) || 0),
      }),
      { cost: 0, quantity: 0, hours: 0 }
    )
  }, [orders])

  return (
    <div className="space-y-6">
      
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-slate-400">Łączny przychód</p>
            <p className="text-2xl font-bold text-slate-900">{totals.cost.toFixed(2)} zł</p>
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-slate-400">Wydrukowane sztuki</p>
            <p className="text-2xl font-bold text-slate-900">{totals.quantity} szt.</p>
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-slate-400">Czas pracy maszyn</p>
            <p className="text-2xl font-bold text-slate-900">{totals.hours}h</p>
          </div>
        </div>
      </div>

      
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Analityka Zrealizowanych Wydruków
            </h3>
            <p className="text-xs text-slate-400">Tylko zlecenia ze statusem "Zrealizowany"</p>
          </div>

          
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={showCost} 
                onChange={(e) => setShowCost(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <span className="flex items-center gap-1 text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"/>
                Suma (zł)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={showQuantity} 
                onChange={(e) => setShowQuantity(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span className="flex items-center gap-1 text-blue-700">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"/>
                Ilość (szt)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={showHours} 
                onChange={(e) => setShowHours(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
              <span className="flex items-center gap-1 text-purple-700">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"/>
                Godziny (h)
              </span>
            </label>
          </div>
        </div>

        
        {chartData.length > 0 ? (
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorQuantity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold', marginBottom: '4px' }}
                />

                
                {showCost && (
                  <Area 
                    type="monotone" 
                    dataKey="cost" 
                    name="Suma (zł)" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorCost)" 
                  />
                )}

                {showQuantity && (
                  <Area 
                    type="monotone" 
                    dataKey="quantity" 
                    name="Ilość (szt)" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorQuantity)" 
                  />
                )}

                {showHours && (
                  <Area 
                    type="monotone" 
                    dataKey="hours" 
                    name="Czas (h)" 
                    stroke="#a855f7" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorHours)" 
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2 border border-dashed border-slate-200 rounded-xl">
            <Calendar className="w-8 h-8 text-slate-300" />
            <p className="text-sm">Brak zrealizowanych zleceń do wyświetlenia wykresu.</p>
          </div>
        )}
      </div>
    </div>
  )
}