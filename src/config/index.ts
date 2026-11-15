import 'dotenv/config'
import type { config as MssqlConfig } from 'mssql'
import type { GroupEnvKey } from '../types'

const env = process.env

// Aman secara default: hanya "false" yang mematikan mode testing.
const IS_TESTING = String(env.TESTING).trim().toLowerCase() !== 'false'

interface AppConfig {
  sqlConfig: MssqlConfig
  WABLAS_URL?: string
  WABLAS_TOKEN?: string
  WA_PRIVATE_ID?: string
  IS_TESTING: boolean
  PORT: number
}

const config: AppConfig & Record<GroupEnvKey, string | undefined> = {
  sqlConfig: {
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    server: env.DB_SERVER as string,
    port: Number(env.DB_PORT),
    pool: {
      max: 10,
      min: 1,
      idleTimeoutMillis: 30000
    },
    options: {
      encrypt: true,
      trustServerCertificate: true
    }
  },
  WABLAS_URL: env.WABLAS_URL,
  WABLAS_TOKEN: env.WABLAS_TOKEN,
  WA_GROUP_ID_TUAL: env.WA_GROUP_ID_TUAL,
  WA_GROUP_ID_SOFIFI: env.WA_GROUP_ID_SOFIFI,
  WA_PRIVATE_ID: env.WA_PRIVATE_ID,
  IS_TESTING,
  PORT: env.PORT ? Number(env.PORT) : 7002
}

export type Config = typeof config
export default config
