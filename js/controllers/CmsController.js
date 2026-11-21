/**
 * CmsController.js
 * Controller untuk Dashboard Pemilik/Admin (Pak Faik), White-Label CMS,
 * Appearance Customizer (Tema & Warna), Manajemen Katalog Menu, dan Sinkronisasi Google Sheets.
 */
export class CmsController {
  constructor(settingsModel, productModel, userModel, transactionModel, apiService) {
    this.settingsModel = settingsModel;
    this.productModel = productModel;
    this.userModel = userModel;
    this.transactionModel = transactionModel;
    this.apiService = apiService;
  }

  // Update Pengaturan CMS (Brand, Tema, Tampilan)
  async updateSettings(newSettings) {
    this.settingsModel.updateMultiple(newSettings);

    // Jika GAS terhubung, simpan juga ke spreadsheet
    if (this.apiService.isGasConfigured()) {
      try {
        await this.apiService.saveSettings(newSettings);
      } catch (e) {
        console.warn('Gagal sinkron settings ke GAS:', e);
      }
    }
  }

  // Tambah / Update Produk Menu
  async upsertProduct(productData) {
    this.productModel.upsertProduct(productData);

    if (this.apiService.isGasConfigured()) {
      try {
        await this.apiService.saveProduct(productData);
      } catch (e) {
        console.warn('Gagal simpan produk ke GAS:', e);
      }
    }
  }

  // Toggle status aktif produk
  async toggleProductActive(productId) {
    this.productModel.toggleActive(productId);
    const prod = this.productModel.getProductById(productId);
    if (prod && this.apiService.isGasConfigured()) {
      try {
        await this.apiService.saveProduct(prod);
      } catch (e) {
        console.warn('Gagal update status produk ke GAS:', e);
      }
    }
  }

  // Hapus Produk
  async deleteProduct(productId) {
    this.productModel.deleteProduct(productId);
    if (this.apiService.isGasConfigured()) {
      try {
        await this.apiService.deleteProduct(productId);
      } catch (e) {
        console.warn('Gagal hapus produk di GAS:', e);
      }
    }
  }

  // Sinkronisasi Penuh dari Google Spreadsheet
  async syncFromGoogleSheets() {
    if (!this.apiService.isGasConfigured()) {
      throw new Error('URL Google Apps Script belum dikonfigurasi.');
    }

    const data = await this.apiService.fetchAllData();
    if (data) {
      if (data.products && Array.isArray(data.products)) {
        this.productModel.setProducts(data.products);
      }
      if (data.settings && typeof data.settings === 'object') {
        this.settingsModel.updateMultiple(data.settings);
      }
      return data;
    }
    throw new Error('Data tidak dapat dimuat dari Google Sheets.');
  }

  // Hitung Metrik Eksekutif (Dashboard Admin)
  getExecutiveDashboardMetrics() {
    const txs = this.transactionModel.transactionsHistory || [];
    const todayStr = new Date().toISOString().slice(0, 10);

    const todayTxs = txs.filter(t => t.timestamp && t.timestamp.startsWith(todayStr));
    const todayRevenue = todayTxs.reduce((sum, t) => sum + Number(t.total_amount || 0), 0);
    const todayCups = todayTxs.reduce((sum, t) => sum + Number(t.total_items || 0), 0);
    const avgBasket = todayTxs.length > 0 ? Math.round(todayRevenue / todayTxs.length) : 0;

    // Hitung Produk Terlaris
    const productSalesMap = {};
    todayTxs.forEach(t => {
      (t.items || []).forEach(it => {
        productSalesMap[it.name] = (productSalesMap[it.name] || 0) + it.qty;
      });
    });

    const topProducts = Object.keys(productSalesMap)
      .map(name => ({ name, qty: productSalesMap[name] }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    // Hitung Komposisi Metode Pembayaran
    const paymentBreakdown = { Tunai: 0, QRIS: 0, Transfer: 0 };
    todayTxs.forEach(t => {
      const pm = t.payment_method || 'Tunai';
      paymentBreakdown[pm] = (paymentBreakdown[pm] || 0) + Number(t.total_amount || 0);
    });

    return {
      todayRevenue,
      todayCups,
      todayTxCount: todayTxs.length,
      avgBasket,
      topProducts,
      paymentBreakdown,
      allTimeTxCount: txs.length
    };
  }
}
