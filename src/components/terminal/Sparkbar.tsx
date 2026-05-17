const BLOCKS = '▁▂▃▄▅▆▇█'
const SPARK_WIDTH = 14

function seedRand(seed: string): () => number {
  let s = 0
  for (let i = 0; i < seed.length; i += 1) {
    s = ((s * 31) + seed.charCodeAt(i)) >>> 0
  }
  return () => {
    s = ((s * 1664525) + 1013904223) >>> 0
    return s / 4294967296
  }
}

export function sparklineFromValues(values: readonly number[], width = SPARK_WIDTH): string {
  if (!values.length) return ''
  const stepSize = values.length / width
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  let out = ''
  for (let i = 0; i < width; i += 1) {
    const v = values[Math.min(values.length - 1, Math.floor(i * stepSize))]
    const norm = (v - min) / span
    out += BLOCKS[Math.min(BLOCKS.length - 1, Math.floor(norm * BLOCKS.length))]
  }
  return out
}

export function sparklineFromSeed(seed: string, drift: number, width = SPARK_WIDTH): string {
  const rand = seedRand(seed)
  let v = 0.45
  let out = ''
  for (let i = 0; i < width; i += 1) {
    v += (rand() - 0.5) * 0.18 + (drift > 0 ? 0.018 : -0.014)
    v = Math.max(0.05, Math.min(0.98, v))
    out += BLOCKS[Math.floor(v * (BLOCKS.length - 0.01))]
  }
  return out
}

interface SparkbarProps {
  values?: readonly number[]
  seed?: string
  drift?: number
  positive?: boolean
}

export default function Sparkbar({ values, seed, drift = 0, positive }: SparkbarProps) {
  const bars = values && values.length > 0
    ? sparklineFromValues(values)
    : sparklineFromSeed(seed ?? 'x', drift)

  const isPositive = positive ?? drift >= 0
  return (
    <span
      style={{
        color: isPositive ? 'var(--profit)' : 'var(--loss)',
        letterSpacing: '-0.04em',
        fontSize: 16,
      }}
    >
      {bars}
    </span>
  )
}
