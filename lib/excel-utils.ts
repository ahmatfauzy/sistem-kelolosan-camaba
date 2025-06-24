import * as XLSX from "xlsx";
import type { CalonMahasiswa } from "./types";

interface ExcelRow {
  [key: string]: string | number | undefined;
}

export const exportToExcel = (data: ExcelRow[], filename: string) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const importFromExcel = (file: File): Promise<CalonMahasiswa[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const formattedData = jsonData.map((row: ExcelRow) => ({
          nama: String(row.nama || ""),
          gender: String(row.gender || ""),
          asal_sekolah: String(row.asal_sekolah || ""),
          jurusan_asal: String(row.jurusan_asal || ""),
          no_kontak: String(row.no_kontak || ""),
          alamat: String(row.alamat || ""),
          nilai_rata_rata: Number.parseFloat(String(row.nilai_rata_rata)) || 0,
          nilai_matematika:
            Number.parseFloat(String(row.nilai_matematika)) || 0,
          minat_teknologi: Number.parseFloat(String(row.minat_teknologi)) || 0,
          minat_eksat: Number.parseFloat(String(row.minat_eksat)) || 0,
          analisis: Number.parseFloat(String(row.analisis)) || 0,
          verbal: Number.parseFloat(String(row.verbal)) || 0,
          numerik: Number.parseFloat(String(row.numerik)) || 0,
        }));

        resolve(formattedData as CalonMahasiswa[]);
      } catch (error) {
        reject(error);
      }
    };
    reader.readAsArrayBuffer(file);
  });
};
