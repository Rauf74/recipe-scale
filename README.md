# 🍳 RecipeScale — SaaS Multi-Tenant Costing & Scale Simulator for F&B

**RecipeScale** adalah workspace kalkulator HPP (*Harga Pokok Penjualan*) bertingkat dan simulator porsi saji produksi dapur yang dirancang khusus untuk UMKM F&B, bakery, katering, dan restoran kecil. 

Aplikasi ini membantu pemilik usaha menjawab tiga pertanyaan operasional utama:
1. **Berapa HPP aktual** satu porsi makanan/minuman hari ini secara akurat?
2. Jika target produksi berubah (misal katering pesanan 150 porsi), **berapa takaran bahan dapur** yang harus disiapkan?
3. Jika harga bahan di pasar berfluktuasi, **menu mana saja yang marginnya terancam** dan bagaimana rekomendasi harga jual barunya?

---

## 🚀 Fitur Utama

### 1. ⚙️ Kalkulator HPP Bertingkat & Konversi Otomatis
* **Nested Recipe Support**: Mendukung bumbu dasar setengah jadi (saus, kaldu, bumbu halus) yang disisipkan ke dalam formula menu masakan utama.
* **Smart Unit Conversion**: Konversi otomatis berat dan volume (`g` $\leftrightarrow$ `kg`, `ml` $\leftrightarrow$ `L`) sehingga harga modal bahan dihitung tepat secara proporsional.
* **Cycle & Validation Guards**: Validasi backend untuk mendeteksi hubungan melingkar (*circular dependencies*) antar resep, validasi isolasi data antar workspace (*tenant guard*), serta validasi XOR referensi item.

### 📊 2. Visual Cost Breakdown (Donut Chart) & Simulator Markup
* **Cost Composition Pie Chart**: Diagram lingkaran interaktif (menggunakan Recharts) yang memetakan persentase kontribusi biaya komponen resep langsung di panel detail.
* **Markup Simulator**: Kalkulator interaktif untuk menghitung harga jual rekomendasi, nett jual (+ Pajak PB1 10% & Service Charge 5%), keuntungan bersih per porsi, dan persentase gross margin.

### 🚨 3. Real-Time Dashboard Alerts & Price History
* **Price Change Timeline**: Melacak riwayat perubahan harga bahan baku di database setiap kali terjadi pembaruan harga beli, lengkap dengan visualisasi linimasa fluktuasi harga.
* **Margin Threat Notification**: Panel peringatan reaktif di dashboard yang secara otomatis berbunyi/memicu alarm apabila harga bahan mentah melonjak tinggi dan menyebabkan Food Cost aktual melampaui batas aman Target Food Cost % yang disimpan di resep.

### ⚖️ 4. Timbangan Dapur Instant (Batch Scaling Sheet)
* Masukkan porsi saji target yang ingin diproduksi dapur Anda, dan sistem akan langsung menghasilkan **Daftar Timbangan Dapur** (kuantitas baru tiap bahan baku/bumbu dasar) secara instan.

---

## 🛠️ Stack Teknologi

* **Backend**: Go (Fiber v2), GORM (Object Relational Mapping), MySQL, JWT Auth (HttpOnly Cookie, Secure & SameSite).
* **Frontend**: React, TypeScript, Vite 8, Tailwind CSS v4, Lucide Icons, Recharts (Data Visuals).

---

## 📁 Struktur Folder Proyek

```text
recipe-scale/
├── backend/
│   ├── cmd/api/main.go          # Entrypoint server Go Fiber
│   ├── internal/
│   │   ├── config/              # Konfigurasi database & migrasi
│   │   ├── domain/              # Struktur data GORM model
│   │   ├── handler/             # REST API Handlers & Routing
│   │   ├── middleware/          # JWT Auth Middleware
│   │   └── service/             # Logika Bisnis Utama (HPP, Cycle, Tenant validation)
│   └── go.mod
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable UI Components
│   │   ├── lib/                 # Konfigurasi Axios API Client & utilitas
│   │   ├── pages/               # Halaman Dashboard, Bahan Baku, Resep & Bumbu
│   │   ├── types/               # TypeScript Definitions
│   │   └── App.tsx              # Routing dan Guards
│   └── package.json
└── planning/
    └── PLAN.md                  # Rencana Backlog & Product Roadmap
```

---

## 🏁 Memulai Pengoperasian

### 1. Prasyarat
* Pasang **Go 1.21+**
* Pasang **Node.js 18+**
* Server **MySQL** (Default port `3306`)

### 2. Jalankan Backend
1. Masuk ke direktori backend:
   ```bash
   cd backend
   ```
2. Buat berkas `.env` dan konfigurasikan:
   ```env
   DB_DSN="user:password@tcp(127.0.0.1:3306)/recipescale?charset=utf8mb4&parseTime=True&loc=Local"
   JWT_SECRET="ganti_dengan_secret_kunci_anda_yang_aman_123"
   PORT="8085"
   FRONTEND_URL="http://localhost:5173"
   ```
3. Unduh dependensi dan jalankan server:
   ```bash
   go run cmd/api/main.go
   ```

### 3. Jalankan Frontend
1. Masuk ke direktori frontend:
   ```bash
   cd frontend
   ```
2. Pasang dependensi:
   ```bash
   npm install
   ```
3. Jalankan server pengembangan Vite:
   ```bash
   npm run dev
   ```
4. Buka alamat `http://localhost:5173` pada peramban Anda.
