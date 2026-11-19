export interface MeterRow {
  unit_id: number
  unit_name: string | null
  unit_subname: string
  time: Date | null
  v: number
  i: number
  p: number
  f: number
}

export type GroupEnvKey = 'WA_GROUP_ID_TUAL' | 'WA_GROUP_ID_SOFIFI'

export interface Report {
  key: string
  title: string
  /** unit yang jumlah `p`-nya dipakai sebagai TOTAL BEBAN */
  totalUnitId: number
  /** semua unit_id yang ditampilkan (urut tampil) */
  units: number[]
  /** key config untuk ID grup WA produksi */
  groupEnvKey: GroupEnvKey
  /**
   * Opsional. Jika diisi, rincian unit total TIDAK ditaruh di bawah "TOTAL BEBAN",
   * melainkan di blok sendiri berjudul `title` (jumlah p unit total) di bawah
   * baris deviasi, ditambah `extraLines` (baris statis, mis. SEWA : -).
   */
  totalBlock?: {
    title: string
    extraLines?: { label: string; value: string }[]
  }
}

/** Selisih total beban (MW) terhadap pembanding; null = data histori tidak ada. */
export interface Deviation {
  vs2HoursAgo: number | null
  vsYesterday: number | null
}

export interface WablasPayload {
  phone: string | undefined
  message: string
  isGroup: 'true' | 'false'
}
