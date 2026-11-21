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
      <div id="login-root" class="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden">
        <!-- Background Decorative Circles -->
        <div class="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-100/60 blur-2xl pointer-events-none"></div>
        <div class="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-amber-100/60 blur-2xl pointer-events-none"></div>

        <div class="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-emerald-900/5 border border-emerald-100/80 p-6 sm:p-8 relative z-10 transition-all">
          
          <!-- Logo & Brand Header -->
          <div class="text-center mb-6">
            <div class="flex items-center justify-center mb-2">
              <img src="assets/img/logo-teh-poci.png" alt="Logo Asli Teh Poci" class="w-32 sm:w-36 h-auto object-contain filter drop-shadow-md hover:scale-105 transition-transform duration-300">
            </div>
            <h1 class="text-2xl font-black text-[#0B5834] tracking-tight">TEH <span class="text-[#E31E24]">POCI</span></h1>
            <p class="text-xs font-bold text-[#63B846] mt-0.5 tracking-wider uppercase">${branchName}</p>
            <p class="text-[11px] text-slate-500">${branchSubtitle}</p>
          </div>

          <!-- Login Form Manual -->
          <form id="form-login" class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Username / Nama Kasir</label>
              <div class="relative">
                <input type="text" id="login-username" class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0B5834] focus:ring-2 focus:ring-[#0B5834]/20 text-sm font-medium text-slate-800 transition-all outline-none" placeholder="Masukkan username" required autofocus>
                <span class="absolute right-3.5 top-3 text-slate-400 text-sm">👤</span>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">PIN Kasir (4 Digit) / Password</label>
              <div class="relative">
                <input type="password" id="login-password" maxlength="32" class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0B5834] focus:ring-2 focus:ring-[#0B5834]/20 text-sm font-semibold tracking-wider text-slate-800 transition-all outline-none" placeholder="••••" required>
                <button type="button" id="toggle-pwd" class="absolute right-3 top-3 text-slate-400 hover:text-slate-600 text-xs font-semibold px-1">TAMPIL</button>
              </div>
            </div>

            <!-- Pesan Error / Status -->
            <div id="login-alert" class="hidden p-3 rounded-xl text-xs font-medium"></div>

            <!-- Tombol Masuk -->
            <button type="submit" id="btn-submit-login" class="w-full py-3.5 px-4 rounded-xl bg-[#0B5834] hover:bg-[#084428] active:scale-[0.98] text-white font-black text-sm tracking-wide shadow-lg shadow-[#0B5834]/25 transition-all flex items-center justify-center gap-2">
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
    const root = container.querySelector('#login-root');
    if (!root) return;

    const form = root.querySelector('#form-login');
    const alertBox = root.querySelector('#login-alert');
    const userInput = root.querySelector('#login-username');
    const passInput = root.querySelector('#login-password');
    const btnSubmit = root.querySelector('#btn-submit-login');
    const togglePwd = root.querySelector('#toggle-pwd');

    // Toggle Password Visibility
    togglePwd?.addEventListener('click', () => {
      if (passInput.type === 'password') {
        passInput.type = 'text';
        togglePwd.textContent = 'SEMBUNYI';
      } else {
        passInput.type = 'password';
        togglePwd.textContent = 'TAMPIL';
      }
    });

    // Submit Form
    form?.addEventListener('submit', async (e) => {
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
