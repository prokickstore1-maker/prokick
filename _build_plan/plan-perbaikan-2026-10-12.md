# PLAN PERBAIKAN — PROKICK STORE (12 Oktober 2026)

> **Dokumen Rencana:** Perbaikan Hapus Produk, Integrasi Size Chart (dari `jersey-store`), dan Sistem Patch Dinamis (Klub vs Timnas + Kompetisi Kontinental).

---

## 1. MASALAH 1: TIDAK BISA HAPUS PRODUK (BUG FIX)

### 1.1 Akar Masalah (Root Cause Analysis)
1. **Kegagalan Validasi UUID pada Mock Data:**
   - Di `lib/data.ts:59`, ketika database PostgreSQL masih kosong (`rows.length === 0`), sistem otomatis fallback ke `MOCK_JERSEYS`.
   - Di `lib/mock-data.ts`, produk memiliki ID non-UUID (contoh: `"madrid-home-2026"`, `"arsenal-home-2026"`).
   - Di `app/actions/products.ts:89`, query `db.delete(jerseys).where(eq(jerseys.id, id))` langsung dieksekusi. Karena kolom `jerseys.id` di PostgreSQL bertipe `UUID`, query ini menyebabkan fatal error di PostgreSQL: `invalid input syntax for type uuid: "madrid-home-2026"`.
2. **Ketiadaan `try...catch` di Server Action:**
   - Fungsi `deleteProductAction(id)` tidak membungkus operasi DB dalam blok `try...catch`. Setiap kegagalan DB (sintaks UUID, Foreign Key constraint) menyebabkan Next.js melemparkan internal server error yang tidak tertangani.
3. **Potensi Foreign Key Constraint:**
   - Walaupun schema mendefinisikan cascade, tabel `jersey_images` dan relasi `order_items` harus ditangani secara eksplisit dalam transaksi agar tidak melanggar foreign key constraint di database produksi.
4. **Kurangnya Feedback Error di UI Admin:**
   - Di `components/admin/product-manager.tsx:127-132`, UI hanya menampilkan `"Delete failed"` tanpa detail mengapa operasi gagal (apakah karena koneksi DB, produk mock yang tidak bisa dihapus di DB, atau foreign key).

### 1.2 Rencana Perbaikan Kode

#### A. File `app/actions/products.ts`
- Tambahkan validasi regex UUID (`/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`). Jika ID adalah ID mock, berikan pesan jelas bahwa item mock tidak dapat dihapus dari database.
- Bungkus operasi penghapusan dalam `db.transaction` dengan `try...catch`:
  1. Hapus gambar terkait di `jersey_images`.
  2. Putuskan hubungan/set null pada `order_items` jika ada.
  3. Hapus row di `jerseys`.
- Revalidasi path `/admin/products`, `/admin/jerseys`, `/jersey`, dan `/`.

```typescript
export async function deleteProductAction(id: string) {
  if (!(await isAdmin())) return { success: false, error: "Unauthorized" };
  if (!(await checkDbConnection())) return { success: false, error: "Database offline" };

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (!isUuid) {
    return { 
      success: false, 
      error: "Produk demo (mock data) tidak tersimpan di database dan tidak dapat dihapus permanen via DB. Jalankan seed untuk mengisi database dengan produk asli." 
    };
  }

  try {
    await db.transaction(async (tx) => {
      // 1. Bersihkan gallery images
      await tx.delete(jerseyImages).where(eq(jerseyImages.jerseyId, id));
      // 2. Hapus produk
      await tx.delete(jerseys).where(eq(jerseys.id, id));
    });

    revalidatePath("/admin/products");
    revalidatePath("/admin/jerseys");
    revalidatePath("/jersey");
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    console.error("Gagal menghapus produk:", err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : "Gagal menghapus produk dari database." 
    };
  }
}
```

#### B. File `components/admin/product-manager.tsx`
- Tambahkan status `isDeletingId` untuk memberi indikator visual tombol saat penghapusan berlangsung.
- Tampilkan pesan error yang dikembalikan oleh server action secara jelas di alert status.

---

## 2. FITUR 2: INTEGRASI SIZE CHART (DARI PROJECT `jersey-store`)

### 2.1 Analisis Sumber Data `jersey-store`
Di project `d:\project web\jersey-store\features\products\components\SizeGuide.tsx`, telah tersedia komponen Panduan Ukuran dengan data standar jersey:
- **Ukuran:** S, M, L, XL, XXL, 3XL, 4XL
- **Metrik:** Panjang (cm) & Lebar (cm)
  - S: 67 × 47 cm
  - M: 69 × 49 cm
  - L: 72 × 52 cm
  - XL: 74 × 54 cm
  - XXL: 78 × 57 cm
  - 3XL: 80 × 60 cm
  - 4XL: 82 × 63 cm
- **Toleransi:** ±1-2 cm

### 2.2 Rencana Implementasi di PROKICK MY
1. **Buat Komponen Baru: `components/jersey/size-guide-modal.tsx`**
   - Menggunakan komponen `Sheet` dari shadcn/ui yang sudah ada di PROKICK MY (`@/components/ui/sheet`).
   - Tampilan disesuaikan dengan tema gelap PROKICK (`bg-[#121217]`, `border-white/10`, aksen `#E2F952` / volt).
   - Menyediakan trigger tombol ringkas:
     ```tsx
     <SizeGuideModal />
     ```
2. **Integrasi ke `components/jersey/jersey-customizer.tsx`**
   - Letakkan trigger tombol tepat di atas atau di samping grid ukuran:
     ```tsx
     <div className="flex justify-between items-center text-xs">
       <span className="font-bold text-white uppercase tracking-wider font-display">Select Size:</span>
       <SizeGuideModal />
     </div>
     ```

---

## 3. FITUR 3: PATCH DINAMIS BERDASARKAN LIGA & KLUB VS TIMNAS

### 3.1 Kebutuhan Bisnis & Logika Pemisahan
Saat ini di `components/jersey/jersey-customizer.tsx:94-99`, opsi patch di-hardcode ke 4 pilihan tanpa mempedulikan jenis produk.
Pengguna menginginkan:
1. **Untuk Klub:**
   - Menyesuaikan dengan liga domestik klub tersebut.
   - Tetap menyertakan kompetisi kontinental bergengsi: **UEFA Champions League (UCL)**, **UEFA Europa League (UEL)**, **UEFA Conference League (UECL)**, dan **FIFA Club World Cup**.
2. **Untuk Tim Nasional:**
   - Harus berbeda dengan klub (tidak boleh muncul patch UCL/EPL).
   - Menampilkan turnamen antarnegara: **FIFA World Cup**, **FIFA World Cup Qualifiers**, **UEFA Euro**, **Copa America**, **AFC Asian Cup**, **Piala AFF**, dan **AFCON**.

### 3.2 Desain Modul Baru: `lib/patches.ts`

Buat helper terpusat `lib/patches.ts`:

```typescript
export interface PatchOption {
  id: string;
  label: string;
  category: "domestic" | "continental" | "international";
}

// 1. Patch Kompetisi Kontinental & Dunia untuk Klub
export const CLUB_CONTINENTAL_PATCHES: PatchOption[] = [
  { id: "ucl", label: "UEFA Champions League Starball + Foundation", category: "continental" },
  { id: "uel", label: "UEFA Europa League", category: "continental" },
  { id: "uecl", label: "UEFA Conference League", category: "continental" },
  { id: "cwc", label: "FIFA Club World Cup Champions", category: "continental" },
];

// 2. Patch Liga Domestik per Liga
export const LEAGUE_DOMESTIC_PATCHES: Record<string, PatchOption[]> = {
  "Premier League": [
    { id: "epl-gold", label: "Premier League Champions (Gold Badge)", category: "domestic" },
    { id: "epl-regular", label: "Premier League Official Sleeve Badge", category: "domestic" },
    { id: "fa-cup", label: "Emirates FA Cup Badge", category: "domestic" },
  ],
  "La Liga": [
    { id: "laliga-champ", label: "La Liga Campeón Badge", category: "domestic" },
    { id: "laliga-regular", label: "La Liga Official Sleeve Badge", category: "domestic" },
  ],
  "Serie A": [
    { id: "seriea-scudetto", label: "Serie A Scudetto + Official Badge", category: "domestic" },
    { id: "seriea-regular", label: "Serie A Official Sleeve Badge", category: "domestic" },
  ],
  "Bundesliga": [
    { id: "bundesliga-meister", label: "Bundesliga Meister Badge", category: "domestic" },
    { id: "bundesliga-regular", label: "Bundesliga Official Sleeve Badge", category: "domestic" },
  ],
  "Retro Classic": [
    { id: "retro-ucl", label: "Retro Champions League Starball Badge", category: "continental" },
    { id: "retro-domestic", label: "Classic League Sleeve Badge", category: "domestic" },
  ],
};

// 3. Patch Turnamen Internasional untuk Tim Nasional
export const NATIONAL_TEAM_PATCHES: PatchOption[] = [
  { id: "wc", label: "FIFA World Cup Tournament Badge", category: "international" },
  { id: "wc-champ", label: "FIFA World Cup Champions Gold Badge", category: "international" },
  { id: "wc-qual", label: "FIFA World Cup Qualifiers Badge", category: "international" },
  { id: "euro", label: "UEFA Euro Tournament Badge", category: "international" },
  { id: "copa", label: "CONMEBOL Copa America Badge", category: "international" },
  { id: "asian-cup", label: "AFC Asian Cup Tournament Badge", category: "international" },
  { id: "aff", label: "AFF Mitsubishi Electric Cup Badge", category: "international" },
  { id: "afcon", label: "CAF Africa Cup of Nations Badge", category: "international" },
];

/**
 * Mengembalikan daftar patch yang valid berdasarkan data jersey
 */
export function getAvailablePatches(jersey: {
  category?: string;
  league?: string;
  team?: string;
}): PatchOption[] {
  const isNational = 
    jersey.category?.toLowerCase() === "tim nasional" ||
    jersey.league?.toLowerCase() === "world cup" ||
    jersey.team?.toLowerCase() === "malaysia" ||
    jersey.team?.toLowerCase() === "indonesia";

  if (isNational) {
    return NATIONAL_TEAM_PATCHES;
  }

  const league = jersey.league || "";
  const domesticPatches = LEAGUE_DOMESTIC_PATCHES[league] || [
    { id: "domestic-generic", label: `${league} Official Sleeve Badge`, category: "domestic" },
  ];

  return [...domesticPatches, ...CLUB_CONTINENTAL_PATCHES];
}
```

### 3.3 Integrasi ke `components/jersey/jersey-customizer.tsx`
- Ganti array statis `patchOptions` dengan pemanggilan `getAvailablePatches(jersey)`.
- Set default patch secara dinamis:
  - Jika timnas: opsi pertama adalah `FIFA World Cup Tournament Badge`.
  - Jika klub: opsi pertama adalah badge liga domestiknya atau UCL.
- Tampilan select dropdown di kustomisasi akan menampilkan label badge yang presisi sesuai konteks produk.

---

## 4. URUTAN TAHAP PENGERJAAN & VERIFIKASI

| No | Langkah | Berkas yang Disentuh | Verifikasi |
|---|---|---|---|
| **1** | Perbaiki `deleteProductAction` (tambahkan validasi UUID, handling error, `try...catch`, & transaction) | `app/actions/products.ts`<br>`components/admin/product-manager.tsx` | Coba hapus via admin, cek console log tidak crash, feedback error jelas |
| **2** | Buat `lib/patches.ts` & integrasikan ke customizer | `lib/patches.ts`<br>`components/jersey/jersey-customizer.tsx` | Buka produk Real Madrid (muncul La Liga + UCL), buka Harimau Malaya/Timnas (muncul World Cup/AFF/Asian Cup) |
| **3** | Buat komponen `SizeGuideModal` & integrasikan ke customizer | `components/jersey/size-guide-modal.tsx`<br>`components/jersey/jersey-customizer.tsx` | Tombol "Panduan Ukuran" dapat diklik dan menampilkan tabel ukuran yang rapi di mobile & desktop |
| **4** | Validasi TypeScript | Seluruh proyek | Jalankan `node_modules/.bin/tsc --noEmit` wajib EXIT 0 |

---
