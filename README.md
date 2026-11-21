# Teh Poci POS — Cabang Limus Pratama Regensi

Aplikasi Web **Point of Sale (POS) dan Manajemen Booth Modern, Ringan, Cepat, dan Responsif** untuk booth waralaba/kemitraan **Teh Poci — Cabang Limus Pratama Regensi (Depan PG-TK Al-Imam, Cileungsi)**.

Dirancang dengan pola arsitektur **MVC (Model - View - Controller)** yang rapi, *mobile-first*, serta siap dikonfigurasi (*white-label / CMS-ready*) sehingga dapat dengan mudah dijual atau direplikasi untuk usaha booth minuman konvensional lainnya hanya dengan mengganti konfigurasi dan Google Spreadsheet ID.

---

## 🌟 Fitur Utama

1. **Kasir Booth Cepat (Mobile-First POS)**
   - Grid kartu menu minuman dengan grafis cup tajam dan kontras tinggi, nyaman digunakan di bawah terik matahari booth maupun layar HP kecil (360px+).
   - Filter cepat berdasarkan kategori (*Teh Melati, Fruit Tea, Milk & Creamy, Coffee Mix, Spesial*) dan pencarian instan.
   - Penyesuaian pesanan instan: Stepper Qty (+/-), pilihan rasa (*Normal Ice & Sugar, Less Sugar, Extra Ice, No Ice*), dan diskon promosi.
   - Multi metode pembayaran: **Tunai** (dengan tombol cepat *Uang Pas, 10rb, 20rb, 50rb, 100rb* dan hitung otomatis kembalian), **QRIS Standar**, dan **Transfer Bank**.
   - Cetak struk kasir format printer termal (*58mm / 80mm ESC-POS*) dan fitur bagikan struk digital via **WhatsApp**.

2. **Tutup Shift Kasir / Rekap Harian (Shift Closing)**
   - Rekap otomatis modal awal kas kecil, total penjualan tunai, QRIS, dan transfer.
   - **Kalkulator Pecahan Uang Kasir**: hitung lembar/koin fisik di laci (100rb, 50rb, 20rb, 10rb, 5rb, 2rb, 1rb) secara presisi.
   - Audit selisih kas (*Surplus / Defisit / Seimbang*) real-time.
   - Pencatatan kendala booth & bahan baku/cup menipis.
   - Cetak laporan rekap tutup kasir harian dan rekam otomatis ke Google Sheets.

3. **Dashboard Pemilik & CMS (White-Label & Multi-Tenant Ready)**
   - **Analitik Eksekutif (Pak Faik)**: Omzet hari ini, total cup terjual, rata-rata keranjang (*Average Basket*), varian terlaris, dan diagram komposisi pembayaran.
   - **Manajemen Brand & Cabang**: Ubah nama brand, cabang, alamat, nomor telepon, dan jam operasional tanpa menyentuh kode.
   - **Theme & Appearance Customizer**: Pengatur warna interaktif (*Hijau Poci #146C36, Hijau Daun #55A630, Merah Poci #D9232E, Kuning Cerah #FFD600*), gaya sudut kartu (*rounded-2xl, rounded-lg, sharp*), dan mode hemat grafis.
   - **Katalog Menu & Harga (CRUD)**: Kelola 17 varian minuman Teh Poci, ubah harga jual/modal, toggle stok habis, atau tambah varian menu baru.
   - **Lisensi Klien**: Konfigurasi nama mitra (*Pak Faik - Mitra Teh Poci*), kode cabang (*LPR-01*), dan status lisensi.

4. **Integrasi Google Spreadsheet (Tanpa Biaya Server / Zero Hosting Cost)**
   - Google Apps Script (GAS) Web App sebagai REST/JSON API endpoint.
   - 5 Tab Database: `Users`, `Products`, `Transactions`, `Shift_Closings`, `App_Settings`.
   - Inisialisasi otomatis: Skrip dapat membuat dan men-seed seluruh 5 tab database secara mandiri.
   - Mode Caching & Fallback Offline: Kasir tetap dapat melayani pelanggan walau koneksi internet sempat terputus.

---

## 📁 Struktur Direktori (Pola MVC)

```
App POS Teh Poci Booth/
├── index.html                  # Container SPA HTML5 + Tailwind CSS + PWA Meta
├── vercel.json                 # Konfigurasi routing & caching Vercel
├── manifest.json               # PWA Web App Manifest
├── README.md                   # Dokumentasi instalasi dan panduan lengkap
├── google-apps-script/
│   └── Code.gs                 # Kode Backend Google Apps Script (REST API Endpoint)
├── scripts/
│   └── slice_menu.py           # Generator aset visual & utilitas pemotong poster fisik
├── assets/
│   ├── css/
│   │   └── style.css           # Variabel tema dinamis & format cetak struk termal
│   └── img/
│       ├── logo-teh-poci.svg   # Logo autentik Teh Poci vector
│       ├── favicon.svg         # Ikon poci favicon
│       └── menu/               # 17 Aset ilustrasi varian minuman Teh Poci
│           ├── jasmine-kecil.svg
│           ├── jasmine-poci.svg
│           ├── apple-tea.svg
│           ├── orange-tea.svg
│           ├── lemon-honey.svg
│           ├── mango-tea.svg
│           ├── blackcurrant-tea.svg
│           ├── lychee-tea.svg
│           ├── guava-tea.svg
│           ├── markisa-tea.svg
│           ├── thai-tea.svg
│           ├── chocolatos.svg
│           ├── green-tea.svg
│           ├── cappuccino-tea.svg
│           ├── chocolate-tea.svg
│           ├── milo.svg
│           └── beng-beng.svg
└── js/
    ├── app.js                  # Entry point, router hash (#pos, #history, #shift, #cms), role guard
    ├── models/
    │   ├── UserModel.js        # State autentikasi & profil kasir/admin
    │   ├── ProductModel.js     # State katalog produk & filter kategori
    │   ├── TransactionModel.js # State keranjang kasir, diskon, kembalian & faktur
    │   ├── ShiftModel.js       # State tutup kasir, saldo awal & selisih kas
    │   └── SettingsModel.js    # State White-label CMS, tema & lisensi
    ├── controllers/
    │   ├── AuthController.js   # Logika login & role guard
    │   ├── PosController.js    # Logika transaksi kasir & checkout
    │   ├── HistoryController.js# Logika pencarian & cetak ulang faktur
    │   ├── ShiftController.js  # Logika audit kas fisik & laporan shift
    │   └── CmsController.js    # Logika update CMS, menu CRUD & sinkronisasi GAS
    ├── views/
    │   ├── LoginView.js        # Tampilan login cepat kasir/admin
    │   ├── PosView.js          # Tampilan kasir utama (Mobile-First & Desktop)
    │   ├── HistoryView.js      # Tampilan riwayat penjualan
    │   ├── ShiftView.js        # Tampilan formulir tutup shift harian
    │   └── CmsView.js          # Tampilan dashboard pemilik & CMS
    └── services/
        ├── ApiService.js       # Client HTTP ke Google Apps Script + Fallback Offline
        └── PrintService.js     # Generator struk termal 58mm/80mm & share WhatsApp
```

---

## 🫖 Daftar Menu & Harga Default (17 Varian)

| No | Kode | Nama Minuman | Kategori | Harga Jual | Aset Gambar |
|---|---|---|---|---|---|
| 1 | TP-01 | Jasmine Tea Kecil | Teh Melati | Rp 3.000 | `assets/img/menu/jasmine-kecil.svg` |
| 2 | TP-02 | Jasmine Poci Iced Tea | Teh Melati | Rp 4.000 | `assets/img/menu/jasmine-poci.svg` |
| 3 | TP-03 | Apple Iced Tea | Fruit Tea | Rp 6.000 | `assets/img/menu/apple-tea.svg` |
| 4 | TP-04 | Orange Iced Tea | Fruit Tea | Rp 6.000 | `assets/img/menu/orange-tea.svg` |
| 5 | TP-05 | Lemon Honey Iced Tea | Fruit Tea | Rp 6.000 | `assets/img/menu/lemon-honey.svg` |
| 6 | TP-06 | Mango Iced Tea | Fruit Tea | Rp 6.000 | `assets/img/menu/mango-tea.svg` |
| 7 | TP-07 | Blackcurrant Iced Tea | Fruit Tea | Rp 6.000 | `assets/img/menu/blackcurrant-tea.svg` |
| 8 | TP-08 | Lychee Iced Tea | Fruit Tea | Rp 6.000 | `assets/img/menu/lychee-tea.svg` |
| 9 | TP-09 | Guava Iced Tea | Fruit Tea | Rp 6.000 | `assets/img/menu/guava-tea.svg` |
| 10 | TP-10 | Markisa/Menu Baru | Spesial | Rp 7.000 | `assets/img/menu/markisa-tea.svg` |
| 11 | TP-11 | Thai Iced Tea | Milk & Creamy | Rp 9.000 | `assets/img/menu/thai-tea.svg` |
| 12 | TP-12 | Chocolatos | Milk & Creamy | Rp 9.000 | `assets/img/menu/chocolatos.svg` |
| 13 | TP-13 | Green Tea | Milk & Creamy | Rp 9.000 | `assets/img/menu/green-tea.svg` |
| 14 | TP-14 | Cappuccino Iced Tea | Coffee Mix | Rp 8.000 | `assets/img/menu/cappuccino-tea.svg` |
| 15 | TP-15 | Chocolate Iced Tea | Milk & Creamy | Rp 8.000 | `assets/img/menu/chocolate-tea.svg` |
| 16 | TP-16 | Milo | Milk & Creamy | Rp 9.000 | `assets/img/menu/milo.svg` |
| 17 | TP-17 | Beng-Beng | Milk & Creamy | Rp 9.000 | `assets/img/menu/beng-beng.svg` |

*(Seluruh harga dan varian dapat diubah kapan saja melalui Tab **Katalog Menu & Harga** di Dashboard CMS).*

---

## 🚀 Panduan Setup Backend: Google Spreadsheet & Google Apps Script

Aplikasi ini menggunakan Google Spreadsheet sebagai database utama yang gratis, stabil, dan mudah dipantau dari Google Drive pemilik booth.

### Langkah 1: Buat Google Spreadsheet Baru
1. Buka [Google Sheets](https://sheets.new) di browser Anda.
2. Beri nama file, misalnya: `Database POS Teh Poci - Limus Pratama Regensi`.

### Langkah 2: Pasang Kode Google Apps Script
1. Pada menu atas Google Sheets, klik **Extensions (Ekstensi)** > **Apps Script**.
2. Hapus seluruh kode bawaan di `Code.gs`.
3. Buka file `google-apps-script/Code.gs` dari proyek ini, lalu salin (*copy*) seluruh isinya dan tempel (*paste*) ke editor Apps Script.
4. Klik ikon **Save (Simpan)**.

### Langkah 3: Deploy sebagai Web App
1. Di pojok kanan atas editor Apps Script, klik tombol **Deploy** > **New deployment**.
2. Klik ikon gerigi di sebelah kiri jenis deployment, pilih **Web app**.
3. Isi konfigurasi berikut:
   - **Description**: `Teh Poci POS API v1`
   - **Execute as**: **Me (email Anda)**
   - **Who has access**: **Anyone (Siapa saja)** *(Wajib agar web app frontend dapat mengakses API)*.
4. Klik **Deploy**.
5. Jika muncul permintaan izin (*Authorization required*), klik **Authorize access**, pilih akun Google Anda, klik *Advanced*, lalu klik *Go to (unsafe)* dan pilih *Allow*.
6. Salin **Web App URL** yang dihasilkan (formatnya: `https://script.google.com/macros/s/AKfycb.../exec`).

### Langkah 4: Hubungkan ke Aplikasi POS
1. Buka aplikasi web Teh Poci POS di browser.
2. Masuk menggunakan akun admin (**Pak Faik**, password: `admin123`).
3. Buka tab **CMS & Tema** > tab **Integrasi Spreadsheet & Lisensi**.
4. Tempelkan URL Web App Google Apps Script ke input yang tersedia, lalu klik **Simpan URL**.
5. Klik tombol **⚡ Test Koneksi (Ping)** untuk memastikan terhubung.
6. Klik tombol **🪄 Inisialisasi 5 Sheet Otomatis**. Google Apps Script akan secara otomatis membuat dan menyusun 5 tab sheet lengkap dengan data awal:
   - Tab `Users` (Data akun kasir & admin)
   - Tab `Products` (Katalog 17 minuman Teh Poci)
   - Tab `Transactions` (Log seluruh transaksi penjualan kasir)
   - Tab `Shift_Closings` (Laporan rekap tutup shift harian)
   - Tab `App_Settings` (Pengaturan CMS & tema)

---

## 🌐 Panduan Deployment ke GitHub & Vercel

### 1. Inisialisasi Repository Git Lokal & Push ke GitHub
```bash
git init
git add .
git commit -m "feat: inisialisasi aplikasi web POS Teh Poci Cabang Limus Pratama Regensi"
git branch -M main
git remote add origin https://github.com/USERNAME/app-pos-teh-poci.git
git push -u origin main
```

### 2. Deploy ke Vercel
1. Buka [Vercel Dashboard](https://vercel.com).
2. Klik **Add New...** > **Project**.
3. Hubungkan akun GitHub Anda dan pilih repository `app-pos-teh-poci`.
4. Pada bagian **Framework Preset**, pilih **Other** (karena aplikasi ini adalah Vanilla/Modern static web application yang super cepat).
5. Klik **Deploy**.
6. Dalam hitungan detik, aplikasi POS Teh Poci Anda sudah online dengan domain Vercel (contoh: `https://teh-poci-pos.vercel.app`).

---

## 👤 Akun Pengguna & Hak Akses Bawaan

Aplikasi dilengkapi tombol **1-Tap Quick Switch** pada halaman login untuk kemudahan staf dan pengujian:

1. **Staf Kasir Booth (Pak Riza Lahmadi)**
   - **Username**: `riza`
   - **PIN Cepat**: `1234`
   - **Akses**: Melayani pesanan, tambah minuman, catat variasi rasa, hitung pembayaran tunai/non-tunai, cetak struk termal, kirim struk WhatsApp, dan melakukan tutup shift harian.

2. **Admin / Owner (Pak Faik)**
   - **Username**: `admin`
   - **Password / PIN**: `admin123` / `9999`
   - **Akses Penuh**: Seluruh fitur kasir + Akses Dashboard CMS, Analitik Omzet, Ubah Brand & Cabang, Kustomisasi Warna & Tema (Appearance), CRUD Menu & Harga Minuman, dan Integrasi Google Sheets.

---

## ✂️ Utilitas Slicing Gambar Menu (`scripts/slice_menu.py`)

Aplikasi telah menyertakan 17 aset gambar SVG vektor berkualitas tinggi yang siap pakai. Namun, jika Anda memiliki foto poster menu fisik di kemudian hari dan ingin memotongnya secara otomatis:

1. Letakkan foto poster di folder proyek, misalnya: `poster_menu.jpg`.
2. Jalankan perintah:
   ```bash
   python3 scripts/slice_menu.py --poster poster_menu.jpg
   ```
3. Skrip akan memotong poster menjadi 17 gambar PNG rasio 1:1 (400x400) dan menaruhnya langsung ke folder `assets/img/menu/`.

---

## 💡 Keunggulan untuk Dijual / Direplikasi (White-Label)

Aplikasi ini dibangun *loosely coupled* dan *CMS-first*:
- **Ganti Nama Usaha**: Cukup ubah di menu CMS tanpa perlu *re-compile* atau *edit coding*.
- **Multi-Tenant Ready**: Setiap mitra booth baru cukup diberikan salinan (*clone*) Google Spreadsheet dan memasukkan URL Web App mereka sendiri.
- **Biaya Operasional Nol (Zero Server Cost)**: Menggunakan Vercel Hobby (Gratis) dan Google Sheets API (Gratis).
- **Kompatibel Printer Termal**: Mendukung printer kasir bluetooth mini 58mm maupun printer kasir USB desktop 80mm.
