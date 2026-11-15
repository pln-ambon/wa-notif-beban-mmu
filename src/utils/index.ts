const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu']

const pad = (n: number): string => String(n).padStart(2, '0')

// `time` dari SQL Server dibaca mssql sebagai UTC, padahal nilainya waktu
// dinding DB (UTC+9). Karena itu pakai getUTC* agar tampil apa adanya.
export function formatDate(date: Date | null | undefined): string {
  if (!date) return '-'
  return `${pad(date.getUTCDate())}/${pad(date.getUTCMonth() + 1)}/${date.getUTCFullYear()} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`
}

export function dayName(date: Date | null | undefined): string {
  return date ? DAYS[date.getUTCDay()] : '-'
}

export function formatNumber(value: unknown, digits = 1): string {
  const n = Number.parseFloat(String(value))
  return Number.isNaN(n) ? (0).toFixed(digits) : n.toFixed(digits)
}

const HOUR_MS = 60 * 60 * 1000

// Date yang field UTC-nya berisi waktu dinding WIT/DB (UTC+9), independen dari
// timezone server. Pola yang sama dengan `time` yang dibaca dari SQL Server.
export function witNow(): Date {
  return new Date(Date.now() + 9 * HOUR_MS)
}

// Awal jam (menit/detik = 0) dari waktu dinding WIT, dikurangi `hoursBack` jam.
export function witHourStart(hoursBack = 0): Date {
  const d = witNow()
  d.setUTCMinutes(0, 0, 0)
  return new Date(d.getTime() - hoursBack * HOUR_MS)
}

// Jam saat ini di WIT (UTC+9), sama dengan zona waktu DB.
export function currentHourWit(): number {
  return Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Jayapura',
      hour: 'numeric',
      hourCycle: 'h23'
    }).format(new Date())
  )
}
