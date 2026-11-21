/**
 * ShiftView.js
 * Antarmuka Form "Tutup Shift / Rekap Harian Kasir Booth".
 * Menghitung saldo awal kas, omzet tunai/QRIS/transfer, kalkulator pecahan kas fisik riil,
 * selisih kas (surplus/defisit), catatan stok menipis, dan cetak laporan tutup shift.
 */
export class ShiftView {
  constructor(shiftController, userModel, settingsModel, navigateFn) {
    this.shift = shiftController;
    this.user = userModel;
    this.settings = settingsModel;
    this.navigate = navigateFn;

    // Kalkulator pecahan uang kasir
    this.denominations = {
      100000: 0,
      50000: 0,
      20000: 0,
      10000: 0,
      5000: 0,
      2000: 0,
      1000: 0,
      500: 0
    };
  }

  formatRp(amount) {
    return 'Rp ' + Number(amount || 0).toLocaleString('id-ID');
  }

  render(container) {
    const summary = this.shift.getCurrentSummary();
    const staffName = this.user.getFullName();

    container.innerHTML = `
      <div id="shift-root" class="min-h-screen bg-[#FAFDFB] flex flex-col pb-12">
        
        <!-- Header -->
        <header class="bg-white border-b border-emerald-100 sticky top-0 z-20 shadow-xs">
          <div class="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <button id="btn-back-to-pos" class="p-2 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 font-bold text-xs flex items-center gap-1 transition">
                <span>←</span>
                <span>Kembali ke Kasir</span>
              </button>
              <div>
                <h1 class="text-base font-black text-emerald-900">Rekap Kasir & Tutup Shift Harian</h1>
                <p class="text-xs text-slate-500">Cabang Limus Pratama Regensi • Kasir: ${staffName}</p>
              </div>
            </div>
          </div>
        </header>

        <!-- Body Form Tutup Shift -->
        <main class="max-w-4xl mx-auto w-full px-4 py-6 space-y-6">
          
          <!-- KARTU RINGKASAN SISTEM -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm">
              <span class="text-[10px] font-bold text-slate-400 uppercase block">Modal Awal Kas</span>
              <span class="text-base sm:text-lg font-black text-slate-800">${this.formatRp(summary.initialCash)}</span>
            </div>
            <div class="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm">
              <span class="text-[10px] font-bold text-emerald-600 uppercase block">Penjualan Tunai</span>
              <span class="text-base sm:text-lg font-black text-emerald-800">${this.formatRp(summary.totalCashSales)}</span>
            </div>
            <div class="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm">
              <span class="text-[10px] font-bold text-sky-600 uppercase block">Penjualan Non-Tunai</span>
              <span class="text-base sm:text-lg font-black text-sky-800">${this.formatRp(summary.totalQrisSales + summary.totalTransferSales)}</span>
            </div>
            <div class="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm">
              <span class="text-[10px] font-bold text-amber-600 uppercase block">Total Omzet Shift</span>
              <span class="text-base sm:text-lg font-black text-amber-800">${this.formatRp(summary.totalRevenue)}</span>
            </div>
          </div>

          <!-- FORM AUDIT & HITUNG KAS FISIK -->
          <div class="bg-white p-5 sm:p-6 rounded-3xl border border-emerald-100 shadow-sm space-y-5">
            
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 class="font-black text-emerald-950 text-base">Pemeriksaan & Hitung Uang Kas Fisik</h3>
                <p class="text-xs text-slate-500">Hitung total uang fisik di laci kasir (Modal Awal + Penjualan Tunai).</p>
              </div>
              <span class="text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200">
                Kas Sistem Seharusnya: <strong id="val-system-cash">${this.formatRp(summary.totalSystemCash)}</strong>
              </span>
            </div>

            <!-- Kalkulator Pecahan Uang Kertas & Logam -->
            <div class="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70">
              <p class="text-xs font-bold text-slate-700 mb-2.5 flex items-center gap-1.5">
                <span>🧮</span>
                <span>Kalkulator Cepat Pecahan Lembar Uang di Laci:</span>
              </p>
              
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                ${Object.keys(this.denominations).map(denom => `
                  <div class="bg-white p-2 rounded-xl border border-slate-200 flex items-center justify-between gap-1">
                    <span class="font-bold text-slate-600">${Number(denom) >= 1000 ? `${denom/1000}rb` : denom}:</span>
                    <div class="flex items-center gap-1">
                      <input type="number" min="0" value="${this.denominations[denom] || ''}" placeholder="0" class="input-denom w-12 text-center py-1 rounded bg-slate-50 border border-slate-200 font-bold outline-none focus:bg-white focus:border-emerald-500" data-denom="${denom}">
                      <span class="text-[10px] text-slate-400">lbr</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Input Total Kas Fisik Aktual -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Total Uang Fisik Aktual Dihitung (Rp)</label>
                <input type="number" id="input-actual-cash" value="${summary.actualCashCounted || ''}" placeholder="Masukkan nominal total..." class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-base font-black text-slate-800 outline-none focus:bg-white focus:border-emerald-600">
              </div>

              <!-- Box Selisih Kas -->
              <div id="box-diff-container" class="p-4 rounded-2xl ${summary.cashDifference === 0 ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : (summary.cashDifference < 0 ? 'bg-red-50 border border-red-200 text-red-800' : 'bg-amber-50 border border-amber-200 text-amber-800')}">
                <div class="flex justify-between items-center">
                  <span class="text-xs font-bold uppercase">Status Selisih Kas:</span>
                  <span id="badge-diff-status" class="text-xs font-bold px-2 py-0.5 rounded-full ${summary.cashDifference === 0 ? 'bg-emerald-200 text-emerald-900' : 'bg-red-200 text-red-900'}">
                    ${summary.cashDifference === 0 ? '✓ Tepat / Seimbang' : (summary.cashDifference < 0 ? 'Defisit / Kurang' : 'Surplus / Lebih')}
                  </span>
                </div>
                <div id="val-cash-difference" class="text-xl font-black mt-1">
                  ${summary.cashDifference >= 0 ? '+' : ''}${this.formatRp(summary.cashDifference)}
                </div>
              </div>
            </div>

            <!-- Input Catatan Kendala / Stok Menipis -->
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Catatan Kendala Booth & Bahan Baku / Stok Menipis</label>
              <textarea id="shift-notes" rows="3" placeholder="Contoh: Cup 16oz tersisa 20 pcs, sirup leci hampir habis, mesin sealer lancar aman..." class="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 outline-none focus:bg-white focus:border-emerald-600">${this.shift.shiftModel.notes || ''}</textarea>
            </div>

            <!-- Tombol Aksi Tutup Shift -->
            <div class="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
              <button type="button" id="btn-submit-shift" class="flex-1 py-3.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-800/20 active:scale-95 transition flex items-center justify-center gap-2">
                <span>SIMPAN LAPORAN TUTUP SHIFT & CETAK REKAP</span>
                <span>🔒</span>
              </button>
            </div>

          </div>

        </main>
      </div>
    `;

    this.bindEvents(container);
  }

  updateDifferenceDisplay(root) {
    const summary = this.shift.getCurrentSummary();
    const diffContainer = root.querySelector('#box-diff-container');
    const badgeStatus = root.querySelector('#badge-diff-status');
    const valDiff = root.querySelector('#val-cash-difference');

    if (diffContainer && badgeStatus && valDiff) {
      if (summary.cashDifference === 0) {
        diffContainer.className = 'p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800';
        badgeStatus.className = 'text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900';
        badgeStatus.textContent = '✓ Tepat / Seimbang';
      } else if (summary.cashDifference < 0) {
        diffContainer.className = 'p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800';
        badgeStatus.className = 'text-xs font-bold px-2 py-0.5 rounded-full bg-red-200 text-red-900';
        badgeStatus.textContent = 'Defisit / Kurang';
      } else {
        diffContainer.className = 'p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800';
        badgeStatus.className = 'text-xs font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900';
        badgeStatus.textContent = 'Surplus / Lebih';
      }
      valDiff.textContent = (summary.cashDifference >= 0 ? '+' : '') + this.formatRp(summary.cashDifference);
    }
  }

  bindEvents(container) {
    const root = container.querySelector('#shift-root');
    if (!root) return;

    root.querySelector('#btn-back-to-pos')?.addEventListener('click', () => this.navigate('pos'));

    // Input Actual Cash Manual - Update real-time tanpa reload DOM (menjaga kursor tetap fokus)
    const actualCashInput = root.querySelector('#input-actual-cash');
    actualCashInput?.addEventListener('input', (e) => {
      this.shift.setActualCash(e.target.value);
      this.updateDifferenceDisplay(root);
    });

    // Kalkulator Pecahan
    root.querySelectorAll('.input-denom').forEach(input => {
      input.addEventListener('input', () => {
        const denom = Number(input.getAttribute('data-denom'));
        const count = Number(input.value || 0);
        this.denominations[denom] = count;

        let total = 0;
        for (let d in this.denominations) {
          total += Number(d) * this.denominations[d];
        }
        this.shift.setActualCash(total);
        if (actualCashInput) actualCashInput.value = total;
        this.updateDifferenceDisplay(root);
      });
    });

    // Notes
    const notesInput = root.querySelector('#shift-notes');
    notesInput?.addEventListener('input', (e) => {
      this.shift.setNotes(e.target.value);
    });

    // Submit Shift Closing
    root.querySelector('#btn-submit-shift')?.addEventListener('click', async () => {
      if (confirm('Konfirmasi simpan dan tutup shift kasir hari ini?')) {
        const btn = root.querySelector('#btn-submit-shift');
        btn.disabled = true;
        btn.innerHTML = '<span>Menyimpan Laporan ke Spreadsheet...</span>';

        try {
          const shiftRecord = await this.shift.submitShiftClosing();
          this.shift.printShiftReport(shiftRecord);
          alert('Laporan tutup shift kasir berhasil disimpan!');
          this.navigate('pos');
        } catch (err) {
          alert('Gagal menyimpan tutup shift: ' + err.message);
          btn.disabled = false;
          btn.innerHTML = '<span>SIMPAN LAPORAN TUTUP SHIFT & CETAK REKAP</span>';
        }
      }
    });
  }
}
