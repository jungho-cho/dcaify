'use client'

import { useState, useCallback } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { CoinConfig, SUPPORTED_COINS } from '@/lib/coins'
import { PricesResponse } from '@/types/prices'
import { calculateDca, calculateBreakEven, Frequency, DcaResult } from '@/lib/dca'

interface Props {
  defaultCoin: CoinConfig
}

type UiState = 'initial' | 'loading' | 'success' | 'error' | 'rate_limited'

function formatUsd(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(n)
}

function formatPct(n: number): string {
  const sign = n >= 0 ? '+' : ''
  return `${sign}${n.toFixed(2)}%`
}

export default function DcaCalculator({ defaultCoin }: Props) {
  const [coin, setCoin] = useState<CoinConfig>(defaultCoin)
  const [amount, setAmount] = useState('100')
  const [frequency, setFrequency] = useState<Frequency>('monthly')
  const [startDate, setStartDate] = useState('2020-01-01')
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10))

  const [uiState, setUiState] = useState<UiState>('initial')
  const [result, setResult] = useState<DcaResult | null>(null)
  const [dataSource, setDataSource] = useState<'live' | 'cache' | 'stale'>('cache')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [partialWarning, setPartialWarning] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const validate = (): string | null => {
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) return 'Please enter a valid investment amount greater than 0'

    const today = new Date().toISOString().slice(0, 10)
    if (startDate > today) return 'Start date must be in the past'
    if (endDate > today) return 'End date must be in the past'
    if (startDate >= endDate) return 'End date must be after start date'

    const startYear = new Date(startDate).getFullYear()
    const endYear = new Date(endDate).getFullYear()
    if (endYear - startYear > 10) return 'Maximum date range is 10 years'

    if (startDate < coin.listingDate) {
      return `${coin.name} was listed on ${coin.listingDate}. Start date cannot be earlier.`
    }

    return null
  }

  const handleCalculate = useCallback(async () => {
    setValidationError(null)
    setPartialWarning(null)
    setErrorMsg(null)

    const err = validate()
    if (err) {
      setValidationError(err)
      return
    }

    setUiState('loading')

    try {
      const params = new URLSearchParams({
        coinId: coin.id,
        from: startDate,
        to: endDate,
      })
      const res = await fetch(`/api/prices?${params}`)

      if (res.status === 429) {
        setUiState('rate_limited')
        return
      }

      if (!res.ok) {
        setErrorMsg('Failed to fetch price data. Please try again later.')
        setUiState('error')
        return
      }

      const data: PricesResponse = await res.json()
      setDataSource(data.dataSource)

      if (data.prices.length === 0) {
        setErrorMsg('No price data available for the selected range.')
        setUiState('error')
        return
      }

      // Check if start date was clamped to listing date
      const firstPriceDate = new Date(data.prices[0].timestamp).toISOString().slice(0, 10)
      if (firstPriceDate > startDate) {
        setPartialWarning(
          `No ${coin.name} price data before ${firstPriceDate}. Calculation starts from that date.`
        )
      }

      const currentPrice = data.prices[data.prices.length - 1].price

      const dcaResult = calculateDca({
        prices: data.prices,
        amountPerPeriod: parseFloat(amount),
        frequency,
        startDate,
        endDate,
        currentPrice,
      })

      setResult(dcaResult)
      setUiState('success')
    } catch {
      setErrorMsg('Something went wrong. Please try again.')
      setUiState('error')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coin, amount, frequency, startDate, endDate])

  // Build chart data from purchases
  const chartData = result
    ? result.purchases.reduce<{ date: string; value: number; invested: number }[]>(
        (acc, p, i) => {
          const prev = acc[i - 1]
          const invested = (prev?.invested ?? 0) + p.amount
          // Use latest price from result for current value approximation
          const totalCoins = result.purchases
            .slice(0, i + 1)
            .reduce((sum, x) => sum + x.coins, 0)
          const value = totalCoins * (result.purchases[result.purchases.length - 1].price)
          acc.push({ date: p.date, value: parseFloat(value.toFixed(2)), invested: parseFloat(invested.toFixed(2)) })
          return acc
        },
        []
      )
    : []

  const breakEven = result && result.totalCoins > 0
    ? calculateBreakEven(result.totalInvested, result.totalCoins, 0.22)
    : null

  const isProfit = result && result.roi >= 0

  const shareText = result
    ? `I invested ${formatUsd(parseFloat(amount))}/${frequency} in ${coin.name} and got ${formatPct(result.roi)} return (${formatUsd(result.currentValue)}). Check yours at dcaify.com`
    : ''

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">{coin.name} DCA Calculator</h1>
        <p className="text-gray-400">
          See exactly how much you&apos;d have if you dollar cost averaged into {coin.name}.
        </p>
      </div>
      {/* Form */}
      <div className="bg-gray-900 rounded-2xl p-6 space-y-4">
        {/* Coin tabs */}
        <div className="flex gap-2 flex-wrap">
          {SUPPORTED_COINS.map((c) => (
            <button
              key={c.id}
              onClick={() => setCoin(c)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                coin.id === c.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {c.symbol}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Amount */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Investment per period (USD)
            </label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              placeholder="100"
            />
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Frequency</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as Frequency)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {/* Start date */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Start date</label>
            <input
              type="date"
              value={startDate}
              min={coin.listingDate}
              max={endDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* End date */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">End date</label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Validation error */}
        {validationError && (
          <p className="text-red-400 text-sm">{validationError}</p>
        )}

        <button
          onClick={handleCalculate}
          disabled={uiState === 'loading'}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {uiState === 'loading' ? 'Calculating…' : 'Calculate DCA Returns'}
        </button>
      </div>

      {/* Rate limited */}
      {uiState === 'rate_limited' && (
        <div className="bg-red-900/30 border border-red-700 rounded-2xl p-4 text-red-300">
          Too many requests. Please wait a minute and try again.
        </div>
      )}

      {/* Error */}
      {uiState === 'error' && errorMsg && (
        <div className="bg-red-900/30 border border-red-700 rounded-2xl p-4 text-red-300">
          {errorMsg}
        </div>
      )}

      {/* Stale data warning */}
      {uiState === 'success' && dataSource === 'stale' && (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-2xl p-4 text-yellow-300 text-sm">
          Price data may not be up to date due to a temporary data provider issue.
        </div>
      )}

      {/* Partial data warning */}
      {partialWarning && (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-2xl p-4 text-yellow-300 text-sm">
          {partialWarning}
        </div>
      )}

      {/* Results */}
      {uiState === 'success' && result && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gray-900 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Total Invested</p>
              <p className="text-lg font-bold">{formatUsd(result.totalInvested)}</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Current Value</p>
              <p className="text-lg font-bold">{formatUsd(result.currentValue)}</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Return</p>
              <p className={`text-lg font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                {formatPct(result.roi)}
              </p>
            </div>
            <div className="bg-gray-900 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">{coin.symbol} Accumulated</p>
              <p className="text-lg font-bold">{result.totalCoins.toFixed(6)}</p>
            </div>
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <div className="bg-gray-900 rounded-2xl p-4">
              <h3 className="text-sm text-gray-400 mb-4">Portfolio Value Over Time</h3>
              <div>
                <ResponsiveContainer width="100%" height={288}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#9CA3AF', fontSize: 11 }}
                      tickFormatter={(v: string) => v.slice(0, 7)}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fill: '#9CA3AF', fontSize: 11 }}
                      tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                      width={55}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151' }}
                      labelStyle={{ color: '#9CA3AF' }}
                      formatter={(value, name) => [
                        formatUsd(Number(value)),
                        name === 'value' ? 'Portfolio Value' : 'Total Invested',
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="invested"
                      stroke="#6B7280"
                      fill="#1F2937"
                      strokeWidth={1}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={isProfit ? '#10B981' : '#EF4444'}
                      fill={isProfit ? '#064E3B' : '#450A0A'}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Break-even */}
          {breakEven && (
            <div className="bg-gray-900 rounded-2xl p-4">
              <h3 className="text-sm text-gray-400 mb-3">Break-even Analysis</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Break-even Price</p>
                  <p className="text-base font-semibold">{formatUsd(breakEven.breakEvenPrice)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Break-even (22% tax)</p>
                  <p className="text-base font-semibold">{formatUsd(breakEven.breakEvenWithTax)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Share */}
          <div className="flex gap-3">
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium py-3 rounded-xl transition-colors"
            >
              Share on X / Twitter
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
