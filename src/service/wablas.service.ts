import axios from 'axios'
import config from '../config'
import type { WablasPayload } from '../types'

// Error hanya di-log supaya satu kegagalan tidak menghentikan pengiriman lain.
export async function sendMessageToWaBlas(message: WablasPayload): Promise<boolean> {
  try {
    const { WABLAS_URL, WABLAS_TOKEN } = config
    if (!WABLAS_URL || !WABLAS_TOKEN) throw new Error('WABLAS_URL / WABLAS_TOKEN belum diisi')

    await axios({
      method: 'POST',
      url: WABLAS_URL,
      headers: {
        Authorization: WABLAS_TOKEN,
        'Content-Type': 'application/json'
      },
      data: message
    })
    return true
  } catch (error) {
    const e = error as { response?: { data?: unknown }; message?: string }
    console.log(e?.response?.data || e?.message)
    return false
  }
}
