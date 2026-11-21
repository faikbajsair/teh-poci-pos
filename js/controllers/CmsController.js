/**
 * CmsController.js
 * Controller untuk Dashboard Pemilik/Admin (Pak Faik), White-Label CMS,
 * Appearance Customizer (Tema & Warna), Manajemen Katalog Menu, dan Sinkronisasi Google Sheets.
 */
export class CmsController {
  constructor(settingsModel, productModel, userModel, transactionModel, apiService, inventoryModel = null) {
    this.settingsModel = settingsModel;
    this.productModel = productModel;
    this.userModel = userModel;
    this.transactionModel = transactionModel;
    this.apiService = apiService;
    this.inventoryModel = inventoryModel;
    this.selectedPeriod = 'today'; // 'today' | '7days' | '30days' | 'all'
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
      if (data.recentTransactions && Array.isArray(data.recentTransactions)) {
        this.transactionModel.mergeTransactionsFromGas(data.recentTransactions);
      }
      return data;
    }
    throw new Error('Data tidak dapat dimuat dari Google Sheets.');
  }

  // Set Periode Analisis Dashboard
  setPeriod(period) {
    this.selectedPeriod = period;
  }

  // Filter Transaksi Berdasarkan Periode Terpilih
  getTransactionsForPeriod(period = this.selectedPeriod) {
    const txs = this.transactionModel.transactionsHistory || [];
    const now = new Date();

    if (period === 'all') return txs;

    return txs.filter(t => {
      if (!t.timestamp) return false;
      const txDate = new Date(t.timestamp);
      if (isNaN(txDate.getTime())) return false;

      if (period === 'today') {
        return txDate.getFullYear() === now.getFullYear() &&
               txDate.getMonth() === now.getMonth() &&
               txDate.getDate() === now.getDate();
      }

      const diffDays = Math.floor((now - txDate) / (1000 * 60 * 60 * 24));
      if (period === '7days') return diffDays <= 7;
      if (period === '30days') return diffDays <= 30;

      return true;
    });
  }

  // Hitung Metrik Eksekutif Lengkap & Laba Rugi untuk Owner (Pak Faik)
  getExecutiveDashboardMetrics(period = this.selectedPeriod) {
    const periodTxs = this.getTransactionsForPeriod(period);
    const allProducts = this.productModel.getAllProducts();
    const inventorySummary = this.inventoryModel ? this.inventoryModel.getSummary() : { total: 0, safe: 0, warning: 0, critical: 0, lowStockItems: [] };

    // 1. Total Penjualan & Cup
    const totalRevenue = periodTxs.reduce((sum, t) => sum + Number(t.total_amount || 0), 0);
    const totalCups = periodTxs.reduce((sum, t) => sum + Number(t.total_items || 0), 0);
    const totalTxCount = periodTxs.length;
    const avgBasket = totalTxCount > 0 ? Math.round(totalRevenue / totalTxCount) : 0;

    // 2. Analisis Penjualan & Laba Rugi Per Produk Minuman
    const productStatsMap = {};
    allProducts.forEach(p => {
      productStatsMap[p.id] = {
        id: p.id,
        code: p.code,
        name: p.name,
        category: p.category,
        price: Number(p.price || 0),
        cost_price: Number(p.cost_price || Math.round(p.price * 0.45)), // Default HPP ~45% jika belum diisi
        qty_sold: 0,
        revenue: 0,
        cogs: 0,
        gross_profit: 0,
        image_url: p.image_url
      };
    });

    periodTxs.forEach(tx => {
      let items = Array.isArray(tx.items) ? tx.items : [];
      if (items.length === 0 && tx.items_json) {
        try {
          items = typeof tx.items_json === 'string' ? JSON.parse(tx.items_json) : tx.items_json;
        } catch (e) { items = []; }
      }

      items.forEach(it => {
        // Cari produk berdasarkan ID atau nama
        let stat = productStatsMap[it.product_id];
        if (!stat) {
          const match = allProducts.find(p => p.name.toLowerCase() === (it.name || '').toLowerCase());
          if (match) stat = productStatsMap[match.id];
        }

        if (stat) {
          const q = Number(it.qty || 1);
          const rev = Number(it.subtotal || (q * stat.price));
          const cost = q * stat.cost_price;
          stat.qty_sold += q;
          stat.revenue += rev;
          stat.cogs += cost;
          stat.gross_profit += (rev - cost);
        }
      });
    });

    const allProductStats = Object.values(productStatsMap);

    // Hitung margin persentase per produk
    allProductStats.forEach(st => {
      st.margin_percent = st.revenue > 0 ? Math.round((st.gross_profit / st.revenue) * 100) : (st.price > 0 ? Math.round(((st.price - st.cost_price) / st.price) * 100) : 0);
    });

    // 3. Klasifikasi Produk Terlaris & Produk Kurang Laku
    const topProducts = allProductStats
      .filter(p => p.qty_sold > 0)
      .sort((a, b) => b.qty_sold - a.qty_sold);

    const slowProducts = allProductStats
      .filter(p => p.qty_sold === 0 || p.qty_sold <= 2)
      .sort((a, b) => a.qty_sold - b.qty_sold);

    // 4. Hitung Total Laba Rugi (P&L / Profit and Loss)
    const totalCogs = allProductStats.reduce((sum, p) => sum + p.cogs, 0);
    const grossProfit = Math.max(0, totalRevenue - totalCogs);
    const grossMarginPercent = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : '0.0';

    // Estimasi Biaya Operasional Harian Booth (Listrik, Es Batu, Sewa Harian)
    const dailyOpCost = 35000; 
    let operationalCost = dailyOpCost;
    if (period === '7days') operationalCost = dailyOpCost * 7;
    else if (period === '30days' || period === 'all') operationalCost = dailyOpCost * 30;

    const netProfit = grossProfit - (totalRevenue > 0 ? operationalCost : 0);

    // 5. Komposisi Metode Pembayaran
    const paymentBreakdown = { Tunai: 0, QRIS: 0, Transfer: 0 };
    periodTxs.forEach(t => {
      const pm = t.payment_method || 'Tunai';
      paymentBreakdown[pm] = (paymentBreakdown[pm] || 0) + Number(t.total_amount || 0);
    });

    // 6. Rangkuman Saran & Rekomendasi Bisnis Eksekutif untuk Owner
    const strategicAdvice = this.generateStrategicAdvice({
      totalRevenue,
      grossProfit,
      grossMarginPercent,
      netProfit,
      totalCups,
      topProducts,
      slowProducts,
      paymentBreakdown,
      inventorySummary,
      period
    });

    return {
      period,
      todayRevenue: totalRevenue,
      todayCups: totalCups,
      todayTxCount: totalTxCount,
      avgBasket,
      totalCogs,
      grossProfit,
      grossMarginPercent,
      operationalCost,
      netProfit,
      topProducts: topProducts.slice(0, 5),
      allTopProducts: topProducts,
      slowProducts: slowProducts.slice(0, 6),
      allSlowProducts: slowProducts,
      paymentBreakdown,
      allTimeTxCount: (this.transactionModel.transactionsHistory || []).length,
      inventorySummary,
      strategicAdvice
    };
  }

  // GENERATOR SARAN & REKOMENDASI KEPUTUSAN BISNIS OWNER (AI-ASSISTED BUSINESS ADVICE)
  generateStrategicAdvice({ totalRevenue, grossProfit, grossMarginPercent, netProfit, totalCups, topProducts, slowProducts, paymentBreakdown, inventorySummary, period }) {
    const adviceList = [];

    // Rekomendasi 1: Menu Terlaris & Peluang Upselling
    if (topProducts.length > 0) {
      const champion = topProducts[0];
      adviceList.push({
        type: 'champion',
        badge: '⭐️ Menu Terlaris (Champion)',
        color: 'emerald',
        icon: '🏆',
        title: `${champion.name} Menjadi Mesin Omzet Utama (${champion.qty_sold} Cup)`,
        description: `Varian <strong>${champion.name}</strong> menyumbang omzet sebesar <strong>Rp ${champion.revenue.toLocaleString('id-ID')}</strong> dengan margin keuntungan <strong>${champion.margin_percent}%</strong>.`,
        action: `Instruksikan staf kasir untuk selalu menyiapkan cadangan biang teh segar dan es batu ekstra sebelum jam ramai (11:30 - 14:00 & 16:30 - 19:00). Jadikan varian ini sebagai tawaran pertama saat pelanggan bertanya.`
      });
    }

    // Rekomendasi 2: Strategi Mengatasi Produk Kurang Laku (Slow Moving)
    if (slowProducts.length > 0) {
      const slowNames = slowProducts.slice(0, 3).map(p => p.name).join(', ');
      adviceList.push({
        type: 'slow_moving',
        badge: '⚠️ Produk Kurang Laku (Perhatian)',
        color: 'amber',
        icon: '💡',
        title: `Varian Kurang Laku Perlu Diberi Stimulus Promo (${slowNames})`,
        description: `Terdapat <strong>${slowProducts.length} varian</strong> yang penjualannya rendah atau belum terjual pada periode ini, sehingga berisiko menahan perputaran modal pada bahan baku sirup/powder.`,
        action: `<strong>Tindakan yang disarankan:</strong> Buat program promosi bundling, misalnya <em>"Paket Hemat Combo: Beli 2 Es Teh Original + 1 Fruit Tea hemat Rp 2.000"</em>, atau berikan tester cup kecil gratis kepada pelanggan yang datang bersama anak/keluarga.`
      });
    }

    // Rekomendasi 3: Peringatan Stok Bahan Baku Kritis
    if (inventorySummary && inventorySummary.lowStockItems.length > 0) {
      const itemNames = inventorySummary.lowStockItems.slice(0, 3).map(i => `${i.name} (sisa ${i.stock} ${i.unit})`).join(', ');
      adviceList.push({
        type: 'inventory',
        badge: '🚨 Peringatan Stok Menipis',
        color: 'red',
        icon: '📦',
        title: `Segera Lakukan Pembelian Ulang (Restock) Bahan Baku`,
        description: `Terdapat <strong>${inventorySummary.lowStockItems.length} bahan baku</strong> yang stoknya sudah menyentuh atau di bawah batas minimum: ${itemNames}.`,
        action: `Buka tab <strong>"Stok Bahan Baku"</strong> untuk melihat daftar lengkap dan segera hubungi supplier Teh Poci / agen logistik sebelum akhir pekan agar booth tidak kehabisan bahan saat antrean ramai.`
      });
    } else {
      adviceList.push({
        type: 'inventory',
        badge: '✓ Kondisi Stok Aman',
        color: 'emerald',
        icon: '✅',
        title: `Seluruh Stok Bahan Baku Booth dalam Kondisi Aman`,
        description: `Bahan baku utama (daun teh, gula, cup, lid sealer, sedotan) masih berada di atas batas stok minimum aman.`,
        action: `Tetap lakukan kontrol audit stok fisik setiap sore hari sebelum tutup shift.`
      });
    }

    // Rekomendasi 4: Efisiensi Kas & Pembayaran Digital (QRIS / Transfer)
    const cashTotal = paymentBreakdown.Tunai || 0;
    const nonCashTotal = (paymentBreakdown.QRIS || 0) + (paymentBreakdown.Transfer || 0);
    const nonCashPercent = totalRevenue > 0 ? Math.round((nonCashTotal / totalRevenue) * 100) : 0;

    adviceList.push({
      type: 'cashflow',
      badge: '💳 Analisis Arus Kas & Pembayaran',
      color: 'sky',
      icon: '📊',
      title: `Proporsi Pembayaran: ${100 - nonCashPercent}% Tunai vs ${nonCashPercent}% Non-Tunai`,
      description: `Penjualan tunai tercatat sebesar <strong>Rp ${cashTotal.toLocaleString('id-ID')}</strong> dan non-tunai (QRIS/Transfer) sebesar <strong>Rp ${nonCashTotal.toLocaleString('id-ID')}</strong>.`,
      action: nonCashPercent < 30 
        ? `Tingkat non-tunai masih di bawah 30%. Tempelkan stiker/akrilik QRIS di depan meja kasir dan anjurkan staf menawarkan QRIS agar mengurangi kerepotan menyediakan uang receh kembalian dan menekan risiko selisih uang kas.`
        : `Adopsi QRIS & Transfer sangat baik (${nonCashPercent}%). Uang penjualan langsung masuk aman ke rekening BSI / Blu BCA / Mandiri tanpa risiko selisih fisik di laci kasir.`
    });

    // Rekomendasi 5: Keputusan Profitabilitas & Margin
    adviceList.push({
      type: 'profit',
      badge: '📈 Evaluasi Laba Bersih & Margin',
      color: 'purple',
      icon: '💰',
      title: `Margin Laba Kotor Usaha: ${grossMarginPercent}% (Kategori Sangat Sehat)`,
      description: `Rata-rata bisnis minuman booth memiliki standar margin kotor 50% - 60%. Pencapaian margin kotor Teh Poci Anda saat ini adalah <strong>${grossMarginPercent}%</strong> dengan estimasi laba kotor <strong>Rp ${grossProfit.toLocaleString('id-ID')}</strong>.`,
      action: `Untuk meningkatkan margin lebih lanjut, dorong kasir untuk melakukan <em>upselling</em> cup Jumbo 22 oz atau ekstra topping, karena peningkatan harga jual Rp 1.000 - Rp 2.000 hampir 90% menjadi laba bersih tambahan.`
    });

    return adviceList;
  }
}
