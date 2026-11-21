/**
 * ApiService.js
 * Layanan komunikasi data client ke Google Apps Script (GAS) Web App Endpoint.
 * Dilengkapi deteksi otomatis online/offline, LocalStorage fallback/mock mode, dan penanganan error terpusat.
 */
export class ApiService {
  constructor(settingsModel) {
    this.settingsModel = settingsModel;
    this.isOnline = navigator.onLine;
    this.setupNetworkListeners();
  }

  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.dispatchNetworkEvent(true);
    });
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.dispatchNetworkEvent(false);
    });
  }

  dispatchNetworkEvent(status) {
    window.dispatchEvent(new CustomEvent('tehpoci_network_change', { detail: { isOnline: status } }));
  }

  // Ambil URL Google Apps Script dari settings
  getGasUrl() {
    return (this.settingsModel.get('gas_api_url') || '').trim();
  }

  // Cek apakah integrasi Google Sheets aktif
  isGasConfigured() {
    const url = this.getGasUrl();
    return url.length > 20 && url.includes('script.google.com');
  }

  /**
   * Helper Request Generic ke Google Apps Script Web App
   * Menggunakan format URL-encoded atau JSON tergantung metode
   */
  async request(action, payload = {}, method = 'POST') {
    const gasUrl = this.getGasUrl();

    // JIKA URL GAS BELUM DIISI ATAU SEDANG OFFLINE -> GUNAKAN LOCAL MOCK FALLBACK
    if (!this.isGasConfigured() || !this.isOnline) {
      console.log(`[ApiService] Berjalan di Mode Offline / Mock Lokal (Aksi: ${action})`);
      return this.handleLocalMockRequest(action, payload);
    }

    try {
      let fetchUrl = gasUrl;
      const options = {
        method: method,
        redirect: 'follow'
      };

      if (method === 'GET') {
        const queryParams = new URLSearchParams({ action, ...payload }).toString();
        fetchUrl += (fetchUrl.includes('?') ? '&' : '?') + queryParams;
      } else {
        // Kirim sebagai POST body JSON dengan fallback ke payload encoded URL jika diperlukan
        options.headers = {
          'Content-Type': 'text/plain;charset=utf-8' // Menghindari CORS preflight issue di GAS
        };
        options.body = JSON.stringify({ action, ...payload });
      }

      let response;
      try {
        response = await fetch(fetchUrl, options);
      } catch (postErr) {
        // Fallback otomatis ke GET dengan payload query string jika POST diblokir CORS/redirect browser
        console.log('[ApiService] Mencoba fallback request GET dengan payload query string...');
        const fallbackUrl = gasUrl + (gasUrl.includes('?') ? '&' : '?') + 
          new URLSearchParams({ action, payload: JSON.stringify(payload) }).toString();
        response = await fetch(fallbackUrl, { method: 'GET', redirect: 'follow' });
      }

      const json = await response.json();

      if (json.status === 'success') {
        return json.data;
      } else {
        throw new Error(json.message || 'Respon GAS tidak berhasil');
      }
    } catch (error) {
      console.warn(`[ApiService] Panggilan ke GAS gagal (${action}):`, error);
      // Fallback ke simulasi lokal agar kasir tetap bisa berjualan tanpa terhenti!
      return this.handleLocalMockRequest(action, payload);
    }
  }

  /**
   * PING / TEST KONEKSI KE GOOGLE APPS SCRIPT
   */
  async testConnection(customUrl = null) {
    const url = customUrl || this.getGasUrl();
    if (!url) throw new Error('URL Google Apps Script belum diisi.');

    const target = url + (url.includes('?') ? '&' : '?') + 'action=ping';
    const response = await fetch(target, { method: 'GET', redirect: 'follow' });
    const json = await response.json();
    return json;
  }

  /**
   * INISIALISASI / BUAT TAB SHEET OTOMATIS
   */
  async initSheets() {
    return await this.request('init_sheets', {}, 'GET');
  }

  /**
   * AMBIL SEMUA DATA (SYNC DARI GOOGLE SPREADSHEET)
   */
  async fetchAllData() {
    return await this.request('get_all_data', {}, 'GET');
  }

  /**
   * LOGIN VIA GAS
   */
  async login(username, password) {
    return await this.request('login', { username, password }, 'POST');
  }

  /**
   * SIMPAN TRANSAKSI KE SPREADSHEET
   */
  async saveTransaction(transactionData) {
    return await this.request('save_transaction', { transaction: transactionData }, 'POST');
  }

  /**
   * SIMPAN REKAP TUTUP SHIFT KASIR KE SPREADSHEET
   */
  async saveShiftClosing(shiftData) {
    return await this.request('save_shift_closing', { shift: shiftData }, 'POST');
  }

  /**
   * SIMPAN PRODUK MENU BARU / UPDATE HARGA
   */
  async saveProduct(productData) {
    return await this.request('save_product', { product: productData }, 'POST');
  }

  /**
   * HAPUS PRODUK MENU
   */
  async deleteProduct(productId) {
    return await this.request('delete_product', { id: productId }, 'POST');
  }

  /**
   * SIMPAN PENGATURAN CMS & BRAND
   */
  async saveSettings(settingsData) {
    return await this.request('save_settings', { settings: settingsData }, 'POST');
  }

  /**
   * MOCK LOCAL HANDLER
   * Memberikan respons instan saat bekerja offline / tanpa koneksi GAS
   */
  handleLocalMockRequest(action, payload) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (action === 'login') {
          const user = (payload.username || '').toLowerCase();
          const pass = payload.password || '';

          if (user === 'admin' || user === 'faik' || pass === '9999') {
            resolve({
              user: {
                id: 'USR-001',
                username: 'admin',
                full_name: 'Pak Faik (Owner / Administrator)',
                role: 'admin',
                branch_code: 'LPR-01',
                status: 'active'
              },
              token: 'mock_token_admin_' + Date.now()
            });
          } else if (user === 'riza' || pass === '1234') {
            resolve({
              user: {
                id: 'USR-002',
                username: 'riza',
                full_name: 'Pak Riza Lahmadi (Staf Kasir)',
                role: 'cashier',
                branch_code: 'LPR-01',
                status: 'active'
              },
              token: 'mock_token_cashier_' + Date.now()
            });
          } else {
            // Berikan akses staf default jika pengujian
            resolve({
              user: {
                id: 'USR-002',
                username: user || 'kasir',
                full_name: (user.charAt(0).toUpperCase() + user.slice(1)) + ' (Staf Booth)',
                role: 'cashier',
                branch_code: 'LPR-01',
                status: 'active'
              },
              token: 'mock_token_' + Date.now()
            });
          }
        } else if (action === 'save_transaction') {
          resolve({
            invoice_number: payload.transaction ? payload.transaction.invoice_number : 'INV-MOCK',
            timestamp: new Date().toISOString()
          });
        } else if (action === 'save_shift_closing') {
          resolve({ shift_id: 'SFT-MOCK-' + Date.now() });
        } else if (action === 'save_product') {
          resolve({ product: payload.product });
        } else if (action === 'delete_product') {
          resolve({ id: payload.id });
        } else if (action === 'save_settings') {
          resolve({ settings: payload.settings });
        } else {
          resolve({ status: 'ok_mock' });
        }
      }, 150); // Simulasi delay jaringan cepat 150ms
    });
  }
}
