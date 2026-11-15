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
  return p === undefined || p === null ? null : Number(p)
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
