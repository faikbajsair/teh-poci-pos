/**
 * ProductModel.js
 * Model untuk mengelola katalog produk minuman Teh Poci, kategori, pencarian, dan status ketersediaan.
 */
export class ProductModel {
  constructor() {
    this.products = [];
    this.categories = ['Semua', 'Teh Melati', 'Fruit Tea', 'Milk & Creamy', 'Coffee Mix', 'Spesial'];
    this.selectedCategory = 'Semua';
    this.searchQuery = '';
    this.loadFromStorage();
  }

  // Muat produk dari LocalStorage atau default 17 Varian Menu Teh Poci
  loadFromStorage() {
    try {
      const stored = localStorage.getItem('tehpoci_products');
      if (stored) {
        this.products = JSON.parse(stored);
      } else {
        this.products = this.getDefaultProducts();
        this.saveToStorage();
      }
    } catch (e) {
      console.warn('Gagal membaca cache produk:', e);
      this.products = this.getDefaultProducts();
    }
  }

  // Simpan produk ke LocalStorage
  saveToStorage() {
    localStorage.setItem('tehpoci_products', JSON.stringify(this.products));
  }

  // 17 Menu Spesifik Teh Poci Cabang Limus Pratama Regensi
  getDefaultProducts() {
    return [
      {
        id: 'PROD-001',
        code: 'TP-01',
        name: 'Jasmine Tea Kecil',
        category: 'Teh Melati',
        price: 3000,
        cost_price: 1500,
        is_active: true,
        image_url: 'assets/img/menu/jasmine-kecil.svg',
        sort_order: 1,
        badge: 'Hemat'
      },
      {
        id: 'PROD-002',
        code: 'TP-02',
        name: 'Jasmine Poci Iced Tea',
        category: 'Teh Melati',
        price: 4000,
        cost_price: 2000,
        is_active: true,
        image_url: 'assets/img/menu/jasmine-poci.svg',
        sort_order: 2,
        badge: 'Best Seller'
      },
      {
        id: 'PROD-003',
        code: 'TP-03',
        name: 'Apple Iced Tea',
        category: 'Fruit Tea',
        price: 6000,
        cost_price: 3000,
        is_active: true,
        image_url: 'assets/img/menu/apple-tea.svg',
        sort_order: 3,
        badge: 'Segar'
      },
      {
        id: 'PROD-004',
        code: 'TP-04',
        name: 'Orange Iced Tea',
        category: 'Fruit Tea',
        price: 6000,
        cost_price: 3000,
        is_active: true,
        image_url: 'assets/img/menu/orange-tea.svg',
        sort_order: 4,
        badge: 'Segar'
      },
      {
        id: 'PROD-005',
        code: 'TP-05',
        name: 'Lemon Honey Iced Tea',
        category: 'Fruit Tea',
        price: 6000,
        cost_price: 3000,
        is_active: true,
        image_url: 'assets/img/menu/lemon-honey.svg',
        sort_order: 5,
        badge: 'Favorit'
      },
      {
        id: 'PROD-006',
        code: 'TP-06',
        name: 'Mango Iced Tea',
        category: 'Fruit Tea',
        price: 6000,
        cost_price: 3000,
        is_active: true,
        image_url: 'assets/img/menu/mango-tea.svg',
        sort_order: 6,
        badge: 'Favorit'
      },
      {
        id: 'PROD-007',
        code: 'TP-07',
        name: 'Blackcurrant Iced Tea',
        category: 'Fruit Tea',
        price: 6000,
        cost_price: 3000,
        is_active: true,
        image_url: 'assets/img/menu/blackcurrant-tea.svg',
        sort_order: 7,
        badge: 'Segar'
      },
      {
        id: 'PROD-008',
        code: 'TP-08',
        name: 'Lychee Iced Tea',
        category: 'Fruit Tea',
        price: 6000,
        cost_price: 3000,
        is_active: true,
        image_url: 'assets/img/menu/lychee-tea.svg',
        sort_order: 8,
        badge: 'Favorit'
      },
      {
        id: 'PROD-009',
        code: 'TP-09',
        name: 'Guava Iced Tea',
        category: 'Fruit Tea',
        price: 6000,
        cost_price: 3000,
        is_active: true,
        image_url: 'assets/img/menu/guava-tea.svg',
        sort_order: 9,
        badge: 'Segar'
      },
      {
        id: 'PROD-010',
        code: 'TP-10',
        name: 'Markisa/Menu Baru',
        category: 'Spesial',
        price: 7000,
        cost_price: 3500,
        is_active: true,
        image_url: 'assets/img/menu/markisa-tea.svg',
        sort_order: 10,
        badge: 'Menu Baru'
      },
      {
        id: 'PROD-011',
        code: 'TP-11',
        name: 'Thai Iced Tea',
        category: 'Milk & Creamy',
        price: 9000,
        cost_price: 4500,
        is_active: true,
        image_url: 'assets/img/menu/thai-tea.svg',
        sort_order: 11,
        badge: 'Best Seller'
      },
      {
        id: 'PROD-012',
        code: 'TP-12',
        name: 'Chocolatos',
        category: 'Milk & Creamy',
        price: 9000,
        cost_price: 4500,
        is_active: true,
        image_url: 'assets/img/menu/chocolatos.svg',
        sort_order: 12,
        badge: 'Creamy'
      },
      {
        id: 'PROD-013',
        code: 'TP-13',
        name: 'Green Tea',
        category: 'Milk & Creamy',
        price: 9000,
        cost_price: 4500,
        is_active: true,
        image_url: 'assets/img/menu/green-tea.svg',
        sort_order: 13,
        badge: 'Creamy'
      },
      {
        id: 'PROD-014',
        code: 'TP-14',
        name: 'Cappuccino Iced Tea',
        category: 'Coffee Mix',
        price: 8000,
        cost_price: 4000,
        is_active: true,
        image_url: 'assets/img/menu/cappuccino-tea.svg',
        sort_order: 14,
        badge: 'Coffee Mix'
      },
      {
        id: 'PROD-015',
        code: 'TP-15',
        name: 'Chocolate Iced Tea',
        category: 'Milk & Creamy',
        price: 8000,
        cost_price: 4000,
        is_active: true,
        image_url: 'assets/img/menu/chocolate-tea.svg',
        sort_order: 15,
        badge: 'Favorit'
      },
      {
        id: 'PROD-016',
        code: 'TP-16',
        name: 'Milo',
        category: 'Milk & Creamy',
        price: 9000,
        cost_price: 4500,
        is_active: true,
        image_url: 'assets/img/menu/milo.svg',
        sort_order: 16,
        badge: 'Kids Favorit'
      },
      {
        id: 'PROD-017',
        code: 'TP-17',
        name: 'Beng-Beng',
        category: 'Milk & Creamy',
        price: 9000,
        cost_price: 4500,
        is_active: true,
        image_url: 'assets/img/menu/beng-beng.svg',
        sort_order: 17,
        badge: 'Spesial'
      }
    ];
  }

  // Update daftar produk (misal hasil sinkronisasi dari Google Sheets)
  setProducts(newProducts) {
    if (Array.isArray(newProducts) && newProducts.length > 0) {
      this.products = newProducts;
      this.saveToStorage();
    }
  }

  // Filter produk berdasarkan kategori dan kata kunci pencarian
  getFilteredProducts() {
    return this.products.filter(p => {
      // Hanya tampilkan produk aktif di layar POS
      if (p.is_active === false || p.is_active === 'false') return false;

      // Filter Kategori
      const matchCategory = (this.selectedCategory === 'Semua') || (p.category === this.selectedCategory);

      // Filter Pencarian
      const query = this.searchQuery.toLowerCase().trim();
      const matchQuery = !query || 
        p.name.toLowerCase().includes(query) || 
        (p.code && p.code.toLowerCase().includes(query)) ||
        (p.category && p.category.toLowerCase().includes(query));

      return matchCategory && matchQuery;
    });
  }

  // Ambil semua produk termasuk non-aktif (untuk Admin CMS)
  getAllProducts() {
    return [...this.products].sort((a, b) => (a.sort_order || 99) - (b.sort_order || 99));
  }

  // Ambil produk berdasarkan ID
  getProductById(id) {
    return this.products.find(p => p.id === id);
  }

  // Tambah atau Update Produk (CMS)
  upsertProduct(productData) {
    const existingIndex = this.products.findIndex(p => p.id === productData.id);
    if (existingIndex >= 0) {
      this.products[existingIndex] = { ...this.products[existingIndex], ...productData };
    } else {
      const newProduct = {
        id: productData.id || ('PROD-' + Date.now().toString().slice(-6)),
        code: productData.code || ('TP-' + Math.floor(100 + Math.random() * 900)),
        name: productData.name,
        category: productData.category || 'Teh Melati',
        price: Number(productData.price || 0),
        cost_price: Number(productData.cost_price || 0),
        is_active: productData.is_active !== undefined ? productData.is_active : true,
        image_url: productData.image_url || 'assets/img/menu/jasmine-poci.svg',
        sort_order: Number(productData.sort_order || this.products.length + 1)
      };
      this.products.push(newProduct);
    }
    this.saveToStorage();
  }

  // Hapus Produk (CMS)
  deleteProduct(id) {
    this.products = this.products.filter(p => p.id !== id);
    this.saveToStorage();
  }

  // Toggle status aktif produk
  toggleActive(id) {
    const p = this.products.find(item => item.id === id);
    if (p) {
      p.is_active = !p.is_active;
      this.saveToStorage();
    }
  }
}
