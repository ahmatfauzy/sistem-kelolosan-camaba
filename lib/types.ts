export interface Periode {
  id_periode: string;
  periode: string;
}

export interface Kriteria {
  id_kriteria: string;
  nama: string;
  bobot: number;
  sifat: 'benefit' | 'cost';
  id_periode: string;
}

export interface CalonMahasiswa {
  id_calon: string;
  nama: string;
  gender: string;
  asal_sekolah: string;
  jurusan_asal?: string;
  no_kontak: string;
  alamat?: string;
  id_periode: string;
}

export interface Penilaian {
  id_penilaian: string;
  id_calon: string;
  id_kriteria: string;
  nilai: number;
}

export interface RankingResult {
  id_calon: string;
  nama: string;
  nilai_preferensi: number;
  peringkat: number;
}

export interface CalonMahasiswaWithScores extends CalonMahasiswa {
  penilaian: Array<{
    id_kriteria: string;
    nama_kriteria: string;
    nilai: number;
  }>;
}

export const SIFAT_KRITERIA = {
  benefit: 'Benefit (Semakin Besar Semakin Baik)',
  cost: 'Cost (Semakin Kecil Semakin Baik)'
} as const;
