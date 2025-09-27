export function abbrNumber(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 1_000_000_000) return (n / 1_000_000_000).toFixed(n % 1_000_000_000 ? 1 : 0) + "b"
  if (abs >= 1_000_000)     return (n / 1_000_000).toFixed(n % 1_000_000 ? 1 : 0) + "m"
  if (abs >= 1_000)         return (n / 1_000).toFixed(n % 1_000 ? 1 : 0) + "k"
  return String(n | 0)
}

import { fmtVolume } from './currency';

export function formatVolume(n: number): string {
  return fmtVolume(Math.max(0, Math.round(n || 0)));
}

export function formatPercent(x: number): string {
  if (!isFinite(x)) return "0%"
  if (x > 0 && x < 1) return "<1%"
  if (x >= 1 && x < 10) return x.toFixed(1).replace(/\.0$/, "") + "%"
  return Math.round(x) + "%"
}

export function formatTimeLeft(endISO: string): string {
  const end = new Date(endISO).getTime()
  const now = Date.now()
  const ms = end - now
  if (ms <= 0) return "Encerrado"
  const s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (d >= 1) return `${d}d`
  if (h >= 1) return `${h}h`
  return `${m}m`
}