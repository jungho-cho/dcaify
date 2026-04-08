'use client'

import { useEffect } from 'react'
import { trackEvent } from '@/lib/analytics'

interface AnalyticsViewTrackerProps {
  eventName: string
  params?: Record<string, string | number | boolean>
}

export default function AnalyticsViewTracker({ eventName, params }: AnalyticsViewTrackerProps) {
  useEffect(() => {
    trackEvent(eventName, params)
  }, [eventName, params])

  return null
}
