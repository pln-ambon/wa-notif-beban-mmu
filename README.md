# wa-notif-beban-mmu

Service Node.js (TypeScript) yang mengirim notifikasi WhatsApp (via WABLAS) berisi data beban dari SQL Server SCADA untuk **UP3 Tual** dan **UP3 Sofifi**. Tiap UP3 dikirim ke grup WA masing-masing.

Tidak ada endpoint API. Express hanya menjaga proses tetap hidup; pekerjaan dilakukan oleh satu cron job.

## Cara kerja

1. Cron berjalan tiap jam (zona waktu `Asia/Jayapura`, WIT).
2. Pesan hanya dikirim pada **jam genap atau jam 19** (WIT).
3. Query mengambil baris terakhir per `(unit_id, unit_subname)` dari `SCADA_METER_2`.
4. Untuk tiap laporan di `src/config/reports.ts`, data difilter, dijumlahkan, dan diformat jadi satu pesan.
5. Pesan dikirim ke grup (produksi) atau ke WA pribadi (testing). Kegagalan satu laporan tidak membatalkan yang lain.

## Mapping data

Ada di [src/config/reports.ts](src/config/reports.ts):

| Laporan | Total beban | Unit yang ditampilkan | Env grup |
|---|---|---|---|
| UP3 Tual | jumlah `p` unit 201 | 201, 251, 252 | `WA_GROUP_ID_TUAL` |
| UP3 Sofifi | jumlah `p` unit 301 | 301 | `WA_GROUP_ID_SOFIFI` |

## Deviasi (histori)

Di bawah `TOTAL BEBAN` ditampilkan selisih terhadap **2 jam sebelumnya** dan **jam yang sama H-1** (📈 Naik / 📉 Turun / ➖ Tetap). Pembanding dibaca dari tabel `POWER_HIS_HOUR` untuk `unit_id` total (201 dan 301); tabel itu diisi stored procedure terpisah, bukan oleh service ini (service ini hanya membaca).

- Waktu pembanding dihitung dalam waktu dinding WIT (sama dengan DB), dibulatkan ke awal jam, lalu dicari baris terdekat dalam ±5 menit.
- Jika histori tidak ada atau gagal dibaca, baris menampilkan `➖ Data ... belum tersedia`; pesan tetap terkirim.
- `p` di `POWER_HIS_HOUR` diasumsikan satuan MW (tanpa konversi). Ubah di `getDeviation` bila ternyata kW.

Judul blok unit non-total diambil dari `unit_name` di `SCADA_UNIT` (fallback `UNIT <id>`). Menambah atau mengubah unit cukup dengan mengedit file tersebut.

Satuan: `p` dianggap sudah **MW** dan `i` dalam **A**, tanpa konversi. Jika ternyata kW, ubah di `src/utils/message-builder.ts`.

## Contoh pesan

```
*DATA BEBAN UP3 TUAL*
Sabtu, 14/11/2026 23:30 WIT

*TOTAL BEBAN ➤ 11.33 MW*
MVTIC           : 5.40 MW | 460 A
A3CS            : 5.93 MW | 522 A

*PENYULANG 251 ➤ 8.63 MW*
HOTEL           : 1.94 MW | 55 A
...
```

Dengan deviasi, bagian total menjadi:

```
*TOTAL BEBAN ➤ 11.33 MW*
📈 Naik *0.9 MW* dari 2 jam sebelumnya
📉 Turun *4.1 MW* di jam sama H-1
```

Waktu pada pesan diambil dari kolom `time` data di DB, bukan jam server.

## Konfigurasi

Salin `.env.example` ke `.env` lalu isi.

| Variabel | Keterangan |
|---|---|
| `PORT` | Default `7002` |
| `TESTING` | `true` = kirim ke `WA_PRIVATE_ID`; `false` = kirim ke grup |
| `DB_SERVER`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Koneksi SQL Server SCADA |
| `WABLAS_URL` | URL lengkap endpoint kirim pesan |
| `WABLAS_TOKEN` | Token WABLAS |
| `WA_GROUP_ID_TUAL`, `WA_GROUP_ID_SOFIFI` | ID grup produksi |
| `WA_PRIVATE_ID` | Nomor pribadi untuk mode testing |

**Mode testing aman secara default:** hanya nilai `TESTING=false` yang mengirim ke grup. Kosong atau salah ketik tetap dianggap testing. Pesan testing diberi prefix `[TESTING - <nama UP3>]` dan dikirim sebagai pesan pribadi. Jika penerima yang dibutuhkan kosong, pengiriman dibatalkan dengan error yang jelas.

## Menjalankan

```bash
npm install
cp .env.example .env     # lalu isi

npm run preview          # cetak pesan dari data contoh (tanpa DB/WA)
npm run send-now         # kirim sekali sekarang (mengikuti TESTING; menyentuh DB & WABLAS asli)
npm run dev              # jalankan langsung dari TypeScript

npm run build            # kompilasi ke dist/
npm start                # jalankan dist/app.js
npm run typecheck        # cek tipe saja
```

Urutan aman saat pertama kali: `preview` → `send-now` dengan `TESTING=true` → baru ubah ke `TESTING=false`.

## Deploy (PM2)

```bash
npm run build
pm2 start ecosystem.config.js    # nama: wa-notif-beban-mmu-7002
```

PM2 menjalankan `dist/app.js`, jadi `npm run build` wajib dijalankan setiap ada perubahan kode.

## Struktur

```
src/
├── app.ts                               # Express + start cron
├── types.ts                             # MeterRow, Report, WablasPayload
├── config/
│   ├── index.ts                         # baca .env, flag IS_TESTING
│   └── reports.ts                       # mapping laporan -> unit_id
├── model/scada_unit.model.ts            # query getMmuMeter, getHistoryTotal
├── service/
│   ├── scheduler-beban-mmu.service.ts   # cron + sendReports
│   └── wablas.service.ts                # POST ke WABLAS
├── utils/
│   ├── index.ts                         # format tanggal/angka, jam WIT
│   └── message-builder.ts               # susun pesan & payload
└── scripts/                             # preview.ts, send-now.ts
```

## Catatan

- Tidak ada test otomatis. Verifikasi format pesan dengan `npm run preview`.
- Tidak ada log pengiriman ke database dan tidak ada penanda "sudah terkirim"; error WABLAS hanya di-`console.log`.
- Jangan commit `.env` atau token WABLAS.
