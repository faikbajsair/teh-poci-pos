/**
 * UserModel.js
 * Model untuk mengelola state autentikasi, profil user aktif, dan hak akses (Role Guard).
 */
export class UserModel {
  constructor() {
    this.currentUser = null;
    this.token = null;
    this.loadSession();
  }

  // Muat sesi tersimpan dari localStorage
  loadSession() {
    try {
      const savedUser = localStorage.getItem('tehpoci_user');
      const savedToken = localStorage.getItem('tehpoci_token');
      if (savedUser && savedToken) {
        this.currentUser = JSON.parse(savedUser);
        this.token = savedToken;
      }
    } catch (e) {
      console.warn('Gagal memuat sesi pengguna:', e);
      this.clearSession();
    }
  }

  // Simpan sesi login baru
  setSession(user, token) {
    this.currentUser = user;
    this.token = token || ('sess_' + Date.now());
    localStorage.setItem('tehpoci_user', JSON.stringify(this.currentUser));
    localStorage.setItem('tehpoci_token', this.token);
  }

  // Hapus sesi (Logout)
  clearSession() {
    this.currentUser = null;
    this.token = null;
    localStorage.removeItem('tehpoci_user');
    localStorage.removeItem('tehpoci_token');
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
