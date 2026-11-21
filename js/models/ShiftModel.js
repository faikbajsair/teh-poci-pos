/**
 * ShiftModel.js
 * Model untuk mengelola pembukaan & penutupan shift kasir booth (Rekap Tutup Kasir Harian).
 * Menghitung saldo awal kas, omzet tunai vs non-tunai, kas fisik aktual, selisih kas, dan catatan inventori/stok.
 */
export class ShiftModel {
  constructor() {
    this.initialCash = 50000; // Modal awal kas kecil kasir (kembalian) default Rp 50.000
    this.actualCashCounted = 0;
    this.notes = '';
    this.closedShifts = [];
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem('tehpoci_shifts');
      if (stored) {
        this.closedShifts = JSON.parse(stored);
      }
      const savedInitial = localStorage.getItem('tehpoci_initial_cash');
      if (savedInitial) {
        this.initialCash = Number(savedInitial);
      }
    } catch (e) {
      console.warn('Gagal membaca data shift:', e);
    }
  }

  saveToStorage() {
    localStorage.setItem('tehpoci_shifts', JSON.stringify(this.closedShifts));
    localStorage.setItem('tehpoci_initial_cash', this.initialCash.toString());
  }

  setInitialCash(amount) {
    this.initialCash = Number(amount || 0);
    this.saveToStorage();
  }

  /**
   * Hitung kalkulasi rekap kasir berdasarkan daftar transaksi shift hari ini
   */
  calculateSummary(transactions, filterDate = null) {
    const targetDateStr = filterDate || new Date().toISOString().slice(0, 10);

    // Filter transaksi hari ini
    const todayTxs = (transactions || []).filter(tx => {
      const txDate = tx.timestamp ? tx.timestamp.slice(0, 10) : '';
      return txDate === targetDateStr;
    });

    let totalCashSales = 0;
    let totalQrisSales = 0;
    let totalTransferSales = 0;
    let totalCupsSold = 0;

    todayTxs.forEach(tx => {
      const amt = Number(tx.total_amount || 0);
      if (tx.payment_method === 'Tunai') {
        totalCashSales += amt;
      } else if (tx.payment_method === 'QRIS') {
        totalQrisSales += amt;
      } else if (tx.payment_method === 'Transfer') {
        totalTransferSales += amt;
      }
      totalCupsSold += Number(tx.total_items || 0);
    });

    const totalSystemCash = this.initialCash + totalCashSales;
    const cashDifference = (this.actualCashCounted || 0) - totalSystemCash;

    return {
      date: targetDateStr,
      transactionCount: todayTxs.length,
      totalCupsSold: totalCupsSold,
      initialCash: this.initialCash,
      totalCashSales: totalCashSales,
      totalQrisSales: totalQrisSales,
      totalTransferSales: totalTransferSales,
      totalRevenue: totalCashSales + totalQrisSales + totalTransferSales,
      totalSystemCash: totalSystemCash,
      actualCashCounted: this.actualCashCounted,
      cashDifference: cashDifference
    };
  }

  /**
   * Rekam dan kunci laporan tutup kasir
   */
  saveShiftClosing(summaryData, cashierUser, notes) {
    const now = new Date();
    const shiftRecord = {
      id: 'SFT-' + Date.now(),
      shift_date: summaryData.date,
      shift_time: now.toLocaleTimeString('id-ID'),
      cashier_id: cashierUser ? cashierUser.id : 'STF-01',
      cashier_name: cashierUser ? cashierUser.full_name : 'Pak Riza Lahmadi',
      branch_code: cashierUser ? (cashierUser.branch_code || 'LPR-01') : 'LPR-01',
      initial_cash: summaryData.initialCash,
      total_cash_sales: summaryData.totalCashSales,
      total_qris_sales: summaryData.totalQrisSales,
      total_transfer_sales: summaryData.totalTransferSales,
      total_system_cash: summaryData.totalSystemCash,
      actual_cash_counted: summaryData.actualCashCounted,
      cash_difference: summaryData.cashDifference,
      total_transactions: summaryData.transactionCount,
      total_cups: summaryData.totalCupsSold,
      notes: notes || '',
      created_at: now.toISOString()
    };

    this.closedShifts.unshift(shiftRecord);
    this.saveToStorage();
    return shiftRecord;
  }
}
