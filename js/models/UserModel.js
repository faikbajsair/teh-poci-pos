/**
 * UserModel.js
 * Model untuk mengelola state autentikasi, profil user aktif, dan hak akses (Role Guard).
 */
import { SecurityService } from '../services/SecurityService.js';

export class UserModel {
  constructor() {
    this.currentUser = null;
    this.token = null;
    this.loginTime = null;
    this.loadSession();
  }

  // Muat sesi tersimpan dari localStorage dengan verifikasi masa berlaku
  loadSession() {
    try {
      const savedUser = localStorage.getItem('tehpoci_user');
      const savedToken = localStorage.getItem('tehpoci_token');
      const savedTime = localStorage.getItem('tehpoci_login_time');

      if (savedUser && savedToken) {
        // Cek apakah sesi kadaluarsa (> 12 jam)
        if (SecurityService.isSessionExpired(savedTime, 12)) {
          console.warn('[Security] Sesi login telah kadaluarsa demi keamanan.');
          this.clearSession();
          return;
        }

        const decryptedUser = SecurityService.decryptData(savedUser);
        this.currentUser = JSON.parse(decryptedUser);
        this.token = savedToken;
        this.loginTime = savedTime;
      }
    } catch (e) {
      console.warn('Gagal memuat sesi pengguna:', e);
      this.clearSession();
    }
  }

  // Simpan sesi login baru dengan enkripsi
  setSession(user, token, loginTime = null) {
    this.currentUser = user;
    this.token = token || ('sess_' + Date.now());
    this.loginTime = loginTime || Date.now();

    const encryptedUser = SecurityService.encryptData(JSON.stringify(this.currentUser));
    localStorage.setItem('tehpoci_user', encryptedUser);
    localStorage.setItem('tehpoci_token', this.token);
    localStorage.setItem('tehpoci_login_time', this.loginTime.toString());
  }

  // Hapus sesi (Logout)
  clearSession() {
    this.currentUser = null;
    this.token = null;
    this.loginTime = null;
    localStorage.removeItem('tehpoci_user');
    localStorage.removeItem('tehpoci_token');
    localStorage.removeItem('tehpoci_login_time');
  }

  // Cek apakah user sedang login
  isAuthenticated() {
    return !!this.currentUser;
  }

  // Cek apakah user memiliki hak akses Admin / Owner
  isAdmin() {
    return this.currentUser && (this.currentUser.role === 'admin' || this.currentUser.role === 'owner');
  }

  // Ambil nama lengkap kasir aktif
  getFullName() {
    return this.currentUser ? this.currentUser.full_name : 'Tamu';
  }

  // Ambil ID user
  getId() {
    return this.currentUser ? this.currentUser.id : '';
  }

  // Ambil kode cabang user
  getBranchCode() {
    return this.currentUser ? (this.currentUser.branch_code || 'LPR-01') : 'LPR-01';
  }
}
