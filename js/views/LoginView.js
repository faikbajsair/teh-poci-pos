/**
 * LoginView.js
 * Tampilan antarmuka login yang modern, responsif, dan ramah layar HP (Mobile-First).
 * Mendukung login PIN cepat untuk kasir booth atau username/password untuk owner.
 */
export class LoginView {
  constructor(authController, settingsModel) {
    this.auth = authController;
    this.settings = settingsModel;
  }

  render(container) {
    const brandName = this.settings.get('brand_name', 'Teh Poci');
    const branchName = this.settings.get('branch_name', 'Teh Poci — Cabang Limus Pratama Regensi');
    const branchSubtitle = this.settings.get('branch_subtitle', 'Depan PG-TK Al-Imam');

    container.innerHTML = `
      <div class="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden">
        <!-- Background Decorative Circles -->
        <div class="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-100/60 blur-2xl pointer-events-none"></div>
        <div class="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-amber-100/60 blur-2xl pointer-events-none"></div>

        <div class="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-emerald-900/5 border border-emerald-100/80 p-6 sm:p-8 relative z-10 transition-all">
          
          <!-- Logo & Brand Header -->
          <div class="text-center mb-6">
            <div class="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-900 shadow-lg shadow-emerald-800/30 p-2 mb-3">
              <img src="assets/img/logo-teh-poci.svg" alt="Logo Teh Poci" class="w-full h-full object-contain filter drop-shadow">
            </div>
            <h1 class="text-2xl font-black text-emerald-900 tracking-tight">${brandName.toUpperCase()}</h1>
            <p class="text-xs font-bold text-emerald-700 mt-0.5 tracking-wider uppercase">${branchName}</p>
            <p class="text-[11px] text-slate-500">${branchSubtitle}</p>
          </div>

          <!-- Quick Login Preset Badges (1-Tap Switch) -->
          <div class="mb-5 bg-emerald-50/70 p-3 rounded-2xl border border-emerald-100">
            <p class="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Pilih Akses Cepat (1-Klik):
            </p>
            <div class="grid grid-cols-2 gap-2">
              <button type="button" id="btn-preset-cashier" class="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white border border-emerald-200 text-slate-700 hover:border-emerald-600 hover:text-emerald-700 active:scale-95 transition-all shadow-sm">
                <span class="text-xs font-black text-emerald-900">Pak Riza Lahmadi</span>
                <span class="text-[10px] text-emerald-600 font-medium">Staf Kasir Booth (PIN: 1234)</span>
              </button>
              <button type="button" id="btn-preset-admin" class="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white border border-amber-200 text-slate-700 hover:border-amber-600 hover:text-amber-800 active:scale-95 transition-all shadow-sm">
                <span class="text-xs font-black text-amber-900">Pak Faik</span>
                <span class="text-[10px] text-amber-700 font-medium">Owner / Admin (Akses Penuh)</span>
              </button>
            </div>
          </div>

          <!-- Login Form Manual -->
          <form id="form-login" class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Username / Nama Staf</label>
              <div class="relative">
                <input type="text" id="login-username" class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium text-slate-800 transition-all outline-none" placeholder="riza atau admin" required>
                <span class="absolute right-3.5 top-3 text-slate-400 text-sm">👤</span>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">PIN Kasir (4 Digit) / Password</label>
              <div class="relative">
                <input type="password" id="login-password" maxlength="20" class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-sm font-semibold tracking-wider text-slate-800 transition-all outline-none" placeholder="••••" required>
                <button type="button" id="toggle-pwd" class="absolute right-3 top-3 text-slate-400 hover:text-slate-600 text-xs font-semibold px-1">TAMPIL</button>
              </div>
            </div>

            <!-- Pesan Error / Status -->
            <div id="login-alert" class="hidden p-3 rounded-xl text-xs font-medium"></div>

            <!-- Tombol Masuk -->
            <button type="submit" id="btn-submit-login" class="w-full py-3.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white font-black text-sm tracking-wide shadow-lg shadow-emerald-700/25 transition-all flex items-center justify-center gap-2">
              <span>MASUK KE SISTEM KASIR</span>
              <span>➔</span>
            </button>
          </form>

          <!-- Footer Information -->
          <div class="mt-6 pt-4 border-t border-slate-100 text-center">
            <p class="text-[11px] text-slate-400">
              Sistem POS & Booth Management • Multi-Tenant & CMS Ready<br>
              <span class="text-emerald-700 font-semibold">Cabang Limus Pratama Regensi</span>
            </p>
          </div>

        </div>
      </div>
    `;

    this.bindEvents(container);
  }

  bindEvents(container) {
    const form = container.querySelector('#form-login');
    const alertBox = container.querySelector('#login-alert');
    const userInput = container.querySelector('#login-username');
    const passInput = container.querySelector('#login-password');
    const btnSubmit = container.querySelector('#btn-submit-login');
    const togglePwd = container.querySelector('#toggle-pwd');

    // Preset Cashier
    container.querySelector('#btn-preset-cashier').addEventListener('click', async () => {
      userInput.value = 'riza';
      passInput.value = '1234';
      await this.doSubmit(userInput.value, passInput.value, alertBox, btnSubmit);
    });

    // Preset Admin
    container.querySelector('#btn-preset-admin').addEventListener('click', async () => {
      userInput.value = 'admin';
      passInput.value = 'admin123';
      await this.doSubmit(userInput.value, passInput.value, alertBox, btnSubmit);
    });

    // Toggle Password Visibility
    togglePwd.addEventListener('click', () => {
      if (passInput.type === 'password') {
        passInput.type = 'text';
        togglePwd.textContent = 'SEMBUNYI';
      } else {
        passInput.type = 'password';
        togglePwd.textContent = 'TAMPIL';
      }
    });

    // Submit Form
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.doSubmit(userInput.value, passInput.value, alertBox, btnSubmit);
    });
  }

  async doSubmit(username, password, alertBox, btnSubmit) {
    alertBox.className = 'hidden';
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `
      <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
      </svg>
      <span>Memverifikasi Akun...</span>
    `;

    try {
      await this.auth.handleLogin(username, password);
    } catch (err) {
      alertBox.className = 'block p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold text-center animate-shake';
      alertBox.textContent = err.message || 'Login gagal. Periksa kembali username dan PIN.';
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = `<span>MASUK KE SISTEM KASIR</span> <span>➔</span>`;
    }
  }
}
