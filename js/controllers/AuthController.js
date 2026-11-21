/**
 * AuthController.js
 * Controller untuk menangani alur autentikasi, validasi PIN, dan pengalihan peran (Role Guard).
 */
import { SecurityService } from '../services/SecurityService.js';

export class AuthController {
  constructor(userModel, apiService, onLoginSuccess, onLogout) {
    this.userModel = userModel;
    this.apiService = apiService;
    this.onLoginSuccess = onLoginSuccess;
    this.onLogout = onLogout;
    this.failedAttempts = 0;
    this.lockoutUntil = 0;
  }

  /**
   * Proses login staf booth atau admin dengan proteksi keamanan berlapis
   */
  async handleLogin(username, password) {
    // 1. Cek Throttle / Lockout Lokal
    const now = Date.now();
    if (this.lockoutUntil > now) {
      const waitSeconds = Math.ceil((this.lockoutUntil - now) / 1000);
      throw new Error(`Terlalu banyak percobaan gagal. Silakan tunggu ${waitSeconds} detik.`);
    }

    const cleanUsername = SecurityService.sanitizeHtml((username || '').trim());
    const cleanPassword = (password || '').trim();

    if (!cleanUsername || !cleanPassword) {
      throw new Error('Masukkan Username dan PIN/Password!');
    }

    try {
      const response = await this.apiService.login(cleanUsername, cleanPassword);
      if (response && response.user) {
        // Reset counter gagal jika sukses
        this.failedAttempts = 0;
        this.lockoutUntil = 0;

        this.userModel.setSession(response.user, response.token, response.login_time || Date.now());
        if (this.onLoginSuccess) {
          this.onLoginSuccess(response.user);
        }
        return response.user;
      } else {
        throw new Error('Gagal memverifikasi akun pengguna.');
      }
    } catch (err) {
      this.failedAttempts += 1;
      if (this.failedAttempts >= 5) {
        this.lockoutUntil = Date.now() + (60 * 1000); // Kunci selama 60 detik
        throw new Error('Terlalu banyak percobaan gagal. Akun dikunci sementara selama 60 detik demi keamanan.');
      }
      throw new Error(err.message || 'Terjadi kesalahan saat login.');
    }
  }

  /**
   * Quick Login Preset (Kemudahan pengujian & staf booth)
   */
  async quickLogin(presetType) {
    if (presetType === 'cashier') {
      return await this.handleLogin('riza', '1234');
    } else if (presetType === 'admin') {
      return await this.handleLogin('admin', 'admin123');
    }
  }

  /**
   * Logout dari sistem
   */
  handleLogout() {
    this.userModel.clearSession();
    if (this.onLogout) {
      this.onLogout();
    }
  }
}
