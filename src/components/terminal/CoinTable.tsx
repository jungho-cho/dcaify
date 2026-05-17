'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import Sparkbar from '@/components/terminal/Sparkbar'
import { formatPct } from '@/lib/formatters'
import type { CoinTableRow } from '@/lib/home-data'

type SortKey = 'oneY' | 'threeY' | 'fiveY'
type SortDir = 'asc' | 'desc'

interface CoinTableProps {
  rows: CoinTableRow[]
  lang?: 'en' | 'ko'
  limit?: number
}

const FILTERS: Array<{ key: string; label: string }> = [
  { key: 'all',  label: '/all' },
  { key: 'L1',   label: '/L1' },
  { key: 'L2',   label: '/L2' },
  { key: 'DeFi', label: '/DeFi' },
  { key: 'Meme', label: '/Meme' },
  { key: 'AI',   label: '/AI' },
]

function compareRows(a: CoinTableRow, b: CoinTableRow, key: SortKey, dir: SortDir): number {
  const av = a[key]
  const bv = b[key]
  if (av === null && bv === null) return 0
  if (av === null) return 1
  if (bv === null) return -1
  return dir === 'desc' ? bv - av : av - bv
}

function categoryMatches(filter: string, category: string): boolean {
  if (filter === 'all') return true
  if (filter === 'AI') return category.includes('AI')
  return category === filter
}

export default function CoinTable({ rows, lang = 'en', limit = 16 }: CoinTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('threeY')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [filter, setFilter] = useState<string>('all')

  const filtered = useMemo(
    () => rows.filter((row) => categoryMatches(filter, row.category)),
    [rows, filter],
  )

  const sorted = useMemo(
    () => filtered.slice().sort((a, b) => compareRows(a, b, sortKey, sortDir)),
    [filtered, sortKey, sortDir],
  )

  const visible = sorted.slice(0, limit)
  const remaining = sorted.length - visible.length
  const basePath = lang === 'ko' ? '/ko' : ''

  function onSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sortLabel = `sort=${sortKey === 'oneY' ? '1y' : sortKey === 'threeY' ? '3y' : '5y'}_${sortDir}`

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          margin: '32px 0 16px',
          color: 'var(--faint)',
          fontSize: 12,
          flexWrap: 'wrap',
        }}
      >
        <span>────</span>
        <span style={{ color: 'var(--accent)' }}>
          coins[] · {filtered.length} of {rows.length} · {sortLabel}
        </span>
        <span style={{ flex: 1, borderTop: '1px dashed var(--border)', minWidth: 32 }} />
        <span style={{ color: 'var(--muted)' }}>filter:</span>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              color: filter === f.key ? 'var(--accent)' : 'var(--fg-2)',
              fontWeight: filter === f.key ? 600 : 400,
              fontFamily: 'inherit',
              fontSize: 12,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div
        role="row"
        style={{
          display: 'grid',
          gridTemplateColumns: '24px 60px minmax(120px, 1fr) 80px 90px 90px 90px 160px',
          columnGap: 12,
          fontSize: 12,
          color: 'var(--muted)',
          paddingBottom: 6,
          borderBottom: '1px solid var(--border)',
        }}
      >
        <span>#</span>
        <span>SYM</span>
        <span>NAME</span>
        <span>CAT</span>
        <SortHeader label="1Y_DCA" active={sortKey === 'oneY'} dir={sortDir} onClick={() => onSort('oneY')} />
        <SortHeader label="3Y_DCA" active={sortKey === 'threeY'} dir={sortDir} onClick={() => onSort('threeY')} />
        <SortHeader label="5Y_DCA" active={sortKey === 'fiveY'} dir={sortDir} onClick={() => onSort('fiveY')} />
        <span style={{ textAlign: 'right' }}>CHART</span>
      </div>

      {visible.map((row, i) => (
        <Link
          key={row.slug}
          href={`${basePath}/${row.slug}`}
          style={{
            display: 'grid',
            gridTemplateColumns: '24px 60px minmax(120px, 1fr) 80px 90px 90px 90px 160px',
            columnGap: 12,
            fontSize: 13,
            padding: '7px 0',
            borderBottom: '1px solid var(--faint)',
            color: 'var(--fg)',
          }}
        >
          <span style={{ color: 'var(--muted)' }}>{String(i + 1).padStart(2, '0')}</span>
          <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{row.symbol}</span>
          <span>{row.name}</span>
          <span style={{ color: 'var(--muted)' }}>{row.category}</span>
          <RoiCell value={row.oneY} />
          <RoiCell value={row.threeY} />
          <RoiCell value={row.fiveY} />
          <span style={{ textAlign: 'right' }}>
            <Sparkbar values={row.sparkValues} positive={(row.threeY ?? 0) >= 0} />
          </span>
        </Link>
      ))}

      {remaining > 0 && (
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 10 }}>
          # {remaining} more ·{' '}
          {lang === 'ko' ? '필터로 좁혀 보세요' : 'click a filter to narrow down'}
        </div>
      )}
    </div>
  )
}

function SortHeader({
  label,
  active,
  dir,
  onClick,
}: {
  label: string
  active: boolean
  dir: SortDir
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        textAlign: 'right',
        cursor: 'pointer',
        color: active ? 'var(--accent)' : 'var(--muted)',
        fontWeight: active ? 600 : 400,
        fontFamily: 'inherit',
        fontSize: 12,
      }}
    >
      {label} {active ? (dir === 'desc' ? '▼' : '▲') : ''}
    </button>
  )
}

function RoiCell({ value }: { value: number | null }) {
  if (value === null) {
    return <span style={{ textAlign: 'right', color: 'var(--faint)' }}>—</span>
  }
  return (
    <span
      style={{
        textAlign: 'right',
        color: value >= 0 ? 'var(--profit)' : 'var(--loss)',
      }}
    >
      {formatPct(value)}
    </span>
  )
}
