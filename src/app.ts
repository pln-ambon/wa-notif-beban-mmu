import express from 'express'
import config from './config'
import './service/scheduler-beban-mmu.service' // cron start saat di-import

const app = express()

app.listen(config.PORT, () => {
  console.log(
    `App is running on port ${config.PORT} | mode: ${config.IS_TESTING ? 'TESTING (kirim ke WA pribadi)' : 'PRODUKSI (kirim ke grup)'}`
  )
})
