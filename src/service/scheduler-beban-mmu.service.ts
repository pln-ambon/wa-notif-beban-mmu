import cron from 'node-cron'
import config from '../config'
import { REPORTS } from '../config/reports'
import { getMmuMeter, getHistoryTotal } from '../model/scada_unit.model'
import { buildReportMessage, buildPayload } from '../utils/message-builder'
import { sendMessageToWaBlas } from './wablas.service'
import { currentHourWit, witHourStart } from '../utils'
import type { Deviation } from '../types'

// Validasi penerima sebelum kirim, supaya salah konfigurasi terlihat jelas.
function assertRecipients(): void {
  if (config.IS_TESTING) {
    if (!config.WA_PRIVATE_ID) throw new Error('TESTING aktif tetapi WA_PRIVATE_ID kosong')
    return
  }
  for (const r of REPORTS) {
    if (!config[r.groupEnvKey]) throw new Error(`${r.groupEnvKey} kosong (TESTING=false)`)
  }
}

// Selisih total sekarang terhadap histori 2 jam lalu dan jam yang sama H-1.
// Kegagalan baca histori tidak boleh menggagalkan pesan: jadi "belum tersedia".
async function getDeviation(totalUnitId: number, total: number): Promise<Deviation> {
  const compare = async (hoursBack: number): Promise<number | null> => {
    try {
      const past = await getHistoryTotal(totalUnitId, witHourStart(hoursBack))
      return past === null ? null : total - past
    } catch (error) {
      console.log(`histori unit ${totalUnitId} (${hoursBack} jam lalu) gagal dibaca:`, error)
      return null
    }
  }
  return { vs2HoursAgo: await compare(2), vsYesterday: await compare(24) }
}

// Kirim satu laporan per UP3. Tiap laporan independen: gagal satu tidak
// membatalkan yang lain.
export async function sendReports(): Promise<void> {
  assertRecipients()
  const rows = await getMmuMeter()

  for (const report of REPORTS) {
    try {
      const base = buildReportMessage(report, rows)
      if (!base) {
        console.log(`[${report.key}] tidak ada data, dilewati`)
        continue
      }
      const deviation = await getDeviation(report.totalUnitId, base.total)
      const built = buildReportMessage(report, rows, deviation) ?? base
      const payload = buildPayload({ content: built.content, report, config })
      const ok = await sendMessageToWaBlas(payload)
      console.log(`[${report.key}] ${ok ? 'terkirim' : 'GAGAL'} -> ${config.IS_TESTING ? 'pribadi (testing)' : 'grup'}`)
    } catch (error) {
      console.log(`[${report.key}] error:`, error)
    }
  }
}

// Tiap jam; kirim hanya pada jam genap atau jam 19 (WIT), sama seperti wa-notif-data-beban.
export const cronJob = cron.schedule(
  '0 * * * *',
  async () => {
    try {
      const hour = currentHourWit()
      const shouldSend = hour % 2 === 0 || hour === 19
      console.log(`Jam WIT: ${hour}, kirim: ${shouldSend}`)
      if (shouldSend) await sendReports()
    } catch (error) {
      console.log(error, '<<< error')
    }
  },
  { timezone: 'Asia/Jayapura' }
)
