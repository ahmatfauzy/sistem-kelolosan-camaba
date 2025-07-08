import * as XLSX from 'xlsx';
import type { CalonMahasiswa, Kriteria } from './types';

interface ExcelRow {
  [key: string]: string | number | undefined;
}

export const exportToExcel = (data: ExcelRow[], filename: string) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const exportTemplateExcel = (kriteria: Kriteria[], filename: string) => {
  // Urutkan kriteria berdasarkan nama (opsional)
  const sortedKriteria = [...kriteria].sort((a, b) =>
    a.nama.localeCompare(b.nama)
  );

  const templateData = [
    {
      nama: 'Contoh Nama Mahasiswa',
      gender: 'L/P',
      asal_sekolah: 'Nama Sekolah',
      jurusan_asal: 'IPA/IPS/SMK',
      no_kontak: '08123456789',
      alamat: 'Alamat Lengkap',
      ...sortedKriteria.reduce(
        (acc, k) => ({
          ...acc,
          [k.nama]: 0
        }),
        {}
      )
    }
  ];

  const ws = XLSX.utils.json_to_sheet(templateData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template');
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const importFromExcel = (
  file: File,
  kriteria: Kriteria[]
): Promise<{
  mahasiswa: Omit<CalonMahasiswa, 'id_calon' | 'id_periode'>[];
  penilaian: Array<{
    nama_mahasiswa: string;
    nama_kriteria: string;
    nilai: number;
  }>;
}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelRow[];

        const mahasiswa: Omit<CalonMahasiswa, 'id_calon' | 'id_periode'>[] = [];
        const penilaian: Array<{
          nama_mahasiswa: string;
          nama_kriteria: string;
          nilai: number;
        }> = [];

        jsonData.forEach((row) => {
          const nama = String(row.nama || '').trim();
          if (!nama) return; // skip baris kosong

          mahasiswa.push({
            nama,
            gender: String(row.gender || '').trim(),
            asal_sekolah: String(row.asal_sekolah || '').trim(),
            jurusan_asal: String(row.jurusan_asal || '').trim(),
            no_kontak: String(row.no_kontak || '').trim(),
            alamat: String(row.alamat || '').trim()
          });
          
          // Loop kriteria untuk ambil nilai per kriteria
          kriteria.forEach((k) => {
            const raw = row[k.nama];
            const nilai =
              typeof raw === 'number'
                ? raw
                : parseFloat(String(raw).replace(',', '.'));

            penilaian.push({
              nama_mahasiswa: nama,
              nama_kriteria: k.nama,
              nilai: isNaN(nilai) ? 0 : nilai
            });
          });
        });

        resolve({ mahasiswa, penilaian });
      } catch (error) {
        reject(error);
      }
    };

    reader.readAsArrayBuffer(file);
  });
};
