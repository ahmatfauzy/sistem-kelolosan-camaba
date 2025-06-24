import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      periode: {
        Row: {
          id_periode: string;
          periode: string;
          w1: number;
          w2: number;
          w3: number;
          w4: number;
          w5: number;
          w6: number;
          w7: number;
        };
        Insert: {
          id_periode?: string;
          periode: string;
          w1: number;
          w2: number;
          w3: number;
          w4: number;
          w5: number;
          w6: number;
          w7: number;
        };
        Update: {
          id_periode?: string;
          periode?: string;
          w1?: number;
          w2?: number;
          w3?: number;
          w4?: number;
          w5?: number;
          w6?: number;
          w7?: number;
        };
      };
      calon_mahasiswa: {
        Row: {
          id_calon: string;
          nama: string;
          gender: string;
          asal_sekolah: string;
          jurusan_asal: string | null;
          no_kontak: string;
          alamat: string | null;
          nilai_rata_rata: number;
          nilai_matematika: number;
          minat_teknologi: number | null;
          minat_eksat: number | null;
          analisis: number | null;
          verbal: number | null;
          numerik: number | null;
          id_periode: string;
        };
        Insert: {
          id_calon?: string;
          nama: string;
          gender: string;
          asal_sekolah: string;
          jurusan_asal?: string | null;
          no_kontak: string;
          alamat?: string | null;
          nilai_rata_rata: number;
          nilai_matematika: number;
          minat_teknologi?: number | null;
          minat_eksat?: number | null;
          analisis?: number | null;
          verbal?: number | null;
          numerik?: number | null;
          id_periode: string;
        };
        Update: {
          id_calon?: string;
          nama?: string;
          gender?: string;
          asal_sekolah?: string;
          jurusan_asal?: string | null;
          no_kontak?: string;
          alamat?: string | null;
          nilai_rata_rata?: number;
          nilai_matematika?: number;
          minat_teknologi?: number | null;
          minat_eksat?: number | null;
          analisis?: number | null;
          verbal?: number | null;
          numerik?: number | null;
          id_periode?: string;
        };
      };
    };
    Views: {
      v_topsis_ranking: {
        Row: {
          id_calon: string;
          id_periode: string;
          nama: string;
          d_plus: number;
          d_min: number;
          nilai_preferensi: number;
          peringkat: number;
        };
      };
    };
  };
};
