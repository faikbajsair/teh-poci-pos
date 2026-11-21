/**
 * SoundService.js
 * Layanan Notifikasi Suara & Suara Asisten (Text-to-Speech)
 * Teh Poci POS — Cabang Limus Pratama Regensi
 * 
 * Fitur:
 * 1. Web Audio API Cash Chime: Nada lonceng kasir jernih ("Kaching / Ting-tong") sintetis tanpa beban file eksternal.
 * 2. Voice Speech Synthesis (TTS): Pembacaan nominal pembayaran bahasa Indonesia (seperti soundbox QRIS).
 * 3. Terbilang Helper: Konversi angka nominal ke kalimat bahasa Indonesia yang akurat.
 * 4. Pengaturan & Uji Coba: Toggle on/off dan tombol preview suara.
 */

export class SoundService {
  constructor(settingsModel = null) {
    this.settingsModel = settingsModel;
    this.audioCtx = null;
    this.isAudioUnlocked = false;

    // Load konfigurasi dari localStorage (default aktif)
    this.isSoundEnabled = localStorage.getItem('poci_sound_enabled') !== 'false';
    this.isVoiceEnabled = localStorage.getItem('poci_voice_enabled') !== 'false';

    // Auto unlock audio context pada klik pertama pengguna
    this.setupUnlockListener();
  }

  // Buka suspensi Web Audio API saat ada interaksi pertama
  setupUnlockListener() {
    const unlock = () => {
      this.ensureAudioContext();
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      this.isAudioUnlocked = true;
      document.removeEventListener('click', unlock);
      document.removeEventListener('touchstart', unlock);
    };

    document.addEventListener('click', unlock, { once: true, passive: true });
    document.addEventListener('touchstart', unlock, { once: true, passive: true });
  }

  ensureAudioContext() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }
  }

  /**
   * Main Notification: Membunyikan Chime + Mengucapkan Nominal
   * @param {Object} tx - Objek transaksi ({ total_amount, payment_method, invoice_number })
   */
  async notifyPaymentSuccess(tx) {
    if (!tx) return;
    const amount = Number(tx.total_amount || 0);
    const method = tx.payment_method || 'QRIS';

    // 1. Mainkan nada lonceng kasir
    if (this.isSoundEnabled) {
      await this.playChime();
    }

    // 2. Ucapkan suara konfirmasi via TTS
    if (this.isVoiceEnabled) {
      // Berikan jeda 350ms agar nada lonceng selesai berdering sebelum suara asisten bicara
      setTimeout(() => {
        this.speakPaymentSuccess(amount, method);
      }, 350);
    }
  }

  /**
   * Web Audio API: Memainkan nada lonceng sukses kasir (Dual Harmonic Bell)
   */
  playChime() {
    return new Promise((resolve) => {
      try {
        this.ensureAudioContext();
        if (!this.audioCtx) return resolve();

        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume();
        }

        const now = this.audioCtx.currentTime;

        // Sequence Nada Arpeggio Mewah: C5 (523.25Hz), E5 (659.25Hz), G5 (783.99Hz), C6 (1046.50Hz)
        const notes = [
          { freq: 523.25, time: 0, dur: 0.18, gain: 0.35 },
          { freq: 659.25, time: 0.08, dur: 0.18, gain: 0.35 },
          { freq: 783.99, time: 0.16, dur: 0.22, gain: 0.4 },
          { freq: 1046.50, time: 0.24, dur: 0.65, gain: 0.45 }
        ];

        notes.forEach(({ freq, time, dur, gain }) => {
          const osc = this.audioCtx.createOscillator();
          const gainNode = this.audioCtx.createGain();

          osc.type = 'triangle'; // Nada bulat hangat khas lonceng kasir
          osc.frequency.setValueAtTime(freq, now + time);

          // Envelope Gain (Attack tajam, Decay lembut)
          gainNode.gain.setValueAtTime(0.001, now + time);
          gainNode.gain.exponentialRampToValueAtTime(gain, now + time + 0.02);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

          osc.connect(gainNode);
          gainNode.connect(this.audioCtx.destination);

          osc.start(now + time);
          osc.stop(now + time + dur);
        });

        setTimeout(resolve, 600);
      } catch (e) {
        console.warn('Gagal memutar audio chime:', e);
        resolve();
      }
    });
  }

  /**
   * Suara Asisten Suara (Text-to-Speech)
   */
  speakPaymentSuccess(amount, method = 'QRIS') {
    if (!('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel(); // Hentikan suara sebelumnya jika ada

      const terbilangStr = this.terbilang(amount);
      let text = '';

      if (method === 'QRIS') {
        text = `Pembayaran QRIS sebesar ${terbilangStr} rupiah berhasil diterima.`;
      } else if (method === 'Transfer') {
        text = `Pembayaran transfer bank sebesar ${terbilangStr} rupiah berhasil masuk.`;
      } else {
        text = `Pembayaran tunai sebesar ${terbilangStr} rupiah berhasil diselesaikan.`;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      utterance.rate = 1.0;  // Kecepatan normal dan jelas
      utterance.pitch = 1.05; // Sedikit cerah ramah
      utterance.volume = 1.0;

      // Cari suara bahasa Indonesia jika tersedia di perangkat
      const voices = window.speechSynthesis.getVoices();
      const idVoice = voices.find(v => v.lang === 'id-ID' || v.lang === 'id_ID' || v.lang.startsWith('id'));
      if (idVoice) {
        utterance.voice = idVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Gagal memainkan Text-to-Speech:', e);
    }
  }

  /**
   * Fungsi Konversi Angka ke Terbilang Bahasa Indonesia
   * Contoh: 16000 -> "enam belas ribu"
   */
  terbilang(angka) {
    const num = Math.abs(Math.round(Number(angka) || 0));
    if (num === 0) return 'nol';

    const bilangan = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];

    if (num < 12) {
      return bilangan[num];
    } else if (num < 20) {
      return this.terbilang(num - 10) + ' belas';
    } else if (num < 100) {
      return this.terbilang(Math.floor(num / 10)) + ' puluh ' + this.terbilang(num % 10);
    } else if (num < 200) {
      return 'seratus ' + this.terbilang(num - 100);
    } else if (num < 1000) {
      return this.terbilang(Math.floor(num / 100)) + ' ratus ' + this.terbilang(num % 100);
    } else if (num < 2000) {
      return 'seribu ' + this.terbilang(num - 1000);
    } else if (num < 1000000) {
      return this.terbilang(Math.floor(num / 1000)) + ' ribu ' + this.terbilang(num % 1000);
    } else if (num < 1000000000) {
      return this.terbilang(Math.floor(num / 1000000)) + ' juta ' + this.terbilang(num % 1000000);
    } else {
      return num.toLocaleString('id-ID');
    }
  }

  // Uji Coba Suara (Bisa dipanggil dari tombol test di UI)
  testSound(method = 'QRIS', amount = 16000) {
    this.notifyPaymentSuccess({
      payment_method: method,
      total_amount: amount
    });
  }

  // Toggle Pengaturan Suara Chime
  toggleSound(enabled = null) {
    this.isSoundEnabled = enabled !== null ? enabled : !this.isSoundEnabled;
    localStorage.setItem('poci_sound_enabled', this.isSoundEnabled);
    return this.isSoundEnabled;
  }

  // Toggle Pengaturan Suara Voice TTS
  toggleVoice(enabled = null) {
    this.isVoiceEnabled = enabled !== null ? enabled : !this.isVoiceEnabled;
    localStorage.setItem('poci_voice_enabled', this.isVoiceEnabled);
    return this.isVoiceEnabled;
  }
}
