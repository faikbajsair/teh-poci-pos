/**
 * SettingsModel.js
 * Model untuk White-Label CMS, Identitas Brand, Cabang, Konfigurasi Tema (Appearance),
 * dan Lisensi Multi-Tenant Booth Konvensional.
 */
export class SettingsModel {
  constructor() {
    this.settings = {};
    this.loadSettings();
  }

  loadSettings() {
    try {
      const stored = localStorage.getItem('tehpoci_settings');
      if (stored) {
        this.settings = JSON.parse(stored);
      } else {
        this.settings = this.getDefaultSettings();
        this.saveSettings();
      }
    } catch (e) {
      console.warn('Gagal membaca pengaturan:', e);
      this.settings = this.getDefaultSettings();
    }
  }

  saveSettings() {
    localStorage.setItem('tehpoci_settings', JSON.stringify(this.settings));
    this.applyThemeToDOM();
  }

  getDefaultSettings() {
    return {
      // 1. Identitas Brand & Cabang
      brand_name: 'Teh Poci',
      branch_name: 'Teh Poci — Cabang Limus Pratama Regensi',
      branch_subtitle: 'Depan PG-TK Al-Imam, Cileungsi, Kab. Bogor',
      branch_code: 'LPR-01',
      owner_name: 'Pak Faik',
      address: 'Jl. Limus Pratama Regensi (Depan PG-TK Al-Imam), Cileungsi, Bogor, Jawa Barat',
      phone: '0812-9876-5432',
      operating_hours: '09:00 - 21:00 WIB',
      receipt_footer: 'Terima Kasih Atas Kunjungan Anda! Teh Poci Asli Segar & Nikmat.',
      logo_url: 'assets/img/logo-teh-poci.svg',

      // 2. Identitas Visual & Tema (Appearance Customizer)
      primary_color: '#146C36',      // Hijau Tua Khas Poci
      accent_color: '#55A630',       // Hijau Daun Segar
      poci_red: '#D9232E',           // Merah Poci Logo
      bright_yellow: '#FFD600',      // Kuning Cerah Highlight
      theme_card_style: 'rounded-2xl', // 'rounded-2xl' | 'rounded-lg' | 'rounded-none'
      theme_density: 'comfortable',    // 'comfortable' | 'compact'
      show_images_in_pos: true,        // Toggle gambar produk di POS
      compact_receipt: false,

      // 3. Konfigurasi Backend & Google Sheets API
      gas_api_url: '', // URL Google Apps Script Web App (diisi oleh pengguna / owner)
      offline_demo_mode: false, // Jika true atau GAS kosong, gunakan data mock lokal

      // 4. Lisensi / Profil Klien Multi-Tenant
      client_name: 'Pak Faik - Mitra Teh Poci',
      license_status: 'ACTIVE',
      license_key: 'POCI-LPR-PRO-2026',
      qris_image_url: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=00020101021126570014ID.LINKAJA.WWW011893600914000000000002150000000000000000303UME51440014ID.CO.QRIS.WWW0215ID10200000000005204581253033605802ID5923TEH%20POCI%20LIMUS%20PRATAMA6005BOGOR61051682062070703A016304E627'
    };
  }

  get(key, defaultValue = '') {
    return this.settings[key] !== undefined ? this.settings[key] : defaultValue;
  }

  set(key, value) {
    this.settings[key] = value;
    this.saveSettings();
  }

  updateMultiple(newSettingsObj) {
    this.settings = { ...this.settings, ...newSettingsObj };
    this.saveSettings();
  }

  /**
   * Terapkan variabel warna & style ke Root Document CSS secara dinamis
   */
  applyThemeToDOM() {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', this.get('primary_color', '#146C36'));
    root.style.setProperty('--color-accent', this.get('accent_color', '#55A630'));
    root.style.setProperty('--color-poci-red', this.get('poci_red', '#D9232E'));
    root.style.setProperty('--color-bright-yellow', this.get('bright_yellow', '#FFD600'));
    
    // Set Document Title
    document.title = `${this.get('brand_name', 'Teh Poci')} — ${this.get('branch_name', 'Cabang Limus Pratama')}`;
  }
}
