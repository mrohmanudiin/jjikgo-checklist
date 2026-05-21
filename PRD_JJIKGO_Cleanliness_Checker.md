# PRD — JJIKGO Daily Cleanliness Checker
**Version**: 1.0  
**Tanggal**: 2025-05-26  
**Author**: MR / JJIKGO Studio  
**Status**: Ready to Build

---

## 1. Latar Belakang & Problem Statement

Saat ini proses pengecekan kebersihan harian dilakukan dengan cara:
1. Staff keliling lokasi dan **memfoto satu per satu area/item**
2. Staff kemudian **membuka Excel secara manual** dan memasukkan data + foto satu per satu
3. Manager mengisi kolom Score secara terpisah

Proses ini memakan waktu, rawan lupa item, dan foto sering tidak terarah karena tidak ada panduan urutan.

**Solusi**: Web app berbasis browser yang memandu staff item per item, memungkinkan foto langsung dari kamera HP, lalu menghasilkan file `.xlsx` yang formatnya **identik** dengan template yang sudah ada (`260520_JJIKGO_Cleanliness_Checklist_Bagas.xlsx`).

---

## 2. Tujuan & Success Metrics

| Tujuan | Ukuran Keberhasilan |
|---|---|
| Proses checklist lebih cepat | Waktu pengisian turun ≥ 50% vs manual |
| Tidak ada item yang terlewat | 31/31 item selalu muncul di output Excel |
| Output Excel identik dengan template | File bisa langsung diserahkan ke manager tanpa editing |
| Bisa dipakai siapa saja | Staff baru bisa pakai tanpa training |

---

## 3. Target Pengguna

- **Primary User**: Staff yang ditugaskan cek kebersihan hari itu (rotasi harian)
- **Secondary User**: Manager (Rohman) — hanya menerima file Excel output, tidak menggunakan tool ini secara aktif
- **Device**: HP (utama, mobile-first) + Laptop (secondary, responsive)

---

## 4. Scope

### ✅ In Scope (v1.0)
- Form header (Date, Branch, Manager, Checked By)
- Guided checklist 31 item dalam 6 kategori
- Ambil foto per item via kamera HP atau upload file
- Input Issue (Y/N), Forced C (Y/N), Comment per item
- Score dikosongkan (diisi manager secara manual)
- Export file `.xlsx` dengan foto tertanam (embedded)
- Draft auto-save di browser (tidak hilang kalau tutup tab)
- Progress indicator

### ❌ Out of Scope (v1.0)
- Backend / database / cloud storage
- Login / autentikasi
- Multi-branch management
- Manager dashboard / scoring interface
- Notifikasi / reminder
- Riwayat checklist lama

---

## 5. Checklist Data

### Header
| Field | Input Type | Wajib? | Default |
|---|---|---|---|
| Date | Date picker | Ya | Hari ini (auto) |
| Branch | Text / Dropdown | Ya | "Serang" |
| Manager | Text | Ya | Kosong |
| Checked By | Text | Ya | Kosong |

### 6 Kategori & 31 Item

| # | Kategori | Item |
|---|---|---|
| 1 | Outdoor Seating Area | Table Organized |
| 2 | Outdoor Seating Area | Glass Clean |
| 3 | Outdoor Seating Area | Floor Clean |
| 4 | Outdoor Seating Area | No Bad Smell |
| 5 | Outdoor Seating Area | Lighting Work |
| 6 | Outdoor Seating Area | Ceiling Fan Work |
| 7 | Outdoor Seating Area | Floor Mat Clean |
| 8 | Café Area | Table Organized |
| 9 | Café Area | Receipt Photo Print Working |
| 10 | Café Area | Air Conditioning Good |
| 11 | Café Area | No Bad Smell |
| 12 | Café Area | Lighting Working |
| 13 | Café Area | Floor Clean |
| 14 | Accessories Area | Accessories Organized |
| 15 | Accessories Area | Wardrobe Clean |
| 16 | Accessories Area | Accessories Clean |
| 17 | Accessories Area | Mirror Clean |
| 18 | Kitchen/Bar | Tools Organized |
| 19 | Kitchen/Bar | Stocks Organized |
| 20 | Kitchen/Bar | Boxes Organized |
| 21 | Kitchen/Bar | Tools Clean |
| 22 | Toilet | No Bad Smell |
| 23 | Toilet | Toilet Clean |
| 24 | Toilet | Tissue Available |
| 25 | Toilet | Floor Clean |
| 26 | Photobooth Area | Camera Cabinet Clean |
| 27 | Photobooth Area | Tools Organized |
| 28 | Photobooth Area | Air Conditioning Good |
| 29 | Photobooth Area | Lighting Working |
| 30 | Photobooth Area | Floor Clean |
| 31 | Photobooth Area | Camera Working Properly |

### Per-Item Fields yang Diisi Staff

| Field | Input Type | Wajib? | Keterangan |
|---|---|---|---|
| Photo | Camera / File upload | Ya (disarankan) | Bisa skip dengan konfirmasi |
| Photo Checked | Auto (Y/N) | — | Otomatis "Y" kalau foto diambil, "N" kalau skip |
| Issue? | Toggle (Y/N) | Tidak | Default: N |
| Forced C? | Toggle (Y/N) | Tidak | Default: N |
| Comment | Text area | Tidak | Opsional, maks 200 karakter |
| **Score** | — | **DIKOSONGKAN** | Hanya diisi manager secara manual di Excel |

---

## 6. User Flow

```
[BUKA APP]
    │
    ▼
[ISI HEADER]
Date · Branch · Manager · Checked By
    │
    ▼
[PILIH / MULAI DARI KATEGORI PERTAMA]
Progress bar: 0/31
    │
    ▼
┌─────────────────────────────────────┐
│  ITEM CARD (satu per satu)          │
│                                     │
│  Kategori: Outdoor Seating Area     │
│  Item: Table Organized              │
│                                     │
│  [📷 Ambil Foto]  [📁 Upload]       │
│  Preview foto (kalau sudah ada)     │
│                                     │
│  Issue?   [ Y / N ]                 │
│  Forced C? [ Y / N ]                │
│  Comment: _________________         │
│                                     │
│  [← Sebelumnya]  [Selanjutnya →]    │
└─────────────────────────────────────┘
    │
    ▼ (setelah item ke-31)
[REVIEW SCREEN]
Tampilkan semua item + status foto
Highlight item yang belum difoto
    │
    ▼
[TOMBOL: GENERATE & DOWNLOAD EXCEL]
    │
    ▼
[FILE .xlsx TERDOWNLOAD]
Format identik dengan template asli
Foto tertanam di kolom "Photo Checked"
Score kosong untuk diisi manager
```

---

## 7. Spesifikasi Output Excel

Output `.xlsx` harus **identik secara struktur** dengan template asli.

### Nama File Output
Format: `DDMMYY_JJIKGO_Cleanliness_Checklist_[CheckedBy].xlsx`  
Contoh: `260520_JJIKGO_Cleanliness_Checklist_Bagas.xlsx`

### Struktur Sheet: "JJIKGO Cleanliness Checklist"

**Baris 1–2: Header**
```
JJIKGO DAILY CLEANLINESS CHECKLIST
Date | Branch | Manager | | Checked By
[value] | [value] | [value] | | [value]
```

**Baris 4+: Data**

| Kolom | Field | Diisi oleh |
|---|---|---|
| A | Category | Template (hardcoded) |
| B | Checklist Item | Template (hardcoded) |
| C | Point | 5 (hardcoded) |
| D | Score | **KOSONG** — diisi manager |
| E | Photo Checked (Y/N) | Auto: Y/N dari tool |
| F | Issue? | Input staff |
| G | Forced C? | Input staff |
| H | Comment | Input staff |
| I | [Foto embedded] | Gambar dari kamera staff |

**Baris summary (setelah data):**
- Total Point: `=SUM(C4:C34)` → 155
- Total Score: `=SUM(D4:D34)` → kosong sampai manager isi
- Persentase: `=(D35/C35)*100` → kosong
- Grade: `=IF(D36>=90,"A",IF(D36>=75,"B","C"))` → kosong

**Baris Forced C Conditions (hardcoded di bawah):**
```
FORCED C CONDITIONS
- Toilet bad smell
- Photo booth bad smell
- Customer complaint
- Severe floor dirt
- Trash overflow
```

### Embedding Foto
- Foto dimasukkan ke **kolom I** (kolom baru di kanan Comment)
- Setiap foto di-resize ke maksimal **200x150 px** sebelum diembed
- Row height di-adjust otomatis mengikuti ukuran foto
- Jika tidak ada foto untuk item tersebut → kolom I kosong

---

## 8. Spesifikasi Teknis

### Stack
| Layer | Teknologi | Alasan |
|---|---|---|
| UI | HTML + CSS + Vanilla JS | Single file, tidak perlu server |
| Excel generation | **ExcelJS** (via CDN) | Satu-satunya library JS yang support embedded images di xlsx |
| Foto capture | `<input type="file" accept="image/*" capture="environment">` | Native browser, works di HP dan laptop |
| Image processing | Canvas API (resize sebelum embed) | Kompres foto agar file Excel tidak terlalu besar |
| Draft saving | `localStorage` | Tidak hilang kalau tab tertutup |
| Distribusi | File `.html` tunggal | Bisa dibuka langsung, tidak perlu install |

### Library CDN
```html
<!-- ExcelJS untuk export Excel dengan embedded images -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js"></script>
```

### Batasan & Pertimbangan
- **Ukuran foto**: Resize otomatis ke max 800x600 sebelum disimpan ke memory dan ke Excel. Target ukuran file Excel akhir < 10MB untuk 31 foto.
- **Format foto yang diterima**: JPG, PNG, WEBP, HEIC (via browser handling)
- **Draft**: Disimpan ke `localStorage` key `jjikgo_checklist_draft`. Saat buka app dan ada draft, tampilkan opsi "Lanjutkan Draft" atau "Mulai Baru".
- **Offline**: App berfungsi offline setelah pertama kali dimuat (karena single HTML file)

---

## 9. UI/UX Requirements

### Visual Style
- **Tema**: Dark premium (sesuai brand JJIKGO)
- **Warna utama**: Background `#0A0A0A`, Surface `#1A1A1A`
- **Accent**: Gold `#C9A84C` untuk CTA dan highlight
- **Teks**: White `#FFFFFF` primary, `#888888` secondary
- **Font**: System font stack (Inter / -apple-system)

### Layout Mobile-First
- Satu item per layar (card style, swipeable feel)
- Foto area besar (50% viewport height)
- Tombol besar untuk thumb-friendly tapping
- Progress bar fixed di atas: `Item 7 dari 31 · Café Area`

### Komponen Kunci
1. **Header Form** — full-screen step sebelum checklist dimulai
2. **Item Card** — area foto besar + 3 toggle input + comment
3. **Category Divider** — visual separator saat pindah kategori
4. **Review Screen** — grid thumbnails semua item, badge hijau/merah/abu
5. **Export Button** — CTA button gold, muncul setelah semua item dilihat
6. **Draft Banner** — muncul di atas kalau ada draft tersimpan

### States per Item
| State | Visual |
|---|---|
| Belum dikunjungi | Abu-abu, kosong |
| Dikunjungi, foto ada | Hijau ✓, thumbnail muncul |
| Dikunjungi, foto skip | Kuning ⚠, tanda "No Photo" |
| Ada issue ditandai | Badge merah "ISSUE" |
| Forced C ditandai | Badge merah terang "FORCED C" |

---

## 10. Edge Cases & Error Handling

| Skenario | Handling |
|---|---|
| Staff tutup tab di tengah jalan | Draft otomatis tersimpan setiap pindah item |
| Foto terlalu besar (>5MB) | Auto-compress ke <500KB via Canvas resize |
| Tidak semua item difoto | Boleh generate Excel, tapi ada warning "X item tanpa foto" |
| Browser tidak support kamera | Tampilkan file picker sebagai fallback |
| localStorage penuh | Tampilkan warning, minta clear storage atau download draft dulu |
| Nama Checked By kosong | Validasi di header form, tidak bisa lanjut |

---

## 11. File Deliverable

| File | Deskripsi |
|---|---|
| `jjikgo_checklist.html` | Satu file HTML lengkap (UI + logic + styling) |

Cara distribusi ke staff:
- Kirim file `.html` via WhatsApp / Google Drive
- Buka di browser HP (Chrome / Safari)
- Tidak perlu install apapun

---

## 12. Rencana Pengembangan

### v1.0 (Build Sekarang)
Semua fitur di atas. Single HTML file.

### v1.1 (Opsional Future)
- QR code untuk buka app (tempel di dinding studio)
- Pilihan bahasa (Indonesia / English)
- Export juga ke PDF untuk arsip visual

### v2.0 (Jika Skala Besar)
- Backend + database (simpan histori per branch)
- Manager dashboard untuk isi Score langsung di web
- Notifikasi otomatis ke WhatsApp manager saat checklist selesai

---

## 13. Open Questions

| # | Pertanyaan | Impact |
|---|---|---|
| 1 | Apakah nama Branch perlu jadi dropdown (multi-branch) atau text bebas? | UX header form |
| 2 | Apakah Forced C perlu pop-up konfirmasi ("Yakin ini Forced C?")? | UX safety |
| 3 | Apakah staff perlu bisa edit/hapus foto yang sudah diambil? | UX per-item |
| 4 | Apakah urutan item per kategori bisa berbeda setiap hari, atau selalu sama? | Data model |

---

*PRD ini cukup untuk langsung build `jjikgo_checklist.html` tanpa pertanyaan tambahan.*
