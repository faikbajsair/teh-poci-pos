/**
 * PosView.js
 * Antarmuka Kasir Utama (Point of Sale) untuk Booth Teh Poci Cabang Limus Pratama Regensi.
 * Desain Mobile-First & Desktop, responsif, berkecepatan tinggi, navigasi intuitif.
 */
export class PosView {
  constructor(posController, productModel, transactionModel, userModel, settingsModel, apiService, navigateFn) {
    this.pos = posController;
    this.products = productModel;
    this.tx = transactionModel;
    this.user = userModel;
    this.settings = settingsModel;
    this.api = apiService;
    this.navigate = navigateFn;

    this.isCartOpenMobile = false;
    this.activePaymentMethod = 'Tunai';
    this.editingNotesItemIndex = null;
  }

  // Format Angka ke Rupiah
  formatRp(amount) {
    return 'Rp ' + Number(amount || 0).toLocaleString('id-ID');
  }

  render(container) {
    const brandName = this.settings.get('brand_name', 'Teh Poci');
    const branchName = this.settings.get('branch_name', 'Teh Poci — Cabang Limus Pratama Regensi');
    const staffName = this.user.getFullName();
    const isAdmin = this.user.isAdmin();
    const isGasActive = this.api.isGasConfigured();
    const showImages = this.settings.get('show_images_in_pos', true);
    const cardRadius = this.settings.get('theme_card_style', 'rounded-2xl');

    container.innerHTML = `
      <div id="pos-root" class="min-h-screen bg-[#FAFDFB] flex flex-col pb-24 lg:pb-0">
        
        <!-- HEADER / NAVBAR UTAMA -->
        <header class="bg-white border-b border-emerald-100/80 sticky top-0 z-30 shadow-sm shadow-emerald-900/5">
          <div class="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2">
            
            <!-- Brand & Info Cabang -->
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-800 p-1.5 shadow flex-shrink-0">
                <img src="assets/img/logo-teh-poci.svg" alt="Teh Poci" class="w-full h-full object-contain">
              </div>
              <div class="leading-tight">
                <div class="flex items-center gap-2">
                  <h1 class="text-base sm:text-lg font-black text-emerald-900 tracking-tight">${brandName}</h1>
                  <span class="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">POS KASIR</span>
                </div>
                <p class="text-[11px] sm:text-xs text-slate-500 font-medium truncate max-w-[200px] sm:max-w-md">
                  Cabang Limus Pratama Regensi (Depan PG-TK Al-Imam)
                </p>
              </div>
            </div>

            <!-- Status Koneksi & Tombol Navigasi Cepat -->
            <div class="flex items-center gap-1.5 sm:gap-2">
              
              <!-- Indikator Integrasi GAS / Offline -->
              <div class="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${isGasActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}">
                <span class="w-2 h-2 rounded-full ${isGasActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}"></span>
                <span>${isGasActive ? 'Sheets Terhubung' : 'Mode Offline / Demo'}</span>
              </div>

              <!-- Menu Navigasi Utama -->
              <button id="nav-btn-history" class="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 text-xs font-bold transition flex items-center gap-1">
                <span>📋</span>
                <span class="hidden sm:inline">Riwayat</span>
              </button>

              <button id="nav-btn-shift" class="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 text-xs font-bold transition flex items-center gap-1">
                <span>🔒</span>
                <span class="hidden sm:inline">Tutup Shift</span>
              </button>

              ${isAdmin ? `
              <button id="nav-btn-cms" class="px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black shadow-sm transition flex items-center gap-1">
                <span>⚙️</span>
                <span>CMS & Tema</span>
              </button>` : ''}

              <!-- User Badge & Logout -->
              <div class="flex items-center gap-1 pl-1 border-l border-slate-200">
                <span class="text-xs font-bold text-emerald-900 hidden lg:inline max-w-[120px] truncate">${staffName}</span>
                <button id="nav-btn-logout" title="Keluar / Logout" class="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition">
                  <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                  </svg>
                </button>
              </div>

            </div>

          </div>
        </header>

        <!-- LAYOUT UTAMA: KATALOG MENU (KIRI/TENGAH) + KERANJANG KASIR (KANAN) -->
        <main class="max-w-7xl mx-auto w-full px-3 sm:px-6 py-4 flex-1 flex flex-col lg:flex-row gap-5 items-start">
          
          <!-- SISI KIRI: PENCARIAN, FILTER KATEGORI, & GRID MENU -->
          <div class="flex-1 w-full min-w-0">
            
            <!-- Pencarian Cepat & Kategori Bar -->
            <div class="bg-white p-3 sm:p-4 rounded-2xl border border-emerald-100/80 shadow-sm mb-4 space-y-3">
              
              <!-- Search Input -->
              <div class="relative">
                <input type="text" id="pos-search-input" value="${this.products.searchQuery}" placeholder="Cari varian rasa minuman... (Jasmine, Thai, Apple, Milo, dll)" class="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-none transition">
                <span class="absolute left-3.5 top-2.5 text-slate-400 text-base">🔍</span>
                ${this.products.searchQuery ? `
                <button id="btn-clear-search" class="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 font-bold text-xs">✕</button>
                ` : ''}
              </div>

              <!-- Kategori Filter Horizontal Scroll -->
              <div class="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
                ${this.renderCategoryPills()}
              </div>

            </div>

            <!-- Grid Menu Minuman -->
            <div id="product-grid" class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              ${this.renderProductCards(showImages, cardRadius)}
            </div>

          </div>

          <!-- SISI KANAN: PANEL KERANJANG TRANSAKSI (DESKTOP) -->
          <aside class="hidden lg:flex flex-col w-96 bg-white rounded-3xl border border-emerald-100/90 shadow-xl shadow-emerald-900/5 sticky top-20 overflow-hidden flex-shrink-0 h-[calc(100vh-6.5rem)]">
            ${this.renderCartContent()}
          </aside>

        </main>

        <!-- FLOATING BOTTOM BAR PESANAN (KHUSUS MOBILE SCREEN) -->
        <div class="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-emerald-100 p-3 shadow-2xl z-30">
          <div class="flex items-center justify-between gap-3">
            <button id="btn-toggle-cart-mobile" class="flex-1 flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-900 text-white font-bold text-xs shadow-lg active:scale-[0.98] transition">
              <div class="flex items-center gap-2">
                <span class="bg-emerald-500 text-slate-900 font-black px-2 py-0.5 rounded-full text-[11px]">${this.tx.getTotalItems()}</span>
                <span>Pesanan Cup</span>
              </div>
              <span class="text-sm font-black text-amber-300">${this.formatRp(this.tx.getTotalAmount())}</span>
            </button>

            <button id="btn-quick-checkout-mobile" ${this.tx.cart.length === 0 ? 'disabled' : ''} class="px-5 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-800/20 active:scale-95 transition flex items-center gap-1.5">
              <span>BAYAR</span>
              <span>➔</span>
            </button>
          </div>
        </div>

        <!-- MODAL DRAWER KERANJANG MOBILE -->
        <div id="mobile-cart-drawer" class="lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 transition-opacity ${this.isCartOpenMobile ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}">
          <div class="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] flex flex-col p-4 shadow-2xl transform transition-transform duration-300 ${this.isCartOpenMobile ? 'translate-y-0' : 'translate-y-full'}">
            <div class="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-3"></div>
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 class="font-black text-emerald-900 text-base">Rincian Pesanan Kasir</h3>
              <button id="btn-close-cart-drawer" class="p-1 rounded-full text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>
            <div class="flex-1 overflow-y-auto py-3">
              ${this.renderCartItemsList()}
            </div>
            <div class="border-t border-slate-100 pt-3">
              ${this.renderCartSummarySection()}
            </div>
          </div>
        </div>

        <!-- MODAL PEMBAYARAN KASIR -->
        <div id="modal-checkout" class="hidden fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div class="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-emerald-100 max-h-[92vh] overflow-y-auto">
            ${this.renderCheckoutModalContent()}
          </div>
        </div>

        <!-- MODAL SUKSES TRANSAKSI & STRUK KASIR -->
        <div id="modal-receipt-success" class="hidden fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div class="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-emerald-100 text-center">
            <div id="receipt-modal-body"></div>
          </div>
        </div>

        <!-- MODAL EDIT CATATAN PESANAN (Less Sugar, Normal Ice, Extra Cup) -->
        <div id="modal-item-notes" class="hidden fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl">
            <h4 class="font-black text-emerald-900 text-sm mb-3">Pilihan Rasa & Catatan Cup</h4>
            <div class="space-y-2 mb-4">
              <button type="button" class="btn-note-preset w-full py-2 px-3 text-xs font-semibold rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-left text-slate-700" data-note="Normal Ice & Sugar">🌿 Normal Ice & Sugar (Standar)</button>
              <button type="button" class="btn-note-preset w-full py-2 px-3 text-xs font-semibold rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-left text-slate-700" data-note="Less Sugar (Sedikit Gula)">🍃 Less Sugar (Sedikit Gula)</button>
              <button type="button" class="btn-note-preset w-full py-2 px-3 text-xs font-semibold rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-left text-slate-700" data-note="Extra Ice (Dingin Maksimal)">❄️ Extra Ice (Dingin Maksimal)</button>
              <button type="button" class="btn-note-preset w-full py-2 px-3 text-xs font-semibold rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-left text-slate-700" data-note="No Ice (Tanpa Es)">☕ No Ice (Tanpa Es)</button>
            </div>
            <input type="text" id="custom-note-input" placeholder="Catatan kustom lainnya..." class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 mb-3 outline-none focus:border-emerald-500">
            <div class="flex gap-2">
              <button type="button" id="btn-cancel-note" class="flex-1 py-2 rounded-xl bg-slate-100 text-xs font-bold text-slate-600">Batal</button>
              <button type="button" id="btn-save-note" class="flex-1 py-2 rounded-xl bg-emerald-700 text-xs font-bold text-white">Simpan</button>
            </div>
          </div>
        </div>

      </div>
    `;

    this.bindEvents(container);
  }

  // Render Kategori Pills
  renderCategoryPills() {
    return this.products.categories.map(cat => {
      const isActive = this.products.selectedCategory === cat;
      return `
        <button type="button" class="cat-pill px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${isActive ? 'bg-emerald-800 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}" data-category="${cat}">
          ${cat}
        </button>
      `;
    }).join('');
  }

  // Render Kartu Menu Minuman
  renderProductCards(showImages, cardRadius) {
    const items = this.products.getFilteredProducts();

    if (items.length === 0) {
      return `
        <div class="col-span-full py-12 text-center text-slate-400">
          <p class="text-3xl mb-2">🍃</p>
          <p class="text-sm font-semibold">Tidak ada varian menu yang cocok.</p>
        </div>
      `;
    }

    return items.map(p => {
      return `
        <div class="product-card group bg-white border border-emerald-100/80 ${cardRadius} p-3 sm:p-4 flex flex-col justify-between shadow-sm hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer select-none active:scale-[0.98]" data-product-id="${p.id}">
          
          <!-- Image Box -->
          ${showImages ? `
          <div class="w-full aspect-square rounded-xl bg-emerald-50/50 p-2 mb-2.5 overflow-hidden flex items-center justify-center relative">
            <img src="${p.image_url || 'assets/img/menu/jasmine-poci.svg'}" alt="${p.name}" class="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200">
            ${p.badge ? `
            <span class="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-[#D9232E] text-white shadow-xs">
              ${p.badge}
            </span>` : ''}
          </div>` : ''}

          <!-- Info Produk -->
          <div>
            <span class="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">${p.category}</span>
            <h3 class="text-xs sm:text-sm font-black text-slate-800 line-clamp-1 group-hover:text-emerald-800 transition">${p.name}</h3>
          </div>

          <!-- Harga & Tombol Tambah (+) -->
          <div class="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span class="text-xs sm:text-sm font-black text-emerald-900">${this.formatRp(p.price)}</span>
            <button type="button" class="btn-add-item w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-black text-base flex items-center justify-center shadow-xs transition">
              +
            </button>
          </div>

        </div>
      `;
    }).join('');
  }

  // Render Isi Keranjang Desktop
  renderCartContent() {
    return `
      <div class="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div class="flex items-center gap-2">
          <span class="text-base font-black text-emerald-900">Pesanan Aktif</span>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
            ${this.tx.getTotalItems()} Cup
          </span>
        </div>
        ${this.tx.cart.length > 0 ? `
        <button id="btn-clear-cart" class="text-[11px] font-bold text-red-600 hover:text-red-700">Kosongkan</button>
        ` : ''}
      </div>

      <!-- Scrollable List of Items -->
      <div class="flex-1 overflow-y-auto p-4 space-y-3">
        ${this.renderCartItemsList()}
      </div>

      <!-- Bottom Summary & Checkout Button -->
      <div class="p-4 border-t border-slate-100 bg-white">
        ${this.renderCartSummarySection()}
      </div>
    `;
  }

  // Render Daftar Item di Keranjang
  renderCartItemsList() {
    if (this.tx.cart.length === 0) {
      return `
        <div class="h-48 flex flex-col items-center justify-center text-center text-slate-400 p-4">
          <span class="text-4xl mb-2">🫖</span>
          <p class="text-xs font-bold text-slate-600">Keranjang Masih Kosong</p>
          <p class="text-[11px] text-slate-400 mt-0.5">Pilih varian rasa minuman Teh Poci di samping untuk mulai transaksi.</p>
        </div>
      `;
    }

    return this.tx.cart.map((item, idx) => `
      <div class="bg-slate-50/80 p-2.5 rounded-2xl border border-slate-200/60 flex items-center justify-between gap-2">
        <div class="flex-1 min-w-0">
          <h4 class="text-xs font-black text-slate-800 truncate">${item.name}</h4>
          <div class="flex items-center gap-1.5 mt-0.5">
            <span class="text-[11px] font-bold text-emerald-800">${this.formatRp(item.price)}</span>
            <button type="button" class="btn-edit-note text-[10px] text-slate-500 hover:text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-slate-200 truncate max-w-[130px]" data-index="${idx}">
              ✏️ ${item.notes || 'Catatan'}
            </button>
          </div>
        </div>

        <!-- Stepper Qty (- / +) -->
        <div class="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200">
          <button type="button" class="btn-qty-minus w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs flex items-center justify-center" data-index="${idx}">-</button>
          <span class="text-xs font-black text-slate-800 w-5 text-center">${item.qty}</span>
          <button type="button" class="btn-qty-plus w-6 h-6 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs flex items-center justify-center" data-index="${idx}">+</button>
        </div>

        <!-- Subtotal -->
        <div class="text-right pl-1">
          <div class="text-xs font-black text-slate-900">${this.formatRp(item.subtotal)}</div>
        </div>
      </div>
    `).join('');
  }

  // Render Rincian Subtotal & Tombol Bayar
  renderCartSummarySection() {
    const subtotal = this.tx.getSubtotal();
    const discount = this.tx.discount;
    const total = this.tx.getTotalAmount();

    return `
      <div class="space-y-1.5 text-xs text-slate-600 mb-3">
        <div class="flex justify-between">
          <span>Subtotal</span>
          <span class="font-bold text-slate-800">${this.formatRp(subtotal)}</span>
        </div>
        ${discount > 0 ? `
        <div class="flex justify-between text-red-600">
          <span>Diskon Promosi</span>
          <span class="font-bold">-${this.formatRp(discount)}</span>
        </div>` : ''}
        <div class="flex justify-between items-baseline pt-2 border-t border-slate-100 text-sm">
          <span class="font-black text-slate-800 uppercase">Total Bayar</span>
          <span class="text-base font-black text-emerald-800">${this.formatRp(total)}</span>
        </div>
      </div>

      <button id="btn-open-checkout" ${this.tx.cart.length === 0 ? 'disabled' : ''} class="w-full py-3.5 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 disabled:shadow-none text-white font-black text-sm tracking-wide shadow-lg shadow-emerald-800/25 active:scale-[0.98] transition flex items-center justify-center gap-2">
        <span>LANJUT KE PEMBAYARAN</span>
        <span>➔</span>
      </button>
    `;
  }

  // Render Konten Modal Pembayaran (Tunai / QRIS / Transfer)
  renderCheckoutModalContent() {
    const total = this.tx.getTotalAmount();
    const cashReceived = this.tx.cashReceived;
    const change = this.tx.getChange();
    const qrisUrl = this.settings.get('qris_image_url');

    return `
      <div>
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 class="font-black text-emerald-900 text-base">Pembayaran Kasir Booth</h3>
            <p class="text-xs text-slate-500">${this.tx.getTotalItems()} Cup • Total Tagihan: <strong class="text-emerald-700">${this.formatRp(total)}</strong></p>
          </div>
          <button id="btn-close-checkout-modal" class="text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
        </div>

        <!-- Pilihan Tab Metode Bayar -->
        <div class="grid grid-cols-3 gap-2 my-4">
          <button type="button" class="btn-pay-tab py-2.5 rounded-xl font-bold text-xs flex flex-col items-center gap-1 transition ${this.activePaymentMethod === 'Tunai' ? 'bg-emerald-800 text-white shadow-sm' : 'bg-slate-100 text-slate-600'}" data-method="Tunai">
            <span>💵</span>
            <span>Uang Tunai</span>
          </button>
          <button type="button" class="btn-pay-tab py-2.5 rounded-xl font-bold text-xs flex flex-col items-center gap-1 transition ${this.activePaymentMethod === 'QRIS' ? 'bg-emerald-800 text-white shadow-sm' : 'bg-slate-100 text-slate-600'}" data-method="QRIS">
            <span>📱</span>
            <span>QRIS Standar</span>
          </button>
          <button type="button" class="btn-pay-tab py-2.5 rounded-xl font-bold text-xs flex flex-col items-center gap-1 transition ${this.activePaymentMethod === 'Transfer' ? 'bg-emerald-800 text-white shadow-sm' : 'bg-slate-100 text-slate-600'}" data-method="Transfer">
            <span>🏦</span>
            <span>Transfer Bank</span>
          </button>
        </div>

        <!-- DETAIL METODE BAYAR -->
        ${this.activePaymentMethod === 'Tunai' ? `
          <div class="space-y-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Uang Diterima dari Pelanggan</label>
              <div class="relative">
                <span class="absolute left-3.5 top-3 text-sm font-bold text-slate-400">Rp</span>
                <input type="number" id="input-cash-received" value="${cashReceived || ''}" placeholder="0" class="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-lg font-black text-slate-800 outline-none focus:bg-white focus:border-emerald-600">
              </div>
            </div>

            <!-- Tombol Preset Cepat (Uang Pas, 10k, 20k, 50k, 100k) -->
            <div>
              <p class="text-[11px] font-bold text-slate-500 mb-1.5 uppercase">Pecahan Cepat:</p>
              <div class="grid grid-cols-5 gap-1.5 text-xs">
                <button type="button" class="btn-quick-cash py-2 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 hover:bg-emerald-100" data-cash="pas">Pas</button>
                <button type="button" class="btn-quick-cash py-2 rounded-lg bg-slate-100 text-slate-700 font-bold hover:bg-slate-200" data-cash="10000">10rb</button>
                <button type="button" class="btn-quick-cash py-2 rounded-lg bg-slate-100 text-slate-700 font-bold hover:bg-slate-200" data-cash="20000">20rb</button>
                <button type="button" class="btn-quick-cash py-2 rounded-lg bg-slate-100 text-slate-700 font-bold hover:bg-slate-200" data-cash="50000">50rb</button>
                <button type="button" class="btn-quick-cash py-2 rounded-lg bg-slate-100 text-slate-700 font-bold hover:bg-slate-200" data-cash="100000">100rb</button>
              </div>
            </div>

            <!-- Tampilan Kembalian -->
            <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span class="text-xs font-bold text-slate-500 block">Uang Kembalian:</span>
                <span id="checkout-change-amount" class="text-lg font-black ${change >= 0 && cashReceived >= total ? 'text-emerald-700' : 'text-red-600'}">
                  ${this.formatRp(change)}
                </span>
              </div>
              <span id="checkout-change-badge" class="${cashReceived < total ? 'text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg' : 'text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg'}">
                ${cashReceived < total ? `Kurang ${this.formatRp(total - cashReceived)}` : '✓ Uang Cukup'}
              </span>
            </div>
          </div>
        ` : ''}

        ${this.activePaymentMethod === 'QRIS' ? `
          <div class="text-center p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <p class="text-xs font-bold text-slate-700">Scan QRIS Booth Teh Poci</p>
            <div class="w-44 h-44 mx-auto bg-white p-2 rounded-xl shadow-inner border border-slate-200 flex items-center justify-center">
              <img src="${qrisUrl}" alt="QRIS Code" class="w-full h-full object-contain">
            </div>
            <p class="text-[11px] text-slate-500">Mendukung BCA, Mandiri, BRI, BNI, GoPay, OVO, ShopeePay, DANA.</p>
          </div>
        ` : ''}

        ${this.activePaymentMethod === 'Transfer' ? `
          <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <p class="font-bold text-slate-700">Nomor Rekening Booth Resmi:</p>
            <div class="p-2.5 bg-white rounded-xl border border-slate-200 font-mono flex justify-between items-center">
              <div>
                <div class="font-bold text-slate-800">BCA: 5410-892-111</div>
                <div class="text-[10px] text-slate-500">a.n. Pak Faik (Teh Poci LPR)</div>
              </div>
              <span class="text-emerald-700 font-bold">Salin</span>
            </div>
            <div class="p-2.5 bg-white rounded-xl border border-slate-200 font-mono flex justify-between items-center">
              <div>
                <div class="font-bold text-slate-800">DANA / OVO: 0812-9876-5432</div>
                <div class="text-[10px] text-slate-500">a.n. Teh Poci Limus Pratama</div>
              </div>
              <span class="text-emerald-700 font-bold">Salin</span>
            </div>
          </div>
        ` : ''}

        <!-- Tombol Konfirmasi Selesai Bayar -->
        <div class="mt-5 pt-3 border-t border-slate-100 flex gap-2">
          <button type="button" id="btn-cancel-checkout" class="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-700">Batal</button>
          <button type="button" id="btn-confirm-payment" ${!this.tx.isCheckoutValid() ? 'disabled' : ''} class="flex-1 py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 font-black text-xs text-white uppercase tracking-wider shadow-lg shadow-emerald-800/20 active:scale-95 transition flex items-center justify-center gap-1.5">
            <span>KONFIRMASI PEMBAYARAN & CETAK STRUK</span>
            <span>✓</span>
          </button>
        </div>

      </div>
    `;
  }

  // BIND EVENTS: Terisolasi pada #pos-root untuk mencegah listener berganda
  bindEvents(container) {
    const root = container.querySelector('#pos-root');
    if (!root) return;

    // 1. Pencarian Real-Time
    const searchInput = root.querySelector('#pos-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.pos.setSearch(e.target.value);
        this.refreshProductGrid(root);
      });
    }

    const clearSearch = root.querySelector('#btn-clear-search');
    if (clearSearch) {
      clearSearch.addEventListener('click', () => {
        this.pos.setSearch('');
        if (searchInput) searchInput.value = '';
        this.refreshProductGrid(root);
      });
    }

    // 2. UNIFIED DELEGATED CLICK DISPATCHER (1x Eksekusi per Klik)
    root.addEventListener('click', (e) => {
      // Kategori Filter Pills
      const catBtn = e.target.closest('.cat-pill');
      if (catBtn) {
        const cat = catBtn.getAttribute('data-category');
        this.pos.setCategory(cat);
        root.querySelectorAll('.cat-pill').forEach(b => {
          b.className = 'cat-pill px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all bg-slate-100 text-slate-600 hover:bg-slate-200';
        });
        catBtn.className = 'cat-pill px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all bg-emerald-800 text-white shadow-sm';
        this.refreshProductGrid(root);
        return;
      }

      // Tambah Produk ke Keranjang (Klik Card atau Tombol +)
      const card = e.target.closest('.product-card');
      if (card) {
        const pId = card.getAttribute('data-product-id');
        this.pos.addToCart(pId);
        this.refreshCart(root);
        return;
      }

      // Stepper Minus Qty
      const btnMinus = e.target.closest('.btn-qty-minus');
      if (btnMinus) {
        const idx = Number(btnMinus.getAttribute('data-index'));
        this.pos.decreaseQty(idx);
        this.refreshCart(root);
        return;
      }

      // Stepper Plus Qty
      const btnPlus = e.target.closest('.btn-qty-plus');
      if (btnPlus) {
        const idx = Number(btnPlus.getAttribute('data-index'));
        this.pos.increaseQty(idx);
        this.refreshCart(root);
        return;
      }

      // Edit Note Minuman
      const btnNote = e.target.closest('.btn-edit-note');
      if (btnNote) {
        const idx = Number(btnNote.getAttribute('data-index'));
        this.openNotesModal(root, idx);
        return;
      }

      // Kosongkan Keranjang
      if (e.target.id === 'btn-clear-cart') {
        if (confirm('Yakin ingin mengosongkan keranjang pesanan?')) {
          this.pos.clearCart();
          this.refreshCart(root);
        }
        return;
      }

      // Navigasi Cepat
      if (e.target.closest('#nav-btn-history')) { this.navigate('history'); return; }
      if (e.target.closest('#nav-btn-shift')) { this.navigate('shift'); return; }
      if (e.target.closest('#nav-btn-cms')) { this.navigate('cms'); return; }
      if (e.target.closest('#nav-btn-logout')) { this.navigate('logout'); return; }

      // Mobile Drawer Toggle
      if (e.target.closest('#btn-toggle-cart-mobile')) {
        this.isCartOpenMobile = true;
        this.refreshMobileDrawer(root);
        return;
      }
      if (e.target.closest('#btn-close-cart-drawer')) {
        this.isCartOpenMobile = false;
        this.refreshMobileDrawer(root);
        return;
      }

      // Buka Modal Pembayaran (Checkout)
      if (e.target.closest('#btn-open-checkout') || e.target.closest('#btn-quick-checkout-mobile')) {
        this.isCartOpenMobile = false;
        this.refreshMobileDrawer(root);
        this.openCheckoutModal(root);
        return;
      }

      // Tutup / Batal Modal Checkout
      if (e.target.id === 'btn-close-checkout-modal' || e.target.id === 'btn-cancel-checkout') {
        root.querySelector('#modal-checkout')?.classList.add('hidden');
        return;
      }

      // Ganti Tab Metode Bayar
      const payTab = e.target.closest('.btn-pay-tab');
      if (payTab) {
        const method = payTab.getAttribute('data-method');
        this.activePaymentMethod = method;
        this.pos.setPaymentMethod(method);
        const modalContent = root.querySelector('#modal-checkout .bg-white');
        if (modalContent) modalContent.innerHTML = this.renderCheckoutModalContent();
        return;
      }

      // Preset Uang Cepat (Pas, 10k, 20k, 50k, 100k)
      const btnCash = e.target.closest('.btn-quick-cash');
      if (btnCash) {
        const val = btnCash.getAttribute('data-cash');
        this.pos.setQuickCash(val);
        const inputCash = root.querySelector('#input-cash-received');
        if (inputCash) inputCash.value = this.tx.cashReceived;
        this.updateCashChangeDisplay(root);
        return;
      }

      // Konfirmasi Pembayaran
      if (e.target.closest('#btn-confirm-payment')) {
        this.handleConfirmPayment(root);
        return;
      }
    });

    // 3. Input Uang Tunai Real-Time (Tanpa merusak DOM input)
    root.addEventListener('input', (e) => {
      if (e.target.id === 'input-cash-received') {
        this.pos.setCashReceived(e.target.value);
        this.updateCashChangeDisplay(root);
      }
    });

    this.bindNotesModalEvents(root);
  }

  // Update Tampilan Kembalian secara Presisi tanpa Re-render Seluruh Modal
  updateCashChangeDisplay(root) {
    const total = this.tx.getTotalAmount();
    const cash = this.tx.cashReceived;
    const change = this.tx.getChange();
    const btnConfirm = root.querySelector('#btn-confirm-payment');
    const changeAmt = root.querySelector('#checkout-change-amount');
    const changeBadge = root.querySelector('#checkout-change-badge');

    if (btnConfirm) {
      btnConfirm.disabled = !this.tx.isCheckoutValid();
    }
    if (changeAmt) {
      changeAmt.textContent = this.formatRp(change);
      changeAmt.className = `text-lg font-black ${change >= 0 && cash >= total ? 'text-emerald-700' : 'text-red-600'}`;
    }
    if (changeBadge) {
      if (cash < total) {
        changeBadge.className = 'text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg';
        changeBadge.textContent = `Kurang ${this.formatRp(total - cash)}`;
      } else {
        changeBadge.className = 'text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg';
        changeBadge.textContent = '✓ Uang Cukup';
      }
    }
  }

  async handleConfirmPayment(root) {
    const btn = root.querySelector('#btn-confirm-payment');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span>Menyimpan Transaksi...</span>';
    }

    try {
      const result = await this.pos.processCheckout();
      root.querySelector('#modal-checkout')?.classList.add('hidden');
      this.refreshCart(root);
      this.openReceiptSuccessModal(root, result.transaction);
    } catch (err) {
      alert(err.message || 'Pembayaran gagal');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span>KONFIRMASI PEMBAYARAN</span>';
      }
    }
  }

  // Buka Modal Sukses & Pratinjau Struk
  openReceiptSuccessModal(root, tx) {
    const modal = root.querySelector('#modal-receipt-success');
    const body = root.querySelector('#receipt-modal-body');

    body.innerHTML = `
      <div class="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl font-black">
        ✓
      </div>
      <h3 class="text-lg font-black text-emerald-950">Transaksi Berhasil!</h3>
      <p class="text-xs text-slate-500 mb-4 font-mono font-bold">${tx.invoice_number}</p>
      
      <!-- Mini Summary -->
      <div class="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs text-slate-700 mb-4 text-left font-mono">
        <div class="flex justify-between font-bold">
          <span>Total Cup:</span>
          <span>${tx.total_items} Cup</span>
        </div>
        <div class="flex justify-between font-bold text-emerald-900 mt-1">
          <span>Total Bayar:</span>
          <span>${this.formatRp(tx.total_amount)} (${tx.payment_method})</span>
        </div>
        ${tx.payment_method === 'Tunai' ? `
        <div class="flex justify-between text-slate-600 mt-1">
          <span>Kembalian:</span>
          <span>${this.formatRp(tx.cash_change)}</span>
        </div>` : ''}
      </div>

      <!-- Action Buttons Cetak & WhatsApp -->
      <div class="space-y-2 mb-4">
        <button type="button" id="btn-print-receipt-modal" class="w-full py-3 rounded-xl bg-slate-900 hover:bg-black text-white font-black text-xs flex items-center justify-center gap-2 shadow-md">
          <span>🖨️ Cetak Struk (Printer Termal)</span>
        </button>

        <div class="flex gap-2">
          <input type="tel" id="input-wa-phone" placeholder="0812xxxx (No. WhatsApp)" class="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none">
          <button type="button" id="btn-share-wa-modal" class="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1">
            <span>Kirim WA</span>
          </button>
        </div>
      </div>

      <button type="button" id="btn-next-transaction" class="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs uppercase tracking-wider">
        Transaksi Baru
      </button>
    `;

    modal.classList.remove('hidden');

    root.querySelector('#btn-print-receipt-modal')?.addEventListener('click', () => {
      this.pos.printReceipt(tx);
    });

    root.querySelector('#btn-share-wa-modal')?.addEventListener('click', () => {
      const phone = root.querySelector('#input-wa-phone').value;
      this.pos.shareWhatsApp(tx, phone);
    });

    root.querySelector('#btn-next-transaction')?.addEventListener('click', () => {
      modal.classList.add('hidden');
    });
  }

  // Modal Catatan Item
  openNotesModal(root, itemIndex) {
    this.editingNotesItemIndex = itemIndex;
    const modal = root.querySelector('#modal-item-notes');
    const input = root.querySelector('#custom-note-input');
    input.value = this.tx.cart[itemIndex].notes || '';
    modal.classList.remove('hidden');
  }

  bindNotesModalEvents(root) {
    const modal = root.querySelector('#modal-item-notes');
    const input = root.querySelector('#custom-note-input');

    root.querySelectorAll('.btn-note-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        input.value = btn.getAttribute('data-note');
      });
    });

    root.querySelector('#btn-cancel-note')?.addEventListener('click', () => {
      modal.classList.add('hidden');
    });

    root.querySelector('#btn-save-note')?.addEventListener('click', () => {
      if (this.editingNotesItemIndex !== null) {
        this.pos.updateItemNotes(this.editingNotesItemIndex, input.value || 'Normal Ice & Sugar');
        modal.classList.add('hidden');
        this.refreshCart(root);
      }
    });
  }

  openCheckoutModal(root) {
    const modal = root.querySelector('#modal-checkout');
    this.pos.setPaymentMethod(this.activePaymentMethod);
    modal.querySelector('.bg-white').innerHTML = this.renderCheckoutModalContent();
    modal.classList.remove('hidden');
  }

  refreshProductGrid(root) {
    const grid = root.querySelector('#product-grid');
    if (grid) {
      grid.innerHTML = this.renderProductCards(
        this.settings.get('show_images_in_pos', true),
        this.settings.get('theme_card_style', 'rounded-2xl')
      );
    }
  }

  refreshCart(root) {
    // Refresh Desktop Sidebar
    const aside = root.querySelector('aside');
    if (aside) aside.innerHTML = this.renderCartContent();

    // Refresh Mobile Floating Bar
    const totalItems = this.tx.getTotalItems();
    const totalAmt = this.formatRp(this.tx.getTotalAmount());
    const mobileBtn = root.querySelector('#btn-toggle-cart-mobile');
    if (mobileBtn) {
      mobileBtn.innerHTML = `
        <div class="flex items-center gap-2">
          <span class="bg-emerald-500 text-slate-900 font-black px-2 py-0.5 rounded-full text-[11px]">${totalItems}</span>
          <span>Pesanan Cup</span>
        </div>
        <span class="text-sm font-black text-amber-300">${totalAmt}</span>
      `;
    }
    const quickCheckout = root.querySelector('#btn-quick-checkout-mobile');
    if (quickCheckout) {
      quickCheckout.disabled = this.tx.cart.length === 0;
    }

    // Refresh Drawer
    this.refreshMobileDrawer(root);
  }

  refreshMobileDrawer(root) {
    const drawer = root.querySelector('#mobile-cart-drawer');
    if (drawer) {
      if (this.isCartOpenMobile) {
        drawer.className = 'lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 transition-opacity opacity-100 pointer-events-auto';
        drawer.querySelector('.absolute').className = 'absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] flex flex-col p-4 shadow-2xl transform transition-transform duration-300 translate-y-0';
      } else {
        drawer.className = 'lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 transition-opacity opacity-0 pointer-events-none';
        drawer.querySelector('.absolute').className = 'absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] flex flex-col p-4 shadow-2xl transform transition-transform duration-300 translate-y-full';
      }
      const list = drawer.querySelector('.overflow-y-auto');
      if (list) list.innerHTML = this.renderCartItemsList();
      const summary = drawer.querySelector('.border-t');
      if (summary) summary.innerHTML = this.renderCartSummarySection();
    }
  }
}
