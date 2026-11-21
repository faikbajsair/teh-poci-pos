#!/usr/bin/env python3
"""
Skrip Generator Aset Gambar & Utilitas Slicing Poster Menu Teh Poci
Fungsi:
1. Menghasilkan SVG berkualitas tinggi untuk Logo Teh Poci & 17 Varian Menu Minuman.
2. Menyediakan utilitas untuk memotong (slice) poster menu fisik/foto jika ada gambar poster input.
   Contoh penggunaan:
   - Generate default SVG: python3 scripts/slice_menu.py
   - Slicing foto poster: python3 scripts/slice_menu.py --poster poster_menu.jpg
"""

import os
import sys
import argparse

MENU_ITEMS = [
    {
        "id": "PROD-001",
        "name": "Jasmine Tea Kecil",
        "filename": "jasmine-kecil.svg",
        "liquid_color": "#C9822B",
        "accent_color": "#6FA832",
        "cup_size": "small",
        "label": "Jasmine Small",
        "price": "3.000",
        "badge": "Hemat"
    },
    {
        "id": "PROD-002",
        "name": "Jasmine Poci Iced Tea",
        "filename": "jasmine-poci.svg",
        "liquid_color": "#B86A1D",
        "accent_color": "#55A630",
        "cup_size": "medium",
        "label": "Original Poci",
        "price": "4.000",
        "badge": "Best Seller"
    },
    {
        "id": "PROD-003",
        "name": "Apple Iced Tea",
        "filename": "apple-tea.svg",
        "liquid_color": "#D35400",
        "accent_color": "#2ECC71",
        "cup_size": "medium",
        "label": "Apple Tea",
        "price": "6.000",
        "badge": "Segar"
    },
    {
        "id": "PROD-004",
        "name": "Orange Iced Tea",
        "filename": "orange-tea.svg",
        "liquid_color": "#E67E22",
        "accent_color": "#F39C12",
        "cup_size": "medium",
        "label": "Orange Tea",
        "price": "6.000",
        "badge": "Segar"
    },
    {
        "id": "PROD-005",
        "name": "Lemon Honey Iced Tea",
        "filename": "lemon-honey.svg",
        "liquid_color": "#F1C40F",
        "accent_color": "#27AE60",
        "cup_size": "medium",
        "label": "Lemon Honey",
        "price": "6.000",
        "badge": "Favorit"
    },
    {
        "id": "PROD-006",
        "name": "Mango Iced Tea",
        "filename": "mango-tea.svg",
        "liquid_color": "#FFA500",
        "accent_color": "#E67E22",
        "cup_size": "medium",
        "label": "Mango Tea",
        "price": "6.000",
        "badge": "Favorit"
    },
    {
        "id": "PROD-007",
        "name": "Blackcurrant Iced Tea",
        "filename": "blackcurrant-tea.svg",
        "liquid_color": "#6C3483",
        "accent_color": "#8E44AD",
        "cup_size": "medium",
        "label": "Blackcurrant",
        "price": "6.000",
        "badge": "Segar"
    },
    {
        "id": "PROD-008",
        "name": "Lychee Iced Tea",
        "filename": "lychee-tea.svg",
        "liquid_color": "#E8A7A1",
        "accent_color": "#C0392B",
        "cup_size": "medium",
        "label": "Lychee Tea",
        "price": "6.000",
        "badge": "Favorit"
    },
    {
        "id": "PROD-009",
        "name": "Guava Iced Tea",
        "filename": "guava-tea.svg",
        "liquid_color": "#E57373",
        "accent_color": "#4CAF50",
        "cup_size": "medium",
        "label": "Guava Tea",
        "price": "6.000",
        "badge": "Segar"
    },
    {
        "id": "PROD-010",
        "name": "Markisa/Menu Baru",
        "filename": "markisa-tea.svg",
        "liquid_color": "#F39C12",
        "accent_color": "#D35400",
        "cup_size": "medium",
        "label": "Markisa Baru",
        "price": "7.000",
        "badge": "Menu Baru"
    },
    {
        "id": "PROD-011",
        "name": "Thai Iced Tea",
        "filename": "thai-tea.svg",
        "liquid_color": "#E06D28",
        "accent_color": "#FDFEFE",
        "cup_size": "large",
        "label": "Thai Tea",
        "price": "9.000",
        "badge": "Best Seller"
    },
    {
        "id": "PROD-012",
        "name": "Chocolatos",
        "filename": "chocolatos.svg",
        "liquid_color": "#563A29",
        "accent_color": "#2C1B13",
        "cup_size": "large",
        "label": "Chocolatos",
        "price": "9.000",
        "badge": "Creamy"
    },
    {
        "id": "PROD-013",
        "name": "Green Tea",
        "filename": "green-tea.svg",
        "liquid_color": "#689F38",
        "accent_color": "#9CCC65",
        "cup_size": "large",
        "label": "Green Tea",
        "price": "9.000",
        "badge": "Creamy"
    },
    {
        "id": "PROD-014",
        "name": "Cappuccino Iced Tea",
        "filename": "cappuccino-tea.svg",
        "liquid_color": "#795548",
        "accent_color": "#D7CCC8",
        "cup_size": "medium",
        "label": "Cappuccino",
        "price": "8.000",
        "badge": "Coffee Mix"
    },
    {
        "id": "PROD-015",
        "name": "Chocolate Iced Tea",
        "filename": "chocolate-tea.svg",
        "liquid_color": "#4E342E",
        "accent_color": "#8D6E63",
        "cup_size": "medium",
        "label": "Choco Tea",
        "price": "8.000",
        "badge": "Favorit"
    },
    {
        "id": "PROD-016",
        "name": "Milo",
        "filename": "milo.svg",
        "liquid_color": "#4A2E18",
        "accent_color": "#008837",
        "cup_size": "large",
        "label": "Milo Iced",
        "price": "9.000",
        "badge": "Kids Favorit"
    },
    {
        "id": "PROD-017",
        "name": "Beng-Beng",
        "filename": "beng-beng.svg",
        "liquid_color": "#5D2B12",
        "accent_color": "#E53935",
        "cup_size": "large",
        "label": "Beng-Beng",
        "price": "9.000",
        "badge": "Spesial"
    }
]

def generate_logo():
    return """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 140" width="100%" height="100%">
  <defs>
    <linearGradient id="pociGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#C0392B"/>
      <stop offset="50%" stop-color="#A93226"/>
      <stop offset="100%" stop-color="#7B241C"/>
    </linearGradient>
    <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#76B82A"/>
      <stop offset="100%" stop-color="#146C36"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFE082"/>
      <stop offset="50%" stop-color="#FFD600"/>
      <stop offset="100%" stop-color="#FFA000"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-opacity="0.25"/>
    </filter>
  </defs>

  <g transform="translate(15, 12)" filter="url(#shadow)">
    <circle cx="58" cy="58" r="56" fill="#146C36" stroke="#FFD600" stroke-width="4"/>
    <circle cx="58" cy="58" r="48" fill="#1B5E20"/>

    <path d="M48 30 C 44 24, 52 20, 48 14" stroke="#FFF" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.75"/>
    <path d="M58 28 C 54 22, 62 18, 58 12" stroke="#FFF" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.85"/>
    <path d="M68 30 C 64 24, 72 20, 68 14" stroke="#FFF" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.75"/>

    <path d="M 32 50 C 18 52, 18 78, 33 82" fill="none" stroke="url(#pociGrad)" stroke-width="7" stroke-linecap="round"/>
    <path d="M 80 56 C 94 48, 98 42, 94 38 C 90 38, 82 48, 76 60 Z" fill="url(#pociGrad)"/>

    <ellipse cx="58" cy="66" rx="26" ry="20" fill="url(#pociGrad)"/>
    <ellipse cx="58" cy="65" rx="22" ry="16" fill="#D9232E" opacity="0.4"/>

    <path d="M 44 84 L 72 84 L 68 88 L 48 88 Z" fill="#7B241C"/>
    <ellipse cx="58" cy="48" rx="16" ry="5" fill="#7B241C"/>
    <circle cx="58" cy="42" r="4" fill="url(#goldGrad)"/>

    <path d="M 58 84 C 68 76, 78 82, 80 94 C 70 94, 62 90, 58 84 Z" fill="url(#leafGrad)"/>
    <path d="M 58 84 C 52 76, 42 78, 40 88 C 48 90, 54 88, 58 84 Z" fill="#55A630"/>
    <path d="M 58 84 L 72 90" stroke="#FFF" stroke-width="1" fill="none" opacity="0.6"/>
  </g>

  <g transform="translate(145, 0)">
    <text x="0" y="58" font-family="'Montserrat', 'Arial Black', sans-serif" font-weight="900" font-size="46" fill="#146C36" letter-spacing="1">TEH <tspan fill="#D9232E">POCI</tspan></text>
    <rect x="0" y="68" width="310" height="4" rx="2" fill="url(#goldGrad)"/>
    <text x="0" y="92" font-family="'Poppins', 'Segoe UI', sans-serif" font-weight="700" font-size="14" fill="#55A630" letter-spacing="2">ASLI • SEGAR • NIKMAT ALAMI</text>
    
    <g transform="translate(0, 102)">
      <rect x="0" y="0" width="300" height="24" rx="12" fill="#E8F5E9" stroke="#C8E6C9" stroke-width="1"/>
      <circle cx="12" cy="12" r="5" fill="#D9232E"/>
      <text x="24" y="16" font-family="'Poppins', 'Segoe UI', sans-serif" font-weight="600" font-size="11" fill="#1B5E20">CABANG LIMUS PRATAMA REGENSI</text>
    </g>
  </g>
</svg>"""

def generate_menu_cup_svg(item):
    liquid_color = item["liquid_color"]
    accent_color = item["accent_color"]
    label = item["label"]
    price = item["price"]
    badge = item.get("badge", "Poci")

    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F4FBF7"/>
      <stop offset="100%" stop-color="#E8F6EF"/>
    </linearGradient>
    <linearGradient id="teaLiquid" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="{liquid_color}" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="{liquid_color}"/>
    </linearGradient>
    <linearGradient id="cupReflect" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.4"/>
      <stop offset="30%" stop-color="#FFFFFF" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.05"/>
    </linearGradient>
    <filter id="cupShadow" x="-20%" y="-10%" width="140%" height="130%">
      <feDropShadow dx="0" dy="12" stdDeviation="10" flood-color="#146C36" flood-opacity="0.18"/>
    </filter>
  </defs>

  <rect width="400" height="400" rx="28" fill="url(#bgGrad)"/>
  <circle cx="200" cy="180" r="140" fill="#FFFFFF" opacity="0.8"/>
  <circle cx="200" cy="180" r="125" fill="{accent_color}" opacity="0.08"/>

  <g transform="translate(265, 24)">
    <rect width="115" height="30" rx="15" fill="#D9232E"/>
    <text x="57" y="19" font-family="'Poppins', sans-serif" font-weight="700" font-size="12" fill="#FFFFFF" text-anchor="middle">{badge}</text>
  </g>

  <g filter="url(#cupShadow)">
    <line x1="225" y1="50" x2="185" y2="280" stroke="#FFD600" stroke-width="14" stroke-linecap="round"/>
    <line x1="225" y1="50" x2="215" y2="120" stroke="#E67E22" stroke-width="14" stroke-linecap="round" stroke-dasharray="10 14"/>

    <path d="M 125 125 L 275 125 L 250 310 C 248 318, 242 324, 232 324 L 168 324 C 158 324, 152 318, 150 310 Z" fill="#FFFFFF" opacity="0.6"/>
    <path d="M 129 155 Q 200 150 271 155 L 250 308 C 248 316, 243 320, 234 320 L 166 320 C 157 320, 152 316, 150 308 Z" fill="url(#teaLiquid)"/>

    <rect x="150" y="170" width="36" height="34" rx="7" fill="#FFFFFF" opacity="0.55" transform="rotate(12 168 187)"/>
    <rect x="205" y="185" width="40" height="36" rx="7" fill="#FFFFFF" opacity="0.6" transform="rotate(-15 225 203)"/>
    <rect x="175" y="235" width="34" height="32" rx="6" fill="#FFFFFF" opacity="0.5" transform="rotate(25 192 251)"/>

    <circle cx="200" cy="225" r="32" fill="#FFFFFF" opacity="0.95" stroke="#146C36" stroke-width="2"/>
    <circle cx="200" cy="225" r="28" fill="#146C36"/>
    <circle cx="200" cy="225" r="14" fill="#D9232E"/>
    <text x="200" y="222" font-family="'Arial Black', sans-serif" font-weight="900" font-size="8" fill="#FFD600" text-anchor="middle">TEH</text>
    <text x="200" y="230" font-family="'Arial Black', sans-serif" font-weight="900" font-size="8" fill="#FFFFFF" text-anchor="middle">POCI</text>

    <ellipse cx="200" cy="125" rx="76" ry="12" fill="#FFFFFF" opacity="0.95" stroke="#146C36" stroke-width="2"/>
    <ellipse cx="200" cy="123" rx="74" ry="10" fill="#FFD600" opacity="0.8"/>
    <ellipse cx="200" cy="123" rx="65" ry="7" fill="#146C36"/>
    <path d="M 132 155 L 146 155 L 160 305 L 152 305 Z" fill="url(#cupReflect)"/>
  </g>

  <g transform="translate(130, 95)">
    <path d="M 15 15 C 5 2, 28 -8, 38 12 C 28 20, 20 25, 15 15 Z" fill="#55A630"/>
    <path d="M 15 15 C 2 20, -5 38, 12 40 C 20 32, 22 22, 15 15 Z" fill="#76B82A"/>
  </g>

  <g transform="translate(20, 328)">
    <rect width="360" height="52" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5"/>
    <text x="20" y="32" font-family="'Poppins', sans-serif" font-weight="700" font-size="16" fill="#1E293B">{label}</text>
    <g transform="translate(245, 10)">
      <rect width="95" height="32" rx="10" fill="#E8F5E9"/>
      <text x="47" y="21" font-family="'Poppins', sans-serif" font-weight="800" font-size="14" fill="#146C36" text-anchor="middle">Rp {price}</text>
    </g>
  </g>
</svg>"""

def slice_poster_image(poster_path, output_dir):
    """
    Memotong (slice) gambar poster menu fisik menjadi kartu menu individual.
    Membutuhkan paket Pillow (PIL). Jika tidak ada, instruksi manual diberikan.
    """
    try:
        from PIL import Image
    except ImportError:
        print("[INFO] Paket 'Pillow' belum terpasang. Pasang dengan: pip install Pillow")
        return False

    if not os.path.exists(poster_path):
        print(f"[ERROR] File poster tidak ditemukan: {poster_path}")
        return False

    print(f"[INFO] Membuka poster: {poster_path}...")
    img = Image.open(poster_path)
    w, h = img.size

    # Asumsi grid poster menu umum 3x6 atau 4x4
    cols = 4
    rows = 5
    cell_w = w // cols
    cell_h = h // rows

    count = 0
    for idx, item in enumerate(MENU_ITEMS):
        r = idx // cols
        c = idx % cols
        left = c * cell_w
        top = r * cell_h
        right = min(w, left + cell_w)
        bottom = min(h, top + cell_h)

        crop = img.crop((left, top, right, bottom))
        # Resize ke thumbnail 400x400
        crop = crop.resize((400, 400), Image.Resampling.LANCZOS)
        
        # Simpan sebagai PNG
        base_name = item["filename"].replace(".svg", ".png")
        out_path = os.path.join(output_dir, base_name)
        crop.save(out_path, "PNG", quality=95)
        print(f"  ✓ Berhasil slicing: {base_name} ({item['name']})")
        count += 1

    print(f"[OK] Slicing selesai: {count} varian berhasil diekstraksi ke {output_dir}")
    return True

def main():
    parser = argparse.ArgumentParser(description="Generator & Slicing Aset Menu Teh Poci")
    parser.add_argument("--poster", type=str, help="Path ke file foto/poster menu fisik untuk di-slice")
    args = parser.parse_args()

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    img_dir = os.path.join(base_dir, "assets", "img")
    menu_dir = os.path.join(img_dir, "menu")
    os.makedirs(menu_dir, exist_ok=True)

    # 1. Generate Logo
    logo_path = os.path.join(img_dir, "logo-teh-poci.svg")
    with open(logo_path, "w", encoding="utf-8") as f:
        f.write(generate_logo())
    print(f"[OK] Logo Teh Poci tersimpan di: {logo_path}")

    # Favicon
    favicon_path = os.path.join(img_dir, "favicon.svg")
    with open(favicon_path, "w", encoding="utf-8") as f:
        f.write("""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="#146C36" stroke="#FFD600" stroke-width="3"/><ellipse cx="32" cy="36" rx="16" ry="12" fill="#D9232E"/><circle cx="32" cy="20" r="2.5" fill="#FFD600"/><path d="M 20 28 C 12 30, 12 44, 21 46" fill="none" stroke="#7B241C" stroke-width="4" stroke-linecap="round"/><path d="M 44 32 C 52 28, 54 24, 52 22 C 50 22, 45 28, 41 34 Z" fill="#7B241C"/></svg>""")

    # 2. Slicing Poster fisik jika argumen diberikan
    if args.poster:
        slice_poster_image(args.poster, menu_dir)
    else:
        # Generate SVG untuk seluruh 17 Varian Menu
        for item in MENU_ITEMS:
            filepath = os.path.join(menu_dir, item["filename"])
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(generate_menu_cup_svg(item))
            print(f"  ✓ {item['filename']} -> {item['name']} ({item['price']})")

    print("\n[SUKSES] Seluruh aset visual siap digunakan di aplikasi POS.")

if __name__ == "__main__":
    main()
