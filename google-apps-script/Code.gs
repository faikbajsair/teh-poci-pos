/**
 * ===================================================================================
 * BACKEND GOOGLE APPS SCRIPT (GAS) - TEH POCI POS & BOOTH MANAGEMENT SYSTEM
 * Cabang: Limus Pratama Regensi (Depan PG-TK Al-Imam)
 * Pola: RESTful JSON API via doGet & doPost dengan Integrasi 5 Tab Google Spreadsheet
 * ===================================================================================
 */

// Konstanta Nama Sheet Database
const SHEET_USERS = 'Users';
const SHEET_PRODUCTS = 'Products';
const SHEET_TRANSACTIONS = 'Transactions';
const SHEET_SHIFTS = 'Shift_Closings';
const SHEET_SETTINGS = 'App_Settings';

/**
 * Endpoint Utama HTTP GET
 * Digunakan untuk: Ping status, inisialisasi sheet, get data (produk, user, transaksi, pengaturan)
 */
function doGet(e) {
  return handleRequest(e, 'GET');
}

/**
 * Endpoint Utama HTTP POST
 * Digunakan untuk: Login, simpan transaksi, tutup shift, CRUD produk, update CMS
 */
function doPost(e) {
  return handleRequest(e, 'POST');
}

/**
 * Dispatcher & Handler Request Utama dengan CORS Protection & Error Handling
 */
function handleRequest(e, method) {
  // Set default response headers & template
  const response = {
    status: 'error',
    code: 400,
    message: 'Permintaan tidak valid',
    data: null,
    serverTime: new Date().toISOString()
  };

  try {
    let params = {};
    if (e && e.parameter) {
      params = Object.assign({}, e.parameter);
      // Dukungan payload JSON via GET query parameter data / payload (Ultra-reliable CORS bypass)
      if (params.payload) {
        try {
          const parsed = JSON.parse(params.payload);
          params = Object.assign(params, parsed);
        } catch (err) {}
      }
    }

    // Jika request POST memiliki body JSON (application/json)
    if (method === 'POST' && e && e.postData && e.postData.contents) {
      try {
        const body = JSON.parse(e.postData.contents);
        params = Object.assign(params, body);
      } catch (err) {
        // Fallback jika dikirim x-www-form-urlencoded
      }
    }

    const action = params.action || 'ping';
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Action: PING (Pemeriksaan Koneksi)
    if (action === 'ping') {
      response.status = 'success';
      response.code = 200;
      response.message = 'Backend Teh Poci POS GAS aktif dan siap digunakan.';
      response.data = {
        spreadsheetName: ss.getName(),
        spreadsheetId: ss.getId(),
        activeSheets: ss.getSheets().map(s => s.getName())
      };
      return createJsonResponse(response);
    }

    // 2. Action: INIT_SHEETS (Inisialisasi & Seeding Awal Otomatis)
    if (action === 'init_sheets') {
      const initResult = initializeDatabaseSheets(ss);
      response.status = 'success';
      response.code = 200;
      response.message = 'Inisialisasi database sheet dan data awal berhasil.';
      response.data = initResult;
      return createJsonResponse(response);
    }

    // 3. Action: GET_ALL_DATA (Sinkronisasi awal POS & CMS)
    if (action === 'get_all_data') {
      // Pastikan sheet telah dibuat
      initializeDatabaseSheets(ss);
      
      const settings = getSheetDataAsObjects(ss, SHEET_SETTINGS);
      const products = getSheetDataAsObjects(ss, SHEET_PRODUCTS);
      // KEAMANAN KETAT: Sensor dan sembunyikan password_hash serta PIN agar tidak pernah bocor ke client
      const users = getSheetDataAsObjects(ss, SHEET_USERS, ['password_hash', 'pin']);
      const recentTransactions = getRecentTransactions(ss, 50);

      // Ubah array settings menjadi key-value object untuk kemudahan client
      const settingsMap = {};
      settings.forEach(item => {
        if (item.key) settingsMap[item.key] = item.value;
      });

      response.status = 'success';
      response.code = 200;
      response.message = 'Data berhasil dimuat';
      response.data = {
        settings: settingsMap,
        products: products,
        users: users,
        recentTransactions: recentTransactions
      };
      return createJsonResponse(response);
    }

    // 4. Action: LOGIN (Autentikasi Staf / Admin dengan Proteksi Brute-Force & Hashing)
    if (action === 'login') {
      const username = (params.username || '').trim();
      const password = (params.password || '').trim();
      const clientIp = (e && e.headers && (e.headers['X-Forwarded-For'] || e.headers['x-forwarded-for'])) || 'default_ip';
      const cacheKey = 'login_attempts_' + username.toLowerCase();
      const cache = CacheService.getScriptCache();

      // Pemeriksaan Proteksi Brute-Force (Maksimal 5x gagal dalam 5 menit)
      let failedAttempts = Number(cache.get(cacheKey) || 0);
      if (failedAttempts >= 5) {
        throw new Error('Terlalu banyak percobaan login gagal. Demi keamanan akun, silakan tunggu 1 menit sebelum mencoba lagi.');
      }

      if (!username || !password) {
        throw new Error('Username dan PIN/Password wajib diisi!');
      }

      const users = getSheetDataAsObjects(ss, SHEET_USERS);
      const user = users.find(u => 
        String(u.username).toLowerCase() === username.toLowerCase() || 
        String(u.pin) === password
      );

      if (!user) {
        cache.put(cacheKey, String(failedAttempts + 1), 300); // Simpan percobaan gagal selama 300 detik
        throw new Error('Akun pengguna tidak ditemukan.');
      }

      if (user.status !== 'active') {
        throw new Error('Akun dinonaktifkan oleh administrator.');
      }

      // Verifikasi Password / PIN (dukungan hash SHA-256 dan salt)
      const inputHash = hashSha256(password);
      const isMatch = (user.password_hash === inputHash) || 
                      (user.password_hash === password) || 
                      (String(user.pin) === password);

      if (!isMatch) {
        cache.put(cacheKey, String(failedAttempts + 1), 300);
        throw new Error('PIN atau Password salah!');
      }

      // Reset cache brute force jika login berhasil
      cache.remove(cacheKey);

      // Hapus data kredensial sensitif sebelum dikirim ke client
      const safeUserData = Object.assign({}, user);
      delete safeUserData.password_hash;
      delete safeUserData.pin;

      const sessionToken = 'sess_' + Utilities.getUuid() + '_' + Date.now();

      response.status = 'success';
      response.code = 200;
      response.message = 'Login berhasil. Selamat bertugas!';
      response.data = {
        user: safeUserData,
        token: sessionToken,
        login_time: Date.now()
      };
      return createJsonResponse(response);
    }

    // 5. Action: SAVE_TRANSACTION (Simpan Transaksi Kasir POS)
    if (action === 'save_transaction') {
      const txData = params.transaction;
      if (!txData || !txData.items || !txData.items.length) {
        throw new Error('Data transaksi atau item pesanan tidak boleh kosong.');
      }

      const txSheet = getOrCreateSheet(ss, SHEET_TRANSACTIONS);
      const timestamp = new Date();
      const invoiceNumber = txData.invoice_number || generateInvoiceNumber(ss);

      const newRow = [
        txData.id || ('TX-' + Utilities.getUuid().substring(0, 8).toUpperCase()),
        invoiceNumber,
        Utilities.formatDate(timestamp, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss'),
        txData.cashier_id || 'STF-01',
        txData.cashier_name || 'Kasir Booth',
        txData.branch_code || 'LPR-01',
        JSON.stringify(txData.items),
        Number(txData.total_items || 0),
        Number(txData.subtotal || 0),
        Number(txData.discount || 0),
        Number(txData.total_amount || 0),
        txData.payment_method || 'Tunai',
        Number(txData.cash_received || 0),
        Number(txData.cash_change || 0),
        txData.payment_status || 'PAID',
        txData.notes || ''
      ];

      txSheet.appendRow(newRow);

      response.status = 'success';
      response.code = 200;
      response.message = 'Transaksi berhasil disimpan ke Google Sheets.';
      response.data = {
        invoice_number: invoiceNumber,
        timestamp: newRow[2]
      };
      return createJsonResponse(response);
    }

    // 6. Action: SAVE_SHIFT_CLOSING (Simpan Rekap Tutup Kasir Harian)
    if (action === 'save_shift_closing') {
      const shiftData = params.shift;
      if (!shiftData) {
        throw new Error('Data rekap tutup kasir tidak boleh kosong.');
      }

      const shiftSheet = getOrCreateSheet(ss, SHEET_SHIFTS);
      const timestamp = new Date();
      const shiftId = 'SFT-' + Utilities.formatDate(timestamp, Session.getScriptTimeZone(), 'yyyyMMdd') + '-' + Utilities.getUuid().substring(0, 4).toUpperCase();

      const newRow = [
        shiftId,
        Utilities.formatDate(timestamp, Session.getScriptTimeZone(), 'yyyy-MM-dd'),
        Utilities.formatDate(timestamp, Session.getScriptTimeZone(), 'HH:mm:ss'),
        shiftData.cashier_id || 'STF-01',
        shiftData.cashier_name || 'Kasir Booth',
        shiftData.branch_code || 'LPR-01',
        Number(shiftData.initial_cash || 0),
        Number(shiftData.total_cash_sales || 0),
        Number(shiftData.total_qris_sales || 0),
        Number(shiftData.total_transfer_sales || 0),
        Number(shiftData.total_system_cash || 0),
        Number(shiftData.actual_cash_counted || 0),
        Number(shiftData.cash_difference || 0),
        Number(shiftData.total_transactions || 0),
        shiftData.notes || '',
        Utilities.formatDate(timestamp, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss')
      ];

      shiftSheet.appendRow(newRow);

      response.status = 'success';
      response.code = 200;
      response.message = 'Laporan tutup shift kasir berhasil direkam.';
      response.data = { shift_id: shiftId };
      return createJsonResponse(response);
    }

    // 7. Action: SAVE_PRODUCT (Tambah atau Edit Menu Produk via CMS)
    if (action === 'save_product') {
      const product = params.product;
      if (!product || !product.name || !product.price) {
        throw new Error('Nama produk dan harga wajib disertakan.');
      }

      const prodSheet = getOrCreateSheet(ss, SHEET_PRODUCTS);
      const data = prodSheet.getDataRange().getValues();
      const headers = data[0];
      const idColIdx = headers.indexOf('id');

      let rowIndexToUpdate = -1;
      const targetId = product.id;

      if (targetId) {
        for (let i = 1; i < data.length; i++) {
          if (String(data[i][idColIdx]) === String(targetId)) {
            rowIndexToUpdate = i + 1; // 1-based index di Google Sheets
            break;
          }
        }
      }

      const rowValues = [
        targetId || ('PROD-' + Utilities.getUuid().substring(0, 6).toUpperCase()),
        product.code || ('TP-' + Math.floor(100 + Math.random() * 900)),
        product.name,
        product.category || 'Teh Original',
        Number(product.price),
        Number(product.cost_price || 0),
        product.is_active !== undefined ? product.is_active : true,
        product.image_url || '',
        Number(product.sort_order || 99)
      ];

      if (rowIndexToUpdate > 0) {
        prodSheet.getRange(rowIndexToUpdate, 1, 1, rowValues.length).setValues([rowValues]);
      } else {
        prodSheet.appendRow(rowValues);
      }

      response.status = 'success';
      response.code = 200;
      response.message = 'Data produk berhasil disimpan.';
      response.data = { product: product };
      return createJsonResponse(response);
    }

    // 8. Action: DELETE_PRODUCT (Nonaktifkan / Hapus Menu)
    if (action === 'delete_product') {
      const productId = params.id;
      const prodSheet = getOrCreateSheet(ss, SHEET_PRODUCTS);
      const data = prodSheet.getDataRange().getValues();
      const idColIdx = data[0].indexOf('id');

      for (let i = 1; i < data.length; i++) {
        if (String(data[i][idColIdx]) === String(productId)) {
          prodSheet.deleteRow(i + 1);
          break;
        }
      }

      response.status = 'success';
      response.code = 200;
      response.message = 'Produk berhasil dihapus.';
      return createJsonResponse(response);
    }

    // 9. Action: SAVE_SETTINGS (Simpan Konfigurasi Brand & Appearance CMS)
    if (action === 'save_settings') {
      const newSettings = params.settings;
      if (!newSettings || typeof newSettings !== 'object') {
        throw new Error('Data pengaturan tidak valid.');
      }

      const setSheet = getOrCreateSheet(ss, SHEET_SETTINGS);
      const data = setSheet.getDataRange().getValues();
      const keyColIdx = data[0].indexOf('key');
      const valColIdx = data[0].indexOf('value');
      const updatedColIdx = data[0].indexOf('updated_at');

      const existingKeys = {};
      for (let i = 1; i < data.length; i++) {
        const k = String(data[i][keyColIdx]);
        existingKeys[k] = i + 1; // 1-based index baris
      }

      const nowStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');

      for (let key in newSettings) {
        const val = String(newSettings[key]);
        if (existingKeys[key]) {
          const row = existingKeys[key];
          setSheet.getRange(row, valColIdx + 1).setValue(val);
          if (updatedColIdx >= 0) setSheet.getRange(row, updatedColIdx + 1).setValue(nowStr);
        } else {
          setSheet.appendRow([key, val, 'Konfigurasi Aplikasi', nowStr]);
        }
      }

      response.status = 'success';
      response.code = 200;
      response.message = 'Pengaturan Brand & CMS berhasil diperbarui.';
      return createJsonResponse(response);
    }

    throw new Error('Aksi tidak dikenali: ' + action);

  } catch (error) {
    response.status = 'error';
    response.code = 500;
    response.message = error.message || 'Terjadi kesalahan pada server Google Apps Script';
    return createJsonResponse(response);
  }
}

/**
 * Helper Membuat HTTP Response JSON dengan Header CORS
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Helper Hash SHA-256 untuk Keamanan Password / PIN
 */
function hashSha256(rawString) {
  const rawBytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, rawString, Utilities.Charset.UTF_8);
  let hexString = '';
  for (let i = 0; i < rawBytes.length; i++) {
    let byteVal = rawBytes[i];
    if (byteVal < 0) byteVal += 256;
    let byteHex = byteVal.toString(16);
    if (byteHex.length === 1) byteHex = '0' + byteHex;
    hexString += byteHex;
  }
  return hexString;
}

/**
 * Helper Ambil / Buat Sheet Baru jika belum ada
 */
function getOrCreateSheet(ss, sheetName) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  return sheet;
}

/**
 * Helper Membaca data baris sheet menjadi Array of Objects
 */
function getSheetDataAsObjects(ss, sheetName, excludeFields) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const range = sheet.getDataRange();
  const values = range.getValues();
  if (values.length <= 1) return [];

  const headers = values[0];
  const results = [];
  const excludes = excludeFields || [];

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const obj = {};
    let hasData = false;
    for (let j = 0; j < headers.length; j++) {
      const header = headers[j];
      if (header && excludes.indexOf(header) === -1) {
        obj[header] = row[j];
        if (row[j] !== '' && row[j] !== null) hasData = true;
      }
    }
    if (hasData) results.push(obj);
  }
  return results;
}

/**
 * Helper Mengambil transaksi terbaru
 */
function getRecentTransactions(ss, limit) {
  const sheet = ss.getSheetByName(SHEET_TRANSACTIONS);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data[0];
  const items = [];
  const totalRows = data.length;
  const startRow = Math.max(1, totalRows - (limit || 50));

  for (let i = totalRows - 1; i >= startRow; i--) {
    const row = data[i];
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
    }
    items.push(obj);
  }
  return items;
}

/**
 * Helper Generate Nomor Faktur Otomatis: INV-LPR-YYYYMMDD-XXXX
 */
function generateInvoiceNumber(ss) {
  const sheet = ss.getSheetByName(SHEET_TRANSACTIONS);
  const now = new Date();
  const dateStr = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyyMMdd');
  const count = sheet ? Math.max(1, sheet.getLastRow()) : 1;
  const seq = ('000' + count).slice(-4);
  return 'INV-LPR-' + dateStr + '-' + seq;
}

/**
 * INISIALISASI & SEEDING OTOMATIS SELURUH TAB DATABASE GOOGLE SPREADSHEET
 */
function initializeDatabaseSheets(ss) {
  // 1. Sheet Users
  const userSheet = getOrCreateSheet(ss, SHEET_USERS);
  if (userSheet.getLastRow() === 0) {
    userSheet.appendRow(['id', 'username', 'pin', 'password_hash', 'full_name', 'role', 'branch_code', 'status', 'created_at']);
    // Seed default admin & staff
    userSheet.appendRow([
      'USR-001',
      'admin',
      '9999',
      hashSha256('admin123'),
      'Pak Faik (Owner / Administrator)',
      'admin',
      'LPR-01',
      'active',
      new Date().toISOString()
    ]);
    userSheet.appendRow([
      'USR-002',
      'riza',
      '1234',
      hashSha256('1234'),
      'Pak Riza Lahmadi (Staf Booth)',
      'cashier',
      'LPR-01',
      'active',
      new Date().toISOString()
    ]);
  }

  // 2. Sheet Products
  const prodSheet = getOrCreateSheet(ss, SHEET_PRODUCTS);
  if (prodSheet.getLastRow() === 0) {
    prodSheet.appendRow(['id', 'code', 'name', 'category', 'price', 'cost_price', 'is_active', 'image_url', 'sort_order']);
    
    // Seed 17 Menu Spesifik Teh Poci Sesuai Lampiran
    const defaultProducts = [
      ['PROD-001', 'TP-01', 'Jasmine Tea Kecil', 'Teh Melati', 3000, 1500, true, 'assets/img/menu/jasmine-kecil.svg', 1],
      ['PROD-002', 'TP-02', 'Jasmine Poci Iced Tea', 'Teh Melati', 4000, 2000, true, 'assets/img/menu/jasmine-poci.svg', 2],
      ['PROD-003', 'TP-03', 'Apple Iced Tea', 'Fruit Tea', 6000, 3000, true, 'assets/img/menu/apple-tea.svg', 3],
      ['PROD-004', 'TP-04', 'Orange Iced Tea', 'Fruit Tea', 6000, 3000, true, 'assets/img/menu/orange-tea.svg', 4],
      ['PROD-005', 'TP-05', 'Lemon Honey Iced Tea', 'Fruit Tea', 6000, 3000, true, 'assets/img/menu/lemon-honey.svg', 5],
      ['PROD-006', 'TP-06', 'Mango Iced Tea', 'Fruit Tea', 6000, 3000, true, 'assets/img/menu/mango-tea.svg', 6],
      ['PROD-007', 'TP-07', 'Blackcurrant Iced Tea', 'Fruit Tea', 6000, 3000, true, 'assets/img/menu/blackcurrant-tea.svg', 7],
      ['PROD-008', 'TP-08', 'Lychee Iced Tea', 'Fruit Tea', 6000, 3000, true, 'assets/img/menu/lychee-tea.svg', 8],
      ['PROD-009', 'TP-09', 'Guava Iced Tea', 'Fruit Tea', 6000, 3000, true, 'assets/img/menu/guava-tea.svg', 9],
      ['PROD-010', 'TP-10', 'Markisa/Menu Baru', 'Spesial', 7000, 3500, true, 'assets/img/menu/markisa-tea.svg', 10],
      ['PROD-011', 'TP-11', 'Thai Iced Tea', 'Milk & Creamy', 9000, 4500, true, 'assets/img/menu/thai-tea.svg', 11],
      ['PROD-012', 'TP-12', 'Chocolatos', 'Milk & Creamy', 9000, 4500, true, 'assets/img/menu/chocolatos.svg', 12],
      ['PROD-013', 'TP-13', 'Green Tea', 'Milk & Creamy', 9000, 4500, true, 'assets/img/menu/green-tea.svg', 13],
      ['PROD-014', 'TP-14', 'Cappuccino Iced Tea', 'Coffee Mix', 8000, 4000, true, 'assets/img/menu/cappuccino-tea.svg', 14],
      ['PROD-015', 'TP-15', 'Chocolate Iced Tea', 'Milk & Creamy', 8000, 4000, true, 'assets/img/menu/chocolate-tea.svg', 15],
      ['PROD-016', 'TP-16', 'Milo', 'Milk & Creamy', 9000, 4500, true, 'assets/img/menu/milo.svg', 16],
      ['PROD-017', 'TP-17', 'Beng-Beng', 'Milk & Creamy', 9000, 4500, true, 'assets/img/menu/beng-beng.svg', 17]
    ];

    defaultProducts.forEach(row => prodSheet.appendRow(row));
  }

  // 3. Sheet Transactions
  const txSheet = getOrCreateSheet(ss, SHEET_TRANSACTIONS);
  if (txSheet.getLastRow() === 0) {
    txSheet.appendRow([
      'id', 'invoice_number', 'timestamp', 'cashier_id', 'cashier_name', 'branch_code',
      'items_json', 'total_items', 'subtotal', 'discount', 'total_amount',
      'payment_method', 'cash_received', 'cash_change', 'payment_status', 'notes'
    ]);
  }

  // 4. Sheet Shift Closings
  const shiftSheet = getOrCreateSheet(ss, SHEET_SHIFTS);
  if (shiftSheet.getLastRow() === 0) {
    shiftSheet.appendRow([
      'id', 'shift_date', 'shift_time', 'cashier_id', 'cashier_name', 'branch_code',
      'initial_cash', 'total_cash_sales', 'total_qris_sales', 'total_transfer_sales',
      'total_system_cash', 'actual_cash_counted', 'cash_difference',
      'total_transactions', 'notes', 'created_at'
    ]);
  }

  // 5. Sheet App Settings / Appearance (CMS)
  const setSheet = getOrCreateSheet(ss, SHEET_SETTINGS);
  if (setSheet.getLastRow() === 0) {
    setSheet.appendRow(['key', 'value', 'description', 'updated_at']);

    const defaultSettings = [
      ['brand_name', 'Teh Poci', 'Nama Brand Utama', new Date().toISOString()],
      ['branch_name', 'Booth Cabang Limus Pratama Regensi — Depan PG-TK Al-Imam', 'Nama Cabang Booth', new Date().toISOString()],
      ['branch_code', 'LPR-01', 'Kode Cabang', new Date().toISOString()],
      ['owner_name', 'Pak Faik', 'Pemilik / Penanggung Jawab', new Date().toISOString()],
      ['address', 'Jl. Limus Pratama Regensi, Depan PG-TK Al-Imam, Cileungsi, Bogor', 'Alamat Lengkap Booth', new Date().toISOString()],
      ['phone', '0812-9876-5432', 'Nomor Kontak / WhatsApp', new Date().toISOString()],
      ['operating_hours', '09:00 - 21:00 WIB', 'Jam Operasional Harian', new Date().toISOString()],
      ['receipt_footer', 'Terima Kasih Atas Kunjungan Anda! Teh Poci Asli Segar & Nikmat.', 'Catatan Kaki Struk', new Date().toISOString()],
      ['primary_color', '#146C36', 'Warna Utama Brand (Hijau Poci)', new Date().toISOString()],
      ['accent_color', '#55A630', 'Warna Sekunder / Aksen Daun', new Date().toISOString()],
      ['poci_red', '#D9232E', 'Warna Merah Poci', new Date().toISOString()],
      ['bright_yellow', '#FFD600', 'Warna Kuning Badge', new Date().toISOString()],
      ['theme_card_style', 'rounded-2xl', 'Gaya Sudut Kartu (rounded-2xl / rounded-lg / rounded-none)', new Date().toISOString()],
      ['theme_density', 'comfortable', 'Kerapatan Grid POS (comfortable / compact)', new Date().toISOString()],
      ['show_images_in_pos', 'true', 'Tampilkan Gambar Menu di POS (true/false)', new Date().toISOString()],
      ['license_client_name', 'Pak Faik - Mitra Teh Poci', 'Nama Mitra Pemegang Lisensi', new Date().toISOString()],
      ['license_status', 'ACTIVE', 'Status Lisensi Aplikasi', new Date().toISOString()],
      ['qris_image_url', '', 'URL Gambar QRIS Booth untuk Pembayaran', new Date().toISOString()]
    ];

    defaultSettings.forEach(row => setSheet.appendRow(row));
  }

  return {
    sheetsCreated: [SHEET_USERS, SHEET_PRODUCTS, SHEET_TRANSACTIONS, SHEET_SHIFTS, SHEET_SETTINGS],
    status: 'Ready'
  };
}
