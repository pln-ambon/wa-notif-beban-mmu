import type { Report } from '../types'

// Mapping laporan -> unit_id di SCADA_METER_2.
export const REPORTS: Report[] = [
  {
    key: 'tual',
    title: 'UPS TUAL',
    totalUnitId: 201,
    units: [201, 251, 252],
    groupEnvKey: 'WA_GROUP_ID_TUAL'
  },
  {
    key: 'sofifi',
    title: 'UP3 SOFIFI',
    totalUnitId: 301,
    units: [301],
    groupEnvKey: 'WA_GROUP_ID_SOFIFI'
  }
]

export const ALL_UNIT_IDS: number[] = [...new Set(REPORTS.flatMap((r) => r.units))]
