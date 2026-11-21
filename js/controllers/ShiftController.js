/**
 * ShiftController.js
 * Controller untuk menangani alur tutup kasir harian (Shift Closing),
 * pencatatan kas fisik riil, audit selisih kas, dan sinkronisasi ke Google Spreadsheet.
 */
export class ShiftController {
  constructor(shiftModel, transactionModel, userModel, apiService, printService) {
    this.shiftModel = shiftModel;
    this.transactionModel = transactionModel;
    this.userModel = userModel;
    this.apiService = apiService;
    this.printService = printService;
  }

  // Ambil ringkasan shift saat ini
  getCurrentSummary() {
    return this.shiftModel.calculateSummary(this.transactionModel.transactionsHistory);
  }

  // Update modal awal kas kecil
  setInitialCash(amount) {
    this.shiftModel.setInitialCash(amount);
  }

  // Update uang fisik aktual yang dihitung kasir
  setActualCash(amount) {
    this.shiftModel.actualCashCounted = Number(amount || 0);
  }

  // Update catatan kendala / stok menipis
  setNotes(notes) {
    this.shiftModel.notes = notes;
  }

  /**
   * Submit Laporan Tutup Kasir
   */
  async submitShiftClosing() {
    const summary = this.getCurrentSummary();
    const cashierUser = this.userModel.currentUser;
    const notes = this.shiftModel.notes;

    // Rekam di model lokal
    const shiftRecord = this.shiftModel.saveShiftClosing(summary, cashierUser, notes);

    // Kirim ke Google Apps Script
    try {
      await this.apiService.saveShiftClosing(shiftRecord);
    } catch (e) {
      console.warn('Gagal sinkronisasi tutup shift ke GAS:', e);
    }

    return shiftRecord;
  }

  /**
   * Cetak Laporan Rekap Tutup Shift Kasir (Format Thermal / Kertas)
   */
  printShiftReport(shiftRecord) {
    const brandName = 'TEH POCI';
    const branchName = 'Cabang Limus Pratama Regensi';
    const formatRp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

    const html = `
      <div style="width:100%; max-width:300px; margin:0 auto; padding:16px 12px; font-family:'Courier New', monospace; font-size:11px; color:#111;">
        <div style="text-align:center; margin-bottom:10px;">
          <img src="assets/img/logo-teh-poci.png" alt="Teh Poci" style="max-height:45px; margin:0 auto 6px auto; display:block;" onerror="this.style.display='none'"/>
          <div style="font-size:16px; font-weight:bold; color:#0B5834;">${brandName}</div>
          <div style="font-size:11px; font-weight:bold;">LAPORAN TUTUP SHIFT KASIR</div>
          <div style="font-size:9px; color:#555;">${branchName}</div>
        </div>
        <div style="border-top:1px dashed #333; margin:8px 0;"></div>
        <div><strong>Waktu Tutup:</strong> ${shiftRecord.shift_date} ${shiftRecord.shift_time}</div>
        <div><strong>Kasir:</strong> ${shiftRecord.cashier_name}</div>
        <div><strong>Kode Cabang:</strong> ${shiftRecord.branch_code}</div>
        <div style="border-top:1px dashed #333; margin:8px 0;"></div>
        
        <div style="display:flex; justify-content:space-between; margin:3px 0;">
          <span>Modal Awal Kas:</span>
          <span>${formatRp(shiftRecord.initial_cash)}</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin:3px 0;">
          <span>Penjualan Tunai:</span>
          <span>${formatRp(shiftRecord.total_cash_sales)}</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin:3px 0;">
          <span>Penjualan QRIS:</span>
          <span>${formatRp(shiftRecord.total_qris_sales)}</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin:3px 0;">
          <span>Penjualan Transfer:</span>
          <span>${formatRp(shiftRecord.total_transfer_sales)}</span>
        </div>
        
        <div style="border-top:1px dashed #333; margin:8px 0;"></div>
        <div style="display:flex; justify-content:space-between; margin:3px 0; font-weight:bold;">
          <span>Total Transaksi:</span>
          <span>${shiftRecord.total_transactions} Trx (${shiftRecord.total_cups || 0} Cup)</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin:3px 0; font-weight:bold;">
          <span>Kas Sistem (Modal+Tunai):</span>
          <span>${formatRp(shiftRecord.total_system_cash)}</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin:3px 0; font-weight:bold;">
          <span>Kas Fisik Aktual:</span>
          <span>${formatRp(shiftRecord.actual_cash_counted)}</span>
        </div>
        
        <div style="display:flex; justify-content:space-between; margin:5px 0; padding:4px; font-weight:bold; background:${shiftRecord.cash_difference === 0 ? '#E8F5E9' : '#FFEBEE'};">
          <span>Selisih Kas:</span>
          <span>${shiftRecord.cash_difference >= 0 ? '+' : ''}${formatRp(shiftRecord.cash_difference)}</span>
        </div>

        ${shiftRecord.notes ? `
        <div style="margin-top:8px; padding-top:4px; border-top:1px dotted #ccc;">
          <strong>Catatan Kasir:</strong>
          <div style="font-size:10px; color:#444;">${shiftRecord.notes}</div>
        </div>` : ''}

        <div style="border-top:1px dashed #333; margin:12px 0 6px 0;"></div>
        <div style="text-align:center; font-size:9px; color:#666;">
          Tanda Tangan Kasir: ___________________
        </div>
      </div>
    `;

    const printWin = window.open('', '_blank', 'width=380,height=600');
    if (printWin) {
      printWin.document.write(`
        <!DOCTYPE html>
        <html>
        <head><title>Rekap Kasir - ${shiftRecord.id}</title></head>
        <body>${html}
        <script>window.onload=function(){window.print(); setTimeout(function(){window.close();}, 500);};</script>
        </body>
        </html>
      `);
      printWin.document.close();
    }
  }
}
