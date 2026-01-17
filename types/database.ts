export type UserRole = 'admin' | 'guru' | 'siswa' | 'staff';
export type JenisKelamin = 'L' | 'P';
export type UserStatus = 'aktif' | 'nonaktif' | 'pensiun' | 'pindah';
export type SiswaStatus = 'aktif' | 'alumni' | 'pindah' | 'keluar' | 'dropout';
export type KelasTingkat = 'X' | 'XI' | 'XII';
export type Semester = 'ganjil' | 'genap';
export type MapelKategori = 'umum' | 'jurusan' | 'peminatan' | 'ekstrakurikuler';
export type Hari = 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Minggu' | 'semua';

export interface User {
  id: number;
  auth_id?: string; // Links to supabase auth.users
  username: string;
  nama_lengkap: string;
  jenis_kelamin: JenisKelamin;
  nip?: string;
  email?: string;
  role: UserRole;
  jabatan?: string;
  bidang_studi?: string;
  foto?: string;
  status: UserStatus;
  created_at?: string;
}

export interface Kelas {
  id: number;
  kode_kelas: string;
  nama_kelas: string;
  tingkat: KelasTingkat;
  jurusan?: string;
  wali_kelas_id?: number;
  kapasitas: number;
  ruangan?: string;
  tahun_ajaran?: string;
  semester: Semester;
  status: 'aktif' | 'nonaktif';
  wali_kelas?: User; // Joined
}

export interface Siswa {
  id: number;
  nis: string;
  nisn: string;
  nama_lengkap: string;
  jenis_kelamin: JenisKelamin;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  alamat?: string;
  no_telepon?: string;
  email?: string;
  nama_ayah?: string;
  nama_ibu?: string;
  kelas_id?: number;
  foto?: string;
  status: SiswaStatus;
  total_poin_prestasi: number;
  total_poin_pelanggaran: number;
  kelas?: Kelas; // Joined
}

export interface MataPelajaran {
  id: number;
  kode_mapel: string;
  nama_mapel: string;
  kategori: MapelKategori;
  tingkat: string;
  jurusan?: string;
  guru_id?: number;
  kelas_id?: number;
  semester: string;
  jam_per_minggu: number;
  deskripsi?: string;
  status: 'aktif' | 'nonaktif';
  guru?: User; // Joined
  kelas?: Kelas; // Joined
}

export interface JadwalKelas {
  id: number;
  hari: Hari;
  sesi: number;
  mapel_id: number;
  kelas_id: number;
  guru_id?: number;
  ruangan?: string;
  jam_mulai?: string; // Derived/Joined from JamPelajaran if needed, or separate
  jam_selesai?: string;
  mapel?: MataPelajaran;
  kelas?: Kelas;
  guru?: User;
}

export interface Absensi {
  id: number;
  siswa_id: number;
  mapel_id: number;
  tanggal: string;
  sesi: number;
  status: 'hadir' | 'sakit' | 'izin' | 'alfa' | 'terlambat' | 'dinas' | 'cuti';
  keterangan?: string;
  siswa?: Siswa;
  mapel?: MataPelajaran;
}

export interface PoinPrestasi {
  id: number;
  siswa_id: number;
  jenis_prestasi: string;
  nama_prestasi: string;
  poin: number;
  tanggal: string;
  siswa?: Siswa;
}

export interface PoinPelanggaran {
  id: number;
  siswa_id: number;
  jenis_pelanggaran: string;
  deskripsi: string;
  poin: number;
  tanggal: string;
  siswa?: Siswa;
}

export interface Setting {
  id: number;
  setting_key: string;
  setting_value: string;
  label: string;
  setting_type: 'text' | 'number' | 'boolean' | 'json';
  description?: string;
}

export interface TahunAjaran {
  id: number;
  tahun_ajaran: string;
  status: 'aktif' | 'selesai' | 'akan_datang';
  tanggal_mulai: string;
  tanggal_selesai: string;
}

export interface SemesterData {
  id: number;
  tahun_ajaran: string;
  semester: Semester;
  status: 'aktif' | 'selesai' | 'akan_datang';
}

export interface JamPelajaran {
  id: number;
  sesi: number;
  jam_mulai: string;
  jam_selesai: string;
  hari: Hari;
  jenis: 'normal' | 'istirahat' | 'upacara' | 'khusus';
}

export interface PoinKategori {
  id: number;
  nama_kategori: string;
  jenis: 'prestasi' | 'pelanggaran';
  poin_min: number;
  poin_max: number;
}
