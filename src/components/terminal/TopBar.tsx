'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo } from 'react'

type TabKey = 'home' | 'compare' | 'blog' | 'tax' | 'about' | null

const TABS: Array<{ key: Exclude<TabKey, null>; shortcut: string; label: string; en: string; ko: string }> = [
  { key: 'home',    shortcut: 'c', label: 'coins',   en: '/',         ko: '/ko' },
  { key: 'compare', shortcut: 'd', label: 'compare', en: '/btc-vs-eth', ko: '/btc-vs-eth' },
  { key: 'blog',    shortcut: 'b', label: 'blog',    en: '/blog',     ko: '/ko/blog' },
  { key: 'tax',     shortcut: 't', label: 'tax',     en: '/ko/btc/tax', ko: '/ko/btc/tax' },
  { key: 'about',   shortcut: 'a', label: 'about',   en: '/about',    ko: '/ko/about' },
]

function detectTab(pathname: string): TabKey {
  if (pathname === '/' || pathname === '/ko') return 'home'
  if (/^\/[a-z0-9-]+-vs-[a-z0-9-]+$/.test(pathname)) return 'compare'
  if (pathname.startsWith('/blog') || pathname.startsWith('/ko/blog')) return 'blog'
  if (pathname.endsWith('/tax')) return 'tax'
  if (pathname === '/about' || pathname === '/ko/about') return 'about'
  // Coin pages and guide pages live under the "home/coins" tab.
  if (/^\/(ko\/)?[a-z0-9]+(\/guide)?$/.test(pathname)) return 'home'
  return null
}

function detectLang(pathname: string): 'en' | 'ko' {
  return pathname === '/ko' || pathname.startsWith('/ko/') ? 'ko' : 'en'
}

function derivePath(pathname: string): string {
  if (pathname === '/' || pathname === '/ko') return '~/home'
  return `~${pathname}`
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (target.isContentEditable) return true
  return false
}

interface TopBarProps {
  /** Override the path label shown after `● dcaify`. Defaults to the URL pathname. */
  path?: string
  /** Override the active tab detection (useful for pages that don't map cleanly). */
  tab?: TabKey
  /** Override the language toggle. Defaults to `/ko` prefix detection. */
  lang?: 'en' | 'ko'
}

export default function TopBar({ path, tab, lang }: TopBarProps) {
  const pathname = usePathname() || '/'
  const router = useRouter()

  const activeTab = useMemo<TabKey>(() => tab ?? detectTab(pathname), [tab, pathname])
  const currentLang: 'en' | 'ko' = lang ?? detectLang(pathname)
  const displayPath = path ?? derivePath(pathname)

  // Toggle URL: swap /ko prefix on/off.
  const toggleHref = useMemo(() => {
    if (currentLang === 'ko') {
      const stripped = pathname.replace(/^\/ko/, '')
      return stripped === '' ? '/' : stripped
    }
    return pathname === '/' ? '/ko' : `/ko${pathname}`
  }, [currentLang, pathname])

  // Keyboard shortcuts: c / d / b / t / a — skip when typing.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (isTypingTarget(event.target)) return
      const key = event.key.toLowerCase()
      const match = TABS.find((t) => t.shortcut === key)
      if (!match) return
      event.preventDefault()
      router.push(currentLang === 'ko' ? match.ko : match.en)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [router, currentLang])

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        borderBottom: '1px solid var(--border)',
        paddingBottom: 12,
        fontSize: 12,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: 'var(--muted)', flexWrap: 'wrap' }}>
        <Link href={currentLang === 'ko' ? '/ko' : '/'} style={{ color: 'var(--accent)', fontWeight: 700 }}>
          ● dcaify
        </Link>
        <span>{displayPath}</span>
        <span style={{ color: 'var(--faint)' }}>·</span>
        <span>v0.3.1</span>
        <span style={{ color: 'var(--faint)' }}>·</span>
        <span>main</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: 'var(--muted)', flexWrap: 'wrap' }}>
        {TABS.map((t) => {
          const active = t.key === activeTab
          const href = currentLang === 'ko' ? t.ko : t.en
          return (
            <Link
              key={t.key}
              href={href}
              style={{
                color: active ? 'var(--accent)' : 'var(--muted)',
                fontWeight: active ? 600 : 400,
              }}
            >
              [<span style={{ color: active ? 'var(--accent)' : 'var(--fg)' }}>{t.shortcut}</span>]{t.label}
            </Link>
          )
        })}
        <span style={{ color: 'var(--faint)' }}>·</span>
        <Link href={toggleHref} style={{ color: 'var(--muted)' }}>
          <span style={{ color: currentLang === 'ko' ? 'var(--accent)' : 'var(--muted)' }}>ko</span>
          <span style={{ color: 'var(--faint)', margin: '0 2px' }}>|</span>
          <span style={{ color: currentLang === 'en' ? 'var(--accent)' : 'var(--muted)' }}>en</span>
        </Link>
      </div>
    </div>
  )
}
