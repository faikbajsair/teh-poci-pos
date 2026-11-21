/**
 * app.js
 * Inisialisasi Utama Aplikasi (Entry Point) Teh Poci POS — Cabang Limus Pratama Regensi
 * Pola Arsitektur Modular MVC (Model - View - Controller).
 */

// 1. Import Models
import { UserModel } from './models/UserModel.js';
import { ProductModel } from './models/ProductModel.js';
import { TransactionModel } from './models/TransactionModel.js';
import { ShiftModel } from './models/ShiftModel.js';
import { SettingsModel } from './models/SettingsModel.js';
import { InventoryModel } from './models/InventoryModel.js';

// 2. Import Services
import { ApiService } from './services/ApiService.js';
import { PrintService } from './services/PrintService.js';
import { SoundService } from './services/SoundService.js';

// 3. Import Controllers
import { AuthController } from './controllers/AuthController.js';
import { PosController } from './controllers/PosController.js';
import { HistoryController } from './controllers/HistoryController.js';
import { ShiftController } from './controllers/ShiftController.js';
import { CmsController } from './controllers/CmsController.js';

// 4. Import Views
import { LoginView } from './views/LoginView.js';
import { PosView } from './views/PosView.js';
import { HistoryView } from './views/HistoryView.js';
import { ShiftView } from './views/ShiftView.js';
import { CmsView } from './views/CmsView.js';

class App {
  constructor() {
    this.container = document.getElementById('app');

    // Inisialisasi Models
    this.settingsModel = new SettingsModel();
    this.userModel = new UserModel();
    this.productModel = new ProductModel();
    this.transactionModel = new TransactionModel();
    this.shiftModel = new ShiftModel();
    this.inventoryModel = new InventoryModel();

    // Terapkan Tema CSS Variables
    this.settingsModel.applyThemeToDOM();

    // Inisialisasi Services
    this.apiService = new ApiService(this.settingsModel);
    this.printService = new PrintService(this.settingsModel);
    this.soundService = new SoundService(this.settingsModel);

    // Inisialisasi Controllers
    this.authController = new AuthController(
      this.userModel,
      this.apiService,
      (user) => this.handleLoginSuccess(user),
      () => this.handleLogoutSuccess()
    );

    this.posController = new PosController(
      this.productModel,
      this.transactionModel,
      this.userModel,
      this.apiService,
      this.printService,
      (msg, type) => this.showNotification(msg, type)
    );

    this.historyController = new HistoryController(
      this.transactionModel,
      this.apiService,
      this.printService
    );

    this.shiftController = new ShiftController(
      this.shiftModel,
      this.transactionModel,
      this.userModel,
      this.apiService,
      this.printService
    );

    this.cmsController = new CmsController(
      this.settingsModel,
      this.productModel,
      this.userModel,
      this.transactionModel,
      this.apiService,
      this.inventoryModel
    );

    // Inisialisasi Views
    this.loginView = new LoginView(this.authController, this.settingsModel);
    this.posView = new PosView(
      this.posController,
      this.productModel,
      this.transactionModel,
      this.userModel,
      this.settingsModel,
      this.apiService,
      (route) => this.navigate(route),
      this.soundService
    );
    this.historyView = new HistoryView(
      this.historyController,
      this.userModel,
      this.settingsModel,
      (route) => this.navigate(route)
    );
    this.shiftView = new ShiftView(
      this.shiftController,
      this.userModel,
      this.settingsModel,
      (route) => this.navigate(route)
    );
    this.cmsView = new CmsView(
      this.cmsController,
      this.settingsModel,
      this.productModel,
      this.userModel,
      this.apiService,
      (route) => this.navigate(route),
      this.inventoryModel,
      this.soundService
    );

    this.setupRouter();
    this.syncInitialData();
  }

  // Sinkronisasi data awal & berkala dari Google Apps Script secara real-time
  async syncInitialData() {
    if (!this.apiService || !this.apiService.isGasConfigured()) return;
    try {
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
      }
    } catch (e) {
      console.warn('Sync background berjalan:', e);
    }
  }

  // Notifikasi Toast Ringan
  showNotification(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold text-white transition-all transform duration-300 ${type === 'error' ? 'bg-red-600' : 'bg-emerald-800'}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-[-10px]');
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  // Pengaturan Router Hash (#pos, #history, #shift, #cms, #login)
  setupRouter() {
    window.addEventListener('hashchange', () => this.handleRouting());
    this.handleRouting();
  }

  navigate(route) {
    if (route === 'logout') {
      this.authController.handleLogout();
      return;
    }
    window.location.hash = '#' + route;
  }

  handleLoginSuccess(user) {
    this.navigate('pos');
  }

  handleLogoutSuccess() {
    this.navigate('login');
  }

  handleRouting() {
    const hash = window.location.hash.replace('#', '') || 'pos';

    // Role Guard: Cek apakah sudah login
    if (!this.userModel.isAuthenticated() && hash !== 'login') {
      window.location.hash = '#login';
      this.loginView.render(this.container);
      return;
    }

    if (this.userModel.isAuthenticated() && hash === 'login') {
      window.location.hash = '#pos';
      this.posView.render(this.container);
      return;
    }

    // Role Guard untuk Menu CMS: Hanya Admin / Owner yang boleh akses
    if (hash === 'cms' && !this.userModel.isAdmin()) {
      alert('Akses Terbatas: Hanya Administrator/Owner (Pak Faik) yang dapat membuka Dashboard CMS.');
      window.location.hash = '#pos';
      this.posView.render(this.container);
      return;
    }

    switch (hash) {
      case 'login':
        this.loginView.render(this.container);
        break;
      case 'pos':
        this.posView.render(this.container);
        break;
      case 'history':
        this.historyView.render(this.container);
        break;
      case 'shift':
        this.shiftView.render(this.container);
        break;
      case 'cms':
        this.cmsView.render(this.container);
        break;
      default:
        this.posView.render(this.container);
        break;
    }

    window.scrollTo(0, 0);
  }
}

// Boot Aplikasi saat DOM Siap
document.addEventListener('DOMContentLoaded', () => {
  window.tehPociApp = new App();
});
