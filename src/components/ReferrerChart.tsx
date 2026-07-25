'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useMemo } from 'react'

interface ReferrerData {
  referrer: string
  count: number
}

interface ReferrerChartProps {
  data: ReferrerData[]
}

const COLORS = ['#ffffff', '#a1a1aa', '#52525b', '#3f3f46', '#27272a', '#18181b']

export default function ReferrerChart({ data }: ReferrerChartProps) {
  const chartData = useMemo(() => {
    return data.map(item => ({
      name: item.referrer,
      value: item.count
    }))
  }, [data])

  if (chartData.length === 0) {
    return <p className="text-muted" style={{ textAlign: 'center', padding: '2rem' }}>Nenhum dado de origem disponível.</p>
  }

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }}
            itemStyle={{ color: '#fff' }}
          />
          <Legend wrapperStyle={{ fontSize: '0.85rem', color: '#a1a1aa' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
