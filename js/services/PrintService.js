/**
 * PrintService.js
 * Layanan untuk mencetak struk transaksi kasir (Thermal Printer 58mm / 80mm format),
 * dialog pratinjau struk di browser, serta fitur Kirim Struk Digital via WhatsApp ke pelanggan.
 */
export class PrintService {
  constructor(settingsModel) {
    this.settingsModel = settingsModel;
  }

  // Format angka ke format mata uang Rupiah
  formatRupiah(amount) {
    return 'Rp ' + Number(amount || 0).toLocaleString('id-ID');
  }

  /**
   * Hasilkan Template HTML Struk Kasir Termal 58mm / 80mm
   */
  generateReceiptHtml(tx) {
    const brandName = this.settingsModel.get('brand_name', 'Teh Poci');
    const branchName = this.settingsModel.get('branch_name', 'Cabang Limus Pratama Regensi');
    const branchSubtitle = this.settingsModel.get('branch_subtitle', 'Depan PG-TK Al-Imam');
    const address = this.settingsModel.get('address', 'Jl. Limus Pratama Regensi, Cileungsi');
    const phone = this.settingsModel.get('phone', '0812-9876-5432');
    const footerMsg = this.settingsModel.get('receipt_footer', 'Terima Kasih Atas Kunjungan Anda!');

    const itemsHtml = (tx.items || []).map(item => `
      <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:12px;">
        <div style="flex:1; text-align:left;">
          <div style="font-weight:600;">${item.name}</div>
          <div style="font-size:10px; color:#555;">${item.qty} x ${this.formatRupiah(item.price)} ${item.notes ? `(${item.notes})` : ''}</div>
        </div>
        <div style="font-weight:600; text-align:right;">${this.formatRupiah(item.subtotal)}</div>
      </div>
    `).join('');

    return `
      <div id="receipt-container" style="
        width: 100%;
        max-width: 300px;
        margin: 0 auto;
        padding: 16px 12px;
        font-family: 'Courier New', Courier, monospace, sans-serif;
        color: #111;
        background: #fff;
        line-height: 1.3;
      ">
        <!-- Logo & Header -->
        <div style="text-align: center; margin-bottom: 12px;">
          <img src="assets/img/logo-teh-poci.png" alt="Teh Poci Logo" style="max-height: 48px; margin: 0 auto 6px auto; display: block;" onerror="this.style.display='none'"/>
          <div style="font-size: 18px; font-weight: 900; letter-spacing: 1px; color: #0B5834;">
            ${brandName.toUpperCase()}
          </div>
          <div style="font-size: 11px; font-weight: bold; margin-top: 2px;">
            ${branchName}
          </div>
          <div style="font-size: 10px; color: #444;">
            ${branchSubtitle}
          </div>
          <div style="font-size: 9px; color: #666; margin-top: 2px;">
            ${address} • Telp: ${phone}
          </div>
        </div>

        <div style="border-top: 1px dashed #333; margin: 8px 0;"></div>

        <!-- Meta Transaksi -->
        <div style="font-size: 11px; margin-bottom: 8px;">
          <div style="display:flex; justify-content:space-between;">
            <span>No. Struk:</span>
            <span style="font-weight:bold;">${tx.invoice_number}</span>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span>Waktu:</span>
            <span>${tx.display_date || ''} ${tx.display_time || ''}</span>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span>Kasir:</span>
            <span>${tx.cashier_name}</span>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span>Metode Bayar:</span>
            <span style="font-weight:bold;">${tx.payment_method}</span>
          </div>
        </div>

        <div style="border-top: 1px dashed #333; margin: 8px 0;"></div>

        <!-- Daftar Minuman -->
        <div style="margin: 8px 0;">
          ${itemsHtml}
        </div>

        <div style="border-top: 1px dashed #333; margin: 8px 0;"></div>

        <!-- Rincian Total -->
        <div style="font-size: 11px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
            <span>Total Item:</span>
            <span>${tx.total_items} Cup</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
            <span>Subtotal:</span>
            <span>${this.formatRupiah(tx.subtotal)}</span>
          </div>
          ${tx.discount > 0 ? `
          <div style="display:flex; justify-content:space-between; margin-bottom:2px; color:#E31E24;">
            <span>Diskon:</span>
            <span>-${this.formatRupiah(tx.discount)}</span>
          </div>` : ''}
          <div style="display:flex; justify-content:space-between; font-size:14px; font-weight:bold; margin-top:4px; padding-top:4px; border-top:1px solid #ddd;">
            <span>TOTAL:</span>
            <span>${this.formatRupiah(tx.total_amount)}</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-top:3px;">
            <span>Bayar:</span>
            <span>${this.formatRupiah(tx.cash_received)}</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-top:2px; font-weight:bold;">
            <span>Kembalian:</span>
            <span>${this.formatRupiah(tx.cash_change)}</span>
          </div>
        </div>

        <div style="border-top: 1px dashed #333; margin: 12px 0 8px 0;"></div>

        <!-- Footer -->
        <div style="text-align: center; font-size: 10px; color: #444;">
          <div>${footerMsg}</div>
          <div style="font-size: 9px; color: #888; margin-top: 4px;">~ Teh Poci POS System ~</div>
        </div>
      </div>
    `;
  }

  /**
   * Cetak Langsung Melalui Dialog Print Browser / Printer Termal
   */
  printReceipt(tx) {
    const html = this.generateReceiptHtml(tx);
    const printWindow = window.open('', '_blank', 'width=380,height=600');
    if (!printWindow) {
      alert('Mohon izinkan pop-up browser untuk mencetak struk.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cetak Struk - ${tx.invoice_number}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @media print {
            body { margin: 0; padding: 0; }
            @page { margin: 0; size: auto; }
          }
        </style>
      </head>
      <body>
        ${html}
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }

  /**
   * Bagikan Struk Digital melalui WhatsApp ke Pelanggan
   * Mendukung deep-link native WhatsApp di Android & iOS (tanpa refresh/reset PWA),
   * normalisasi nomor HP otomatis (0812 / 812 -> 62812), dan WhatsApp Web di desktop.
   */
  shareViaWhatsApp(tx, customerPhone = '') {
    const brandName = this.settingsModel.get('brand_name', 'Teh Poci');
    const branchName = this.settingsModel.get('branch_name', 'Cabang Limus Pratama Regensi');

    let text = `*STRUK DIGITAL ${brandName.toUpperCase()}*\n`;
    text += `📍 ${branchName}\n`;
    text += `🧾 No: ${tx.invoice_number}\n`;
    text += `⏰ Waktu: ${tx.display_date || ''} ${tx.display_time || ''}\n`;
    text += `👤 Kasir: ${tx.cashier_name}\n`;
    text += `--------------------------------\n`;

    (tx.items || []).forEach(item => {
      text += `• ${item.name} (${item.qty}x) = ${this.formatRupiah(item.subtotal)}\n`;
      if (item.notes && item.notes !== 'Normal Ice & Sugar') {
        text += `  _Catatan: ${item.notes}_\n`;
      }
    });

    text += `--------------------------------\n`;
    text += `*TOTAL: ${this.formatRupiah(tx.total_amount)}*\n`;
    text += `Metode: ${tx.payment_method}\n`;
    text += `Bayar: ${this.formatRupiah(tx.cash_received)}\n`;
    text += `Kembali: ${this.formatRupiah(tx.cash_change)}\n\n`;
    text += `_Terima kasih atas pesanan Anda di Teh Poci! Segar & Nikmat Alami._ 🫖🍃`;

    // Normalisasi nomor telepon Indonesia (0812... / 812... / 62812...)
    let cleanPhone = String(customerPhone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    } else if (cleanPhone.startsWith('8')) {
      cleanPhone = '62' + cleanPhone;
    }

    const encodedText = encodeURIComponent(text);
    const isMobile = /Android|iPhone|iPad|iPod|Windows Phone|Mobile/i.test(navigator.userAgent || '');

    if (isMobile) {
      // 1. Pada Perangkat HP: Gunakan skema URL Native (whatsapp://)
      // Skema ini langsung membuka aplikasi WhatsApp di HP tanpa membuka browser baru
      // dan mencegah browser PWA me-reload ke halaman awal (home/login).
      const nativeUrl = cleanPhone 
        ? `whatsapp://send?phone=${cleanPhone}&text=${encodedText}`
        : `whatsapp://send?text=${encodedText}`;

      // Buat elemen anchor sementara untuk men-trigger intent native OS
      const link = document.createElement('a');
      link.href = nativeUrl;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();

      // Bersihkan elemen anchor
      setTimeout(() => {
        if (link.parentNode) link.parentNode.removeChild(link);
      }, 500);

      // Fallback: Jika setelah 2.5 detik browser masih fokus (WhatsApp native tidak terbuka),
      // arahkan ke tautan web api.whatsapp.com
      setTimeout(() => {
        if (document.visibilityState === 'visible') {
          const fallbackUrl = cleanPhone 
            ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
            : `https://api.whatsapp.com/send?text=${encodedText}`;
          window.location.href = fallbackUrl;
        }
      }, 2500);
    } else {
      // 2. Pada Komputer / Laptop Desktop: Buka WhatsApp Web
      const webUrl = cleanPhone 
        ? `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
        : `https://web.whatsapp.com/send?text=${encodedText}`;

      window.open(webUrl, '_blank', 'noopener,noreferrer');
    }
  }
}
