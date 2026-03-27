'use client'

import { useEffect } from 'react'

interface Props {
  path: string
  coinSlug?: string
  lang?: string
}

export default function PageView({ path, coinSlug, lang = 'en' }: Props) {
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return

    fetch(`${url}/rest/v1/page_views`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        path,
        coin_slug: coinSlug || null,
        lang,
        referrer: document.referrer || null,
      }),
    }).catch(() => {})
  }, [path, coinSlug, lang])

  return null
}
