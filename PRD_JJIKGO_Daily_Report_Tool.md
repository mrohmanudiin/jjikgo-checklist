# PRD — JJIKGO Daily Report Tool
**Versi:** 1.0  
**Dibuat untuk:** M. Rohmanudin — JJIKGO Serang  
**Tujuan:** Aplikasi web mobile-friendly untuk mengisi daily report harian dengan mudah (klik-klik, minim ketik), lalu mengunduh hasilnya sebagai file Excel yang identik dengan template asli.

---

## 1. Latar Belakang & Masalah

Saat ini daily report diisi secara manual di Excel. Masalahnya:
- Tidak nyaman diisi lewat HP (Excel mobile kurang responsif)
- Banyak input berulang (tanggal, nama store, nama manager)
- Revenue harus dihitung manual (qty × harga)
- Cumulative monthly sales harus ditambah sendiri setiap hari
- Checklist status (Done/Not Done) harus diketik
- Jadwal staff harus diisi ulang setiap hari padahal nama staff tetap

**Solusi:** Web app mobile-first yang bisa diakses dari browser HP, semua kalkulasi otomatis, dan output-nya berupa file `.xlsx` yang formatnya identik dengan template.

---

## 2. Target Pengguna

| Pengguna | Kebutuhan Utama |
|---|---|
| Manager (M. Rohmanudin) | Isi laporan harian cepat dari HP, export Excel |
| Staff | Lihat jadwal shift besok |
| HQ | Menerima file Excel dengan format standar |

---

## 3. Fitur Utama

### 3.1 Halaman Settings (Konfigurasi Awal — sekali set, tidak perlu diubah tiap hari)

Settings disimpan di `localStorage` agar tidak perlu diisi ulang.

**A. Info Toko**
| Field | Tipe | Contoh |
|---|---|---|
| Nama Store | Text input | JJIKGO Serang |
| Nama Manager | Text input | M. Rohmanudin |
| Nama "Prepared by" | Text input | M. Rohmanudin |

**B. Daftar Staff**  
Form untuk menambah/edit/hapus nama staff beserta posisi default mereka. Disimpan sebagai list untuk dipakai di dropdown jadwal shift.

| Field | Tipe | Contoh |
|---|---|---|
| Nama Staff | Text | aldi, noval, huril, saldi, dito, reyvan, Rohman |
| Posisi Default | Dropdown | Barista / Staff Photobooth / Manager |

**C. Harga Menu Cafe** (dipakai untuk kalkulasi otomatis revenue)
| Menu | Harga (IDR) |
|---|---|
| Taro Latte | [input] |
| Matcha Latte | [input] |
| Lychee Green Tea | [input] |
| Lemon Green Tea | [input] |
| Mango Green Tea | [input] |
| Brown Sugar Milk Tea | [input] |
| Caramel Milk Tea | [input] |
| Hazelnut Milk Tea | [input] |
| Taro Milk Tea | [input] |
| Vanilla Milk Tea | [input] |
| Chicken Nugget | [input] |
| French Fries | [input] |
| Sosis | [input] |
| Mix Platter | [input] |
| Snack Set A | [input] |
| Snack Set B | [input] |
| Taro | [input] |
| Cheetos | [input] |

**D. Harga Photobooth per Booth Type**
| Booth Type | Harga per Transaksi (IDR) |
|---|---|
| Red Box | [input] |
| Teddy Bear | [input] |
| Vintage Album | [input] |
| Vintage Vinyl | [input] |
| Vintage Hotel | [input] |
| Vintage Elevator | [input] |
| Supermarket | [input] |
| Subway | [input] |
| Pas Foto | [input] |

> Self Studio tidak punya harga tetap per transaksi karena dihitung per sesi/orang — input revenue-nya manual.

**E. Data Cumulative Bulan Berjalan**  
Tabel yang bisa diedit untuk menyimpan data daily revenue & expense dari tanggal 1 sampai kemarin. Ini dipakai otomatis mengisi Section C di laporan. Setiap kali user submit laporan hari ini, data hari ini otomatis ditambahkan ke tabel cumulative.

---

### 3.2 Halaman Form Daily Report (Diisi Setiap Hari)

Form dibagi menjadi **section** dengan navigasi tab/scroll. Setiap section bisa di-collapse/expand.

---

#### SECTION 0 — Header Info
| Field | Tipe | Default / Pilihan |
|---|---|---|
| Tanggal | Date picker | Hari ini (otomatis) |
| Store | Text (read-only) | Dari settings |
| Manager | Text (read-only) | Dari settings |
| Prepared by | Text (read-only) | Dari settings |
| Cuaca | Dropdown | ☀️ Bright / 🌤 Cloudy / 🌧 Rainy / ⛈ Stormy |

---

#### SECTION A — Daily Sales Cafe

Tampil sebagai tabel. Untuk setiap menu item:
- **Input:** Kolom "Transactions" → number input (default 0), keyboard angka
- **Auto-hitung:** Revenue = Transactions × Harga (dari settings) → tampil otomatis
- **TOTAL** di baris bawah dihitung otomatis (sum semua transactions & revenue)
- Kolom **Remark** → text input opsional

> UX tip: Tombol `+` dan `-` di samping number input agar mudah di HP tanpa ketik angka.

---

#### SECTION B — Daily Sales by Photo Booth Type

Sama seperti Section A:
- **Input:** Transactions per booth type → number input
- **Auto-hitung:** Revenue = Transactions × Harga Booth (dari settings)
- **TOTAL** otomatis
- **Pas Foto:** Transactions + Revenue (manual, karena harga tetap sudah di settings = otomatis)
- **Self Studio:** 
  - Input: Jumlah Sesi (number) + Jumlah Person (number) → tampil sebagai "X Sesion/ Y Person" di Excel
  - Input: Revenue Self Studio (manual, karena harga bervariasi)

---

#### SECTION C — Monthly Cumulative Sales

- **Auto-generate:** Ditarik dari data cumulative yang tersimpan di settings
- Tanggal 1 s/d kemarin → otomatis muncul dari data simpanan
- Baris hari ini → otomatis diisi setelah user klik Generate/Submit
- User hanya perlu **review**, tidak perlu input apapun di section ini
- Tampil sebagai tabel read-only di form, tapi semua data masuk ke Excel

---

#### SECTION D — Daily Expense

Tabel dengan tombol **"+ Tambah Pengeluaran"**:
| Field | Tipe | Contoh |
|---|---|---|
| Tanggal | Date (auto = hari ini) | 20/05/2026 |
| Nominal (IDR) | Number input | 20000 |
| Keterangan | Text input | Ice Cube |

- Bisa tambah baris sebanyak yang dibutuhkan
- Bisa hapus baris
- **Total expense hari ini** dihitung otomatis (dipakai di Section C)

---

#### SECTION — Refund

Tabel dengan tombol **"+ Tambah Refund"** (opsional, bisa dikosongkan):
| Field | Tipe |
|---|---|
| Nomor urut (1-16) | Auto |
| Nominal Refund (IDR) | Number input |

---

#### SECTION — Tomorrow Staff Schedule

Jadwal shift untuk **besok** (tanggal otomatis = hari ini + 1):

**Shift 1 (08.00–16.00)**  
Tabel dengan tombol "+ Tambah Staff Shift 1":
| Field | Tipe | Pilihan |
|---|---|---|
| Position | Dropdown | Shift 1 / Shift 2 |
| Name | Dropdown | Dari daftar staff di settings |
| Shift Time | Auto-fill | Besok 08.00-16.00 (format: DD/MM/YY HH.mm-HH.mm) |
| Status | Dropdown | Barista / Staff Photobooth / Manager / Kasir / Security |

**Shift 2 (14.00–22.00)**  
Sama, tapi shift time auto-fill 14.00-22.00.

- Bisa tambah/hapus baris per shift
- Nama staff bisa diketik manual jika tidak ada di dropdown

**Info Max Salary:**  
Tampil otomatis: "Max monthly salary: not over 15% of total revenue"  
Kalkulasi opsional: tampilkan 15% dari total cumulative revenue bulan berjalan sebagai informasi.

---

#### SECTION — DNP Paper & Inventory Status

Tabel inventory:
| Field | Tipe |
|---|---|
| Item | Text input |
| Start Qty | Number input |
| Used Today | Number input |
| Remaining | **Auto-hitung** (Start Qty − Used Today) |
| Need Order? | **Auto-logic**: jika Remaining ≤ threshold (bisa di-set), tampil "YESSS" |

Tombol "+ Tambah Item Inventory"

---

#### SECTION — Customer Complaint & Google Review Check

Tabel dengan tombol "+ Tambah Entry":
| Field | Tipe |
|---|---|
| Complaint / Review | Text input |
| Cause / Rating | Text input |
| Action Taken | Text input |
| Need HQ Support | Dropdown: Yes / No |

---

#### SECTION — Equipment Status

Toggle checklist per alat:
| Alat | Status |
|---|---|
| Camera | Toggle: ✅ Done / ❌ Issue |
| Monitor | Toggle |
| PC | Toggle |
| Mouse | Toggle |
| AC | Toggle |

Jika status = "Issue" → muncul text input untuk deskripsi masalah (kolom Issue di Excel).

---

#### SECTION — Cleaning Checklist

Toggle checklist per area:
| Area | Done? |
|---|---|
| Booth Cleaning | ✅ / ❌ |
| Toilet Cleaning | ✅ / ❌ |
| Floor Mopping | ✅ / ❌ |
| Glass Cleaning | ✅ / ❌ |
| Trash Disposal | ✅ / ❌ |
| Warehouse Arrangement | ✅ / ❌ |

Default semua = Done (✅). User tinggal un-toggle kalau tidak selesai.

---

#### SECTION — Marketing & SNS Activity

Toggle checklist:
| Activity | Done? |
|---|---|
| Instagram Reel Upload | ✅ / ❌ |
| Instagram Story Upload | ✅ / ❌ |
| TikTok Upload | ✅ / ❌ |
| Google Review Request | ✅ / ❌ |
| Promotion Running | ✅ / ❌ |
| Influencer's visit | Text input (nama influencer, opsional) |
| Influencer's posting URL | Text input (URL, opsional) |

---

#### SECTION — Incident / Special Report

Text area panjang, opsional.

---

#### SECTION — HQ Support Request

**Upload Payment (1-3 item):**  
Text input x3 (keterangan upload payment, bukan file upload)

**Delivery Request (1-3 item):**  
Text input x3

---

### 3.3 Tombol Generate & Download Excel

Di bagian bawah form, tombol besar:

```
[ 📥 Download Laporan Excel ]
```

Saat diklik:
1. Validasi form — field wajib yang kosong di-highlight
2. Generate file `.xlsx` dengan format identik template
3. Nama file otomatis: `DDMMYY_JJIKGO_[NamaManager].xlsx`  
   Contoh: `260520_JJIKGO_rohman.xlsx`
4. File langsung terdownload ke HP/browser
5. Data hari ini (revenue & expense total) **otomatis tersimpan** ke data cumulative di settings

---

## 4. Spesifikasi Output Excel

File Excel yang dihasilkan harus **identik strukturnya** dengan template `260520_JJIKGO_rohman.xlsx`:

### Struktur Sheet: "JJIKGO Daily Report"

| Baris | Kolom | Isi |
|---|---|---|
| A1:D1 (merged) | — | "JJIKGO DAILY REPORT" — bold, center |
| A2–B6 | — | Header info (Date, Store, Manager, Weather, Prepared by) |
| A8:D8 (merged) | — | "A. Daily Sales Cafe" — bold, center |
| A9–D9 | — | Header kolom (Menu, Transactions, Daily Revenue IDR, Remark) — fill #DDDDDD |
| A10 | — | "NON COFFEE" — kategori, fill #DDDDDD, bold |
| A11–C12 | — | Taro Latte, Matcha Latte + data |
| A13 | — | "GREEN TEA" — fill #DDDDDD, bold |
| A14–C16 | — | 3 item green tea |
| A17 | — | "MILK TEA" — fill #DDDDDD, bold |
| A18–C22 | — | 5 item milk tea |
| A23 | — | "SIDE DISH" — fill #DDDDDD, bold |
| A24–C31 | — | 8 item side dish |
| A32–C32 | — | TOTAL — bold |
| A35:D35 (merged) | — | "B. Daily Sales by Photo Booth Type" |
| A36–C36 | — | Header kolom — fill #DDDDDD |
| A37–C47 | — | Data booth + Pas Foto + Self Studio |
| A50:D50 (merged) | — | "C. Monthly Cumulative Sales" |
| A51–D51 | — | Header kolom — fill #DDDDDD |
| A52–D81 | — | Data cumulative (tanggal 1–31) |
| A72:D72 (merged) | — | "D. DAILY EXPENSE" |
| A73–C73 | — | Header (Date, Daily Expense, keterangan) |
| A74+ | — | Data expense (dinamis, sesuai jumlah baris) |
| A80–B80 | — | "REFUND Date" + "Daily Refund (IDR)" |
| A81–B96 | — | Data refund (16 baris tetap) |
| A98:D98 (merged) | — | "Tomorrow Staff Schedule" |
| A99–D99 | — | Header kolom |
| A100+ | — | Data staff shift (dinamis) |
| A108–B108 | — | "Max monthly salary" + "not over 15% of total revenue" |
| A110:D110 (merged) | — | "DNP Paper & Inventory Status" |
| A111–E111 | — | Header kolom |
| A112+ | — | Data inventory |
| A115:D115 (merged) | — | "Customer Complaint & Google Review Check" |
| A116–D116 | — | Header kolom |
| A120:D120 (merged) | — | "EQUIPMENT STATUS" |
| A121–C121 | — | Header (Equipment, Status, Issue) |
| A122–C126 | — | Data equipment |
| A128:D128 (merged) | — | "CLEANING CHECKLIST" |
| A129–B129 | — | Header (Area, Done) |
| A130–B135 | — | Data cleaning |
| A137:D137 (merged) | — | "MARKETING & SNS ACTIVITY" |
| A138–B138 | — | Header (Activity, Done) |
| A139–B145 | — | Data marketing + influencer |
| A147:D147 (merged) | — | "INCIDENT / SPECIAL REPORT" |
| A148 | — | Isi incident report |
| A152:D152 (merged) | — | "9. HQ SUPPORT REQUEST" |
| A153 | — | "Upload payment" |
| A154–A156 | — | Item 1–3 |
| A157 | — | "Delivery request" |
| A158–A160 | — | Item 1–3 |

### Styling yang harus direplikasi:
- Font default: Calibri 11
- Header section (judul): **Bold**, center, merged A:D
- Header kolom tabel: **Bold**, center, fill `#DDDDDD`
- Kategori sub-menu cafe (NON COFFEE, GREEN TEA, dll): **Bold**, fill `#DDDDDD`
- Lebar kolom: A=20, B=20, C=20, D=15, E=12 (approx)
- Border tipis pada semua sel berisi data
- Angka revenue format: angka biasa tanpa simbol (seperti di template, bukan format currency otomatis Excel)

---

## 5. Teknologi yang Direkomendasikan

### Stack: Single-file HTML App (tidak perlu server, bisa dibuka langsung dari HP)

```
index.html (satu file saja)
├── HTML + Vanilla JS / atau React
├── SheetJS (xlsx.js) → untuk generate file Excel
├── localStorage → untuk simpan settings & data cumulative
└── CSS → responsive mobile-first
```

**Kenapa single HTML file?**
- Bisa dibuka dari HP tanpa install app
- Bisa disimpan ke home screen HP seperti app
- Tidak perlu internet setelah didownload
- Bisa dihosting di GitHub Pages / Netlify gratis

### Library:
| Library | Fungsi |
|---|---|
| [SheetJS / xlsx.js](https://sheetjs.com) | Generate file `.xlsx` di browser |
| [Tailwind CDN](https://tailwindcss.com) | Styling mobile-friendly |
| LocalStorage API | Simpan settings & data cumulative |

---

## 6. Alur Penggunaan (User Flow)

```
Pertama kali pakai:
  → Buka app di browser HP
  → Pergi ke Settings
  → Isi nama store, manager, daftar staff, harga menu, harga booth
  → Simpan settings
  → Mulai isi laporan hari ini

Setiap hari:
  → Buka app
  → Tab "Daily Report"
  → Tanggal sudah otomatis = hari ini
  → Cuaca → pilih dari dropdown (1 tap)
  → Section A: ketuk angka transactions per menu yang terjual (revenue otomatis)
  → Section B: ketuk angka transactions per booth (revenue otomatis)
  → Section C: tampil otomatis (no input)
  → Section D: tap "+ Tambah", isi nominal + keterangan pengeluaran
  → Refund: isi kalau ada
  → Staff Schedule: pilih nama dari dropdown untuk besok
  → Inventory: update Used Today
  → Complaint: isi kalau ada
  → Equipment: semua default Done, un-toggle kalau ada masalah
  → Cleaning: semua default Done, un-toggle kalau belum
  → Marketing: semua default Done, un-toggle kalau belum
  → Incident: isi kalau ada
  → HQ Request: isi kalau ada
  → Tap [ 📥 Download Laporan Excel ]
  → File terdownload: 260520_JJIKGO_rohman.xlsx
  → Kirim file ke HQ via WhatsApp/email seperti biasa
```

---

## 7. Validasi & Error Handling

| Kondisi | Perlakuan |
|---|---|
| Transactions diisi negatif | Tolak, tampil error |
| Revenue < 0 | Tampil warning |
| Staff schedule kosong | Warning (tapi bisa tetap download) |
| Tidak ada expense hari ini | Baris expense kosong di Excel (normal) |
| Cumulative tidak ada data | Section C hanya tampil baris hari ini |

---

## 8. Nice-to-Have (Future Enhancement)

- [ ] Preview tampilan laporan sebelum download
- [ ] Mode dark/light
- [ ] Export ke PDF selain Excel
- [ ] Notifikasi pengingat jam tertentu untuk isi laporan
- [ ] Sinkronisasi Google Sheets (butuh backend)
- [ ] Riwayat laporan yang sudah dibuat (simpan di localStorage)
- [ ] Grafik penjualan mingguan/bulanan

---

## 9. Prioritas Development

| Priority | Fitur |
|---|---|
| P0 (Must Have) | Settings (nama toko, staff, harga menu & booth) |
| P0 | Form Section A & B dengan kalkulasi otomatis |
| P0 | Export Excel identik dengan template |
| P1 | Section C auto-generate dari data cumulative |
| P1 | Section D (expense) dengan tombol tambah/hapus |
| P1 | Staff schedule dengan dropdown nama |
| P2 | Cleaning, equipment, marketing checklist toggle |
| P2 | Inventory dengan auto-calculate remaining |
| P3 | Validasi form & error handling |
| P3 | Nice-to-have features |

---

## 10. Acceptance Criteria

✅ Bisa diakses dari browser HP (Chrome/Safari mobile)  
✅ Tanggal, store, manager auto-fill  
✅ Revenue cafe = qty × harga (dari settings), otomatis  
✅ Revenue photobooth = qty × harga (dari settings), otomatis  
✅ Total Section A dan B dihitung otomatis  
✅ Cumulative Section C diisi otomatis dari data tersimpan  
✅ Dropdown cuaca berfungsi  
✅ Dropdown nama staff dari daftar tersimpan  
✅ Cleaning & equipment toggle default Done  
✅ File Excel yang didownload membuka dengan benar di Microsoft Excel / Google Sheets  
✅ Format Excel identik dengan template (merged cells, warna header, bold, struktur baris)  
✅ Nama file otomatis sesuai format: `DDMMYY_JJIKGO_[nama].xlsx`  
✅ Data cumulative diperbarui otomatis setelah download  

---

*PRD ini dibuat berdasarkan analisis file `260520_JJIKGO_rohman.xlsx` yang dikirimkan. Seluruh struktur Excel, urutan section, merged cells, warna, dan format sudah dipetakan secara detail di dokumen ini.*
