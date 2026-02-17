import { useState, useEffect, useRef } from 'react'

interface WeatherData {
  temp: number | null
  isDaytime: boolean
  loading: boolean
}

const API_URL =
  'https://api.open-meteo.com/v1/forecast?latitude=40.7128&longitude=-74.0060&current=temperature_2m&temperature_unit=fahrenheit&daily=sunrise,sunset&timezone=America%2FNew_York&forecast_days=1'

export function useNycWeather(): WeatherData {
  const [data, setData] = useState<WeatherData>({ temp: null, isDaytime: true, loading: true })
  const cachedRef = useRef<{ temp: number; isDaytime: boolean } | null>(null)

  useEffect(() => {
    let aborted = false

    async function fetchWeather() {
      try {
        const res = await fetch(API_URL)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()

        const temp = Math.round(json.current?.temperature_2m)
        const sunrise = json.daily?.sunrise?.[0]
        const sunset = json.daily?.sunset?.[0]

        // Compare current NYC time against sunrise/sunset ISO strings
        const nycNow = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
        const nowMs = new Date(nycNow).getTime()
        const sunriseMs = sunrise ? new Date(sunrise).getTime() : 0
        const sunsetMs = sunset ? new Date(sunset).getTime() : Infinity
        const isDaytime = nowMs >= sunriseMs && nowMs < sunsetMs

        if (!aborted) {
          const result = { temp: isNaN(temp) ? null : temp, isDaytime }
          cachedRef.current = { temp: result.temp ?? 0, isDaytime }
          setData({ ...result, loading: false })
        }
      } catch {
        if (!aborted) {
          if (cachedRef.current) {
            setData({ ...cachedRef.current, loading: false })
          } else {
            setData({ temp: null, isDaytime: true, loading: false })
          }
        }
      }
    }

    fetchWeather()
    const interval = setInterval(fetchWeather, 10 * 60_000)

    return () => {
      aborted = true
      clearInterval(interval)
    }
  }, [])

  return data
}
