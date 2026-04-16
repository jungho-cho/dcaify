import { describe, expect, it } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { middleware } from '@/middleware'

function makeRequest(url: string): NextRequest {
  return new NextRequest(new URL(url))
}

describe('middleware', () => {
  it('redirects www root to apex with 301', () => {
    const res = middleware(makeRequest('https://www.dcaify.com/'))
    expect(res).toBeInstanceOf(NextResponse)
    expect(res.status).toBe(301)
    expect(res.headers.get('location')).toBe('https://dcaify.com/')
  })

  it('redirects www path to apex preserving path and query', () => {
    const res = middleware(makeRequest('https://www.dcaify.com/btc?utm=x'))
    expect(res.status).toBe(301)
    expect(res.headers.get('location')).toBe('https://dcaify.com/btc?utm=x')
  })

  it('does not redirect apex requests', () => {
    const res = middleware(makeRequest('https://dcaify.com/btc'))
    expect(res.headers.get('location')).toBeNull()
    expect(res.status).not.toBe(301)
  })

  it('does not redirect localhost during dev', () => {
    const res = middleware(makeRequest('http://localhost:3000/btc'))
    expect(res.headers.get('location')).toBeNull()
    expect(res.status).not.toBe(301)
  })

  it('does not redirect www-prefixed subdomains other than production', () => {
    const res = middleware(makeRequest('https://www.staging.dcaify.com/btc'))
    expect(res.headers.get('location')).toBeNull()
    expect(res.status).not.toBe(301)
  })
})
