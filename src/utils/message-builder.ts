import { formatDate, dayName, formatNumber } from './index'
import type { Config } from '../config'
import type { Deviation, MeterRow, Report, WablasPayload } from '../types'

const sum = (rows: MeterRow[], key: 'p' | 'i'): number =>
  rows.reduce((acc, r) => acc + (Number(r[key]) || 0), 0)

// Satuan di SCADA_METER_2 untuk unit ini: p sudah MW, i A (tanpa konversi).
function line(label: string, row: MeterRow): string {
  return `${String(label).padEnd(16, ' ')}: ${formatNumber(row.p, 2)} MW | ${formatNumber(row.i, 0)} A`
}

// `label` mis. "2 jam sebelumnya" / "jam sama H-1"; `prep` kata depan untuk Naik/Turun.
function deviationLine(delta: number | null, label: string, prep: string): string {
  if (delta === null) return `➖ Data pembanding ${label} belum tersedia`
  if (Math.abs(delta) < 0.05) return `➖ Tetap dibanding ${label}`
  const arrow = delta > 0 ? '📈 Naik' : '📉 Turun'
  return `${arrow} *${formatNumber(Math.abs(delta))} MW* ${prep} ${label}`
}

/** Mengembalikan null jika tidak ada data untuk laporan ini. */
export function buildReportMessage(
  report: Report,
  rows: MeterRow[],
  deviation?: Deviation
): { content: string; total: number } | null {
  const mine = rows.filter((r) => report.units.includes(Number(r.unit_id)))
  if (!mine.length) return null

  const latest = mine.reduce<Date | null>(
    (max, r) => (r.time && (!max || r.time > max) ? r.time : max),
    null
  )

  const total = sum(
    mine.filter((r) => Number(r.unit_id) === report.totalUnitId),
    'p'
  )

  const blocks = report.units
    .map((unitId) => {
      const unitRows = mine.filter((r) => Number(r.unit_id) === unitId)
      if (!unitRows.length) return null

      const name = unitRows[0].unit_name || `UNIT ${unitId}`
      const isTotal = unitId === report.totalUnitId
      const header = isTotal
        ? `*TOTAL BEBAN ➤ ${formatNumber(total, 2)} MW*`
        : `*${name} ➤ ${formatNumber(sum(unitRows, 'p'), 2)} MW*`
      const deviationLines =
        isTotal && deviation
          ? [
              deviationLine(deviation.vs2HoursAgo, '2 jam sebelumnya', 'dari'),
              deviationLine(deviation.vsYesterday, 'jam sama H-1', 'di')
            ]
          : []

      return [header, ...deviationLines, ...unitRows.map((r) => line(r.unit_subname, r))].join('\n')
    })
    .filter((b): b is string => b !== null)

  const content = [
    `*DATA BEBAN ${report.title}*`,
    `${dayName(latest)}, ${formatDate(latest)} WIT`,
    '',
    blocks.join('\n\n')
  ].join('\n')

  return { content, total }
}

// Payload WABLAS. Mode testing selalu ke nomor pribadi (bukan grup).
export function buildPayload(args: {
  content: string
  report: Report
  config: Pick<Config, 'IS_TESTING' | 'WA_PRIVATE_ID' | 'WA_GROUP_ID_TUAL' | 'WA_GROUP_ID_SOFIFI'>
}): WablasPayload {
  const { content, report, config } = args
  if (config.IS_TESTING) {
    return {
      phone: config.WA_PRIVATE_ID,
      message: `[TESTING - ${report.title}]\n${content}`,
      isGroup: 'false'
    }
  }
  return {
    phone: config[report.groupEnvKey],
    message: content,
    isGroup: 'true'
  }
}
