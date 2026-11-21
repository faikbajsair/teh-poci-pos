/**
 * PosController.js
 * Controller untuk logika kasir POS: tambah produk ke keranjang, filter kategori,
 * modifikasi kuantitas, kalkulasi diskon & kembalian, proses bayar, dan simpan transaksi.
 */
export class PosController {
  constructor(productModel, transactionModel, userModel, apiService, printService, notifyFn) {
    this.productModel = productModel;
    this.transactionModel = transactionModel;
    this.userModel = userModel;
    this.apiService = apiService;
    this.printService = printService;
    this.notify = notifyFn || console.log;
    this.isProcessingPayment = false;
  }

  // Tambah item ke keranjang
  addToCart(productId, notes = '') {
    const product = this.productModel.getProductById(productId);
    if (!product) {
      this.notify('Produk tidak ditemukan', 'error');
      return;
    }
    this.transactionModel.addItem(product, notes);
  }

  // Tambah jumlah
  increaseQty(index) {
    this.transactionModel.increaseItem(index);
  }

  // Kurangi jumlah
  decreaseQty(index) {
    this.transactionModel.decreaseItem(index);
  }

  // Hapus item
  removeItem(index) {
    this.transactionModel.removeItem(index);
  }

  // Update Catatan Minuman (Less Sugar, Normal Ice, dll)
  updateItemNotes(index, notes) {
    this.transactionModel.updateItemNotes(index, notes);
  }

  // Ganti Kategori
  setCategory(category) {
    this.productModel.selectedCategory = category;
  }

  // Ganti Pencarian
  setSearch(query) {
    this.productModel.searchQuery = query;
  }

  // Set Metode Pembayaran
  setPaymentMethod(method) {
    this.transactionModel.paymentMethod = method;
    if (method !== 'Tunai') {
      this.transactionModel.cashReceived = this.transactionModel.getTotalAmount();
    }
  }

  // Set Jumlah Uang Tunai Diterima
  setCashReceived(amount) {
    this.transactionModel.cashReceived = Number(amount || 0);
  }

  // Quick Cash Preset Button (Uang Pas, 5k, 10k, 20k, 50k, 100k)
  setQuickCash(preset) {
    const total = this.transactionModel.getTotalAmount();
    if (preset === 'pas') {
      this.transactionModel.cashReceived = total;
    } else {
      this.transactionModel.cashReceived = Number(preset);
    }
  }

  // Set Diskon
  setDiscount(amount) {
    this.transactionModel.discount = Number(amount || 0);
  }

  // Kosongkan Keranjang
  clearCart() {
    this.transactionModel.clearCart();
  }

  /**
   * PROSES CHECKOUT TRANSAKSI
   */
  async processCheckout() {
    if (this.isProcessingPayment) return;
    if (!this.transactionModel.isCheckoutValid()) {
      if (this.transactionModel.cart.length === 0) {
        throw new Error('Keranjang pesanan masih kosong!');
      }
      if (this.transactionModel.paymentMethod === 'Tunai') {
        throw new Error('Jumlah uang tunai yang diterima kurang!');
      }
      throw new Error('Data pembayaran belum lengkap.');
    }

    this.isProcessingPayment = true;

    try {
      const cashierUser = this.userModel.currentUser;
      const txPayload = this.transactionModel.createTransactionPayload(cashierUser);

      // Simpan ke Google Apps Script (atau Mock jika offline)
      const apiResult = await this.apiService.saveTransaction(txPayload);

      // Kosongkan keranjang setelah sukses
      this.transactionModel.clearCart();

      return {
        transaction: txPayload,
        apiResult: apiResult
      };
    } finally {
      this.isProcessingPayment = false;
    }
  }

  // Cetak struk via PrintService
  printReceipt(transaction) {
    this.printService.printReceipt(transaction);
  }

  // Bagikan struk via WhatsApp
  shareWhatsApp(transaction, phone) {
    this.printService.shareViaWhatsApp(transaction, phone);
  }
}
