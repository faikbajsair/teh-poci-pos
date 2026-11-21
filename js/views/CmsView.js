/**
 * CmsView.js
 * Dashboard Pemilik/Admin (Pak Faik) & CMS Customizer (White-Label / Multi-Tenant Ready):
 * Analisis Omzet & Laba Rugi Lengkap, Produk Terlaris & Kurang Laku, Update Stok Bahan Baku,
 * Saran & Rekomendasi Keputusan Bisnis Owner, Manajemen Brand/Cabang, Tema Warna, Katalog Menu, & Google Sheets.
 */
export class CmsView {
  constructor(cmsController, settingsModel, productModel, userModel, apiService, navigateFn, inventoryModel = null, soundService = null) {
    this.cms = cmsController;
    this.settings = settingsModel;
    this.products = productModel;
    this.user = userModel;
    this.api = apiService;
    this.navigate = navigateFn;
    this.inventory = inventoryModel;
    this.soundService = soundService;

    this.activeTab = 'dashboard'; // 'dashboard' | 'inventory' | 'brand' | 'appearance' | 'menu' | 'sheets'
    this.editingProduct = null;
    this.editingInventory = null;
    this.inventoryFilterCategory = 'Semua';
    this.inventorySearch = '';
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
        
        <!-- Top Signature Tricolor Accent Bar (Kuning, Merah, Hijau Poci) -->
        <div class="h-1.5 w-full bg-gradient-to-r from-[#FEDE00] via-[#E31E24] to-[#0B5834]"></div>

        <!-- Header Admin -->
        <header class="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
          <div class="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <button id="btn-back-to-pos" class="p-2 rounded-xl bg-slate-100 hover:bg-[#0B5834]/10 text-slate-700 font-bold text-xs flex items-center gap-1 transition">
                <span>←</span>
                <span>Kembali ke POS</span>
              </button>
              <div class="flex items-center gap-2.5">
                <img src="${this.settings.get('logo_url', 'assets/img/logo-teh-poci.png')}" alt="Logo Teh Poci" class="h-9 w-auto object-contain">
                <div>
                  <h1 class="text-base font-black text-slate-900 flex items-center gap-2">
                    <span>Dashboard Pemilik & CMS</span>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">PAK FAIK (OWNER)</span>
                  </h1>
                  <p class="text-xs text-slate-500">${brandName} — ${branchName}</p>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button id="btn-sync-all-gas" class="p-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#0B5834] font-bold text-xs flex items-center gap-1.5 transition border border-emerald-200 shadow-xs">
                <span id="cms-sync-spin">🔄</span>
                <span class="hidden sm:inline">Sinkronkan Data Sheets</span>
              </button>

              <div class="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${isGasActive ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}">
                <span class="w-2 h-2 rounded-full ${isGasActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}"></span>
                <span>${isGasActive ? 'Google Sheets Terhubung' : 'Demo Mode'}</span>
              </div>
            </div>
          </div>

          <!-- TAB NAVIGATION BAR -->
          <div class="max-w-7xl mx-auto px-4 flex items-center gap-1 overflow-x-auto border-t border-slate-100 text-xs font-bold text-slate-600 no-scrollbar">
            <button class="cms-tab-btn py-3 px-3.5 border-b-2 whitespace-nowrap transition flex items-center gap-1.5 ${this.activeTab === 'dashboard' ? 'border-[#0B5834] text-[#0B5834] font-black' : 'border-transparent hover:text-slate-900'}" data-tab="dashboard">
              <span>📊</span>
              <span>Laporan Penjualan & Laba Rugi</span>
            </button>
            <button class="cms-tab-btn py-3 px-3.5 border-b-2 whitespace-nowrap transition flex items-center gap-1.5 ${this.activeTab === 'inventory' ? 'border-[#0B5834] text-[#0B5834] font-black' : 'border-transparent hover:text-slate-900'}" data-tab="inventory">
              <span>📦</span>
              <span>Stok Bahan Baku</span>
            </button>
            <button class="cms-tab-btn py-3 px-3.5 border-b-2 whitespace-nowrap transition flex items-center gap-1.5 ${this.activeTab === 'brand' ? 'border-[#0B5834] text-[#0B5834] font-black' : 'border-transparent hover:text-slate-900'}" data-tab="brand">
              <span>🏪</span>
              <span>Identitas Brand & Rekening</span>
            </button>
            <button class="cms-tab-btn py-3 px-3.5 border-b-2 whitespace-nowrap transition flex items-center gap-1.5 ${this.activeTab === 'appearance' ? 'border-[#0B5834] text-[#0B5834] font-black' : 'border-transparent hover:text-slate-900'}" data-tab="appearance">
              <span>🎨</span>
              <span>Tema & Tampilan (Appearance)</span>
            </button>
            <button class="cms-tab-btn py-3 px-3.5 border-b-2 whitespace-nowrap transition flex items-center gap-1.5 ${this.activeTab === 'menu' ? 'border-[#0B5834] text-[#0B5834] font-black' : 'border-transparent hover:text-slate-900'}" data-tab="menu">
              <span>🫖</span>
              <span>Katalog Menu & Harga</span>
            </button>
            <button class="cms-tab-btn py-3 px-3.5 border-b-2 whitespace-nowrap transition flex items-center gap-1.5 ${this.activeTab === 'sheets' ? 'border-[#0B5834] text-[#0B5834] font-black' : 'border-transparent hover:text-slate-900'}" data-tab="sheets">
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
                <button type="submit" class="flex-1 py-2.5 rounded-xl bg-[#0B5834] text-white font-bold shadow-md">Simpan Menu</button>
              </div>
            </form>
          </div>
        </div>

        <!-- MODAL TAMBAH / EDIT BAHAN BAKU -->
        <div id="modal-edit-inventory" class="hidden fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl">
            <h3 class="font-black text-slate-900 text-base mb-3" id="modal-inv-title">Kelola Stok Bahan Baku</h3>
            <form id="form-inv-edit" class="space-y-3 text-xs">
              <input type="hidden" id="inv-edit-id">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Nama Bahan Baku / Kemasan</label>
                <input type="text" id="inv-edit-name" required placeholder="Contoh: Daun Teh Melati Poci" class="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold outline-none focus:border-emerald-500">
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Kategori Bahan</label>
                  <select id="inv-edit-category" class="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold outline-none focus:border-emerald-500">
                    <option value="Bahan Utama">Bahan Utama</option>
                    <option value="Kemasan">Kemasan</option>
                    <option value="Sirup Buah">Sirup Buah</option>
                    <option value="Powder Rasa">Powder Rasa</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Satuan Stok</label>
                  <input type="text" id="inv-edit-unit" required placeholder="Kg / Pack / Roll / Botol" class="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-emerald-500">
                </div>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Jumlah Sisa Stok Fisik</label>
                  <input type="number" id="inv-edit-stock" required class="w-full px-3 py-2 rounded-xl border border-slate-200 font-black text-emerald-800 text-sm outline-none focus:border-emerald-500">
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Batas Minimal (Peringatan)</label>
                  <input type="number" id="inv-edit-min" required class="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold outline-none focus:border-emerald-500">
                </div>
              </div>
              <div class="flex gap-2 pt-3 border-t border-slate-100">
                <button type="button" id="btn-cancel-inv-modal" class="flex-1 py-2.5 rounded-xl bg-slate-100 font-bold text-slate-600">Batal</button>
                <button type="submit" class="flex-1 py-2.5 rounded-xl bg-[#0B5834] text-white font-bold shadow-md">Simpan Stok</button>
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
    } else if (this.activeTab === 'inventory') {
      return this.renderInventoryTab();
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

  // TAB 1: EXECUTIVE DASHBOARD & LAPORAN LABA RUGI
  renderDashboardTab(metrics) {
    const period = this.cms.selectedPeriod;

    return `
      <div class="space-y-6">
        
        <!-- BAR FILTER PERIODE WAKTU -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <h2 class="text-sm font-black text-slate-900 flex items-center gap-2">
              <span>Laporan Kinerja & Profitabilitas Booth</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">Real-time</span>
            </h2>
            <p class="text-xs text-slate-500">Analisis menyeluruh omzet, beban HPP bahan baku, estimasi laba bersih, dan produk terlaris.</p>
          </div>

          <div class="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold self-stretch sm:self-auto justify-between">
            <button type="button" class="btn-period px-3 py-1.5 rounded-lg transition ${period === 'today' ? 'bg-[#0B5834] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}" data-period="today">Hari Ini</button>
            <button type="button" class="btn-period px-3 py-1.5 rounded-lg transition ${period === '7days' ? 'bg-[#0B5834] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}" data-period="7days">7 Hari</button>
            <button type="button" class="btn-period px-3 py-1.5 rounded-lg transition ${period === '30days' ? 'bg-[#0B5834] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}" data-period="30days">30 Hari</button>
            <button type="button" class="btn-period px-3 py-1.5 rounded-lg transition ${period === 'all' ? 'bg-[#0B5834] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}" data-period="all">Semua Waktu</button>
          </div>
        </div>

        <!-- 4 KPI CARDS UTAMA (LABA RUGI & VOLUME PENJUALAN) -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Omzet Penjualan</span>
            <div class="text-xl sm:text-2xl font-black text-[#0B5834] mt-1">${this.formatRp(metrics.todayRevenue)}</div>
            <p class="text-[11px] text-emerald-700 font-semibold mt-1">✓ ${metrics.todayTxCount} Nota Transaksi (${metrics.todayCups} Cup)</p>
          </div>

          <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Modal Bahan (HPP)</span>
            <div class="text-xl sm:text-2xl font-black text-slate-800 mt-1">${this.formatRp(metrics.totalCogs)}</div>
            <p class="text-[11px] text-slate-500 font-medium mt-1">Teh, Gula, Cup, Lid & Sirup</p>
          </div>

          <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Laba Kotor (Gross Profit)</span>
            <div class="text-xl sm:text-2xl font-black text-emerald-600 mt-1">${this.formatRp(metrics.grossProfit)}</div>
            <p class="text-[11px] text-emerald-800 font-black mt-1">Margin Kotor: ${metrics.grossMarginPercent}%</p>
          </div>

          <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Estimasi Laba Bersih</span>
            <div class="text-xl sm:text-2xl font-black ${metrics.netProfit >= 0 ? 'text-[#0B5834]' : 'text-red-600'} mt-1">${this.formatRp(metrics.netProfit)}</div>
            <p class="text-[11px] text-slate-500 font-medium mt-1">Est. Beban Op: ${this.formatRp(metrics.operationalCost)}</p>
          </div>
        </div>

        <!-- LAPORAN LABA RUGI STATEMENT RINGKAS -->
        <div class="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs">
          <h3 class="font-black text-slate-900 text-sm mb-3 flex items-center justify-between">
            <span>Rincian Laporan Laba Rugi (P&L Summary)</span>
            <span class="text-xs font-mono font-bold text-[#0B5834]">Periode: ${period === 'today' ? 'Hari Ini' : (period === '7days' ? '7 Hari Terakhir' : (period === '30days' ? '30 Hari Terakhir' : 'Semua Data'))}</span>
          </h3>

          <div class="divide-y divide-slate-100 text-xs font-medium">
            <div class="py-2.5 flex justify-between">
              <span class="text-slate-600">Total Penjualan Minuman (Gross Sales)</span>
              <span class="font-bold text-slate-900">${this.formatRp(metrics.todayRevenue)}</span>
            </div>
            <div class="py-2.5 flex justify-between text-red-700">
              <span>Dikurangi: Biaya Modal Bahan Baku Minuman (HPP / COGS)</span>
              <span class="font-bold">-${this.formatRp(metrics.totalCogs)}</span>
            </div>
            <div class="py-2.5 flex justify-between font-bold text-emerald-900 bg-emerald-50/50 px-2 rounded-lg">
              <span>= LABA KOTOR (GROSS PROFIT)</span>
              <span class="font-black text-sm">${this.formatRp(metrics.grossProfit)} (${metrics.grossMarginPercent}%)</span>
            </div>
            <div class="py-2.5 flex justify-between text-slate-500">
              <span>Dikurangi: Estimasi Beban Operasional Booth (Es Batu, Listrik, Sewa)</span>
              <span class="font-bold">-${this.formatRp(metrics.operationalCost)}</span>
            </div>
            <div class="py-3 flex justify-between font-black text-sm ${metrics.netProfit >= 0 ? 'text-[#0B5834] bg-emerald-100/60' : 'text-red-700 bg-red-50'} px-2 rounded-lg">
              <span>= ESTIMASI LABA BERSIH (NET PROFIT)</span>
              <span>${this.formatRp(metrics.netProfit)}</span>
            </div>
          </div>
        </div>

        <!-- GRID 2 KOLOM: PRODUK TERLARIS VS PRODUK KURANG LAKU -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <!-- Kolom 1: 🏆 Produk Terlaris (Best Seller) -->
          <div class="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-3">
                <h3 class="font-black text-slate-900 text-sm flex items-center gap-1.5">
                  <span>🏆</span>
                  <span>Produk Terlaris (Fast-Moving)</span>
                </h3>
                <span class="text-[10px] font-bold text-[#0B5834] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Paling Diminati</span>
              </div>
              <p class="text-xs text-slate-500 mb-4">Varian menu dengan kontribusi penjualan dan perputaran cup tertinggi.</p>

              <div class="space-y-2.5 text-xs">
                ${metrics.topProducts.length === 0 ? `
                  <p class="text-slate-400 py-8 text-center">Belum ada data penjualan pada periode ini.</p>
                ` : metrics.topProducts.map((p, idx) => `
                  <div class="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between hover:bg-emerald-50/40 transition">
                    <div class="flex items-center gap-3">
                      <span class="w-7 h-7 rounded-xl ${idx === 0 ? 'bg-[#FEDE00] text-[#0B5834] font-black' : 'bg-slate-200 text-slate-700 font-bold'} text-xs flex items-center justify-center shrink-0">
                        ${idx + 1}
                      </span>
                      <div>
                        <span class="font-bold text-slate-900 block leading-tight">${p.name}</span>
                        <span class="text-[10px] text-slate-400">${p.category} • Harga: ${this.formatRp(p.price)}</span>
                      </div>
                    </div>
                    <div class="text-right">
                      <span class="font-black text-[#0B5834] text-xs block">${p.qty_sold} Cup</span>
                      <span class="text-[10px] font-bold text-emerald-700 font-mono">${this.formatRp(p.revenue)} (Margin ${p.margin_percent}%)</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Kolom 2: ⚠️ Produk Kurang Laku (Slow Moving) -->
          <div class="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-3">
                <h3 class="font-black text-slate-900 text-sm flex items-center gap-1.5">
                  <span>⚠️</span>
                  <span>Produk Kurang Laku (Slow-Moving)</span>
                </h3>
                <span class="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Perlu Evaluasi</span>
              </div>
              <p class="text-xs text-slate-500 mb-4">Menu dengan penjualan paling rendah. Perlu dipromosikan agar stok bahan baku tidak tertahan lama.</p>

              <div class="space-y-2.5 text-xs">
                ${metrics.slowProducts.length === 0 ? `
                  <p class="text-slate-400 py-8 text-center">Semua produk terjual merata.</p>
                ` : metrics.slowProducts.map((p) => `
                  <div class="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between hover:bg-amber-50/40 transition">
                    <div>
                      <span class="font-bold text-slate-800 block leading-tight">${p.name}</span>
                      <span class="text-[10px] text-slate-400">${p.category} • Harga: ${this.formatRp(p.price)}</span>
                    </div>
                    <div class="text-right">
                      <span class="font-black ${p.qty_sold === 0 ? 'text-red-600 bg-red-50 border border-red-200' : 'text-amber-800 bg-amber-50 border border-amber-200'} px-2 py-0.5 rounded-lg text-[11px] block">
                        ${p.qty_sold === 0 ? '0 Cup (Belum Terjual)' : `${p.qty_sold} Cup`}
                      </span>
                      <span class="text-[10px] text-slate-400 mt-0.5 block">HPP: ${this.formatRp(p.cost_price)}</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

        </div>

        <!-- BAGIAN REKOMENDASI & SARAN STRATEGIS BISNIS UNTUK OWNER (PAK FAIK) -->
        <div class="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 class="font-black text-slate-900 text-base flex items-center gap-2">
                <span>💡 Saran & Rekomendasi Keputusan Bisnis untuk Owner</span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#FEDE00] text-[#0B5834]">STRATEGIS</span>
              </h3>
              <p class="text-xs text-slate-500">Rangkuman poin penting dari data penjualan dan stok untuk memudahkan pengambilan keputusan usaha.</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${metrics.strategicAdvice.map(adv => `
              <div class="p-4 rounded-2xl border ${adv.color === 'emerald' ? 'bg-emerald-50/40 border-emerald-200' : (adv.color === 'amber' ? 'bg-amber-50/40 border-amber-200' : (adv.color === 'red' ? 'bg-red-50/40 border-red-200' : (adv.color === 'sky' ? 'bg-sky-50/40 border-sky-200' : 'bg-purple-50/40 border-purple-200')))} space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-lg">${adv.icon}</span>
                  <span class="text-[10px] font-bold px-2.5 py-0.5 rounded-full ${adv.color === 'emerald' ? 'bg-emerald-100 text-emerald-800' : (adv.color === 'amber' ? 'bg-amber-100 text-amber-800' : (adv.color === 'red' ? 'bg-red-100 text-red-800' : (adv.color === 'sky' ? 'bg-sky-100 text-sky-800' : 'bg-purple-100 text-purple-800')))}">
                    ${adv.badge}
                  </span>
                </div>
                <h4 class="font-black text-slate-900 text-xs">${adv.title}</h4>
                <p class="text-xs text-slate-600 leading-relaxed">${adv.description}</p>
                <div class="pt-2 border-t border-slate-200/60 text-xs text-slate-800 bg-white/70 p-2.5 rounded-xl font-medium">
                  👉 ${adv.action}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

      </div>
    `;
  }

  // TAB 2: UPDATE STOK BAHAN BAKU (INVENTORY MANAGEMENT)
  renderInventoryTab() {
    if (!this.inventory) {
      return `<p class="p-8 text-center text-slate-400">Modul stok bahan baku sedang dimuat...</p>`;
    }

    const summary = this.inventory.getSummary();
    let items = this.inventory.getAll();

    // Filter Kategori
    if (this.inventoryFilterCategory && this.inventoryFilterCategory !== 'Semua') {
      items = items.filter(i => i.category === this.inventoryFilterCategory);
    }

    // Filter Search
    if (this.inventorySearch) {
      const q = this.inventorySearch.toLowerCase().trim();
      items = items.filter(i => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
    }

    return `
      <div class="space-y-6">
        
        <!-- HEADER & RINGKASAN STOK -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span class="text-[10px] font-bold text-slate-400 uppercase block">Total Bahan & Kemasan</span>
            <span class="text-lg sm:text-xl font-black text-slate-800 mt-1 block">${summary.total} Varian</span>
            <p class="text-[10px] text-slate-500 font-medium mt-0.5">Katalog Bahan Booth</p>
          </div>

          <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span class="text-[10px] font-bold text-emerald-600 uppercase block">🟢 Stok Aman</span>
            <span class="text-lg sm:text-xl font-black text-emerald-800 mt-1 block">${summary.safe} Bahan</span>
            <p class="text-[10px] text-emerald-600 font-medium mt-0.5">Di Atas Batas Minimal</p>
          </div>

          <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span class="text-[10px] font-bold text-amber-600 uppercase block">🟡 Stok Menipis</span>
            <span class="text-lg sm:text-xl font-black text-amber-800 mt-1 block">${summary.warning} Bahan</span>
            <p class="text-[10px] text-amber-600 font-medium mt-0.5">Mendekati Batas Minimal</p>
          </div>

          <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span class="text-[10px] font-bold text-red-600 uppercase block">🔴 Stok Kritis (Habis)</span>
            <span class="text-lg sm:text-xl font-black text-red-800 mt-1 block">${summary.critical} Bahan</span>
            <p class="text-[10px] text-red-600 font-medium mt-0.5">Perlu Order Ulang Segera</p>
          </div>
        </div>

        <!-- ACTION BAR & SEARCH -->
        <div class="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 class="font-black text-slate-900 text-base">Manajemen Stok Bahan Baku & Kemasan</h3>
              <p class="text-xs text-slate-500">Perbarui jumlah stok fisik di booth, atur batas minimal peringatan, dan catat restock.</p>
            </div>
            <button type="button" id="btn-add-new-inv" class="py-2.5 px-4 rounded-xl bg-[#0B5834] hover:bg-[#074025] text-white font-bold text-xs shadow-sm flex items-center gap-1.5 active:scale-95 transition">
              <span>+ Tambah Bahan Baru</span>
            </button>
          </div>

          <!-- Filter & Search Controls -->
          <div class="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div class="relative w-full sm:w-80">
              <input type="text" id="inv-search-input" value="${this.inventorySearch}" placeholder="Cari nama bahan baku atau kemasan..." class="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-emerald-600">
              <span class="absolute left-3 top-2 text-slate-400 text-xs">🔍</span>
            </div>

            <div class="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs font-bold no-scrollbar">
              ${['Semua', 'Bahan Utama', 'Kemasan', 'Sirup Buah', 'Powder Rasa'].map(cat => `
                <button type="button" class="btn-inv-cat py-1.5 px-3 rounded-lg border transition whitespace-nowrap ${this.inventoryFilterCategory === cat ? 'bg-[#0B5834] text-white border-[#0B5834]' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}" data-cat="${cat}">
                  ${cat}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- TABEL DAFTAR STOK -->
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th class="p-3">Nama Bahan Baku / Kemasan</th>
                  <th class="p-3">Kategori</th>
                  <th class="p-3">Sisa Stok Fisik</th>
                  <th class="p-3">Batas Minimal</th>
                  <th class="p-3">Status</th>
                  <th class="p-3 text-center">Penyesuaian Cepat</th>
                  <th class="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${items.length === 0 ? `
                  <tr>
                    <td colspan="7" class="p-8 text-center text-slate-400">Tidak ada bahan baku yang cocok dengan pencarian.</td>
                  </tr>
                ` : items.map(item => {
                  const status = this.inventory.getItemStatus(item);
                  return `
                    <tr class="hover:bg-slate-50 transition">
                      <td class="p-3">
                        <span class="font-bold text-slate-900 block leading-tight">${item.name}</span>
                        <span class="text-[10px] text-slate-400 font-mono">ID: ${item.id} • Satuan: ${item.unit}</span>
                      </td>
                      <td class="p-3">
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">${item.category}</span>
                      </td>
                      <td class="p-3">
                        <span class="font-black text-sm ${status === 'critical' ? 'text-red-700' : (status === 'warning' ? 'text-amber-700' : 'text-[#0B5834]')}">${item.stock}</span>
                        <span class="text-[11px] text-slate-500 font-medium"> ${item.unit}</span>
                      </td>
                      <td class="p-3 text-slate-600 font-medium">
                        ${item.min_stock} ${item.unit}
                      </td>
                      <td class="p-3">
                        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${status === 'critical' ? 'bg-red-100 text-red-800 border border-red-200' : (status === 'warning' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200')}">
                          ${status === 'critical' ? '🔴 Kritis (Order!)' : (status === 'warning' ? '🟡 Menipis' : '🟢 Aman')}
                        </span>
                      </td>
                      <td class="p-3 text-center">
                        <div class="inline-flex items-center gap-1">
                          <button type="button" class="btn-stock-adj px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs" data-id="${item.id}" data-delta="-1" title="Kurangi 1">-1</button>
                          <button type="button" class="btn-stock-adj px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-[#0B5834] font-black text-xs" data-id="${item.id}" data-delta="1" title="Tambah 1">+1</button>
                          <button type="button" class="btn-stock-adj px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-[#0B5834] font-black text-xs" data-id="${item.id}" data-delta="5" title="Tambah 5 (Restock)">+5</button>
                        </div>
                      </td>
                      <td class="p-3 text-center">
                        <div class="flex items-center justify-center gap-1">
                          <button type="button" class="btn-edit-inv px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 text-[11px]" data-id="${item.id}">
                            ✏️ Edit
                          </button>
                          <button type="button" class="btn-del-inv px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 font-bold text-red-700 text-[11px]" data-id="${item.id}" title="Hapus">
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;
  }

  // TAB 3: BRAND & CABANG SETTINGS
  renderBrandTab() {
    return `
      <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs max-w-3xl space-y-4">
        <div>
          <h3 class="font-black text-slate-900 text-base">Identitas Brand & Rekening Pembayaran</h3>
          <p class="text-xs text-slate-500">Konfigurasi informasi cabang dan nomor rekening transfer resmi yang tampil pada POS dan struk.</p>
        </div>

        <form id="form-brand-settings" class="space-y-4 text-xs">
          <!-- Logo Brand Display & Customizer -->
          <div class="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-4">
            <div class="w-16 h-16 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0">
              <img id="brand-logo-preview" src="${this.settings.get('logo_url', 'assets/img/logo-teh-poci.png')}" alt="Logo" class="max-w-full max-h-full object-contain">
            </div>
            <div class="flex-1">
              <label class="block font-bold text-slate-700 mb-1">Path / URL Logo Resmi Brand</label>
              <input type="text" id="set-logo-url" value="${this.settings.get('logo_url', 'assets/img/logo-teh-poci.png')}" class="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-[11px] outline-none focus:border-emerald-600">
              <span class="text-[10px] text-slate-400 mt-1 block">Default logo resmi: assets/img/logo-teh-poci.png</span>
            </div>
          </div>

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

          <!-- Rekening Pembayaran Resmi Booth -->
          <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
            <span class="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Rekening Bank Transfer & QRIS Booth (Pak Faik):</span>
            
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div class="p-2.5 bg-white rounded-xl border border-emerald-200">
                <span class="text-[10px] font-bold text-emerald-800 uppercase block mb-1">1. Bank Syariah Indonesia (BSI)</span>
                <input type="text" id="set-bsi-no" value="${this.settings.get('bank_bsi_no', '7071810850')}" placeholder="No. Rekening" class="w-full px-2 py-1.5 rounded-lg border border-slate-200 font-mono font-bold text-xs outline-none focus:border-emerald-500 mb-1">
                <input type="text" id="set-bsi-name" value="${this.settings.get('bank_bsi_name', 'Faik')}" placeholder="A.n Pemilik" class="w-full px-2 py-1 rounded-lg border border-slate-200 text-[11px] outline-none">
              </div>

              <div class="p-2.5 bg-white rounded-xl border border-sky-200">
                <span class="text-[10px] font-bold text-sky-800 uppercase block mb-1">2. Blu by BCA Digital</span>
                <input type="text" id="set-blu-no" value="${this.settings.get('bank_blu_no', '005725704200')}" placeholder="No. Rekening" class="w-full px-2 py-1.5 rounded-lg border border-slate-200 font-mono font-bold text-xs outline-none focus:border-sky-500 mb-1">
                <input type="text" id="set-blu-name" value="${this.settings.get('bank_blu_name', 'Faik')}" placeholder="A.n Pemilik" class="w-full px-2 py-1 rounded-lg border border-slate-200 text-[11px] outline-none">
              </div>

              <div class="p-2.5 bg-white rounded-xl border border-amber-200">
                <span class="text-[10px] font-bold text-amber-800 uppercase block mb-1">3. Bank Mandiri</span>
                <input type="text" id="set-mandiri-no" value="${this.settings.get('bank_mandiri_no', '1330031045271')}" placeholder="No. Rekening" class="w-full px-2 py-1.5 rounded-lg border border-slate-200 font-mono font-bold text-xs outline-none focus:border-amber-500 mb-1">
                <input type="text" id="set-mandiri-name" value="${this.settings.get('bank_mandiri_name', 'FAIK')}" placeholder="A.n Pemilik" class="w-full px-2 py-1 rounded-lg border border-slate-200 text-[11px] outline-none">
              </div>
            </div>
          </div>

          <!-- Pengaturan Soundbox Notifikasi Suara Pembayaran -->
          <div class="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-xl">🔊</span>
                <div>
                  <h4 class="font-bold text-slate-800 text-xs">Soundbox Notifikasi Pembayaran (QRIS, Transfer, Tunai)</h4>
                  <p class="text-[11px] text-slate-500">Bunyi bel kasir & suara asisten pembaca nominal otomatis saat pelanggan membayar.</p>
                </div>
              </div>
              <button type="button" id="btn-cms-test-sound" class="py-1.5 px-3 rounded-xl bg-white border border-emerald-300 hover:bg-emerald-100 text-[#0B5834] font-bold text-xs shadow-xs active:scale-95 transition flex items-center gap-1.5">
                <span>🔔</span>
                <span>Uji Coba Suara</span>
              </button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-emerald-200/60">
              <label class="flex items-center gap-2.5 p-2.5 bg-white rounded-xl border border-emerald-200 cursor-pointer hover:bg-emerald-50/50 transition">
                <input type="checkbox" id="check-sound-chime" ${this.soundService?.isSoundEnabled ? 'checked' : ''} class="w-4 h-4 text-emerald-600 rounded">
                <div>
                  <span class="font-bold text-slate-800 block text-xs">Bel Kasir (Chime Bell)</span>
                  <span class="text-[10px] text-slate-500">Nada lonceng khas kasir saat pembayaran sukses</span>
                </div>
              </label>

              <label class="flex items-center gap-2.5 p-2.5 bg-white rounded-xl border border-emerald-200 cursor-pointer hover:bg-emerald-50/50 transition">
                <input type="checkbox" id="check-sound-voice" ${this.soundService?.isVoiceEnabled ? 'checked' : ''} class="w-4 h-4 text-emerald-600 rounded">
                <div>
                  <span class="font-bold text-slate-800 block text-xs">Suara Asisten (Voice TTS)</span>
                  <span class="text-[10px] text-slate-500">Menyebutkan nominal pembayaran (bahasa Indonesia)</span>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Pesan Kaki Struk (Receipt Footer)</label>
            <input type="text" id="set-receipt-footer" value="${this.settings.get('receipt_footer')}" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-emerald-600">
          </div>

          <div class="pt-3 border-t border-slate-100 flex justify-end">
            <button type="submit" class="py-3 px-6 rounded-xl bg-[#0B5834] hover:bg-[#074025] text-white font-black text-xs uppercase tracking-wider shadow-md active:scale-95 transition">
              Simpan Identitas Brand & Rekening
            </button>
          </div>
        </form>
      </div>
    `;
  }

  // TAB 4: APPEARANCE & THEME CUSTOMIZER
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
            <button type="submit" class="py-3 px-6 rounded-xl bg-[#0B5834] hover:bg-[#074025] text-white font-black text-xs uppercase tracking-wider shadow-md active:scale-95 transition">
              Terapkan Perubahan Tampilan
            </button>
          </div>
        </form>
      </div>
    `;
  }

  // TAB 5: KATALOG MENU & HARGA (CRUD)
  renderMenuTab() {
    const list = this.products.getAllProducts();

    return `
      <div class="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 class="font-black text-slate-900 text-base">Manajemen Katalog Menu Minuman (17 Varian)</h3>
            <p class="text-xs text-slate-500">Kelola harga jual, harga modal/HPP, status ketersediaan stok, dan varian baru.</p>
          </div>
          <button type="button" id="btn-add-new-product" class="py-2 px-4 rounded-xl bg-[#0B5834] hover:bg-[#074025] text-white font-bold text-xs shadow-sm flex items-center gap-1.5 active:scale-95 transition">
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
                <th class="p-3">Harga Modal (HPP)</th>
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
                      <button type="button" class="btn-edit-prod p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700" data-id="${p.id}" title="Edit Menu">
                        ✏️
                      </button>
                      <button type="button" class="btn-del-prod p-1.5 rounded-lg bg-red-50 hover:bg-red-100 font-bold text-red-700" data-id="${p.id}" title="Hapus Menu">
                        🗑️
                      </button>
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

  // TAB 6: INTEGRASI SPREADSHEET & LISENSI
  renderSheetsTab() {
    const isGasActive = this.api.isGasConfigured();

    return `
      <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs max-w-3xl space-y-6">
        <div>
          <h3 class="font-black text-slate-900 text-base">Integrasi Google Apps Script & Lisensi Multi-Tenant</h3>
          <p class="text-xs text-slate-500">Konfigurasi endpoint database Google Spreadsheet agar semua transaksi, stok, dan menu tersinkronisasi otomatis.</p>
        </div>

        <form id="form-gas-config" class="space-y-4 text-xs">
          <div>
            <label class="block font-bold text-slate-700 mb-1">URL Google Apps Script Web App</label>
            <input type="url" id="input-gas-url" required value="${this.settings.get('gas_api_url')}" placeholder="https://script.google.com/macros/s/AKfycb.../exec" class="w-full p-3 rounded-xl border border-slate-200 font-mono text-xs outline-none focus:border-emerald-600">
            <span class="text-[11px] text-slate-400 mt-1 block">Pastikan Deployment Web App di Apps Script disetel ke: <em>Execute as: Me</em> dan <em>Who has access: Anyone</em>.</span>
          </div>

          <div class="flex gap-2">
            <button type="button" id="btn-test-gas" class="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold">
              Uji Koneksi (Ping)
            </button>
            <button type="button" id="btn-init-sheets" class="py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#0B5834] font-bold border border-emerald-200">
              Buat / Reset Tab Sheet Otomatis
            </button>
            <button type="submit" class="py-2.5 px-5 rounded-xl bg-[#0B5834] hover:bg-[#074025] text-white font-bold ml-auto shadow-sm">
              Simpan URL
            </button>
          </div>

          <div id="gas-test-result" class="hidden p-3 rounded-xl text-xs font-semibold"></div>
        </form>

        <div class="pt-6 border-t border-slate-100 space-y-3 text-xs">
          <h4 class="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Profil Lisensi & White-Label:</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-[10px] text-slate-400 block font-sans font-bold">Klien / Pemilik:</span>
              <span class="font-bold text-slate-900">${this.settings.get('client_name', 'Pak Faik - Mitra Teh Poci')}</span>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-[10px] text-slate-400 block font-sans font-bold">Status Lisensi:</span>
              <span class="font-bold text-emerald-700">✓ AKTIF (LIFETIME BOOTH)</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents(container, metrics) {
    const root = container.querySelector('#cms-root');
    if (!root) return;

    // Kembali ke POS
    root.querySelector('#btn-back-to-pos')?.addEventListener('click', () => this.navigate('pos'));

    // Ganti Tab Utama
    root.querySelectorAll('.cms-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeTab = btn.getAttribute('data-tab');
        this.render(container);
      });
    });

    // Tombol Sinkronkan Data Sheets di Header
    root.querySelector('#btn-sync-all-gas')?.addEventListener('click', async () => {
      const spin = root.querySelector('#cms-sync-spin');
      if (spin) spin.classList.add('animate-spin');
      try {
        await this.cms.syncAllFromGas();
        alert('Data berhasil disinkronkan dengan Google Spreadsheet!');
        this.render(container);
      } catch (err) {
        alert('Gagal sinkronisasi: ' + err.message);
      } finally {
        if (spin) spin.classList.remove('animate-spin');
      }
    });

    // Event Filter Periode Waktu di Tab Dashboard
    root.querySelectorAll('.btn-period').forEach(btn => {
      btn.addEventListener('click', () => {
        const period = btn.getAttribute('data-period');
        this.cms.setPeriod(period);
        this.render(container);
      });
    });

    // Event Tab Inventory
    this.bindInventoryEvents(root, container);

    // Event Tab Brand
    this.bindBrandEvents(root, container);

    // Event Tab Appearance
    this.bindAppearanceEvents(root, container);

    // Event Tab Menu (Katalog)
    this.bindMenuTabEvents(root, container);

    // Event Tab Sheets
    this.bindSheetsTabEvents(root, container);
  }

  // EVENTS UNTUK TAB INVENTORY (STOK BAHAN BAKU)
  bindInventoryEvents(root, container) {
    if (!this.inventory) return;

    const modal = root.querySelector('#modal-edit-inventory');
    const form = root.querySelector('#form-inv-edit');

    // Filter Kategori Bahan
    root.querySelectorAll('.btn-inv-cat').forEach(btn => {
      btn.addEventListener('click', () => {
        this.inventoryFilterCategory = btn.getAttribute('data-cat');
        this.render(container);
      });
    });

    // Search Bahan
    const searchInput = root.querySelector('#inv-search-input');
    searchInput?.addEventListener('input', (e) => {
      this.inventorySearch = e.target.value;
      // Re-render hanya bagian tabel untuk mempertahankan fokus jika perlu
      this.render(container);
    });

    // Tombol Tambah Bahan Baru
    root.querySelector('#btn-add-new-inv')?.addEventListener('click', () => {
      this.editingInventory = null;
      root.querySelector('#modal-inv-title').textContent = 'Tambah Bahan Baku / Kemasan Baru';
      root.querySelector('#inv-edit-id').value = '';
      root.querySelector('#inv-edit-name').value = '';
      root.querySelector('#inv-edit-category').value = 'Bahan Utama';
      root.querySelector('#inv-edit-unit').value = 'Kg';
      root.querySelector('#inv-edit-stock').value = '10';
      root.querySelector('#inv-edit-min').value = '5';
      modal?.classList.remove('hidden');
    });

    // Tombol Edit Bahan
    root.querySelectorAll('.btn-edit-inv').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const item = this.inventory.getById(id);
        if (item) {
          this.editingInventory = item;
          root.querySelector('#modal-inv-title').textContent = 'Edit Stok: ' + item.name;
          root.querySelector('#inv-edit-id').value = item.id;
          root.querySelector('#inv-edit-name').value = item.name;
          root.querySelector('#inv-edit-category').value = item.category;
          root.querySelector('#inv-edit-unit').value = item.unit;
          root.querySelector('#inv-edit-stock').value = item.stock;
          root.querySelector('#inv-edit-min').value = item.min_stock;
          modal?.classList.remove('hidden');
        }
      });
    });

    // Penyesuaian Stok Cepat (+1, -1, +5)
    root.querySelectorAll('.btn-stock-adj').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const delta = Number(btn.getAttribute('data-delta'));
        this.inventory.adjustStock(id, delta);
        this.render(container);
      });
    });

    // Hapus Bahan Baku
    root.querySelectorAll('.btn-del-inv').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Yakin ingin menghapus item bahan baku ini dari daftar?')) {
          this.inventory.deleteItem(id);
          this.render(container);
        }
      });
    });

    // Batal Modal
    root.querySelector('#btn-cancel-inv-modal')?.addEventListener('click', () => {
      modal?.classList.add('hidden');
    });

    // Submit Modal Form
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = root.querySelector('#inv-edit-id').value;
      const itemData = {
        name: root.querySelector('#inv-edit-name').value,
        category: root.querySelector('#inv-edit-category').value,
        unit: root.querySelector('#inv-edit-unit').value,
        stock: Number(root.querySelector('#inv-edit-stock').value),
        min_stock: Number(root.querySelector('#inv-edit-min').value)
      };

      if (id) {
        this.inventory.updateItem(id, itemData);
      } else {
        this.inventory.addItem(itemData);
      }

      modal?.classList.add('hidden');
      alert('Stok bahan baku berhasil diperbarui!');
      this.render(container);
    });
  }

  bindBrandEvents(root, container) {
    // Soundbox Pengaturan & Uji Coba Suara
    const btnTestSound = root.querySelector('#btn-cms-test-sound');
    if (btnTestSound) {
      btnTestSound.addEventListener('click', () => {
        this.soundService?.testSound('QRIS', 16000);
      });
    }

    const checkChime = root.querySelector('#check-sound-chime');
    if (checkChime) {
      checkChime.addEventListener('change', (e) => {
        this.soundService?.toggleSound(e.target.checked);
      });
    }

    const checkVoice = root.querySelector('#check-sound-voice');
    if (checkVoice) {
      checkVoice.addEventListener('change', (e) => {
        this.soundService?.toggleVoice(e.target.checked);
      });
    }

    const formBrand = root.querySelector('#form-brand-settings');
    if (formBrand) {
      formBrand.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newSettings = {
          logo_url: root.querySelector('#set-logo-url')?.value || 'assets/img/logo-teh-poci.png',
          brand_name: root.querySelector('#set-brand-name').value,
          branch_name: root.querySelector('#set-branch-name').value,
          branch_subtitle: root.querySelector('#set-branch-subtitle').value,
          branch_code: root.querySelector('#set-branch-code').value,
          address: root.querySelector('#set-address').value,
          phone: root.querySelector('#set-phone').value,
          operating_hours: root.querySelector('#set-hours').value,
          receipt_footer: root.querySelector('#set-receipt-footer').value,
          bank_bsi_no: root.querySelector('#set-bsi-no')?.value || '7071810850',
          bank_bsi_name: root.querySelector('#set-bsi-name')?.value || 'Faik',
          bank_blu_no: root.querySelector('#set-blu-no')?.value || '005725704200',
          bank_blu_name: root.querySelector('#set-blu-name')?.value || 'Faik',
          bank_mandiri_no: root.querySelector('#set-mandiri-no')?.value || '1330031045271',
          bank_mandiri_name: root.querySelector('#set-mandiri-name')?.value || 'FAIK'
        };
        await this.cms.updateSettings(newSettings);
        alert('Identitas Brand & Rekening berhasil disimpan!');
        this.render(container);
      });
    }
  }

  bindAppearanceEvents(root, container) {
    const formAppearance = root.querySelector('#form-appearance-settings');
    if (formAppearance) {
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
  }

  bindMenuTabEvents(root, container) {
    const modal = root.querySelector('#modal-edit-product');
    const formEdit = root.querySelector('#form-product-edit');

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

    root.querySelectorAll('.btn-toggle-active').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        await this.cms.toggleProductActive(id);
        this.render(container);
      });
    });

    root.querySelectorAll('.btn-del-prod').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Yakin ingin menghapus menu minuman ini?')) {
          await this.cms.deleteProduct(id);
          this.render(container);
        }
      });
    });

    root.querySelector('#btn-cancel-product-modal')?.addEventListener('click', () => {
      modal?.classList.add('hidden');
    });

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

    root.querySelector('#btn-test-gas')?.addEventListener('click', async () => {
      const url = root.querySelector('#input-gas-url').value;
      resultBox.className = 'block p-3 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold';
      resultBox.textContent = 'Menghubungkan ke Google Apps Script...';

      try {
        const res = await this.api.testConnection(url);
        resultBox.className = 'block p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold';
        resultBox.textContent = '✓ Koneksi Berhasil! Respon: ' + (res.message || 'Online');
      } catch (err) {
        resultBox.className = 'block p-3 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-semibold';
        resultBox.textContent = '✕ Koneksi Gagal: ' + err.message;
      }
    });

    root.querySelector('#btn-init-sheets')?.addEventListener('click', async () => {
      if (confirm('Inisialisasi akan memastikan semua tab Sheet (Users, Products, Transactions, Shift_Closings, App_Settings) tersedia. Lanjutkan?')) {
        resultBox.className = 'block p-3 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold';
        resultBox.textContent = 'Menginisialisasi sheet Google Spreadsheet...';
        try {
          const res = await this.api.initSheets();
          resultBox.className = 'block p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold';
          resultBox.textContent = '✓ Tab Sheets berhasil diinisialisasi & data awal disiapkan.';
          await this.cms.syncAllFromGas();
          this.render(container);
        } catch (err) {
          resultBox.className = 'block p-3 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-semibold';
          resultBox.textContent = '✕ Gagal Inisialisasi: ' + err.message;
        }
      }
    });
  }
}
