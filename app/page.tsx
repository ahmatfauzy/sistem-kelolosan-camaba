import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { BarChart3, Users, Calculator, FileSpreadsheet, Settings, ArrowRight, CheckCircle } from 'lucide-react';

export default function HomePage() {
  const features = [
    {
      icon: BarChart3,
      title: 'Perhitungan TOPSIS',
      description:
        'Algoritma seleksi objektif dengan normalisasi dan pembobotan dinamis',
      color: 'text-blue-600'
    },
    {
      icon: Users,
      title: 'Manajemen Kandidat',
      description: 'Kelola data calon mahasiswa dengan interface yang intuitif',
      color: 'text-green-600'
    },
    {
      icon: Calculator,
      title: 'Pengaturan Bobot',
      description: 'Kustomisasi tingkat kepentingan kriteria (1-5) per periode',
      color: 'text-purple-600'
    },
    {
      icon: FileSpreadsheet,
      title: 'Export Hasil',
      description: 'Dukungan Excel untuk eksport hasil ranking',
      color: 'text-orange-600'
    },
    {
      icon: Settings,
      title: 'Kriteria Fleksibel',
      description: 'Buat dan sesuaikan kriteria penilaian setiap periode',
      color: 'text-gray-600'
    }
  ];

  const benefits = [
    'Proses seleksi yang objektif dan transparan',
    'Interface modern dengan dukungan dark mode',
    'Perhitungan otomatis menggunakan metode TOPSIS',
    'Statistik dan visualisasi data yang komprehensif',
    'Export hasil dalam format Excel'
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-8 py-16 max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-20 space-y-8">
          <div className="inline-flex items-center rounded-full border px-4 py-2 text-sm bg-muted/50">
            <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
            Sistem Pendukung Keputusan Terpercaya
          </div>

          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-foreground">
            Sistem Pendukung Keputusan
            <br />
            <span className="text-blue-600">Kelolosan Camaba</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Sistem ini menggunakan metode{' '}
            <strong className="text-foreground">TOPSIS</strong> untuk menentukan
            ranking calon mahasiswa berdasarkan penilaian dan bobot kriteria yang
            fleksibel setiap periode.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/dashboard">
              <Button size="lg" className="text-lg px-8 py-3">
                Mulai Menggunakan
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            {/* <Button variant="outline" size="lg" className="text-lg px-8 py-3">
              Pelajari Lebih Lanjut
            </Button> */}
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="group hover:shadow-lg transition-all duration-300"
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 group-hover:scale-110 transition-transform">
                  <feature.icon className={`w-8 h-8 ${feature.color}`} />
                </div>
                <CardTitle className="text-lg font-semibold">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-sm leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Benefits Section */}
        <Card className="mb-20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              Keunggulan Sistem
            </CardTitle>
            <CardDescription>
              Mengapa memilih SYNCSELECT untuk proses seleksi?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{benefit}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <Card className="text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
          <CardContent className="p-12">
            <h2 className="text-3xl font-bold mb-4">Siap Memulai Seleksi?</h2>
            <p className="text-xl mb-8 opacity-90">
              Bergabunglah dengan institusi yang telah mempercayai sistem kami
            </p>
            <Link href="/dashboard">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
                Akses Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}