// Cetak pesan dari data contoh (tanpa DB, tanpa WA).
import { REPORTS } from '../config/reports'
import { buildReportMessage } from '../utils/message-builder'
import type { MeterRow } from '../types'

const t = new Date('2026-11-14T23:30:01Z')
const r = (unit_id: number, unit_name: string, unit_subname: string, v: number, i: number, p: number): MeterRow =>
  ({ unit_id, unit_name, unit_subname, time: t, v, i, p, f: 0 })

const rows: MeterRow[] = [
  r(201, 'UP3 TUAL', 'MVTIC', 20.5036, 459.82, 5.3954),
  r(201, 'UP3 TUAL', 'A3CS', 20.4981, 521.52, 5.9302),
  r(251, 'PENYULANG 251', 'HOTEL', 20.4981, 55.2, 1.94),
  r(251, 'PENYULANG 251', 'DULLAH', 20.4981, 82.6, 2.772),
  r(251, 'PENYULANG 251', 'KOTA', 20.4981, 30.8, 1.066),
  r(251, 'PENYULANG 251', 'EXPRESS MESS', 0, 0, 0),
  r(251, 'PENYULANG 251', 'EXPRESS LANGGUR', 20.142, 83.9, 2.857),
  r(252, 'PENYULANG 252', 'DANAR', 19.938, 13, 1.317),
  r(252, 'PENYULANG 252', 'DEBUT', 19.924, 24, 2.309),
  r(252, 'PENYULANG 252', 'NGILNGOF', 19.935, 29, 2.514),
  ...['KOTA', 'SELATAN', 'UTARA', 'EXPRESS', 'KUSU'].map((s) => r(301, 'UP3 SOFIFI', s, 0, 0, 0))
]

const deviations = [
  { vs2HoursAgo: 0.9, vsYesterday: -4.1 },
  { vs2HoursAgo: 0, vsYesterday: null }
]

REPORTS.forEach((report, idx) => {
  console.log(buildReportMessage(report, rows, deviations[idx])?.content, '\n' + '-'.repeat(40))
})
