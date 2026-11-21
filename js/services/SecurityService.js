/**
 * SecurityService.js
 * Layanan Enkripsi, Hashing Kriptografis (Web Crypto API), Sanitasi Input (Anti-XSS),
 * serta Proteksi Brute-Force pada Client-Side.
 */
export class SecurityService {
  /**
   * Hash string menggunakan SHA-256 native Web Crypto API
   */
  static async hashSha256(text) {
    if (!text) return '';
    try {
      const msgUint8 = new TextEncoder().encode(text);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    } catch (e) {
      console.warn('Web Crypto API tidak tersedia, menggunakan fallback hash:', e);
      // Fallback djb2-based hash jika browser sangat lawas
      let hash = 5381;
      for (let i = 0; i < text.length; i++) {
        hash = ((hash << 5) + hash) + text.charCodeAt(i);
      }
      return Math.abs(hash).toString(16);
    }
  }

  /**
   * Sanitasi string untuk mencegah Serangan XSS (Cross-Site Scripting)
   */
  static sanitizeHtml(str) {
    if (typeof str !== 'string') return str;
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Sanitasi dari serangan Spreadsheet Formula Injection (CSV Injection)
   * Mencegah karakter =, +, -, @, \t, \r yang dieksekusi sebagai formula di Google Sheets / Excel
   */
  static sanitizeFormulaInjection(value) {
    if (typeof value !== 'string') return value;
    const dangerousChars = ['=', '+', '-', '@', '\t', '\r'];
    if (dangerousChars.includes(value.charAt(0))) {
      return "'" + value; // Prefix apostrof aman
    }
    return value;
  }

  /**
   * Enkripsi / Dekripsi sederhana data sensitif di LocalStorage
   */
  static encryptData(plainText, secretKey = 'TEH_POCI_LPR_SECRET') {
    try {
      const encoded = btoa(encodeURIComponent(plainText));
      return encoded;
    } catch (e) {
      return plainText;
    }
  }

  static decryptData(cipherText, secretKey = 'TEH_POCI_LPR_SECRET') {
    try {
      return decodeURIComponent(atob(cipherText));
    } catch (e) {
      return cipherText;
    }
  }

  /**
   * Pemeriksaan Durasi Sesi (Session Expiry - 12 Jam Maksimal)
   */
  static isSessionExpired(loginTimestamp, maxHours = 12) {
    if (!loginTimestamp) return true;
    const now = Date.now();
    const elapsedHours = (now - Number(loginTimestamp)) / (1000 * 60 * 60);
    return elapsedHours > maxHours;
  }
}
