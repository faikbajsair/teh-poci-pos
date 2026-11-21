/**
 * InventoryModel.js
 * Model untuk mengelola stok bahan baku dan kemasan booth Teh Poci:
 * Teh Melati, Gula Pasir, Cup 16oz/22oz, Lid Sealer, Sedotan, Plastik, Sirup Buah, dan Powder Rasa.
 * Mendukung status stok (Aman / Menipis / Kritis), penyesuaian stok real-time, dan penyimpanan lokal + sync.
 */
export class InventoryModel {
  constructor() {
    this.storageKey = 'tehpoci_inventory_stock';
    this.items = [];
    this.loadInventory();
  }

  // Daftar default bahan baku booth Teh Poci Cabang Limus Pratama Regensi
  getDefaultInventory() {
    return [
      { id: 'RAW-01', name: 'Daun Teh Melati Poci (Racikan)', category: 'Bahan Utama', stock: 18, unit: 'Pack (100g)', min_stock: 5, cost_per_unit: 8000 },
      { id: 'RAW-02', name: 'Gula Pasir Premium', category: 'Bahan Utama', stock: 25, unit: 'Kg', min_stock: 8, cost_per_unit: 17500 },
      { id: 'RAW-03', name: 'Cup Plastik Sablon 16 oz', category: 'Kemasan', stock: 12, unit: 'Roll (50 cup)', min_stock: 4, cost_per_unit: 20000 },
      { id: 'RAW-04', name: 'Cup Plastik Sablon 22 oz (Jumbo)', category: 'Kemasan', stock: 8, unit: 'Roll (50 cup)', min_stock: 3, cost_per_unit: 23000 },
      { id: 'RAW-05', name: 'Roll Plastik Lid Cup Sealer', category: 'Kemasan', stock: 2, unit: 'Roll (1200 cup)', min_stock: 1, cost_per_unit: 65000 },
      { id: 'RAW-06', name: 'Sedotan Higienis Steril', category: 'Kemasan', stock: 10, unit: 'Pack (100 pcs)', min_stock: 3, cost_per_unit: 10000 },
      { id: 'RAW-07', name: 'Kantong Plastik Kresek 1 Cup (T)', category: 'Kemasan', stock: 9, unit: 'Pack (100 pcs)', min_stock: 3, cost_per_unit: 8000 },
      { id: 'RAW-08', name: 'Kantong Plastik Kresek 2 Cup (T)', category: 'Kemasan', stock: 5, unit: 'Pack (100 pcs)', min_stock: 2, cost_per_unit: 9500 },
      { id: 'RAW-09', name: 'Sirup Apple (Apel)', category: 'Sirup Buah', stock: 4, unit: 'Botol (650ml)', min_stock: 2, cost_per_unit: 28000 },
      { id: 'RAW-10', name: 'Sirup Lemon Honey (Lemon Madu)', category: 'Sirup Buah', stock: 3, unit: 'Botol (650ml)', min_stock: 2, cost_per_unit: 30000 },
      { id: 'RAW-11', name: 'Sirup Mango (Mangga)', category: 'Sirup Buah', stock: 4, unit: 'Botol (650ml)', min_stock: 2, cost_per_unit: 28000 },
      { id: 'RAW-12', name: 'Sirup Orange (Jeruk)', category: 'Sirup Buah', stock: 3, unit: 'Botol (650ml)', min_stock: 2, cost_per_unit: 28000 },
      { id: 'RAW-13', name: 'Sirup Lychee (Leci)', category: 'Sirup Buah', stock: 2, unit: 'Botol (650ml)', min_stock: 2, cost_per_unit: 29000 },
      { id: 'RAW-14', name: 'Sirup Guava (Jambu)', category: 'Sirup Buah', stock: 2, unit: 'Botol (650ml)', min_stock: 2, cost_per_unit: 28000 },
      { id: 'RAW-15', name: 'Sirup Blackcurrant', category: 'Sirup Buah', stock: 3, unit: 'Botol (650ml)', min_stock: 2, cost_per_unit: 29000 },
      { id: 'RAW-16', name: 'Powder Rasa Chocolatos', category: 'Powder Rasa', stock: 20, unit: 'Sachet/Pack', min_stock: 8, cost_per_unit: 4500 },
      { id: 'RAW-17', name: 'Powder Rasa Milo', category: 'Powder Rasa', stock: 18, unit: 'Sachet/Pack', min_stock: 8, cost_per_unit: 4500 },
      { id: 'RAW-18', name: 'Powder Rasa Beng-Beng', category: 'Powder Rasa', stock: 22, unit: 'Sachet/Pack', min_stock: 8, cost_per_unit: 4500 },
      { id: 'RAW-19', name: 'Powder Rasa Green Tea (Matcha)', category: 'Powder Rasa', stock: 14, unit: 'Sachet/Pack', min_stock: 6, cost_per_unit: 4500 },
      { id: 'RAW-20', name: 'Powder Rasa Thai Tea', category: 'Powder Rasa', stock: 16, unit: 'Sachet/Pack', min_stock: 6, cost_per_unit: 4500 },
      { id: 'RAW-21', name: 'Powder Cappuccino', category: 'Powder Rasa', stock: 12, unit: 'Sachet/Pack', min_stock: 6, cost_per_unit: 4000 }
    ];
  }

  // Muat data stok dari LocalStorage
  loadInventory() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.items = JSON.parse(stored);
      } else {
        this.items = this.getDefaultInventory();
        this.saveInventory();
      }
    } catch (e) {
      console.warn('Gagal memuat inventory:', e);
      this.items = this.getDefaultInventory();
    }
  }

  // Simpan data stok ke LocalStorage
  saveInventory() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.items));
    } catch (e) {
      console.error('Gagal menyimpan inventory:', e);
    }
  }

  // Ambil semua daftar bahan baku
  getAll() {
    return this.items;
  }

  // Ambil bahan baku berdasarkan ID
  getById(id) {
    return this.items.find(i => i.id === id);
  }

  // Update jumlah stok langsung
  updateStock(id, newStock) {
    const item = this.getById(id);
    if (item) {
      item.stock = Math.max(0, Number(newStock || 0));
      item.updated_at = new Date().toISOString();
      this.saveInventory();
      return true;
    }
    return false;
  }

  // Tambah / Kurang stok secara relatif (misal +5 atau -1)
  adjustStock(id, delta) {
    const item = this.getById(id);
    if (item) {
      item.stock = Math.max(0, Number(item.stock || 0) + Number(delta));
      item.updated_at = new Date().toISOString();
      this.saveInventory();
      return item.stock;
    }
    return null;
  }

  // Tambah item bahan baku baru
  addItem(itemData) {
    const newId = 'RAW-' + ('0' + (this.items.length + 1)).slice(-2);
    const item = {
      id: newId,
      name: itemData.name,
      category: itemData.category || 'Bahan Tambahan',
      stock: Number(itemData.stock || 0),
      unit: itemData.unit || 'Pcs',
      min_stock: Number(itemData.min_stock || 5),
      cost_per_unit: Number(itemData.cost_per_unit || 0),
      updated_at: new Date().toISOString()
    };
    this.items.push(item);
    this.saveInventory();
    return item;
  }

  // Edit informasi bahan baku
  updateItem(id, itemData) {
    const item = this.getById(id);
    if (item) {
      item.name = itemData.name || item.name;
      item.category = itemData.category || item.category;
      item.stock = Number(itemData.stock !== undefined ? itemData.stock : item.stock);
      item.unit = itemData.unit || item.unit;
      item.min_stock = Number(itemData.min_stock !== undefined ? itemData.min_stock : item.min_stock);
      item.cost_per_unit = Number(itemData.cost_per_unit !== undefined ? itemData.cost_per_unit : item.cost_per_unit);
      item.updated_at = new Date().toISOString();
      this.saveInventory();
      return true;
    }
    return false;
  }

  // Hapus item bahan baku
  deleteItem(id) {
    this.items = this.items.filter(i => i.id !== id);
    this.saveInventory();
  }

  // Hitung status stok tiap item: 'critical' | 'warning' | 'safe'
  getItemStatus(item) {
    const stock = Number(item.stock || 0);
    const min = Number(item.min_stock || 1);
    if (stock <= 0) return 'critical';
    if (stock <= min) return 'warning';
    return 'safe';
  }

  // Dapatkan ringkasan status stok (Total, Aman, Menipis, Kritis)
  getSummary() {
    let safe = 0;
    let warning = 0;
    let critical = 0;

    this.items.forEach(i => {
      const status = this.getItemStatus(i);
      if (status === 'critical') critical++;
      else if (status === 'warning') warning++;
      else safe++;
    });

    const lowStockItems = this.items.filter(i => this.getItemStatus(i) !== 'safe');

    return {
      total: this.items.length,
      safe,
      warning,
      critical,
      lowStockItems
    };
  }
}
