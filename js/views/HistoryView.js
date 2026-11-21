/**
 * HistoryView.js
 * Antarmuka Riwayat Transaksi Kasir Booth:
 * Filter tanggal & metode bayar, pencarian nomor faktur, ringkasan omzet harian, dan cetak ulang struk.
 */
export class HistoryView {
  constructor(historyController, userModel, settingsModel, navigateFn) {
    this.history = historyController;
    this.user = userModel;
    this.settings = settingsModel;
    this.navigate = navigateFn;
  }

  formatRp(amount) {
    return 'Rp ' + Number(amount || 0).toLocaleString('id-ID');
  }

  render(container) {
    const summary = this.history.getFilteredSummary();
    const list = this.history.getFilteredTransactions();
    const brandName = this.settings.get('brand_name', 'Teh Poci');

    container.innerHTML = `
      <div class="min-h-screen bg-[#FAFDFB] flex flex-col pb-12">
        
        <!-- Header Navigasi -->
        <header class="bg-white border-b border-emerald-100 sticky top-0 z-20 shadow-xs">
          <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <button id="btn-back-to-pos" class="p-2 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 font-bold text-xs flex items-center gap-1 transition">
                <span>←</span>
                <span>Kembali ke Kasir</span>
              </button>
              <div>
                <h1 class="text-base font-black text-emerald-900">Riwayat Penjualan Kasir</h1>
                <p class="text-xs text-slate-500">Cabang Limus Pratama Regensi</p>
              </div>
            </div>

            <!-- Ringkasan Cepat -->
            <div class="hidden sm:flex items-center gap-3">
              <div class="text-right">
                <span class="text-[10px] text-slate-400 font-bold uppercase block">Total Transaksi</span>
                <span class="text-xs font-black text-slate-800">${summary.count} Trx (${summary.totalCups} Cup)</span>
              </div>
              <div class="text-right pl-3 border-l border-slate-200">
                <span class="text-[10px] text-slate-400 font-bold uppercase block">Total Omzet</span>
                <span class="text-sm font-black text-emerald-800">${this.formatRp(summary.totalAmount)}</span>
              </div>
            </div>
          </div>
        </header>

        <!-- Main Body -->
        <main class="max-w-7xl mx-auto w-full px-4 py-5 flex-1 space-y-4">
          
          <!-- Filter & Search Bar -->
          <div class="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            <div class="flex-1 w-full md:w-auto relative">
              <input type="text" id="history-search" value="${this.history.searchQuery}" placeholder="Cari No. Faktur, nama kasir, atau menu..." class="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium outline-none focus:bg-white focus:border-emerald-600">
              <span class="absolute left-3 top-2.5 text-slate-400 text-sm">🔍</span>
            </div>

            <div class="flex items-center gap-2 w-full md:w-auto">
              <input type="date" id="history-date-filter" value="${this.history.filterDate}" class="px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 font-medium outline-none text-slate-700">
              
              <select id="history-payment-filter" class="px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 font-medium outline-none text-slate-700">
                <option value="Semua">Semua Metode</option>
                <option value="Tunai">Tunai</option>
                <option value="QRIS">QRIS</option>
                <option value="Transfer">Transfer</option>
              </select>
            </div>
          </div>

          <!-- Tabel / List Transaksi -->
          <div class="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-100">
                  <tr>
                    <th class="p-3.5">Faktur / Waktu</th>
                    <th class="p-3.5">Kasir</th>
                    <th class="p-3.5">Rincian Item</th>
                    <th class="p-3.5">Metode Bayar</th>
                    <th class="p-3.5 text-right">Total Transaksi</th>
                    <th class="p-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 text-slate-700">
                  ${list.length === 0 ? `
                    <tr>
                      <td colspan="6" class="p-8 text-center text-slate-400">
                        <span class="text-2xl block mb-1">📋</span>
                        Belum ada data transaksi yang sesuai filter.
                      </td>
                    </tr>
                  ` : list.map(tx => `
                    <tr class="hover:bg-emerald-50/40 transition">
                      <td class="p-3.5">
                        <div class="font-bold text-slate-900">${tx.invoice_number}</div>
                        <div class="text-[10px] text-slate-400">${tx.display_date || ''} ${tx.display_time || ''}</div>
                      </td>
                      <td class="p-3.5 font-medium text-slate-700">
                        ${tx.cashier_name}
                      </td>
                      <td class="p-3.5">
                        <div class="font-semibold text-slate-800">${tx.total_items} Cup</div>
                        <div class="text-[10px] text-slate-500 truncate max-w-xs">
                          ${(tx.items || []).map(i => `${i.qty}x ${i.name}`).join(', ')}
                        </div>
                      </td>
                      <td class="p-3.5">
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${tx.payment_method === 'Tunai' ? 'bg-emerald-100 text-emerald-800' : (tx.payment_method === 'QRIS' ? 'bg-sky-100 text-sky-800' : 'bg-purple-100 text-purple-800')}">
                          ${tx.payment_method}
                        </span>
                      </td>
                      <td class="p-3.5 text-right font-black text-slate-900">
                        ${this.formatRp(tx.total_amount)}
                      </td>
                      <td class="p-3.5 text-center">
                        <div class="flex items-center justify-center gap-1">
                          <button type="button" class="btn-reprint px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[11px] font-bold text-slate-700" data-inv="${tx.invoice_number}" title="Cetak Ulang Struk">
                            🖨️ Struk
                          </button>
                          <button type="button" class="btn-share-wa px-2 py-1 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-[11px] font-bold text-emerald-800" data-inv="${tx.invoice_number}" title="Kirim Struk WA">
                            📱 WA
                          </button>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>
    `;

    this.bindEvents(container);
  }

  bindEvents(container) {
    container.querySelector('#btn-back-to-pos')?.addEventListener('click', () => this.navigate('pos'));

    // Search
    const searchInput = container.querySelector('#history-search');
    searchInput?.addEventListener('input', (e) => {
      this.history.searchQuery = e.target.value;
      this.render(container);
    });

    // Date Filter
    const dateInput = container.querySelector('#history-date-filter');
    dateInput?.addEventListener('change', (e) => {
      this.history.filterDate = e.target.value;
      this.render(container);
    });

    // Payment Filter
    const paymentSelect = container.querySelector('#history-payment-filter');
    paymentSelect?.addEventListener('change', (e) => {
      this.history.filterPayment = e.target.value;
      this.render(container);
    });

    // Reprint Receipt
    container.querySelectorAll('.btn-reprint').forEach(btn => {
      btn.addEventListener('click', () => {
        const inv = btn.getAttribute('data-inv');
        this.history.reprintReceipt(inv);
      });
    });

    // Share WA
    container.querySelectorAll('.btn-share-wa').forEach(btn => {
      btn.addEventListener('click', () => {
        const inv = btn.getAttribute('data-inv');
        const phone = prompt('Masukkan Nomor WhatsApp Pelanggan (contoh: 081298765432):');
        if (phone) {
          this.history.shareReceiptWa(inv, phone);
        }
      });
    });
  }
}
