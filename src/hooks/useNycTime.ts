import { useState, useEffect, useRef, useCallback } from 'react'

const hourMinFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
})

const tzFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  timeZoneName: 'short',
})

function getNycTimeParts(): { hours: string; minutes: string; period: string; timezone: string } {
  const formatted = hourMinFormatter.format(new Date()) // e.g. "03:09 PM"
  const [hm, period] = formatted.split(' ')
  const [hours, minutes] = hm.split(':')

  // Extract timezone abbreviation — "EST" or "EDT"
  const tzFormatted = tzFormatter.format(new Date()) // e.g. "2/16/2026, EST"
  const timezone = tzFormatted.split(' ').pop() ?? 'EST'

  return { hours, minutes, period, timezone }
}

export interface NycTime {
  hours: string
  minutes: string
  period: string
  timezone: string
  colonVisible: boolean
}

export function useNycTime(): NycTime {
  const [parts, setParts] = useState(getNycTimeParts)
  const [colonVisible, setColonVisible] = useState(() => new Date().getSeconds() % 2 === 0)
  const minuteIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const blinkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const updateTime = useCallback(() => setParts(getNycTimeParts()), [])

  useEffect(() => {
    // --- Minute updates: align to next minute boundary ---
    const now = new Date()
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds()

    const minuteTimeout = setTimeout(() => {
      updateTime()
      minuteIntervalRef.current = setInterval(updateTime, 60_000)
    }, msUntilNextMinute)

    // --- Colon blink: sync to real clock seconds ---
    // Colon visible on even seconds, hidden on odd seconds.
    // Align the first tick to the next whole-second boundary,
    // then tick every 1000ms to stay locked to the clock.
    const msUntilNextSecond = 1000 - now.getMilliseconds()

    const blinkTimeout = setTimeout(() => {
      setColonVisible(new Date().getSeconds() % 2 === 0)
      blinkIntervalRef.current = setInterval(() => {
        setColonVisible(new Date().getSeconds() % 2 === 0)
      }, 1000)
    }, msUntilNextSecond)

    return () => {
      clearTimeout(minuteTimeout)
      clearTimeout(blinkTimeout)
      if (minuteIntervalRef.current) clearInterval(minuteIntervalRef.current)
      if (blinkIntervalRef.current) clearInterval(blinkIntervalRef.current)
    }
  }, [updateTime])

  return { ...parts, colonVisible }
}
