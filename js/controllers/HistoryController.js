/**
 * HistoryController.js
 * Controller untuk mengelola riwayat transaksi, filter tanggal/metode bayar,
 * pencarian faktur, serta cetak ulang struk transaksi.
 */
export class HistoryController {
  constructor(transactionModel, apiService, printService) {
    this.transactionModel = transactionModel;
    this.apiService = apiService;
    this.printService = printService;
    this.filterDate = '';
    this.filterPayment = 'Semua';
    this.searchQuery = '';
    this.isSyncing = false;
  }

  // Sinkronisasi data riwayat transaksi real-time dari Google Spreadsheet
  async syncTransactionsFromGas() {
    if (!this.apiService || !this.apiService.isGasConfigured()) return [];
    this.isSyncing = true;
    try {
      const data = await this.apiService.fetchAllData();
      if (data && data.recentTransactions && Array.isArray(data.recentTransactions)) {
        this.transactionModel.mergeTransactionsFromGas(data.recentTransactions);
      }
      return this.transactionModel.transactionsHistory;
    } catch (err) {
      console.warn('Gagal sinkronisasi transaksi dari GAS:', err);
      return this.transactionModel.transactionsHistory;
    } finally {
      this.isSyncing = false;
    }
  }

  getFilteredTransactions() {
    let list = this.transactionModel.transactionsHistory || [];

    if (this.filterDate) {
      list = list.filter(tx => {
        if (!tx.timestamp) return false;
        // Konversi timestamp UTC / ISO ke YYYY-MM-DD waktu lokal
        try {
          const d = new Date(tx.timestamp);
          if (!isNaN(d.getTime())) {
            const y = d.getFullYear();
            const m = ('0' + (d.getMonth() + 1)).slice(-2);
            const day = ('0' + d.getDate()).slice(-2);
            return `${y}-${m}-${day}` === this.filterDate;
          }
        } catch (e) {
          // fallback string
        }
        return String(tx.timestamp).startsWith(this.filterDate);
      });
    }

    if (this.filterPayment && this.filterPayment !== 'Semua') {
      list = list.filter(tx => tx.payment_method === this.filterPayment);
    }

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(tx => 
        (tx.invoice_number && tx.invoice_number.toLowerCase().includes(q)) ||
        (tx.cashier_name && tx.cashier_name.toLowerCase().includes(q)) ||
        (tx.items && tx.items.some(it => it.name.toLowerCase().includes(q)))
      );
    }

    return list;
  }

  // Hitung total omzet riwayat terfilter
  getFilteredSummary() {
    const list = this.getFilteredTransactions();
    const totalAmount = list.reduce((sum, tx) => sum + Number(tx.total_amount || 0), 0);
    const totalCups = list.reduce((sum, tx) => sum + Number(tx.total_items || 0), 0);
    return {
      count: list.length,
      totalAmount,
      totalCups
    };
  }

  reprintReceipt(invoiceNumber) {
    const tx = this.transactionModel.transactionsHistory.find(t => t.invoice_number === invoiceNumber);
    if (tx) {
      this.printService.printReceipt(tx);
    } else {
      alert('Transaksi tidak ditemukan.');
    }
  }

  shareReceiptWa(invoiceNumber, phone) {
    const tx = this.transactionModel.transactionsHistory.find(t => t.invoice_number === invoiceNumber);
    if (tx) {
      this.printService.shareViaWhatsApp(tx, phone);
    }
  }
}
