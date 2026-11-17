import sql from 'mssql'
import config from '../config'
import { ALL_UNIT_IDS } from '../config/reports'
import type { MeterRow } from '../types'

// Baris terakhir per (unit_id, unit_subname) dari SCADA_METER_2.
// unit_id berasal dari konstanta numerik, aman di-inline.
// Total beban (p) satu unit dari POWER_HIS_HOUR (diisi stored procedure, terpisah
// dari service ini) pada waktu `target` (waktu dinding DB). Ambil baris terdekat
// dalam +/- 5 menit; null jika tidak ada.
export async function getHistoryTotal(unitId: number, target: Date): Promise<number | null> {
  const toleranceMs = 5 * 60 * 1000
  const pool = await sql.connect(config.sqlConfig)
  const result = await pool.request()
    .input('unitId', sql.Int, unitId)
    .input('target', sql.DateTime2, target)
    .input('startTime', sql.DateTime2, new Date(target.getTime() - toleranceMs))
    .input('endTime', sql.DateTime2, new Date(target.getTime() + toleranceMs))
    .query<{ p: number | null }>(`
      SELECT TOP 1 p
      FROM POWER_HIS_HOUR
      WHERE unit_id = @unitId
        AND [time] >= @startTime AND [time] <= @endTime
      ORDER BY ABS(DATEDIFF(SECOND, [time], @target))
    `)

  const p = result.recordset[0]?.p
  if (p !== undefined && p !== null) return Number(p)

  // Tidak ada baris di jendela: log penyebab yang mungkin (tabel kosong untuk
  // unit ini, atau offset waktu berbeda) supaya mudah didiagnosis dari log PM2.
  const latest = await pool.request()
    .input('unitId', sql.Int, unitId)
    .query<{ time: Date; p: number | null }>(
      'SELECT TOP 1 [time], p FROM POWER_HIS_HOUR WHERE unit_id = @unitId ORDER BY [time] DESC'
    )
  const row = latest.recordset[0]
  console.log(
    `[histori] unit ${unitId}: tidak ada baris di ${new Date(target.getTime() - toleranceMs).toISOString()} s/d ` +
      `${new Date(target.getTime() + toleranceMs).toISOString()} (UTC-field = waktu DB). ` +
      (row ? `Baris terbaru di tabel: ${row.time.toISOString()} p=${row.p}` : 'Tabel tidak punya baris untuk unit ini.')
  )
  return null
}

export async function getMmuMeter(): Promise<MeterRow[]> {
  const ids = ALL_UNIT_IDS.map(Number).join(',')
  const pool = await sql.connect(config.sqlConfig)
  const result = await pool.request().query<MeterRow>(`
    SELECT C.unit_id,
      U.unit_name,
      C.unit_subname,
      C.[time],
      C.v,
      C.i,
      C.p,
      C.f
    FROM (
      SELECT *,
        ROW_NUMBER() OVER (
          PARTITION BY unit_id, unit_subname
          ORDER BY id DESC
        ) AS row_num
      FROM SCADA_METER_2
      WHERE unit_id IN (${ids})
    ) AS C
    LEFT JOIN SCADA_UNIT U ON U.unit_id = C.unit_id
    WHERE C.row_num = 1
    ORDER BY C.unit_id, C.id
  `)

  return result.recordset
}
