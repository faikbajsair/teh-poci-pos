/**
 * HistoryController.js
 * Controller untuk mengelola riwayat transaksi, filter tanggal/metode bayar,
 * pencarian faktur, serta cetak ulang struk transaksi.
 */
export class HistoryController {
  constructor(transactionModel, printService) {
    this.transactionModel = transactionModel;
    this.printService = printService;
    this.filterDate = '';
    this.filterPayment = 'Semua';
    this.searchQuery = '';
  }

  getFilteredTransactions() {
    let list = this.transactionModel.transactionsHistory || [];

    if (this.filterDate) {
      list = list.filter(tx => tx.timestamp && tx.timestamp.startsWith(this.filterDate));
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
