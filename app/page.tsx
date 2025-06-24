import Link from "next/link";
import { Button } from "./components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { BarChart3, Users, Calculator, FileSpreadsheet } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Sistem Pendukung Keputusan
          </h1>
          <h2 className="text-2xl font-semibold text-blue-600 mb-6">
            Kelolosan Calon Mahasiswa Program Studi Teknik Informatika
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Sistem ini menggunakan metode TOPSIS (Technique for Order Preference
            by Similarity to Ideal Solution) untuk membantu menentukan ranking
            calon mahasiswa berdasarkan kriteria yang telah ditetapkan.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="text-center">
            <CardHeader>
              <BarChart3 className="w-12 h-12 text-blue-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Analisis TOPSIS</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Menggunakan metode TOPSIS untuk ranking yang akurat dan objektif
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="w-12 h-12 text-green-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Manajemen Data</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Kelola data calon mahasiswa dan periode penilaian dengan mudah
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Calculator className="w-12 h-12 text-purple-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Bobot Kriteria</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Atur bobot untuk setiap kriteria penilaian sesuai kebijakan
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <FileSpreadsheet className="w-12 h-12 text-orange-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Import/Export</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Impor data dari Excel dan ekspor hasil ranking ke berbagai
                format
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Kriteria Penilaian */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              Kriteria Penilaian
            </CardTitle>
            <CardDescription className="text-center">
              Tujuh kriteria utama yang digunakan dalam penilaian calon
              mahasiswa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  label: "Nilai Rata-rata",
                  desc: "Nilai rata-rata rapor/ijazah",
                },
                {
                  label: "Nilai Matematika",
                  desc: "Nilai khusus mata pelajaran matematika",
                },
                {
                  label: "Minat Teknologi",
                  desc: "Tingkat minat terhadap teknologi",
                },
                { label: "Minat Eksakta", desc: "Minat pada ilmu eksakta" },
                {
                  label: "Kemampuan Analisis",
                  desc: "Kemampuan berpikir analitis",
                },
                {
                  label: "Kemampuan Verbal",
                  desc: "Kemampuan komunikasi verbal",
                },
                {
                  label: "Kemampuan Numerik",
                  desc: "Kemampuan perhitungan numerik",
                },
              ].map((kriteria, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900">
                    {kriteria.label}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">{kriteria.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
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
