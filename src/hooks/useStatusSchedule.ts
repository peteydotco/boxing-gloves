import { useState, useEffect } from 'react'

export interface Status {
  text: string
  shortText: string
  icon: string
}

export function getNycDate(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }))
}

/** All possible focus modes — order determines tap-cycle sequence */
export const ALL_STATUSES: Status[] = [
  { text: 'Peter is currently designing', shortText: 'Designing', icon: '/images/sqsp.svg' },
  { text: 'Peter is currently teaching', shortText: 'Teaching', icon: '/images/sva.svg' },
  { text: 'Peter is in dad mode', shortText: 'Dad mode', icon: '/images/dadmode.svg' },
  { text: 'Do not disturb', shortText: 'DND', icon: '/images/zzz.svg' },
]

/**
 * Determine Peter's current status based on NYC day/time.
 * Priority: Teaching > Dad mode > DND > Designing
 */
function getStatus(now: Date): Status {
  const day = now.getDay()     // 0=Sun, 1=Mon, ...
  const hour = now.getHours()  // 0-23
  const month = now.getMonth() // 0=Jan, ...

  const isWeekday = day >= 1 && day <= 5
  const isMonday = day === 1
  const isWeekend = day === 0 || day === 6
  const isSeptThroughMay = month >= 8 || month <= 4 // Sep(8)–May(4)

  // 1. Teaching — Monday 6PM–9PM, September through May
  if (isMonday && hour >= 18 && hour < 21 && isSeptThroughMay) {
    return ALL_STATUSES[1]
  }

  // 2. Dad mode — Mon–Fri 7–10AM & 6–9PM; Sat–Sun 7–9PM
  if (isWeekday && ((hour >= 7 && hour < 10) || (hour >= 18 && hour < 21))) {
    return ALL_STATUSES[2]
  }
  if (isWeekend && hour >= 7 && hour < 21) {
    return ALL_STATUSES[2]
  }

  // 3. Do not disturb — Every day 9PM–7AM
  if (hour >= 21 || hour < 7) {
    return ALL_STATUSES[3]
  }

  // 4. Designing — Mon–Fri 10AM–6PM (and fallback)
  return ALL_STATUSES[0]
}

/**
 * Look ahead from `now` to find the next status transition.
 * Returns the upcoming status and how many hours until it starts (ceil, min 1h).
 */
export function getNextStatus(now: Date): { status: Status; hoursUntil: number } {
  const current = getStatus(now)
  // Walk forward minute-by-minute (up to 24h) until status changes
  for (let m = 1; m <= 24 * 60; m++) {
    const future = new Date(now.getTime() + m * 60_000)
    const futureNyc = new Date(future.toLocaleString('en-US', { timeZone: 'America/New_York' }))
    const next = getStatus(futureNyc)
    if (next !== current) {
      return { status: next, hoursUntil: Math.max(1, Math.ceil(m / 60)) }
    }
  }
  // Fallback (shouldn't happen — schedule always cycles within 24h)
  return { status: current, hoursUntil: 0 }
}

export function useStatusSchedule(): Status {
  const [status, setStatus] = useState<Status>(() => getStatus(getNycDate()))

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(getStatus(getNycDate()))
    }, 60_000)
    return () => clearInterval(interval)
  }, [])

  return status
}
