# Work Duty (WD) Schedule

Aplikasi web untuk mengatur dan mengecek jadwal **Work Duty** (piket kebersihan) di sekolah/asrama. Siswa cukup memasukkan ID untuk melihat tugas hari ini; admin menyusun jadwal harian per lokasi lewat dashboard.

![HTML](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?logo=css&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![Firebase](https://img.shields.io/badge/Firebase_Firestore-FFCA28?logo=firebase&logoColor=black)
![Hosting](https://img.shields.io/badge/Firebase_Hosting-FF6F00?logo=firebase&logoColor=white)

> Tanpa framework, tanpa build step. Cukup HTML + CSS + JavaScript murni dan Firebase (Firestore + Hosting).

<!-- TODO: tambahkan screenshot halaman siswa dan dashboard admin di sini (mis. docs/screenshots/*.png) -->

---

## Daftar Isi

- [Fitur](#fitur)
- [Tech Stack](#tech-stack)
- [Struktur Proyek](#struktur-proyek)
- [Menjalankan Secara Lokal](#menjalankan-secara-lokal)
- [Deploy ke Firebase Hosting](#deploy-ke-firebase-hosting)
- [Model Data Firestore](#model-data-firestore)
- [Konfigurasi Admin & Keamanan](#konfigurasi-admin--keamanan)
- [Masalah yang Diketahui](#masalah-yang-diketahui)

---

## Fitur

### Halaman Siswa (`/`)

- Cari jadwal dengan **ID Siswa**, lalu tekan tombol **Jadwal Saya** atau `Enter`.
- Menampilkan kartu tugas: **Lokasi / Area**, **Tempat Work Duty**, dan **Rincian Kerjaan**.
- Hanya menampilkan penugasan untuk **tanggal hari ini** (berdasarkan zona waktu perangkat).
- ID yang diketik diubah ke **huruf kecil** sebelum dicocokkan, sedangkan pencocokan di Firestore bersifat *case-sensitive* — jadi simpan ID siswa di dashboard dengan **huruf kecil/angka saja**.

### Dashboard Admin (`/admin/`)

Masuk dengan PIN, lalu kelola tiga tab (sesuai menu sidebar):

- **Susun Jadwal**
  - Tambah/edit/hapus hierarki **Lokasi Utama (Area)** → **Tempat WD** → **Detail Kerja**, lalu tugaskan **Petugas** per item lewat tombol **+ Petugas**.
  - Pilih **Tanggal Jadwal**; penugasan disimpan per tanggal.
  - Kotak **Anggota Belum Bertugas** menampilkan siswa yang belum punya tugas di tanggal tersebut.
  - Sidebar **Filter Lantai / Grup** untuk menyaring lokasi yang ditampilkan.
  - Tombol **Kosongkan** menghapus semua penugasan di tanggal tersebut sekaligus (batch).
- **Data Anggota**
  - Master data siswa: **ID Siswa** dan **Nama**, lewat tombol **+ Tambah Anggota Baru**.
  - Kolom **Fokus Lantai** ditampilkan dan dipakai mengelompokkan dropdown petugas — tetapi isian form-nya belum ikut tersimpan dan tombol **Edit/Del** belum berfungsi (lihat [Masalah yang Diketahui](#masalah-yang-diketahui)).
- **Laporan (Rekap)**
  - Statistik total lokasi, anggota, dan penugasan.
  - Tabel rekap tugas per siswa untuk tanggal tertentu, dengan tombol **Cetak PDF/Print** (sudah ada style khusus `@media print`).

Aturan bawaan: **satu siswa hanya boleh mendapat satu tugas per hari** — aplikasi menolak penugasan ganda di tanggal yang sama.

Data lokasi, penugasan, dan anggota dimuat secara **real-time** (Firestore `onSnapshot`), jadi beberapa admin bisa bekerja bersamaan tanpa refresh. Pengecualian: tab **Laporan** hanya dirender ulang saat dibuka atau tanggal diganti.

---

## Tech Stack

| Komponen | Detail |
|----------|--------|
| Frontend | HTML5, CSS3 (custom properties, grid/flex, responsif), JavaScript (ES Modules di sisi siswa) |
| Database | [Cloud Firestore](https://firebase.google.com/docs/firestore) via Firebase JS SDK **9.23.0 (compat)** dari CDN |
| Hosting | [Firebase Hosting](https://firebase.google.com/docs/hosting) |
| UI | [Inter](https://fonts.google.com/specimen/Inter) (Google Fonts), [Font Awesome 6.4](https://fontawesome.com/) |

Tidak ada `package.json`, bundler, atau dependensi npm — semua library dimuat dari CDN. Node.js hanya diperlukan kalau Anda memakai `npx serve` atau `firebase-tools`.

---

## Struktur Proyek

```
workduty/
├── index.html                 # Halaman siswa: cek jadwal berdasarkan ID
├── admin/
│   ├── index.html             # Login admin (PIN)
│   └── dashboard.html         # Dashboard admin (jadwal, anggota, rekap)
├── assets/
│   ├── css/
│   │   └── style.css          # Seluruh styling (siswa + admin + print)
│   └── js/
│       ├── firebase-config.js # Konfigurasi Firebase (gitignored — buat sendiri, lihat di bawah)
│       ├── auth.js            # Login PIN admin
│       ├── admin.js           # Seluruh logika dashboard admin
│       ├── app.js             # (legacy) versi lama halaman siswa — tidak dimuat halaman mana pun, digantikan member/
│       ├── admin/
│       │   └── state.js       # (belum dipakai) draft pemisahan state admin — tidak di-import siapa pun
│       └── member/
│           ├── main.js        # Entry point halaman siswa (ES module)
│           ├── api.js         # Query Firestore untuk jadwal siswa
│           └── ui.js          # Render kartu hasil, loader, error
├── public/                    # Placeholder bawaan `firebase init` (tidak dipakai aplikasi)
├── firebase.json              # Konfigurasi hosting (gitignored — lihat bagian Deploy)
└── .firebaserc                # ID project Firebase (gitignored)
```

---

## Menjalankan Secara Lokal

### 1. Siapkan project Firebase

1. Buat project di [Firebase Console](https://console.firebase.google.com/).
2. Aktifkan **Cloud Firestore**.
3. Di **Project settings → Your apps**, tambahkan **Web app** dan salin objek `firebaseConfig`.

### 2. Buat `assets/js/firebase-config.js`

File ini sengaja **tidak ikut di-commit** (ada di `.gitignore`) supaya tiap orang memakai project Firebase-nya sendiri. Buat manual dengan isi berikut, ganti nilainya dengan milik Anda:

```js
// assets/js/firebase-config.js
const firebaseConfig = {
    apiKey: "...",
    authDomain: "<project-id>.firebaseapp.com",
    projectId: "<project-id>",
    storageBucket: "<project-id>.firebasestorage.app",
    messagingSenderId: "...",
    appId: "..."
};

window.app = firebase.initializeApp(firebaseConfig);
window.db = firebase.firestore();
```

> `window.db` dipakai oleh semua script lain, jadi dua baris terakhir wajib ada. Aplikasi hanya memakai Firestore; `storageBucket`, `messagingSenderId`, dan `appId` boleh ikut disalin tapi tidak dipakai.

### 3. Atur Firestore Security Rules

Aplikasi ini **tidak memakai Firebase Authentication** — halaman admin hanya dilindungi PIN di sisi client. Agar aplikasi berfungsi, Firestore harus mengizinkan baca & tulis dari client:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

⚠️ Rules di atas membuat data bisa dibaca/ditulis oleh **siapa saja yang membuka situs ini** — `projectId` dan `apiKey` ada di `firebase-config.js` yang ikut ter-deploy, jadi cukup lewat console browser. Cocok untuk uji coba atau lingkungan tertutup; untuk produksi, lihat [Konfigurasi Admin & Keamanan](#konfigurasi-admin--keamanan). (Kalau Anda memilih *test mode* saat membuat database, rules-nya otomatis kedaluwarsa setelah 30 hari.)

### 4. Jalankan static server

Halaman siswa memakai `<script type="module">`, jadi **tidak bisa dibuka langsung lewat `file://`** — harus lewat HTTP. Pilih salah satu:

```bash
# Python (port 8080)
python -m http.server 8080

# Node (port 8080)
npx serve -l 8080

# Firebase CLI (butuh firebase.json, lihat bagian Deploy) — port bawaan 5000
firebase emulators:start --only hosting
```

Lalu buka (ganti `8080` dengan `5000` jika memakai Firebase CLI):

- Halaman siswa → http://localhost:8080/
- Dashboard admin → http://localhost:8080/admin/

<details>
<summary>Opsional: debug lewat VS Code + Chrome</summary>

Folder `.vscode/` ada di `.gitignore`, jadi buat `.vscode/launch.json` sendiri. Static server di atas harus sudah berjalan, lalu tekan `F5`.

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome against localhost",
      "url": "http://localhost:8080",
      "webRoot": "${workspaceFolder}"
    }
  ]
}
```
</details>

### 5. Aktifkan indeks collection group

Halaman siswa menjalankan query `collectionGroup('assignments').where('studentId', '==', ...)`. Firestore mewajibkan indeks **collection group scope** untuk field `studentId` di koleksi `assignments`.

Cara termudah: dengan server sudah berjalan, coba cari satu ID di halaman siswa, lalu buka **Console browser** (F12) — Firestore akan menampilkan error `FAILED_PRECONDITION` berisi **link** yang langsung membuat indeks yang dibutuhkan. Atau buat manual di **Firestore → Indexes → Single field → Add exemption** (Collection ID: `assignments`, Field: `studentId`, centang *Collection group*).

### 6. Isi data awal lewat dashboard admin

Firestore masih kosong, jadi pencarian di halaman siswa akan selalu menampilkan *"Jadwal tidak ditemukan"* sampai ada penugasan untuk **hari ini**. Urutannya:

1. Buka `/admin/` dan masuk dengan PIN bawaan `120265` (cara menggantinya ada di [Konfigurasi Admin & Keamanan](#konfigurasi-admin--keamanan)).
2. Tab **Data Anggota** → **+ Tambah Anggota Baru** → isi ID dan nama. **Gunakan huruf kecil/angka untuk ID.**
3. Tab **Susun Jadwal** → **Tambah Lokasi Utama (Area)** → di kartu lokasi klik **+ Tambah Tempat WD** → (opsional) **+ Detail Kerja** → klik **+ Petugas** dan pilih anggota.
4. Pastikan **Tanggal Jadwal** masih tanggal hari ini, lalu cari ID tersebut di halaman siswa.

---

## Deploy ke Firebase Hosting

`firebase.json` dan `.firebaserc` tidak ikut di-commit. Buat keduanya di root project:

**firebase.json**
```json
{
  "hosting": {
    "public": ".",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**",
      "**/*.py",
      "public/**",
      "README.md"
    ]
  }
}
```

**.firebaserc**
```json
{
  "projects": {
    "default": "<project-id>"
  }
}
```

Lalu:

```bash
npm install -g firebase-tools   # sekali saja
firebase login
firebase deploy --only hosting
```

Karena `"public": "."`, seluruh isi root (termasuk `assets/js/firebase-config.js`) ikut ter-deploy — itu memang diperlukan agar aplikasi bisa terhubung ke Firestore. Daftar `ignore` di atas mencegah file yang tidak perlu (script Python, placeholder `public/`, README) ikut terunggah.

---

## Model Data Firestore

Aplikasi memakai dua koleksi top-level dan satu subkoleksi:

```
students/{docId}                 # Master data siswa
rooms/{roomId}                   # Lokasi Utama (Area)
rooms/{roomId}/assignments/{id}  # Tempat WD, Detail Kerja, dan Petugas (satu subkoleksi, dibedakan lewat field `type`)
```

### `students/{docId}`

| Field | Tipe | Keterangan |
|-------|------|------------|
| `studentId` | string | ID yang diketik siswa di halaman depan. **Simpan dalam huruf kecil/angka** (lihat catatan di bawah). |
| `studentName` | string | Nama lengkap |
| `studentFloor` | string | (opsional) Fokus lantai/grup, dipakai untuk badge di tabel anggota dan pengelompokan dropdown petugas. **Hanya dibaca, belum ditulis oleh dashboard** — isi lewat Firestore Console bila ingin dipakai; tanpa itu semua siswa masuk grup `Bebas`. |

> **Catatan `studentId`:** halaman siswa memanggil `.toLowerCase()` pada input sebelum query `studentId == ...`, sedangkan Firestore membandingkan string secara *case-sensitive* dan dashboard menyimpan ID apa adanya. ID yang mengandung huruf kapital tidak akan pernah ditemukan dari halaman siswa. Nilai ini juga disalin ke dokumen `petugas` saat penugasan.

### `rooms/{roomId}`

| Field | Tipe | Keterangan |
|-------|------|------------|
| `roomName` | string | Nama lokasi, mis. `Toilet Lantai 2` |
| `floor` | string | Grup untuk sidebar **Filter Lantai / Grup**. **Saat ini dashboard selalu mengisinya sama dengan `roomName`** (input *Lantai / Grup* di modal belum dibaca), sehingga filter efektifnya satu entri per lokasi. Nilai bisa diubah manual di Firestore, tetapi menekan **Edit** pada lokasi itu akan menimpanya kembali. |

### `rooms/{roomId}/assignments/{id}` — tiga jenis dokumen

Hierarkinya: **Tempat WD** (`place`) → **Detail Kerja** (`detail`) → **Petugas** (`petugas`). Petugas bisa menempel langsung ke Tempat WD *atau* ke Detail Kerja; di UI keduanya saling eksklusif — begitu sebuah Tempat WD punya Detail Kerja, tombol **+ Petugas** hanya muncul di detailnya.

| `type` | Field lain | Keterangan |
|--------|-----------|------------|
| `place` | `name`, `task` (sama dengan `name`), `studentId: ''`, `studentName: ''` | Tempat WD di dalam lokasi |
| `detail` | `parentId` (→ id `place`), `placeName`, `name`, `studentId: ''`, `studentName: ''` | Rincian pekerjaan di dalam Tempat WD |
| `petugas` | `parentId` (→ id `place` atau `detail`), `studentId`, `studentName`, `placeName`, `detailName`, `date` (`YYYY-MM-DD`, waktu lokal) | Penugasan siswa untuk satu tanggal. `detailName` dikosongkan (`''`) bila menempel langsung ke Tempat WD. Jenis induk tidak disimpan — tentukan dari `type` dokumen yang ditunjuk `parentId`. |

> **Catatan denormalisasi:** `placeName` (pada `detail` dan `petugas`) serta `studentId`, `studentName`, `detailName` (pada `petugas`) adalah **salinan saat dokumen dibuat** dan tidak pernah disinkronkan ulang. Mengganti nama Tempat WD / Detail Kerja / siswa tidak mengubah penugasan yang sudah ada — halaman siswa dan tab Rekap tetap memakai nama lama.

**Query halaman siswa:** `collectionGroup('assignments')` dengan filter `studentId == <id>`, lalu disaring di client: dokumen `petugas` hanya ditampilkan bila `date`-nya sama dengan hari ini.

**Kompatibilitas data lama:** dokumen `assignments` tanpa field `type` diperlakukan sebagai `place` (dan `name` kosong diisi dari `task`). Dokumen `place`/`detail` yang masih punya `studentId` terisi tetap ditampilkan di halaman siswa dan tab Rekap tanpa memandang tanggal — tetapi **tab Susun Jadwal akan gagal render** bila ada dokumen seperti itu (lihat [Masalah yang Diketahui](#masalah-yang-diketahui)).

---

## Konfigurasi Admin & Keamanan

### Mengganti PIN admin

PIN ditetapkan di [`assets/js/auth.js`](assets/js/auth.js):

```js
if (pinInput === '120265') {
```

Ganti nilainya, lalu deploy ulang. Sesi admin disimpan di `localStorage` dengan key `admin_auth`; tombol **Keluar** di sidebar akan menghapusnya.

### Yang perlu dipahami

- PIN diperiksa **di browser**, jadi siapa pun yang membuka *view source* bisa melihatnya. Ini hanya mencegah akses tidak sengaja, **bukan** pengaman yang sesungguhnya.
- Pelindung data yang sebenarnya adalah **Firestore Security Rules**. Dengan rules terbuka seperti pada langkah setup, siapa pun bisa mengubah/menghapus data lewat console browser.
- API key Firebase web **bukan rahasia** — ia hanya mengidentifikasi project, dan menurut panduan resmi Firebase boleh di-commit. Di proyek ini ia di-gitignore supaya tiap orang memakai project-nya sendiri, bukan demi kerahasiaan. Meski begitu, Firebase menyarankan memberi **API key restriction** (HTTP referrer) di Google Cloud Console.

### Rekomendasi untuk produksi

Aktifkan **Firebase Authentication** (mis. email/password untuk admin), lalu:

1. Muat SDK Auth di `admin/dashboard.html` (dan di `admin/index.html`, yang saat ini **tidak memuat SDK Firebase maupun `firebase-config.js` sama sekali**):
   ```html
   <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js"></script>
   ```
2. Ganti pengecekan PIN di `auth.js` dengan `firebase.auth().signInWithEmailAndPassword(...)`, dan pengecekan `localStorage` di `admin.js` dengan `firebase.auth().onAuthStateChanged(...)`.
3. Ubah rules menjadi:
   ```
   match /{document=**} {
     allow read: if true;
     allow write: if request.auth != null;
   }
   ```

---

## Masalah yang Diketahui

### Bug (perlu perbaikan kode)

- **Tombol Edit/Del di tab Data Anggota tidak berfungsi.** `onclick`-nya memanggil `editMember`/`deleteMember` (`assets/js/admin.js:265-266`), sedangkan fungsi yang ada bernama `editMasterMember`/`deleteMasterMember`. Untuk sementara, ubah/hapus anggota lewat Firestore Console.
- **Isian Fokus Lantai/Grup di form anggota tidak disimpan.** `saveMasterMemberBtn` hanya menulis `studentId` dan `studentName`; field `studentFloor` hanya bisa diisi lewat Firestore Console.
- **Isian Lantai/Grup di form lokasi diabaikan.** `floor` selalu ditulis sama dengan `roomName`, sehingga filter sidebar efektifnya per lokasi.
- **Dashboard gagal render bila ada data legacy.** `createRoomCard` merujuk variabel `currentSession` yang tidak pernah didefinisikan (`admin.js:405, 418`); begitu ada dokumen `place`/`detail` dengan `studentId` terisi, tab Susun Jadwal kosong dengan `ReferenceError` di console.
- **ID siswa berhuruf kapital tidak pernah ditemukan** dari halaman siswa (lihat catatan `studentId` di Model Data).

### Keterbatasan desain

- Menghapus **Lokasi**, **Tempat WD**, maupun **Detail Kerja** hanya menghapus dokumen itu sendiri — turunannya di `assignments` (detail dan petugas) tidak ikut terhapus. Petugas yatim tetap dihitung di **Rekap**, tetap tampil di halaman siswa dengan nama lama, dan siswanya tetap dianggap sudah bertugas (hilang dari *Anggota Belum Bertugas* dan memicu peringatan bentrok) padahal tidak terlihat di grid Susun Jadwal. Label "Lokasi Terhapus" hanya muncul bila dokumen `rooms` induknya yang hilang.
- Pengecekan bentrok tugas dilakukan di sisi client dari cache lokal, bukan transaksi Firestore — dua admin yang menugaskan siswa yang sama pada saat bersamaan tetap bisa menghasilkan duplikat.
- Halaman siswa hanya menampilkan jadwal **hari ini**; belum ada tampilan jadwal untuk tanggal lain.
- Tab **Laporan** hanya dirender ulang saat tab dibuka atau tanggal diganti, tidak mengikuti perubahan data secara real-time.
- Nama yang disalin ke dokumen `petugas` (`placeName`, `detailName`, `studentName`) tidak ikut berubah saat sumbernya diedit.
