// Kirim sekali sekarang (abaikan aturan jam). Hormati flag TESTING di .env.
import config from '../config'
import { sendReports, cronJob } from '../service/scheduler-beban-mmu.service'

console.log(`mode: ${config.IS_TESTING ? 'TESTING' : 'PRODUKSI (grup)'}`)
cronJob.stop()
sendReports()
  .catch((e) => console.log(e))
  .finally(() => process.exit(0))
