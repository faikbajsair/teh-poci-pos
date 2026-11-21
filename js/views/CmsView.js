/**
 * CmsView.js
 * Dashboard Pemilik/Admin (Pak Faik) & CMS Customizer (White-Label / Multi-Tenant Ready):
 * Analisis Omzet & Produk Terlaris, Manajemen Brand/Cabang, Tema Warna (Appearance),
 * Katalog Menu & Harga Minuman, serta Integrasi Google Spreadsheet.
 */
export class CmsView {
  constructor(cmsController, settingsModel, productModel, userModel, apiService, navigateFn) {
    this.cms = cmsController;
    this.settings = settingsModel;
    this.products = productModel;
    this.user = userModel;
    this.api = apiService;
    this.navigate = navigateFn;

    this.activeTab = 'dashboard'; // 'dashboard' | 'brand' | 'appearance' | 'menu' | 'sheets'
    this.editingProduct = null;
  }

  formatRp(amount) {
    return 'Rp ' + Number(amount || 0).toLocaleString('id-ID');
  }

  render(container) {
    const brandName = this.settings.get('brand_name', 'Teh Poci');
    const branchName = this.settings.get('branch_name', 'Cabang Limus Pratama Regensi');
    const metrics = this.cms.getExecutiveDashboardMetrics();
    const isGasActive = this.api.isGasConfigured();

    container.innerHTML = `
      <div id="cms-root" class="min-h-screen bg-slate-50 flex flex-col pb-12">
        
        <!-- Header Admin -->
        <header class="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
          <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <button id="btn-back-to-pos" class="p-2 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 font-bold text-xs flex items-center gap-1 transition">
                <span>←</span>
                <span>Kembali ke POS</span>
              </button>
              <div>
                <h1 class="text-base font-black text-slate-900 flex items-center gap-2">
                  <span>Dashboard Pemilik & CMS</span>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">ADMIN</span>
                </h1>
                <p class="text-xs text-slate-500">${brandName} — ${branchName}</p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <div class="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${isGasActive ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}">
                <span class="w-2 h-2 rounded-full ${isGasActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}"></span>
                <span>${isGasActive ? 'Google Sheets Terhubung' : 'Demo Mode'}</span>
              </div>
            </div>
          </div>

          <!-- TAB NAVIGATION BAR -->
          <div class="max-w-7xl mx-auto px-4 flex items-center gap-1 overflow-x-auto border-t border-slate-100 text-xs font-bold text-slate-600 no-scrollbar">
            <button class="cms-tab-btn py-3 px-3.5 border-b-2 whitespace-nowrap transition flex items-center gap-1.5 ${this.activeTab === 'dashboard' ? 'border-emerald-600 text-emerald-800 font-black' : 'border-transparent hover:text-slate-900'}" data-tab="dashboard">
              <span>📊</span>
              <span>Ringkasan Omzet</span>
            </button>
            <button class="cms-tab-btn py-3 px-3.5 border-b-2 whitespace-nowrap transition flex items-center gap-1.5 ${this.activeTab === 'brand' ? 'border-emerald-600 text-emerald-800 font-black' : 'border-transparent hover:text-slate-900'}" data-tab="brand">
              <span>🏪</span>
              <span>Identitas Brand & Cabang</span>
            </button>
            <button class="cms-tab-btn py-3 px-3.5 border-b-2 whitespace-nowrap transition flex items-center gap-1.5 ${this.activeTab === 'appearance' ? 'border-emerald-600 text-emerald-800 font-black' : 'border-transparent hover:text-slate-900'}" data-tab="appearance">
              <span>🎨</span>
              <span>Tema & Tampilan (Appearance)</span>
            </button>
            <button class="cms-tab-btn py-3 px-3.5 border-b-2 whitespace-nowrap transition flex items-center gap-1.5 ${this.activeTab === 'menu' ? 'border-emerald-600 text-emerald-800 font-black' : 'border-transparent hover:text-slate-900'}" data-tab="menu">
              <span>🫖</span>
              <span>Katalog Menu & Harga</span>
            </button>
            <button class="cms-tab-btn py-3 px-3.5 border-b-2 whitespace-nowrap transition flex items-center gap-1.5 ${this.activeTab === 'sheets' ? 'border-emerald-600 text-emerald-800 font-black' : 'border-transparent hover:text-slate-900'}" data-tab="sheets">
              <span>🔗</span>
              <span>Integrasi Spreadsheet & Lisensi</span>
            </button>
          </div>
        </header>

        <!-- MAIN CONTAINER PER TAB -->
        <main class="max-w-7xl mx-auto w-full px-4 py-6 flex-1">
          ${this.renderActiveTabContent(metrics)}
        </main>

        <!-- MODAL TAMBAH / EDIT PRODUK -->
        <div id="modal-edit-product" class="hidden fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl">
            <h3 class="font-black text-slate-900 text-base mb-3" id="modal-product-title">Edit Menu Minuman</h3>
            <form id="form-product-edit" class="space-y-3 text-xs">
              <input type="hidden" id="prod-edit-id">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Nama Menu Minuman</label>
                <input type="text" id="prod-edit-name" required class="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold outline-none focus:border-emerald-500">
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Kategori</label>
                  <select id="prod-edit-category" class="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold outline-none focus:border-emerald-500">
                    <option value="Teh Melati">Teh Melati</option>
                    <option value="Fruit Tea">Fruit Tea</option>
                    <option value="Milk & Creamy">Milk & Creamy</option>
                    <option value="Coffee Mix">Coffee Mix</option>
                    <option value="Spesial">Spesial</option>
                  </select>
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Kode Menu</label>
                  <input type="text" id="prod-edit-code" placeholder="TP-01" class="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-emerald-500">
                </div>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Harga Jual (Rp)</label>
                  <input type="number" id="prod-edit-price" required class="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-emerald-800 outline-none focus:border-emerald-500">
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Harga Modal / HPP (Rp)</label>
                  <input type="number" id="prod-edit-cost" class="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-emerald-500">
                </div>
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Path Gambar / URL Slicing</label>
                <input type="text" id="prod-edit-image" placeholder="assets/img/menu/jasmine-poci.svg" class="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-emerald-500">
              </div>
              <div class="flex items-center gap-2 pt-1">
                <input type="checkbox" id="prod-edit-active" checked class="w-4 h-4 rounded text-emerald-600">
                <label for="prod-edit-active" class="font-bold text-slate-700">Tersedia untuk Dijual (Aktif)</label>
              </div>
              <div class="flex gap-2 pt-3 border-t border-slate-100">
                <button type="button" id="btn-cancel-product-modal" class="flex-1 py-2.5 rounded-xl bg-slate-100 font-bold text-slate-600">Batal</button>
                <button type="submit" class="flex-1 py-2.5 rounded-xl bg-emerald-700 text-white font-bold shadow-md">Simpan Menu</button>
              </div>
            </form>
          </div>
        </div>

      </div>
    `;

    this.bindEvents(container, metrics);
  }

  renderActiveTabContent(metrics) {
    if (this.activeTab === 'dashboard') {
      return this.renderDashboardTab(metrics);
    } else if (this.activeTab === 'brand') {
      return this.renderBrandTab();
    } else if (this.activeTab === 'appearance') {
      return this.renderAppearanceTab();
    } else if (this.activeTab === 'menu') {
      return this.renderMenuTab();
    } else if (this.activeTab === 'sheets') {
      return this.renderSheetsTab();
    }
  }

  // TAB 1: EXECUTIVE DASHBOARD
  renderDashboardTab(metrics) {
    return `
      <div class="space-y-6">
        <!-- KPI CARDS -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Omzet Penjualan Hari Ini</span>
            <div class="text-xl sm:text-2xl font-black text-emerald-800 mt-1">${this.formatRp(metrics.todayRevenue)}</div>
            <p class="text-[11px] text-emerald-600 font-semibold mt-1">✓ Berdasarkan ${metrics.todayTxCount} Transaksi</p>
          </div>
          <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Cup Terjual Hari Ini</span>
            <div class="text-xl sm:text-2xl font-black text-slate-800 mt-1">${metrics.todayCups} Cup</div>
            <p class="text-[11px] text-slate-500 font-medium mt-1">Porsi Minuman Teh Poci</p>
          </div>
          <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Rata-rata Nilai Keranjang</span>
            <div class="text-xl sm:text-2xl font-black text-slate-800 mt-1">${this.formatRp(metrics.avgBasket)}</div>
            <p class="text-[11px] text-slate-500 font-medium mt-1">Per Nota Pembelian</p>
          </div>
          <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Transaksi Tersimpan</span>
            <div class="text-xl sm:text-2xl font-black text-slate-800 mt-1">${metrics.allTimeTxCount} Trx</div>
            <p class="text-[11px] text-slate-500 font-medium mt-1">Di Database Kasir</p>
          </div>
        </div>

        <!-- BREAKDOWN METODE PEMBAYARAN & PRODUK TERLARIS -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <!-- Box Metode Pembayaran -->
          <div class="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs">
            <h3 class="font-black text-slate-900 text-sm mb-4">Komposisi Metode Pembayaran (Hari Ini)</h3>
            <div class="space-y-3 text-xs">
              <div>
                <div class="flex justify-between font-bold mb-1">
                  <span>💵 Uang Tunai</span>
                  <span class="text-emerald-800">${this.formatRp(metrics.paymentBreakdown.Tunai)}</span>
                </div>
                <div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div class="bg-emerald-600 h-full rounded-full" style="width: ${metrics.todayRevenue > 0 ? (metrics.paymentBreakdown.Tunai / metrics.todayRevenue * 100) : 0}%"></div>
                </div>
              </div>

              <div>
                <div class="flex justify-between font-bold mb-1">
                  <span>📱 QRIS Standar</span>
                  <span class="text-sky-800">${this.formatRp(metrics.paymentBreakdown.QRIS)}</span>
                </div>
                <div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div class="bg-sky-600 h-full rounded-full" style="width: ${metrics.todayRevenue > 0 ? (metrics.paymentBreakdown.QRIS / metrics.todayRevenue * 100) : 0}%"></div>
                </div>
              </div>

              <div>
                <div class="flex justify-between font-bold mb-1">
                  <span>🏦 Transfer Bank</span>
                  <span class="text-purple-800">${this.formatRp(metrics.paymentBreakdown.Transfer)}</span>
                </div>
                <div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div class="bg-purple-600 h-full rounded-full" style="width: ${metrics.todayRevenue > 0 ? (metrics.paymentBreakdown.Transfer / metrics.todayRevenue * 100) : 0}%"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Top 5 Produk Terlaris -->
          <div class="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs">
            <h3 class="font-black text-slate-900 text-sm mb-4">5 Varian Teh Poci Terlaris (Hari Ini)</h3>
            <div class="space-y-2 text-xs">
              ${metrics.topProducts.length === 0 ? `
                <p class="text-slate-400 py-6 text-center">Belum ada transaksi minuman hari ini.</p>
              ` : metrics.topProducts.map((p, idx) => `
                <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div class="flex items-center gap-2">
                    <span class="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center">${idx + 1}</span>
                    <span class="font-bold text-slate-800">${p.name}</span>
                  </div>
                  <span class="font-black text-emerald-900 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-100">${p.qty} Cup</span>
                </div>
              `).join('')}
            </div>
          </div>

        </div>
      </div>
    `;
  }

  // TAB 2: BRAND & CABANG SETTINGS
  renderBrandTab() {
    return `
      <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs max-w-3xl space-y-4">
        <div>
          <h3 class="font-black text-slate-900 text-base">Identitas Brand & Booth Outlet</h3>
          <p class="text-xs text-slate-500">Konfigurasi informasi cabang yang tampil pada layar POS, struk kasir, dan laporan.</p>
        </div>

        <form id="form-brand-settings" class="space-y-4 text-xs">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Nama Brand Utama</label>
              <input type="text" id="set-brand-name" value="${this.settings.get('brand_name')}" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-bold outline-none focus:border-emerald-600">
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Kode Cabang</label>
              <input type="text" id="set-branch-code" value="${this.settings.get('branch_code')}" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-bold outline-none focus:border-emerald-600">
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Nama Cabang Lengkap</label>
            <input type="text" id="set-branch-name" value="${this.settings.get('branch_name')}" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-bold outline-none focus:border-emerald-600">
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Subjudul / Patokan Lokasi</label>
            <input type="text" id="set-branch-subtitle" value="${this.settings.get('branch_subtitle')}" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-emerald-600">
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Alamat Lengkap Booth</label>
            <textarea id="set-address" rows="2" class="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-emerald-600">${this.settings.get('address')}</textarea>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Nomor WhatsApp Booth</label>
              <input type="text" id="set-phone" value="${this.settings.get('phone')}" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-emerald-600">
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Jam Operasional Harian</label>
              <input type="text" id="set-hours" value="${this.settings.get('operating_hours')}" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-emerald-600">
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Pesan Kaki Struk (Receipt Footer)</label>
            <input type="text" id="set-receipt-footer" value="${this.settings.get('receipt_footer')}" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-emerald-600">
          </div>

          <div class="pt-3 border-t border-slate-100 flex justify-end">
            <button type="submit" class="py-3 px-6 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs uppercase tracking-wider shadow-md active:scale-95 transition">
              Simpan Identitas Brand
            </button>
          </div>
        </form>
      </div>
    `;
  }

  // TAB 3: APPEARANCE & THEME CUSTOMIZER
  renderAppearanceTab() {
    return `
      <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs max-w-3xl space-y-6">
        <div>
          <h3 class="font-black text-slate-900 text-base">Appearance & Theme Customizer (White-Label)</h3>
          <p class="text-xs text-slate-500">Sesuaikan warna khas brand, gaya kartu produk, dan tata letak POS secara live.</p>
        </div>

        <form id="form-appearance-settings" class="space-y-5 text-xs">
          
          <!-- Palette Warna Khas -->
          <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <p class="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Warna Identitas Khas Brand:</p>
            
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label class="block font-bold text-slate-600 mb-1">Warna Utama (Hijau Poci)</label>
                <div class="flex items-center gap-2">
                  <input type="color" id="theme-primary" value="${this.settings.get('primary_color')}" class="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer">
                  <input type="text" id="theme-primary-hex" value="${this.settings.get('primary_color')}" class="w-20 px-2 py-1 rounded border text-xs font-mono font-bold">
                </div>
              </div>

              <div>
                <label class="block font-bold text-slate-600 mb-1">Aksen Hijau Daun</label>
                <div class="flex items-center gap-2">
                  <input type="color" id="theme-accent" value="${this.settings.get('accent_color')}" class="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer">
                  <input type="text" id="theme-accent-hex" value="${this.settings.get('accent_color')}" class="w-20 px-2 py-1 rounded border text-xs font-mono font-bold">
                </div>
              </div>

              <div>
                <label class="block font-bold text-slate-600 mb-1">Merah Poci (Logo)</label>
                <div class="flex items-center gap-2">
                  <input type="color" id="theme-red" value="${this.settings.get('poci_red')}" class="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer">
                  <input type="text" id="theme-red-hex" value="${this.settings.get('poci_red')}" class="w-20 px-2 py-1 rounded border text-xs font-mono font-bold">
                </div>
              </div>

              <div>
                <label class="block font-bold text-slate-600 mb-1">Kuning Cerah (Badge)</label>
                <div class="flex items-center gap-2">
                  <input type="color" id="theme-yellow" value="${this.settings.get('bright_yellow')}" class="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer">
                  <input type="text" id="theme-yellow-hex" value="${this.settings.get('bright_yellow')}" class="w-20 px-2 py-1 rounded border text-xs font-mono font-bold">
                </div>
              </div>
            </div>
          </div>

          <!-- Gaya Sudut & Kerapatan POS -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Gaya Sudut Kartu Menu</label>
              <select id="theme-card-style" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-bold outline-none">
                <option value="rounded-2xl" ${this.settings.get('theme_card_style') === 'rounded-2xl' ? 'selected' : ''}>Rounded Halus (rounded-2xl) - Default</option>
                <option value="rounded-lg" ${this.settings.get('theme_card_style') === 'rounded-lg' ? 'selected' : ''}>Rounded Sedang (rounded-lg)</option>
                <option value="rounded-none" ${this.settings.get('theme_card_style') === 'rounded-none' ? 'selected' : ''}>Sharp / Tegas (rounded-none)</option>
              </select>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Kerapatan Grid POS</label>
              <select id="theme-density" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-bold outline-none">
                <option value="comfortable" ${this.settings.get('theme_density') === 'comfortable' ? 'selected' : ''}>Comfortable (Nyaman & Lega)</option>
                <option value="compact" ${this.settings.get('theme_density') === 'compact' ? 'selected' : ''}>Compact (Kerapatan Tinggi Layar Kecil)</option>
              </select>
            </div>
          </div>

          <!-- Toggle Gambar POS -->
          <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <input type="checkbox" id="theme-show-images" ${this.settings.get('show_images_in_pos') ? 'checked' : ''} class="w-4 h-4 rounded text-emerald-600">
            <div>
              <label for="theme-show-images" class="font-bold text-slate-800 cursor-pointer">Tampilkan Gambar Varian Cup Minuman di Grid Kasir</label>
              <p class="text-[11px] text-slate-500">Nonaktifkan jika ingin mode kasir teks super ringkas tanpa grafis.</p>
            </div>
          </div>

          <div class="pt-3 border-t border-slate-100 flex justify-end">
            <button type="submit" class="py-3 px-6 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs uppercase tracking-wider shadow-md active:scale-95 transition">
              Terapkan Perubahan Tampilan
            </button>
          </div>
        </form>
      </div>
    `;
  }

  // TAB 4: KATALOG MENU & HARGA (CRUD)
  renderMenuTab() {
    const list = this.products.getAllProducts();

    return `
      <div class="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 class="font-black text-slate-900 text-base">Manajemen Katalog Menu Minuman (17 Varian)</h3>
            <p class="text-xs text-slate-500">Kelola harga jual, harga modal, status ketersediaan stok, dan varian baru.</p>
          </div>
          <button type="button" id="btn-add-new-product" class="py-2 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm flex items-center gap-1.5">
            <span>+ Tambah Menu Baru</span>
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th class="p-3">Gambar</th>
                <th class="p-3">Kode / Nama Minuman</th>
                <th class="p-3">Kategori</th>
                <th class="p-3">Harga Jual</th>
                <th class="p-3">Harga Modal</th>
                <th class="p-3">Status</th>
                <th class="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${list.map(p => `
                <tr class="hover:bg-slate-50 transition">
                  <td class="p-3">
                    <div class="w-10 h-10 rounded-lg bg-emerald-50 p-1 border border-slate-200 flex items-center justify-center">
                      <img src="${p.image_url || 'assets/img/menu/jasmine-poci.svg'}" alt="${p.name}" class="w-full h-full object-contain">
                    </div>
                  </td>
                  <td class="p-3">
                    <span class="font-bold text-slate-900 block">${p.name}</span>
                    <span class="text-[10px] text-slate-400 font-mono">${p.code || '-'}</span>
                  </td>
                  <td class="p-3">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">${p.category}</span>
                  </td>
                  <td class="p-3 font-black text-emerald-800">${this.formatRp(p.price)}</td>
                  <td class="p-3 text-slate-500">${this.formatRp(p.cost_price || 0)}</td>
                  <td class="p-3">
                    <button type="button" class="btn-toggle-active px-2.5 py-1 rounded-full text-[10px] font-bold ${p.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}" data-id="${p.id}">
                      ${p.is_active ? '✓ Tersedia' : '✕ Habis'}
                    </button>
                  </td>
                  <td class="p-3 text-center">
                    <div class="flex items-center justify-center gap-1.5">
                      <button type="button" class="btn-edit-prod p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700" data-id="${p.id}" title="Edit Produk">✏️</button>
                      <button type="button" class="btn-del-prod p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700" data-id="${p.id}" title="Hapus Produk">🗑️</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // TAB 5: GOOGLE APPS SCRIPT & LISENSI
  renderSheetsTab() {
    const isGasConfigured = this.api.isGasConfigured();
    const gasUrl = this.settings.get('gas_api_url');
    const clientName = this.settings.get('license_client_name', 'Pak Faik - Mitra Teh Poci');
    const licenseStatus = this.settings.get('license_status', 'ACTIVE');

    return `
      <div class="space-y-6 max-w-3xl">
        
        <!-- Box Konfigurasi Google Apps Script -->
        <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h3 class="font-black text-slate-900 text-base">Integrasi Google Apps Script (Spreadsheet API)</h3>
            <p class="text-xs text-slate-500">Hubungkan web app POS ini dengan Google Spreadsheet Anda sebagai backend database real-time.</p>
          </div>

          <form id="form-gas-config" class="space-y-3 text-xs">
            <div>
              <label class="block font-bold text-slate-700 mb-1">URL Web App Google Apps Script</label>
              <input type="url" id="input-gas-url" value="${gasUrl}" placeholder="https://script.google.com/macros/s/AKfycb.../exec" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-mono outline-none focus:border-emerald-600">
              <p class="text-[11px] text-slate-400 mt-1">Dapatkan URL ini dari menu <strong>Deploy > New Deployment > Web App (Access: Anyone)</strong> pada Google Sheets Anda.</p>
            </div>

            <div class="flex flex-wrap gap-2 pt-2">
              <button type="button" id="btn-test-gas" class="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 flex items-center gap-1.5">
                <span>⚡ Test Koneksi (Ping)</span>
              </button>
              <button type="button" id="btn-init-sheets" class="py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 flex items-center gap-1.5">
                <span>🪄 Inisialisasi 5 Sheet Otomatis</span>
              </button>
              <button type="button" id="btn-sync-data" class="py-2.5 px-4 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold border border-sky-200 flex items-center gap-1.5">
                <span>🔄 Sinkronkan Data dari Sheets</span>
              </button>
              <button type="submit" class="py-2.5 px-5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold ml-auto">
                Simpan URL
              </button>
            </div>

            <div id="gas-test-result" class="hidden p-3 rounded-xl text-xs font-semibold"></div>
          </form>
        </div>

        <!-- Box Lisensi & Profil Multi-Tenant Booth -->
        <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3 text-xs">
          <div class="flex items-center justify-between">
            <h3 class="font-black text-slate-900 text-sm">Profil Lisensi Mitra & Multi-Tenant</h3>
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">${licenseStatus}</span>
          </div>
          <p class="text-slate-500">Aplikasi ini siap di-clone untuk outlet mitra booth Teh Poci lain cukup dengan mengganti Spreadsheet ID.</p>
          
          <div class="grid grid-cols-2 gap-3 pt-2">
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-[10px] text-slate-400 font-bold block">Pemegang Lisensi:</span>
              <span class="font-bold text-slate-800 text-xs">${clientName}</span>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-[10px] text-slate-400 font-bold block">Kode Lisensi:</span>
              <span class="font-bold text-slate-800 text-xs font-mono">POCI-LPR-PRO-2026</span>
            </div>
          </div>
        </div>

      </div>
    `;
  }

  bindEvents(container, metrics) {
    const root = container.querySelector('#cms-root');
    if (!root) return;

    root.querySelector('#btn-back-to-pos')?.addEventListener('click', () => this.navigate('pos'));

    // Tab Switch
    root.querySelectorAll('.cms-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeTab = btn.getAttribute('data-tab');
        this.render(container);
      });
    });

    // Brand Settings Form
    const formBrand = root.querySelector('#form-brand-settings');
    if (formBrand) {
      formBrand.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newSettings = {
          brand_name: root.querySelector('#set-brand-name').value,
          branch_name: root.querySelector('#set-branch-name').value,
          branch_subtitle: root.querySelector('#set-branch-subtitle').value,
          branch_code: root.querySelector('#set-branch-code').value,
          address: root.querySelector('#set-address').value,
          phone: root.querySelector('#set-phone').value,
          operating_hours: root.querySelector('#set-hours').value,
          receipt_footer: root.querySelector('#set-receipt-footer').value
        };
        await this.cms.updateSettings(newSettings);
        alert('Identitas Brand & Cabang berhasil diperbarui!');
        this.render(container);
      });
    }

    // Appearance Settings Form
    const formAppearance = root.querySelector('#form-appearance-settings');
    if (formAppearance) {
      // Color pickers sync
      ['primary', 'accent', 'red', 'yellow'].forEach(c => {
        const picker = root.querySelector(`#theme-${c}`);
        const hex = root.querySelector(`#theme-${c}-hex`);
        if (picker && hex) {
          picker.addEventListener('input', () => { hex.value = picker.value; });
          hex.addEventListener('input', () => { picker.value = hex.value; });
        }
      });

      formAppearance.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newAppearance = {
          primary_color: root.querySelector('#theme-primary').value,
          accent_color: root.querySelector('#theme-accent').value,
          poci_red: root.querySelector('#theme-red').value,
          bright_yellow: root.querySelector('#theme-yellow').value,
          theme_card_style: root.querySelector('#theme-card-style').value,
          theme_density: root.querySelector('#theme-density').value,
          show_images_in_pos: root.querySelector('#theme-show-images').checked
        };
        await this.cms.updateSettings(newAppearance);
        alert('Pengaturan Tema & Appearance berhasil diterapkan!');
        this.render(container);
      });
    }

    // Menu Tab Events
    this.bindMenuTabEvents(root, container);

    // Sheets Tab Events
    this.bindSheetsTabEvents(root, container);
  }

  bindMenuTabEvents(root, container) {
    const modal = root.querySelector('#modal-edit-product');
    const formEdit = root.querySelector('#form-product-edit');

    // Tambah Menu Baru
    root.querySelector('#btn-add-new-product')?.addEventListener('click', () => {
      this.editingProduct = null;
      root.querySelector('#modal-product-title').textContent = 'Tambah Menu Minuman Baru';
      root.querySelector('#prod-edit-id').value = '';
      root.querySelector('#prod-edit-name').value = '';
      root.querySelector('#prod-edit-code').value = 'TP-' + Math.floor(10 + Math.random() * 90);
      root.querySelector('#prod-edit-price').value = '';
      root.querySelector('#prod-edit-cost').value = '';
      root.querySelector('#prod-edit-image').value = 'assets/img/menu/jasmine-poci.svg';
      root.querySelector('#prod-edit-active').checked = true;
      modal?.classList.remove('hidden');
    });

    // Edit Menu
    root.querySelectorAll('.btn-edit-prod').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const prod = this.products.getProductById(id);
        if (prod) {
          this.editingProduct = prod;
          root.querySelector('#modal-product-title').textContent = 'Edit Menu: ' + prod.name;
          root.querySelector('#prod-edit-id').value = prod.id;
          root.querySelector('#prod-edit-name').value = prod.name;
          root.querySelector('#prod-edit-category').value = prod.category;
          root.querySelector('#prod-edit-code').value = prod.code || '';
          root.querySelector('#prod-edit-price').value = prod.price;
          root.querySelector('#prod-edit-cost').value = prod.cost_price || 0;
          root.querySelector('#prod-edit-image').value = prod.image_url || '';
          root.querySelector('#prod-edit-active').checked = prod.is_active;
          modal?.classList.remove('hidden');
        }
      });
    });

    // Toggle Active
    root.querySelectorAll('.btn-toggle-active').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        await this.cms.toggleProductActive(id);
        this.render(container);
      });
    });

    // Delete Product
    root.querySelectorAll('.btn-del-prod').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Yakin ingin menghapus menu minuman ini?')) {
          await this.cms.deleteProduct(id);
          this.render(container);
        }
      });
    });

    // Close Modal
    root.querySelector('#btn-cancel-product-modal')?.addEventListener('click', () => {
      modal?.classList.add('hidden');
    });

    // Submit Product Form
    formEdit?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const productPayload = {
        id: root.querySelector('#prod-edit-id').value || null,
        name: root.querySelector('#prod-edit-name').value,
        category: root.querySelector('#prod-edit-category').value,
        code: root.querySelector('#prod-edit-code').value,
        price: Number(root.querySelector('#prod-edit-price').value),
        cost_price: Number(root.querySelector('#prod-edit-cost').value || 0),
        image_url: root.querySelector('#prod-edit-image').value,
        is_active: root.querySelector('#prod-edit-active').checked
      };

      await this.cms.upsertProduct(productPayload);
      modal?.classList.add('hidden');
      alert('Data menu berhasil disimpan!');
      this.render(container);
    });
  }

  bindSheetsTabEvents(root, container) {
    const formGas = root.querySelector('#form-gas-config');
    const resultBox = root.querySelector('#gas-test-result');

    formGas?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const url = root.querySelector('#input-gas-url').value;
      await this.cms.updateSettings({ gas_api_url: url });
      alert('URL Google Apps Script berhasil disimpan!');
      this.render(container);
    });

    // Test Ping
    root.querySelector('#btn-test-gas')?.addEventListener('click', async () => {
      const url = root.querySelector('#input-gas-url').value;
      resultBox.className = 'block p-3 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold';
      resultBox.textContent = 'Menghubungkan ke Google Apps Script...';

      try {
        const res = await this.api.testConnection(url);
        resultBox.className = 'block p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold';
        resultBox.textContent = `✓ Koneksi Berhasil! Terhubung ke Sheet: "${res.data?.spreadsheetName || 'Google Spreadsheet'}"`;
      } catch (err) {
        resultBox.className = 'block p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold';
        resultBox.textContent = '✕ Gagal terhubung ke GAS: ' + err.message;
      }
    });

    // Init Sheets
    root.querySelector('#btn-init-sheets')?.addEventListener('click', async () => {
      resultBox.className = 'block p-3 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold';
      resultBox.textContent = 'Membuat 5 Tab Database di Google Spreadsheet...';

      try {
        const res = await this.api.initSheets();
        resultBox.className = 'block p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold';
        resultBox.textContent = '✓ 5 Tab Sheet (Users, Products, Transactions, Shift_Closings, App_Settings) berhasil dibuat dan di-seed data awal!';
      } catch (err) {
        resultBox.className = 'block p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold';
        resultBox.textContent = '✕ Gagal inisialisasi sheet: ' + err.message;
      }
    });

    // Sync Data
    root.querySelector('#btn-sync-data')?.addEventListener('click', async () => {
      resultBox.className = 'block p-3 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold';
      resultBox.textContent = 'Menyinkronkan data katalog menu & pengaturan dari Sheets...';

      try {
        await this.cms.syncFromGoogleSheets();
        resultBox.className = 'block p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold';
        resultBox.textContent = '✓ Data berhasil disinkronkan dari Google Spreadsheet!';
        setTimeout(() => this.render(container), 800);
      } catch (err) {
        resultBox.className = 'block p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold';
        resultBox.textContent = '✕ Sinkronisasi gagal: ' + err.message;
      }
    });
  }
}
