'use client'

import type { CashFlowPoint } from '../_lib/tesoreria-actions'

interface Props {
  points: CashFlowPoint[]
}

const WIDTH = 600
const HEIGHT = 200
const PADDING = { top: 20, right: 20, bottom: 40, left: 50 }

function formatMonthLabel(dateStr: string): string {
  const [y, m] = dateStr.split('-')
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return `${monthNames[parseInt(m!, 10) - 1]} ${y}`
}

export function CashFlowChart({ points }: Props) {
  if (points.length === 0) return null

  const chartW = WIDTH - PADDING.left - PADDING.right
  const chartH = HEIGHT - PADDING.top - PADDING.bottom

  const maxVal = Math.max(
    ...points.map((p) => Math.max(p.cashIn, p.cashOut)),
    1,
  )
  const minBalance = Math.min(...points.map((p) => p.balance), 0)
  const maxBalance = Math.max(...points.map((p) => p.balance), 0)

  const xScale = (i: number) => PADDING.left + (i / (points.length - 1)) * chartW
  const yScale = (v: number) => PADDING.top + chartH - (v / maxVal) * chartH * 0.8
  const balanceY = (v: number) => {
    const range = maxBalance - minBalance || 1
    return PADDING.top + chartH - ((v - minBalance) / range) * chartH * 0.8
  }

  const cashInPath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(p.cashIn)}`)
    .join(' ')

  const cashOutPath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(p.cashOut)}`)
    .join(' ')

  const balancePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${balanceY(p.balance)}`)
    .join(' ')

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full max-w-[600px] mx-auto">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <line
            key={t}
            x1={PADDING.left}
            y1={PADDING.top + chartH * t}
            x2={PADDING.left + chartW}
            y2={PADDING.top + chartH * t}
            stroke="var(--border)"
            strokeWidth={0.5}
            strokeDasharray="4 4"
          />
        ))}

        {/* X axis labels */}
        {points.map((p, i) => (
          <text
            key={p.date}
            x={xScale(i)}
            y={HEIGHT - 10}
            textAnchor="middle"
            fontSize={10}
            fill="var(--text-dim)"
          >
            {formatMonthLabel(p.date)}
          </text>
        ))}

        {/* Y axis label */}
        <text
          x={10}
          y={HEIGHT / 2}
          textAnchor="middle"
          fontSize={10}
          fill="var(--text-dim)"
          transform={`rotate(-90, 10, ${HEIGHT / 2})`}
        >
          €
        </text>

        {/* Cash In line (green) */}
        <path d={cashInPath} fill="none" stroke="#22c55e" strokeWidth={2} />
        {points.map((p, i) => (
          <circle key={`in-${p.date}`} cx={xScale(i)} cy={yScale(p.cashIn)} r={3} fill="#22c55e" />
        ))}

        {/* Cash Out line (red) */}
        <path d={cashOutPath} fill="none" stroke="#ef4444" strokeWidth={2} />
        {points.map((p, i) => (
          <circle key={`out-${p.date}`} cx={xScale(i)} cy={yScale(p.cashOut)} r={3} fill="#ef4444" />
        ))}

        {/* Balance line (blue) */}
        <path d={balancePath} fill="none" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="6 3" />

        {/* Legend */}
        <g transform={`translate(${WIDTH - 140}, 10)`}>
          <circle cx={0} cy={4} r={3} fill="#22c55e" />
          <text x={8} y={8} fontSize={10} fill="var(--text)">Entradas</text>
          <circle cx={60} cy={4} r={3} fill="#ef4444" />
          <text x={68} y={8} fontSize={10} fill="var(--text)">Salidas</text>
          <line x1={120} y1={4} x2={130} y2={4} stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="6 3" />
          <text x={134} y={8} fontSize={10} fill="var(--text)">Saldo</text>
        </g>
      </svg>
    </div>
  )
}
