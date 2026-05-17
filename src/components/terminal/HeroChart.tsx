'use client'

import {
  Area,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatUsd } from '@/lib/formatters'

export interface HeroChartPoint {
  date: string
  value: number
  invested: number
}

interface HeroChartProps {
  data: HeroChartPoint[]
  height?: number
  color?: string
  showAxis?: boolean
  formatTooltip?: (value: number) => string
}

export default function HeroChart({
  data,
  height = 240,
  color = 'var(--accent)',
  showAxis = false,
  formatTooltip = formatUsd,
}: HeroChartProps) {
  if (!data.length) {
    return (
      <div
        style={{
          height,
          border: '1px dashed var(--border)',
          color: 'var(--muted)',
          fontSize: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        # no series yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 6, right: 4, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="trmFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.18} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {showAxis && (
          <XAxis
            dataKey="date"
            tick={{ fill: 'var(--muted)', fontSize: 10 }}
            tickFormatter={(v: string) => v.slice(0, 4)}
            interval="preserveStartEnd"
            stroke="var(--faint)"
          />
        )}
        {showAxis && (
          <YAxis
            tick={{ fill: 'var(--muted)', fontSize: 10 }}
            tickFormatter={(v: number) => `$${Math.round(v / 1000)}k`}
            width={42}
            stroke="var(--faint)"
          />
        )}
        <Tooltip
          cursor={{ stroke: 'var(--faint)', strokeDasharray: '2 4' }}
          contentStyle={{
            background: 'var(--panel-2)',
            border: '1px solid var(--border)',
            borderRadius: 0,
            fontSize: 11,
            color: 'var(--fg)',
            padding: '6px 10px',
          }}
          labelStyle={{ color: 'var(--muted)' }}
          formatter={(v, name) => [formatTooltip(Number(v)), String(name)]}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill="url(#trmFill)"
          isAnimationActive={false}
          name="portfolio"
        />
        <Line
          type="monotone"
          dataKey="invested"
          stroke="var(--muted)"
          strokeWidth={1}
          strokeDasharray="2 3"
          dot={false}
          isAnimationActive={false}
          name="invested"
        />
        <ReferenceLine y={0} stroke="var(--faint)" />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
