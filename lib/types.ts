export interface Periode {
  id_periode: string;
  periode: string;
  w1: number;
  w2: number;
  w3: number;
  w4: number;
  w5: number;
  w6: number;
  w7: number;
}

export interface CalonMahasiswa {
  id_calon: string;
  nama: string;
  gender: string;
  asal_sekolah: string;
  jurusan_asal?: string;
  no_kontak: string;
  alamat?: string;
  nilai_rata_rata: number;
  nilai_matematika: number;
  minat_teknologi?: number;
  minat_eksat?: number;
  analisis?: number;
  verbal?: number;
  numerik?: number;
  id_periode: string;
}

export interface RankingResult {
  id_calon: string;
  id_periode: string;
  nama: string;
  d_plus: number;
  d_min: number;
  nilai_preferensi: number;
  peringkat: number;
}

export const KRITERIA_LABELS = {
  w1: "Nilai Rata-rata",
  w2: "Nilai Matematika",
  w3: "Minat Teknologi",
  w4: "Minat Eksakta",
  w5: "Kemampuan Analisis",
  w6: "Kemampuan Verbal",
  w7: "Kemampuan Numerik",
};
