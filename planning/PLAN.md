# RecipeScale — Product & Delivery Plan

> Dokumen ini adalah backlog produk, bukan spesifikasi database final. Perubahan schema, auth, atau pricing engine baru dieksekusi setelah desain dan acceptance criteria-nya disetujui.

## 1. Arah produk

RecipeScale adalah workspace untuk UMKM F&B, bakery, katering, dan restoran kecil yang ingin menjawab tiga pertanyaan operasional:

1. Berapa HPP aktual satu resep atau satu porsi hari ini?
2. Jika target produksi berubah, berapa bahan yang harus disiapkan?
3. Jika harga bahan berubah, menu mana yang margin-nya terdampak dan tindakan apa yang perlu diambil?

**Fokus v1:** workflow costing dan produksi dapur yang dapat dipercaya—dari katalog bahan sampai batch plan, HPP, dan margin. Inventory penuh, POS, supplier portal, dan billing SaaS bukan target sebelum core flow ini stabil.

---

## 2. Audit implementasi saat ini

### Yang sudah ada dan layak dipertahankan

| Area | Status | Catatan |
|---|---|---|
| Workspace + register owner | Ada | Owner dibuat bersama workspace. |
| Auth JWT berbasis HttpOnly cookie | Ada | Perlu hardening sebelum production. |
| Isolasi data bahan/resep berdasarkan workspace | Ada | Query utama sudah menerima `workspaceId`. |
| CRUD bahan baku | Ada | Harga saat ini disimpan sebagai satu nilai aktif. |
| CRUD resep + sub-recipe | Ada | Mendukung bahan mentah dan bumbu dasar. |
| Perhitungan HPP + breakdown | Ada | Belum aman untuk seluruh kasus satuan dan nested recipe. |
| Simulasi skala di UI | Ada | Baru menghitung total biaya, belum menghasilkan daftar takaran batch. |
| Dashboard, loading, empty state | Ada | Belum memberikan alert atau keputusan bisnis yang actionable. |

### Risiko/fondasi yang harus diselesaikan lebih dulu (P0)

| Temuan | Dampak | Arah perbaikan |
|---|---|---|
| Fallback `JWT_SECRET` hardcoded dan cookie `Secure: false` | Token production dapat tidak aman; cookie lintas domain frontend/backend tidak akan konsisten | Wajibkan environment secret, gunakan cookie `Secure`, konfigurasi `SameSite` sesuai domain, dan validasi signing method JWT. |
| Nilai biaya menggunakan `float64` | Pembulatan HPP dapat meleset | Simpan biaya dalam integer minor unit (sen) atau decimal; aturan pembulatan berada di satu service. |
| Konversi satuan mengembalikan angka asli jika tidak kompatibel | HPP bisa tampak valid tetapi salah | Unit harus punya dimensi; tolak konversi mass ↔ volume tanpa faktor densitas yang eksplisit. Normalisasi `g/gram/grams` dan `l/L/liter`. |
| Item resep boleh memiliki ingredient dan sub-recipe sekaligus | Data resep ambigu | Terapkan aturan XOR: tepat satu referensi, quantity > 0, dan unit valid. |
| Nested recipe hanya dipreload beberapa tingkat; belum ada cycle detection | Resep bertingkat dalam dapat bernilai 0 atau recursive loop | Graph traversal dengan visited set + batas kedalaman yang jelas; validasi siklus saat create/update. |
| Tidak ada validasi referensi berada di workspace yang sama | Risiko kebocoran antar tenant | Validasi ingredient/sub-recipe per workspace di service sebelum disimpan. |
| Delete bahan/resep belum punya dependency policy | Data resep dapat putus atau HPP berubah diam-diam | Pilih dan tampilkan kebijakan: blok hapus jika dipakai, atau archive; jangan hard delete langsung. |

### Gap produk penting (P1)

- Tidak ada **price history**; klaim pemantauan fluktuasi belum terpenuhi.
- Tidak ada selling price, target margin, tax, packaging, waste, atau overhead. HPP saja belum cukup untuk keputusan harga jual.
- Tidak ada snapshot/version biaya; laporan hari ini dapat berubah setelah harga bahan diedit.
- Role `OWNER/CHEF/STAFF` ada di token, tetapi belum diterapkan sebagai permission matrix, invite member, atau audit access.
- Dashboard menampilkan lima bahan pertama, bukan lima kontribusi biaya/kenaikan harga terbesar.
- Workspace name belum dipakai konsisten pada UI; tidak ada settings untuk profil bisnis dan preferensi costing.
- Belum ada test unit untuk conversion, scaling, recursive cost, cycle detection, dan tenant isolation.

### Catatan teknis non-blocking (P2)

- Frontend build lolos, dengan dua lint warning di auth context dan bundle utama sekitar 700 kB. Tangani setelah core flow dan gunakan route-level lazy loading bila dashboard mulai bertambah.
- `AutoMigrate` nyaman untuk local MVP; sebelum production, pakai migration versioned dan rollback policy.
- Error API perlu format konsisten dan tidak mengembalikan detail database ke client.

---

## 3. Core flow yang harus dianggap “siap”

```text
Owner setup costing → tambah bahan & harga beli → buat resep/bumbu dasar
→ tetapkan yield & waste → hitung HPP per batch/porsi → tetapkan harga jual
→ lihat margin → ubah harga bahan → lihat menu terdampak → putuskan harga/resep
```

### Acceptance criteria v1

1. Owner dapat membuat bahan dengan harga pembelian, jumlah kemasan, dan satuan resep yang valid.
2. Chef dapat membuat resep bersarang tanpa siklus dan melihat HPP yang dapat dijelaskan per komponen.
3. Mengubah jumlah target produksi menampilkan **daftar bahan dan kuantitas baru**, bukan hanya total biaya.
4. Owner dapat menetapkan harga jual dan melihat gross margin per porsi/menu.
5. Ketika harga bahan diperbarui, sistem menyimpan riwayat dan menandai resep/menu terdampak.
6. Data workspace A tidak pernah dapat dibaca atau direferensikan oleh workspace B.

### Information architecture v1

Navigasi tidak boleh berhenti di `Dashboard → Bahan → Resep`. Itu membuat RecipeScale tampak sebagai CRUD resep, padahal nilai produknya ada pada proses sebelum dan setelah resep disusun.

```text
Dashboard
├─ Katalog
│  └─ Bahan Baku
├─ Formulasi
│  ├─ Bumbu Dasar & Prep
│  └─ Resep Menu
├─ Produksi
│  └─ Batch Planner & Kitchen Sheet
├─ Analisis
│  └─ HPP, Harga Jual & Margin
└─ Pengaturan Workspace
   └─ Satuan, pembulatan, waste, packaging, target margin
```

| Area | Tujuan pengguna | Status implementasi |
|---|---|---|
| Dashboard | Melihat pekerjaan dan risiko yang perlu ditindak | Partial; jangan memakai gauge arbitrer untuk jumlah bahan/resep. |
| Bahan Baku | Menyimpan katalog bahan serta harga pembelian | Ada; jangan diberi nama “Stok” sebelum ada quantity on hand dan mutasi. |
| Bumbu Dasar & Prep | Membuat komponen reusable seperti kaldu, sambal, dough, atau sauce | Saat ini masih tercampur dalam halaman resep; perlu dipisah secara UI, domain tetap boleh memakai `Recipe`. |
| Resep Menu | Menggabungkan bahan dan prep menjadi menu yang dijual | Saat ini masih tercampur dengan bumbu dasar; perlu halaman/list dan filter khusus. |
| Produksi | Menentukan target batch lalu mendapat daftar timbang/kitchen sheet | Belum ada; ini pembeda utama RecipeScale. |
| Analisis | Memutuskan harga dan melihat dampak perubahan bahan | Partial; HPP ada, tetapi margin, price history, dan impact belum ada. |
| Pengaturan Workspace | Menentukan asumsi costing sesuai bisnis | Belum ada. |

**Terminologi UI:** gunakan **Bahan Baku** atau **Katalog Bahan**, bukan **Stok Bahan**, sampai inventory fisik (masuk, keluar, saldo, opname) benar-benar tersedia.

### Prioritas layar untuk portfolio MVP

1. Dashboard yang memberi next action, bukan hanya statistik.
2. Bahan Baku.
3. Bumbu Dasar & Prep.
4. Resep Menu.
5. Produksi & HPP: pilih menu + target porsi → kebutuhan bahan, total batch cost, HPP/porsi, dan kitchen sheet.

Halaman Analisis dan Pengaturan dapat mulai sebagai panel sederhana pada tahap awal, lalu dipisahkan ketika data price history dan cost profile sudah tersedia.

---

## 4. Keputusan model data dan aturan bisnis

### 4.1 Satuan dan harga pembelian

Jangan memakai satu field `pricePerUnit` sebagai satu-satunya sumber harga. Satu bahan sebaiknya memiliki:

- `recipe_unit`: satuan yang dipakai resep (mis. gram, ml, pcs).
- `purchase_unit`: satuan saat dibeli (mis. pack, kg, botol).
- `purchase_quantity`: isi kemasan (mis. 1.000 g per pack).
- `purchase_price`: harga kemasan.
- `usable_yield_percent`: hasil pakai setelah susut/trim, default 100%.
- `cost_per_recipe_unit`: nilai turunan, dihitung server-side.

**Aturan:** konversi mass dan volume dipisahkan. Jika bisnis membutuhkan tepung dalam ml atau minyak dalam gram, gunakan `density` per bahan dan tampilkan asumsi tersebut di UI.

### 4.2 HPP yang dapat dijelaskan

Total HPP menu:

```text
raw material cost
+ packaging cost
+ variable overhead
+ allocated fixed overhead (opsional)
+ waste/production loss
= total batch cost
÷ actual yield
= HPP per portion/unit
```

Simpan dua nilai berbeda:

- **live estimate**: memakai harga aktif saat ini untuk simulasi.
- **cost snapshot**: terkunci ketika batch diproduksi atau price list diterbitkan.

### 4.3 Nested recipe

- Hanya `BASE` recipe yang dapat dipakai sebagai komponen resep lain pada v1.
- Sub-recipe memiliki yield dan unit output yang eksplisit.
- Sebelum save, server memeriksa direct/indirect cycle dan batas kedalaman yang terdokumentasi.
- Menghapus sub-recipe yang dipakai harus diblok; gunakan archive setelah seluruh referensi diganti.

---

## 5. Customization yang bernilai untuk pelanggan

Prioritaskan pengaturan berikut karena memperluas kecocokan ke bakery, katering, dan restoran tanpa membuat produk menjadi ERP penuh.

| Pengaturan | Nilai pengguna | Fase |
|---|---|---|
| Currency, locale, pembulatan harga (mis. Rp500/Rp1.000) | Harga jual sesuai kebiasaan bisnis | P1 |
| Unit catalog + alias + custom count unit (pcs, telur, lembar) | Tidak mengunci semua bisnis ke satuan hardcoded | P1 |
| Cost profile per workspace: waste, packaging, overhead, tax/service | HPP lebih realistis | P1 |
| Target margin / markup per kategori menu | Membuat rekomendasi harga jual berguna | P1 |
| Kategori bahan dan resep | Filter dan insight dashboard lebih relevan | P1 |
| Recipe template / batch preset | Chef dapat memilih “50 porsi”, “100 cup”, dll. dengan cepat | P2 |
| Supplier dan beberapa price quote | Pilih harga beli terbaik tanpa membangun procurement penuh | P2 |
| Multi-location/branch cost profile | Berguna ketika harga bahan berbeda antar cabang | P3 |
| Custom role permission matrix | Berguna untuk bisnis lebih besar; jangan dahulukan sebelum role dasar stabil | P3 |

---

## 6. Roadmap delivery

### Phase 0 — Trust & security foundation (P0)

**Tujuan:** hasil costing aman dan tidak diam-diam salah.

- Hardening JWT/cookie/CORS dan rate limit khusus register/login.
- Validasi payload di backend: input kosong, batas panjang, jumlah positif, satuan, dan status not-found.
- Tenant guard untuk seluruh referensi ingredient/sub-recipe.
- Ubah kalkulasi ke money-safe representation dan buat unit conversion service.
- Validasi XOR item, recipe graph cycle, dan dependency-aware archive/delete.
- Tambahkan test unit backend untuk semua aturan di atas.

**Definition of done:** satu conversion invalid atau cycle selalu gagal dengan pesan yang jelas; workspace lain tidak dapat diakses melalui ID yang ditebak.

### Phase 1 — Costing & scaling MVP (P1)

**Tujuan:** pemilik usaha mampu menetapkan HPP dan harga jual yang masuk akal.

- Model harga pembelian/kemasan + price history.
- Yield loss/waste, packaging, dan overhead sederhana per resep atau workspace.
- Cost breakdown sampai bahan mentah; tampilkan asumsi dan timestamp harga.
- Selling price, target margin/markup, dan recommended price dengan aturan pembulatan workspace.
- Endpoint dan UI **batch scaling sheet**: kuantitas tiap bahan/sub-recipe untuk target batch.
- Dashboard: resep margin rendah, bahan dengan perubahan harga terbesar, dan menu terdampak.
- Pecah UI formulasi menjadi **Bumbu Dasar & Prep** dan **Resep Menu** tanpa menduplikasi costing engine yang sama.
- Tambahkan area **Produksi & HPP** sebagai tujuan setelah resep; jangan menjadikan resep sebagai akhir flow pengguna.

**Definition of done:** perubahan harga minyak dapat menunjukkan semua menu yang terdampak, HPP lama/baru, dan rekomendasi harga baru.

### Phase 2 — Operasional dapur (P2)

**Tujuan:** hasil kalkulasi menjadi alat kerja harian.

- Production batch record dengan cost snapshot dan actual yield.
- Shopping list aggregator dari beberapa menu/batch terpilih.
- Export/print Kitchen Sheet tanpa harga; cost report untuk owner.
- Kategori, search/filter/sort server-side, pagination, dan audit log perubahan harga/resep.
- Invite member serta permission dasar: Owner (semua), Chef (resep/batch), Staff (lihat/print).

### Phase 3 — Optional SaaS expansion (P3)

**Tujuan:** nilai tambah setelah core use case tervalidasi.

- Supplier quote dan perbandingan harga.
- Branch/location costing.
- Import CSV bahan/resep, backup/export data, dan webhook/integrasi POS.
- Billing/subscription hanya setelah produk benar-benar membutuhkan multi-tenant commercial controls.

---

## 7. UX yang disarankan

- **Navigasi mengikuti workflow dapur:** Katalog → Formulasi (Prep → Menu) → Produksi → Analisis. Dashboard hanya sebagai titik masuk, bukan pengganti seluruh proses.
- **Onboarding 3 langkah:** profil costing → tiga bahan contoh → satu resep pertama. Jangan tampilkan dashboard kosong tanpa arah.
- **Bumbu dasar sebagai entitas UI terpisah:** tampilkan sebagai prep reusable, dengan yield, takaran output, dan daftar menu yang menggunakannya.
- **Produksi sebagai langkah setelah resep:** pilih menu dan jumlah target, lalu tampilkan ingredient requirement, pembulatan, serta tombol print kitchen sheet.
- **Ingredient form:** tuliskan “Rp15.000 per 1 kg”, lalu aplikasi menjelaskan biaya turunan “Rp15 per gram”. Ini mengurangi salah input.
- **Recipe builder:** tampilkan validasi unit dan warning cycle secara inline; jangan hanya gagal setelah submit.
- **Cost panel:** selalu tampilkan `live estimate` vs `last snapshot`, kontribusi biaya terbesar, serta margin setelah harga jual diisi.
- **Price update flow:** saat harga berubah, tunjukkan dampak sebelum menyimpan: “6 resep naik HPP; 2 menu di bawah margin target.”
- **Delete flow:** tampilkan jumlah recipe yang memakai bahan/sub-recipe dan arahkan ke archive atau replace, bukan konfirmasi generik.

---

## 8. Test dan quality gate

### Backend wajib

- Unit conversion: g↔kg, ml↔L, alias satuan, incompatible unit, dan density override.
- Costing: bahan langsung, sub-recipe 1–N level, yield loss, money rounding, dan breakdown.
- Guard: cross-workspace ID, item dengan dua/tanpa referensi, cycle, dan delete dependency.
- Auth: missing secret production, expired token, invalid signing algorithm, dan role yang tidak berhak.

### Frontend wajib

- Form mencegah submit berulang ketika save berjalan.
- Error API tampil actionable; loading/empty state tidak memblokir navigasi.
- Scale sheet menghitung ulang quantity tiap komponen dan rounding-nya konsisten dengan backend.

### Manual scenario utama

1. Buat workspace → bahan `Gula Rp18.000/1 kg` → resep 10 porsi memakai 250 g → verifikasi biaya bahan Rp4.500.
2. Buat bumbu dasar, gunakan pada menu akhir, lalu ubah harga satu bahan; verifikasi HPP menu berubah dan recipe graph tetap valid.
3. Coba memakai ingredient atau recipe dari workspace lain; request harus ditolak.
4. Coba membuat A → B → A; server harus menolak tanpa menyimpan data parsial.

---

## 9. Non-goals untuk menjaga scope

- Stock opname, FIFO, purchase order, dan accounting ledger penuh.
- POS/cashier dan payment gateway.
- Sinkronisasi harga pasar otomatis sebelum ada sumber data yang legal dan reliable.
- AI recommendation sebagai fitur utama. Setelah data price history cukup, AI boleh membantu menjelaskan dampak, bukan menjadi sumber angka HPP.

## 10. Urutan implementasi rekomendasi

1. Phase 0 (security + validation + unit/cycle correctness).
2. Phase 1 bagian price history, costing profile, dan batch scaling sheet.
3. Phase 1 selling price/margin dashboard.
4. Phase 2 production record dan shopping list.

Urutan ini membuat RecipeScale terlihat sebagai SaaS yang memahami problem operasional F&B, bukan sekadar CRUD resep dengan kalkulator.
