/**
 * AuthController.js
 * Controller untuk menangani alur autentikasi, validasi PIN, dan pengalihan peran (Role Guard).
 */
export class AuthController {
  constructor(userModel, apiService, onLoginSuccess, onLogout) {
    this.userModel = userModel;
    this.apiService = apiService;
    this.onLoginSuccess = onLoginSuccess;
    this.onLogout = onLogout;
  }

  /**
   * Proses login staf booth atau admin
   */
  async handleLogin(username, password) {
    if (!username && !password) {
      throw new Error('Masukkan Username dan PIN/Password!');
    }

    try {
      const response = await this.apiService.login(username, password);
      if (response && response.user) {
        this.userModel.setSession(response.user, response.token);
        if (this.onLoginSuccess) {
          this.onLoginSuccess(response.user);
        }
        return response.user;
      } else {
        throw new Error('Gagal memverifikasi akun pengguna.');
      }
    } catch (err) {
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
