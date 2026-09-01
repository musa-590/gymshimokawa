export interface ChartDatum {
  label: string
  value: number
  color?: string
}

const PALETTE = ['#facc15', '#38bdf8', '#34d399', '#f472b6', '#a78bfa', '#fb7185']

export function BarChart({ data }: { data: ChartDatum[] }) {
  if (data.length === 0) return <p className="text-sm text-muted-foreground py-8 text-center">Sin datos</p>
  const max = Math.max(...data.map(d => d.value), 1)
  const w = 600
  const h = 180
  const pad = 8
  const bw = (w - pad * 2) / data.length
  const bh = bw * 0.6

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-44" role="img">
      {[0.25, 0.5, 0.75, 1].map(t => (
        <line key={t} x1={pad} x2={w - pad} y1={h - 24 - (h - 48) * t} y2={h - 24 - (h - 48) * t} stroke="currentColor" strokeOpacity="0.08" />
      ))}
      {data.map((d, i) => {
        const barH = (h - 48) * (d.value / max)
        const x = pad + i * bw + (bw - bh) / 2
        const y = h - 24 - barH
        return (
          <g key={i}>
            <title>{`${d.label}: ${d.value}`}</title>
            <rect x={x} y={y} width={bh} height={barH} rx={4} fill={d.color ?? PALETTE[i % PALETTE.length]} className="transition-all duration-500" />
            {d.value > 0 && (
              <text x={x + bh / 2} y={y - 5} textAnchor="middle" fontSize="10" fill="currentColor" fillOpacity="0.7">{d.value}</text>
            )}
            <text x={x + bh / 2} y={h - 8} textAnchor="middle" fontSize="10" fill="currentColor" fillOpacity="0.6">{d.label}</text>
          </g>
        )
      })}
    </svg>
  )
}

export function DonutChart({ data, size = 160, thickness = 26 }: { data: ChartDatum[]; size?: number; thickness?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total <= 0) return <p className="text-sm text-muted-foreground py-8 text-center">Sin datos</p>

  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r
  let acc = 0

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" className="shrink-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity="0.08" strokeWidth={thickness} />
        {data.map((d, i) => {
          const len = (d.value / total) * c
          const off = c - acc
          acc += len
          const color = d.color ?? PALETTE[i % PALETTE.length]
          return (
            <circle
              key={i}
              cx={size / 2} cy={size / 2} r={r} fill="none"
              stroke={color} strokeWidth={thickness}
              strokeDasharray={`${len} ${c - len}`} strokeDashoffset={off}
              className="transition-all duration-500"
            >
              <title>{`${d.label}: ${d.value}`}</title>
            </circle>
          )
        })}
      </svg>
      <div className="space-y-1.5">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color ?? PALETTE[i % PALETTE.length] }} />
            <span className="text-muted-foreground">{d.label}</span>
            <span className="font-semibold ml-auto tabular-nums">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
