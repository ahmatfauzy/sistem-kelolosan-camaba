import Link from 'next/link';
import { Button } from '@components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@components/ui/card';
import {
  BarChart3,
  Users,
  Calculator,
  FileSpreadsheet,
  Settings
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Sistem Pendukung Keputusan
          </h1>
          <h2 className="text-2xl font-semibold text-blue-600 mb-6">
            Kelolosan Calon Mahasiswa Teknik Informatika
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Sistem ini menggunakan metode <strong>TOPSIS</strong> (Technique for
            Order Preference by Similarity to Ideal Solution) untuk menentukan
            ranking calon mahasiswa berdasarkan{' '}
            <strong>penilaian dan bobot kriteria yang fleksibel</strong> tiap
            periode.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <Card className="text-center">
            <CardHeader>
              <BarChart3 className="w-12 h-12 text-blue-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Perhitungan TOPSIS</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Proses seleksi objektif berdasarkan nilai ternormalisasi dan
                pembobotan dinamis.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="w-12 h-12 text-green-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Manajemen Mahasiswa</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Tambah, edit, atau hapus calon mahasiswa dalam satu periode
                tertentu.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Calculator className="w-12 h-12 text-purple-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Pengaturan Bobot</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Tentukan tingkat kepentingan (1–5) untuk setiap kriteria
                penilaian.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <FileSpreadsheet className="w-12 h-12 text-orange-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Import & Export</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Dukungan impor data dari Excel dan ekspor hasil ranking ke
                format spreadsheet.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Settings className="w-12 h-12 text-gray-700 mx-auto mb-2" />
              <CardTitle className="text-lg">Kustomisasi Kriteria</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Buat dan sesuaikan kriteria penilaian tiap periode dengan jumlah
                dan bobot yang tidak tetap.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Link href="/dashboard">
            <Button size="lg" className="text-lg px-8 py-3">
              Mulai Menggunakan Sistem
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
