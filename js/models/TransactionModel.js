/**
 * TransactionModel.js
 * Model untuk mengelola keranjang transaksi (Cart/Basket), kalkulasi subtotal,
 * diskon, kembalian, penyimpanan riwayat transaksi, dan pembuatan nomor faktur.
 */
export class TransactionModel {
  constructor() {
    this.cart = [];
    this.discount = 0;
    this.paymentMethod = 'Tunai'; // 'Tunai' | 'QRIS' | 'Transfer'
    this.cashReceived = 0;
    this.orderNotes = '';
    this.transactionsHistory = [];
    this.loadHistory();
  }

  // Muat riwayat transaksi dari LocalStorage
  loadHistory() {
    try {
      const stored = localStorage.getItem('tehpoci_transactions');
      if (stored) {
        this.transactionsHistory = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Gagal memuat riwayat transaksi:', e);
      this.transactionsHistory = [];
    }
  }

  // Simpan riwayat transaksi ke LocalStorage
  saveHistory() {
    localStorage.setItem('tehpoci_transactions', JSON.stringify(this.transactionsHistory));
  }

  // Sinkronisasi & gabungkan transaksi dari Google Spreadsheet ke Local History
  mergeTransactionsFromGas(gasTransactions) {
    if (!Array.isArray(gasTransactions) || gasTransactions.length === 0) return;

    gasTransactions.forEach(gasTx => {
      // 1. Parse items jika masih berupa items_json string
      let items = gasTx.items;
      if (!items && gasTx.items_json) {
        try {
          items = typeof gasTx.items_json === 'string' ? JSON.parse(gasTx.items_json) : gasTx.items_json;
        } catch (e) {
          items = [];
        }
      }

      // 2. Generate display_date & display_time jika belum ada
      let dDate = gasTx.display_date;
      let dTime = gasTx.display_time;
      if (!dDate || !dTime) {
        try {
          const dt = new Date(gasTx.timestamp);
          if (!isNaN(dt.getTime())) {
            dDate = dt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
            dTime = dt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
          }
        } catch (e) {
          dDate = '';
          dTime = '';
        }
      }

      const normalized = {
        id: gasTx.id || ('TX-' + Date.now()),
        invoice_number: gasTx.invoice_number,
        timestamp: gasTx.timestamp,
        display_date: dDate,
        display_time: dTime,
        cashier_id: gasTx.cashier_id || 'STF-01',
        cashier_name: gasTx.cashier_name || 'Kasir Booth',
        branch_code: gasTx.branch_code || 'LPR-01',
        items: Array.isArray(items) ? items : [],
        total_items: Number(gasTx.total_items || (Array.isArray(items) ? items.reduce((s, it) => s + (it.qty || 1), 0) : 0)),
        subtotal: Number(gasTx.subtotal || 0),
        discount: Number(gasTx.discount || 0),
        total_amount: Number(gasTx.total_amount || 0),
        payment_method: gasTx.payment_method || 'Tunai',
        cash_received: Number(gasTx.cash_received || gasTx.total_amount || 0),
        cash_change: Number(gasTx.cash_change || 0),
        payment_status: gasTx.payment_status || 'PAID',
        notes: gasTx.notes || ''
      };

      // Cek apakah invoice_number sudah ada di transactionsHistory
      const existingIdx = this.transactionsHistory.findIndex(t => t.invoice_number === normalized.invoice_number);
      if (existingIdx >= 0) {
        this.transactionsHistory[existingIdx] = { ...this.transactionsHistory[existingIdx], ...normalized };
      } else {
        this.transactionsHistory.push(normalized);
      }
    });

    // Urutkan berdasarkan waktu transaksi terbaru (descending)
    this.transactionsHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    this.saveHistory();
  }

  // Tambah item produk ke keranjang
  addItem(product, customNotes = '') {
    const notes = customNotes || 'Normal Ice & Sugar';
    const existingIndex = this.cart.findIndex(item => item.product_id === product.id && item.notes === notes);
    
    if (existingIndex >= 0) {
      this.cart[existingIndex].qty += 1;
      this.cart[existingIndex].subtotal = this.cart[existingIndex].qty * this.cart[existingIndex].price;
    } else {
      this.cart.push({
        product_id: product.id,
        code: product.code,
        name: product.name,
        price: Number(product.price),
        qty: 1,
        subtotal: Number(product.price),
        notes: notes,
        image_url: product.image_url || ''
      });
    }
  }

  // Kurangi jumlah item
  decreaseItem(index) {
    if (this.cart[index]) {
      this.cart[index].qty -= 1;
      if (this.cart[index].qty <= 0) {
        this.cart.splice(index, 1);
      } else {
        this.cart[index].subtotal = this.cart[index].qty * this.cart[index].price;
      }
    }
  }

  // Tambah jumlah item
  increaseItem(index) {
    if (this.cart[index]) {
      this.cart[index].qty += 1;
      this.cart[index].subtotal = this.cart[index].qty * this.cart[index].price;
    }
  }

  // Ubah catatan item tertentu (misal Less Sugar, Extra Ice)
  updateItemNotes(index, notes) {
    if (this.cart[index]) {
      this.cart[index].notes = notes;
    }
  }

  // Hapus item dari keranjang
  removeItem(index) {
    this.cart.splice(index, 1);
  }

  // Kosongkan keranjang
  clearCart() {
    this.cart = [];
    this.discount = 0;
    this.cashReceived = 0;
    this.orderNotes = '';
  }

  // Hitung total item cup di keranjang
  getTotalItems() {
    return this.cart.reduce((total, item) => total + item.qty, 0);
  }

  // Hitung subtotal kotor
  getSubtotal() {
    return this.cart.reduce((total, item) => total + item.subtotal, 0);
  }

  // Hitung total akhir setelah diskon
  getTotalAmount() {
    return Math.max(0, this.getSubtotal() - this.discount);
  }

  // Hitung kembalian tunai
  getChange() {
    if (this.paymentMethod !== 'Tunai') return 0;
    const total = this.getTotalAmount();
    return Math.max(0, (this.cashReceived || 0) - total);
  }

  // Validasi apakah transaksi siap dibayar
  isCheckoutValid() {
    if (this.cart.length === 0) return false;
    const total = this.getTotalAmount();
    if (this.paymentMethod === 'Tunai') {
      return (this.cashReceived || 0) >= total;
    }
    return true; // QRIS / Transfer valid jika ada item
  }

  // Generate Nomor Faktur Unik
  generateInvoiceNumber() {
    const date = new Date();
    const ymd = date.getFullYear().toString() +
      ('0' + (date.getMonth() + 1)).slice(-2) +
      ('0' + date.getDate()).slice(-2);
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `INV-LPR-${ymd}-${rand}`;
  }

  // Buat objek transaksi lengkap untuk dikirim ke API & disimpan
  createTransactionPayload(cashierUser) {
    const now = new Date();
    const invoiceNumber = this.generateInvoiceNumber();
    const total = this.getTotalAmount();
    const change = this.getChange();

    const payload = {
      id: 'TX-' + Date.now().toString(),
      invoice_number: invoiceNumber,
      timestamp: now.toISOString(),
      display_time: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      display_date: now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      cashier_id: cashierUser ? cashierUser.id : 'STF-01',
      cashier_name: cashierUser ? cashierUser.full_name : 'Pak Riza Lahmadi',
      branch_code: cashierUser ? (cashierUser.branch_code || 'LPR-01') : 'LPR-01',
      items: JSON.parse(JSON.stringify(this.cart)),
      total_items: this.getTotalItems(),
      subtotal: this.getSubtotal(),
      discount: this.discount,
      total_amount: total,
      payment_method: this.paymentMethod,
      cash_received: this.paymentMethod === 'Tunai' ? Number(this.cashReceived) : total,
      cash_change: change,
      payment_status: 'PAID',
      notes: this.orderNotes || ''
    };

    // Tambah ke riwayat lokal
    this.transactionsHistory.unshift(payload);
    this.saveHistory();

    return payload;
  }
}
