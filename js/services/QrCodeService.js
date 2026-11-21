/**
 * QrCodeService.js
 * Layanan Pembuatan & Render QR Code / QRIS Standar Indonesia secara 100% Client-Side.
 * Menggunakan QRCode.js lokal tanpa ketergantungan API pihak ketiga (bebas blokir & offline-ready).
 */

export class QrCodeService {
  constructor(settingsModel = null) {
    this.settings = settingsModel;
  }

  /**
   * Render QR Code ke dalam DOM element target
   * @param {HTMLElement|string} target - Elemen atau ID target
   * @param {string} text - Payload / String QR
   * @param {number} size - Ukuran pixel (default 180)
   */
  renderQr(target, text, size = 180) {
    const el = typeof target === 'string' ? document.getElementById(target) : target;
    if (!el) return;

    el.innerHTML = ''; // Bersihkan container

    if (window.QRCode) {
      try {
        new window.QRCode(el, {
          text: text,
          width: size,
          height: size,
          colorDark: '#000000',
          colorLight: '#ffffff',
          correctLevel: window.QRCode.CorrectLevel.M
        });

        // Styling canvas/img agar responsif & rapi
        setTimeout(() => {
          const img = el.querySelector('img');
          const canvas = el.querySelector('canvas');
          if (img) {
            img.style.margin = '0 auto';
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            img.style.display = 'block';
          }
          if (canvas) {
            canvas.style.margin = '0 auto';
            canvas.style.maxWidth = '100%';
            canvas.style.height = 'auto';
          }
        }, 50);
        return;
      } catch (e) {
        console.warn('Gagal render QRCode via window.QRCode, beralih ke fallback SVG:', e);
      }
    }

    // Fallback jika QRCode.js belum selesai dimuat: Render SVG QRIS Placeholder Elegan
    el.innerHTML = this.generateFallbackQrSvg(size);
  }

  /**
   * Fallback SVG jika script library QRCode belum siap
   */
  generateFallbackQrSvg(size = 180) {
    return `
      <div class="flex flex-col items-center justify-center p-3 text-center w-full h-full bg-slate-50 rounded-xl">
        <svg class="w-16 h-16 text-slate-400 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="14" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/>
          <path d="M7 7h.01M17 7h.01M7 17h.01M17 17h.01"/>
        </svg>
        <span class="text-[11px] font-bold text-slate-700">QRIS Booth Siap</span>
        <span class="text-[9px] text-slate-400">Scan pembayaran digital</span>
      </div>
    `;
  }

  /**
   * Dapatkan Payload String QRIS Resmi Booth
   */
  getQrisPayload(amount = 0) {
    const customPayload = this.settings?.get('qris_payload');
    if (customPayload && customPayload.trim().length > 10) {
      return customPayload.trim();
    }

    // Default Payload QRIS Booth Teh Poci Cabang Limus Pratama Regensi (A.n Faik)
    return `00020101021126570014ID.LINKAJA.WWW011893600914000000000002150000000000000000303UME51440014ID.CO.QRIS.WWW0215ID10200000000005204581253033605802ID5923TEH%20POCI%20LIMUS%20PRATAMA6005BOGOR61051682062070703A016304E627`;
  }
}
