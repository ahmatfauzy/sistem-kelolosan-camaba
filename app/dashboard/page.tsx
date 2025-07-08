'use client';

import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { StatsCard } from '@/components/ui/stats-card';
import { GradientCard } from '@/components/ui/gradient-card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import {
  type Periode,
  type Kriteria,
  type RankingResult,
  type CalonMahasiswaWithScores,
  SIFAT_KRITERIA
} from '@/lib/types';
import {
  exportToExcel,
  importFromExcel,
  exportTemplateExcel
} from '@/lib/excel-utils';
import {
  Upload,
  Plus,
  Save,
  Edit,
  Trash2,
  FileDown,
  Users,
  Trophy,
  Target,
  TrendingUp,
  Calendar,
  Settings,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { BobotInfo } from '@/components/ui/bobot-info';

export default function DashboardPage() {
  const [periodes, setPeriodes] = useState<Periode[]>([]);
  const [selectedPeriode, setSelectedPeriode] = useState<string>('');
  const [currentPeriode, setCurrentPeriode] = useState<Periode | null>(null);
  const [kriteria, setKriteria] = useState<Kriteria[]>([]);
  const [mahasiswa, setMahasiswa] = useState<CalonMahasiswaWithScores[]>([]);
  const [ranking, setRanking] = useState<RankingResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [newPeriode, setNewPeriode] = useState('');
  const [newKriteria, setNewKriteria] = useState({
    nama: '',
    bobot: 1,
    sifat: 'benefit' as 'benefit' | 'cost'
  });
  const [editingKriteria, setEditingKriteria] = useState<Kriteria | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newMahasiswa, setNewMahasiswa] = useState({
    nama: '',
    gender: '',
    asal_sekolah: '',
    jurusan_asal: '',
    no_kontak: '',
    alamat: '',
    penilaian: [] as { id_kriteria: string; nilai: number }[]
  });
  const [editingMahasiswa, setEditingMahasiswa] =
    useState<CalonMahasiswaWithScores | null>(null);
  const [isDialogMahasiswaOpen, setIsDialogMahasiswaOpen] = useState(false);

  const resetMahasiswaForm = useCallback(() => {
    setNewMahasiswa({
      nama: '',
      gender: '',
      asal_sekolah: '',
      jurusan_asal: '',
      no_kontak: '',
      alamat: '',
      penilaian: kriteria.map((k) => ({
        id_kriteria: k.id_kriteria,
        nilai: 0
      }))
    });
  }, [kriteria]);

  const handleNilaiChange = (kriteriaId: string, nilai: string) => {
    const numericValue = Number.parseFloat(nilai) || 0;
    setNewMahasiswa((prev) => ({
      ...prev,
      penilaian: prev.penilaian.map((p) =>
        p.id_kriteria === kriteriaId ? { ...p, nilai: numericValue } : p
      )
    }));
  };

  const fetchPeriodes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('periode')
        .select('*')
        .order('periode', { ascending: false });

      if (error) throw error;

      setPeriodes(data || []);
      if (data && data.length > 0 && !selectedPeriode) {
        setSelectedPeriode(data[0].id_periode);
      }
    } catch (error) {
      console.error('Error fetching periodes:', error);
      toast.error('Gagal memuat data periode');
    }
  }, [selectedPeriode]);

  const fetchKriteria = useCallback(async () => {
    if (!selectedPeriode) return;

    try {
      const { data, error } = await supabase
        .from('kriteria')
        .select('*')
        .eq('id_periode', selectedPeriode)
        .order('nama');

      if (error) throw error;
      setKriteria(data || []);
    } catch (error) {
      console.error('Error fetching kriteria:', error);
      toast.error('Gagal memuat data kriteria');
    }
  }, [selectedPeriode]);

  const fetchMahasiswa = useCallback(async () => {
    if (!selectedPeriode) return;

    try {
      const { data: mahasiswaData, error: mahasiswaError } = await supabase
        .from('calon_mahasiswa')
        .select('*')
        .eq('id_periode', selectedPeriode)
        .order('nama');

      if (mahasiswaError) throw mahasiswaError;

      if (!mahasiswaData || mahasiswaData.length === 0) {
        setMahasiswa([]);
        return;
      }

      const { data: penilaianData, error: penilaianError } = await supabase
        .from('penilaian')
        .select(
          `
          *,
          kriteria (nama)
        `
        )
        .in(
          'id_calon',
          mahasiswaData.map((m) => m.id_calon)
        );

      if (penilaianError) throw penilaianError;

      const mahasiswaWithScores = mahasiswaData.map((mhs) => ({
        ...mhs,
        penilaian:
          penilaianData
            ?.filter((p) => p.id_calon === mhs.id_calon)
            .map((p) => ({
              id_kriteria: p.id_kriteria,
              nama_kriteria: (p.kriteria as any)?.nama || '',
              nilai: p.nilai
            })) || []
      }));

      setMahasiswa(mahasiswaWithScores);
    } catch (error) {
      console.error('Error fetching mahasiswa:', error);
      toast.error('Gagal memuat data mahasiswa');
    }
  }, [selectedPeriode]);

  const fetchRanking = useCallback(async () => {
    if (!selectedPeriode) return;

    try {
      const { data, error } = await supabase
        .from('v_topsis_hasil_akhir')
        .select('*')
        .order('peringkat');

      if (error) throw error;
      setRanking(data || []);
    } catch (error) {
      console.error('Error fetching ranking:', error);
      toast.error('Gagal memuat ranking');
    }
  }, [selectedPeriode]);

  const createPeriode = async () => {
    if (!newPeriode.trim()) {
      toast.error('Nama periode tidak boleh kosong');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('periode')
        .insert([{ periode: newPeriode }])
        .select();

      if (error) throw error;

      toast.success('Periode berhasil dibuat');
      setNewPeriode('');
      await fetchPeriodes();
      if (data && data[0]) {
        setSelectedPeriode(data[0].id_periode);
      }
    } catch (error) {
      console.error('Error creating periode:', error);
      toast.error('Gagal membuat periode');
    } finally {
      setLoading(false);
    }
  };

  const createOrUpdateKriteria = async () => {
    if (!newKriteria.nama.trim() || !selectedPeriode) {
      toast.error('Nama kriteria tidak boleh kosong');
      return;
    }

    if (newKriteria.bobot < 1 || newKriteria.bobot > 5) {
      toast.error('Bobot harus antara 1 dan 5');
      return;
    }

    setLoading(true);
    try {
      const kriteriaData = {
        ...newKriteria,
        id_periode: selectedPeriode
      };

      let error;
      if (editingKriteria) {
        const { error: updateError } = await supabase
          .from('kriteria')
          .update(kriteriaData)
          .eq('id_kriteria', editingKriteria.id_kriteria);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('kriteria')
          .insert([kriteriaData]);
        error = insertError;
      }

      if (error) throw error;

      toast.success(
        `Kriteria berhasil ${editingKriteria ? 'diupdate' : 'dibuat'}`
      );
      setNewKriteria({ nama: '', bobot: 1, sifat: 'benefit' });
      setEditingKriteria(null);
      setIsDialogOpen(false);
      await fetchKriteria();
      await fetchRanking();
    } catch (error) {
      console.error('Error creating/updating kriteria:', error);
      toast.error(
        `Gagal ${editingKriteria ? 'mengupdate' : 'membuat'} kriteria`
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteKriteria = async (id: string) => {
    if (!confirm('Yakin ingin menghapus kriteria ini?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('kriteria')
        .delete()
        .eq('id_kriteria', id);

      if (error) throw error;

      toast.success('Kriteria berhasil dihapus');
      await fetchKriteria();
      await fetchMahasiswa();
      await fetchRanking();
    } catch (error) {
      console.error('Error deleting kriteria:', error);
      toast.error('Gagal menghapus kriteria');
    } finally {
      setLoading(false);
    }
  };

  const createOrUpdateMahasiswa = async () => {
    if (!newMahasiswa.nama.trim()) {
      toast.error('Nama mahasiswa tidak boleh kosong');
      return;
    }

    if (!newMahasiswa.gender.trim()) {
      toast.error('Gender tidak boleh kosong');
      return;
    }

    if (!newMahasiswa.asal_sekolah.trim()) {
      toast.error('Asal sekolah tidak boleh kosong');
      return;
    }

    if (!newMahasiswa.no_kontak.trim()) {
      toast.error('Nomor kontak tidak boleh kosong');
      return;
    }

    if (!selectedPeriode) {
      toast.error('Pilih periode terlebih dahulu');
      return;
    }

    if (kriteria.length === 0) {
      toast.error('Buat kriteria terlebih dahulu');
      return;
    }

    if (newMahasiswa.penilaian.length !== kriteria.length) {
      toast.error('Data penilaian tidak lengkap');
      return;
    }

    const invalidPenilaian = newMahasiswa.penilaian.some(
      (p) => isNaN(p.nilai) || p.nilai < 0
    );
    if (invalidPenilaian) {
      toast.error('Nilai penilaian harus berupa angka positif');
      return;
    }

    setLoading(true);
    try {
      let id_calon = editingMahasiswa?.id_calon;

      if (editingMahasiswa) {
        const { error: updateError } = await supabase
          .from('calon_mahasiswa')
          .update({
            nama: newMahasiswa.nama,
            gender: newMahasiswa.gender,
            asal_sekolah: newMahasiswa.asal_sekolah,
            jurusan_asal: newMahasiswa.jurusan_asal || null,
            no_kontak: newMahasiswa.no_kontak,
            alamat: newMahasiswa.alamat || null
          })
          .eq('id_calon', id_calon);

        if (updateError) throw updateError;

        const { error: deleteError } = await supabase
          .from('penilaian')
          .delete()
          .eq('id_calon', id_calon);

        if (deleteError) throw deleteError;
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from('calon_mahasiswa')
          .insert([
            {
              nama: newMahasiswa.nama,
              gender: newMahasiswa.gender,
              asal_sekolah: newMahasiswa.asal_sekolah,
              jurusan_asal: newMahasiswa.jurusan_asal || null,
              no_kontak: newMahasiswa.no_kontak,
              alamat: newMahasiswa.alamat || null,
              id_periode: selectedPeriode
            }
          ])
          .select();

        if (insertError) throw insertError;
        if (!inserted || !inserted[0]) {
          throw new Error('Tidak dapat mengambil ID mahasiswa baru');
        }

        id_calon = inserted[0].id_calon;
      }

      const penilaianToInsert = newMahasiswa.penilaian
        .filter((p) => p.id_kriteria && !isNaN(p.nilai))
        .map((p) => ({
          id_calon,
          id_kriteria: p.id_kriteria,
          nilai: Number(p.nilai)
        }));

      if (penilaianToInsert.length === 0) {
        throw new Error('Tidak ada data penilaian yang valid');
      }

      const { error: penilaianError } = await supabase
        .from('penilaian')
        .insert(penilaianToInsert);

      if (penilaianError) throw penilaianError;

      toast.success(
        editingMahasiswa
          ? 'Mahasiswa berhasil diperbarui'
          : 'Mahasiswa berhasil ditambahkan'
      );
      setIsDialogMahasiswaOpen(false);
      setEditingMahasiswa(null);
      resetMahasiswaForm();

      await fetchMahasiswa();
      await fetchRanking();
    } catch (error) {
      console.error('Error in createOrUpdateMahasiswa:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Terjadi kesalahan saat menyimpan data';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deleteMahasiswa = async (id: string) => {
    if (!confirm('Yakin ingin menghapus mahasiswa ini?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('calon_mahasiswa')
        .delete()
        .eq('id_calon', id);

      if (error) throw error;

      toast.success('Mahasiswa berhasil dihapus');
      await fetchMahasiswa();
      await fetchRanking();
    } catch (error) {
      console.error('Error deleting mahasiswa:', error);
      toast.error('Gagal menghapus mahasiswa');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMahasiswa = () => {
    if (kriteria.length === 0) {
      toast.error('Buat kriteria terlebih dahulu');
      return;
    }

    resetMahasiswaForm();
    setEditingMahasiswa(null);
    setIsDialogMahasiswaOpen(true);
  };

  const handleEditMahasiswa = (m: CalonMahasiswaWithScores) => {
    setEditingMahasiswa(m);
    setNewMahasiswa({
      nama: m.nama,
      gender: m.gender,
      asal_sekolah: m.asal_sekolah,
      jurusan_asal: m.jurusan_asal || '',
      no_kontak: m.no_kontak,
      alamat: m.alamat || '',
      penilaian: kriteria.map((k) => {
        const nilai =
          m.penilaian.find((p) => p.id_kriteria === k.id_kriteria)?.nilai || 0;
        return {
          id_kriteria: k.id_kriteria,
          nilai
        };
      })
    });
    setIsDialogMahasiswaOpen(true);
  };

  const handleImportExcel = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !selectedPeriode || kriteria.length === 0) {
      toast.error('Pilih periode dan pastikan ada kriteria terlebih dahulu');
      return;
    }

    try {
      setLoading(true);
      const { mahasiswa: mahasiswaData, penilaian: penilaianData } =
        await importFromExcel(file, kriteria);

      const { data: insertedMahasiswa, error: mahasiswaError } = await supabase
        .from('calon_mahasiswa')
        .insert(
          mahasiswaData.map((m) => ({ ...m, id_periode: selectedPeriode }))
        )
        .select();

      if (mahasiswaError) throw mahasiswaError;

      const penilaianInserts = [];
      for (const mhs of insertedMahasiswa) {
        for (const penilaianItem of penilaianData) {
          if (penilaianItem.nama_mahasiswa === mhs.nama) {
            const kriteriaMatch = kriteria.find(
              (k) => k.nama === penilaianItem.nama_kriteria
            );
            if (kriteriaMatch) {
              penilaianInserts.push({
                id_calon: mhs.id_calon,
                id_kriteria: kriteriaMatch.id_kriteria,
                nilai: penilaianItem.nilai
              });
            }
          }
        }
      }

      const { error: penilaianError } = await supabase
        .from('penilaian')
        .insert(penilaianInserts);

      if (penilaianError) throw penilaianError;

      toast.success(`${mahasiswaData.length} data berhasil diimpor`);
      await fetchMahasiswa();
      await fetchRanking();
    } catch (error) {
      console.error('Error importing data:', error);
      toast.error('Gagal mengimpor data');
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  const handleExportTemplate = () => {
    if (kriteria.length === 0) {
      toast.error('Buat kriteria terlebih dahulu');
      return;
    }

    exportTemplateExcel(
      kriteria,
      `template-${currentPeriode?.periode || 'data'}`
    );
    toast.success('Template berhasil diekspor');
  };

  const handleExportRanking = () => {
    if (ranking.length === 0) {
      toast.error('Tidak ada data untuk diekspor');
      return;
    }

    const exportData = ranking.map((item) => ({
      Peringkat: item.peringkat,
      Nama: item.nama,
      'Nilai Preferensi': item.nilai_preferensi.toFixed(4)
    }));

    exportToExcel(exportData, `ranking-${currentPeriode?.periode || 'data'}`);
    toast.success('Data berhasil diekspor');
  };

  useEffect(() => {
    fetchPeriodes();
  }, [fetchPeriodes]);

  useEffect(() => {
    if (selectedPeriode) {
      fetchKriteria();
      fetchMahasiswa();
      fetchRanking();
      const periode = periodes.find((p) => p.id_periode === selectedPeriode);
      setCurrentPeriode(periode || null);
    }
  }, [selectedPeriode, periodes, fetchKriteria, fetchMahasiswa, fetchRanking]);

  useEffect(() => {
    if (kriteria.length > 0 && !editingMahasiswa) {
      resetMahasiswaForm();
    }
  }, [kriteria, editingMahasiswa, resetMahasiswaForm]);

  const totalBobot = kriteria.reduce((sum, k) => sum + k.bobot, 0);
  const lolosCount = ranking.filter((r) => r.peringkat <= 10).length;
  const tidakLolosCount = ranking.filter((r) => r.peringkat > 10).length;
  const avgScore =
    ranking.length > 0
      ? ranking.reduce((sum, r) => sum + r.nilai_preferensi, 0) / ranking.length
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Dashboard SPK Kelolosan Camaba
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Sistem Pendukung Keputusan menggunakan metode TOPSIS untuk
            menentukan ranking calon mahasiswa
          </p>
        </div>

        {/* Stats Overview */}
        {selectedPeriode && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Total Kandidat"
              value={mahasiswa.length}
              description="Calon mahasiswa terdaftar"
              icon={<Users className="w-6 h-6" />}
              trend={{ value: 12, isPositive: true }}
            />
            <StatsCard
              title="Kriteria Aktif"
              value={kriteria.length}
              description={`Total bobot: ${totalBobot}`}
              icon={<Target className="w-6 h-6" />}
            />
            <StatsCard
              title="Lolos Seleksi"
              value={lolosCount}
              description={`${ranking.length > 0 ? ((lolosCount / ranking.length) * 100).toFixed(1) : 0}% dari total`}
              icon={<Trophy className="w-6 h-6" />}
              trend={{ value: 8, isPositive: true }}
            />
            <StatsCard
              title="Rata-rata Skor"
              value={avgScore.toFixed(3)}
              description="Nilai preferensi TOPSIS"
              icon={<TrendingUp className="w-6 h-6" />}
            />
          </div>
        )}

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/50 dark:bg-slate-800/50 backdrop-blur">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="periode" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Periode
            </TabsTrigger>
            <TabsTrigger value="kriteria" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Kriteria
            </TabsTrigger>
            <TabsTrigger value="mahasiswa" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Mahasiswa
            </TabsTrigger>
            <TabsTrigger value="ranking" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Ranking
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top 5 Mahasiswa */}
              <GradientCard title="Top 5 Mahasiswa" gradient="blue">
                <div className="space-y-3">
                  {ranking.slice(0, 5).map((r, index) => (
                    <div
                      key={r.nama}
                      className="flex items-center justify-between p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0
                              ? 'bg-yellow-500 text-white'
                              : index === 1
                                ? 'bg-gray-400 text-white'
                                : index === 2
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-blue-500 text-white'
                          }`}
                        >
                          {index + 1}
                        </div>
                        <span className="font-medium">{r.nama}</span>
                      </div>
                      <Badge variant="outline">
                        {r.nilai_preferensi.toFixed(4)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </GradientCard>

              {/* Bobot Kriteria */}
              <GradientCard title="Bobot Kriteria" gradient="purple">
                <div className="space-y-3">
                  {kriteria.map((k) => (
                    <div
                      key={k.id_kriteria}
                      className="flex items-center justify-between p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg"
                    >
                      <div>
                        <span className="font-medium">{k.nama}</span>
                        <Badge
                          variant={
                            k.sifat === 'benefit' ? 'default' : 'secondary'
                          }
                          className="ml-2 text-xs"
                        >
                          {k.sifat}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{k.bobot}</div>
                        <div className="text-xs text-muted-foreground">
                          {totalBobot > 0
                            ? ((k.bobot / totalBobot) * 100).toFixed(1)
                            : 0}
                          %
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </GradientCard>
            </div>

            {/* Quick Actions */}
            <Card className="bg-white/50 dark:bg-slate-800/50 backdrop-blur">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Aksi cepat untuk mengelola data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <Button
                    onClick={handleAddMahasiswa}
                    disabled={kriteria.length === 0}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Mahasiswa
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      document.getElementById('import-excel')?.click()
                    }
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import Excel
                  </Button>
                  <input
                    id="import-excel"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleImportExcel}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={handleExportRanking}
                    disabled={ranking.length === 0}
                  >
                    <FileDown className="w-4 h-4 mr-2" />
                    Export Ranking
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="periode" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/50 dark:bg-slate-800/50 backdrop-blur">
                <CardHeader>
                  <CardTitle>Pilih Periode</CardTitle>
                  <CardDescription>
                    Pilih periode untuk melihat dan mengedit data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Select
                    value={selectedPeriode}
                    onValueChange={setSelectedPeriode}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih periode" />
                    </SelectTrigger>
                    <SelectContent>
                      {periodes.map((periode) => (
                        <SelectItem
                          key={periode.id_periode}
                          value={periode.id_periode}
                        >
                          {periode.periode}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card className="bg-white/50 dark:bg-slate-800/50 backdrop-blur">
                <CardHeader>
                  <CardTitle>Buat Periode Baru</CardTitle>
                  <CardDescription>
                    Tambah periode baru untuk evaluasi
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="periode">Nama Periode</Label>
                    <Input
                      id="periode"
                      value={newPeriode}
                      onChange={(e) => setNewPeriode(e.target.value)}
                      placeholder="Contoh: 2024/2025 Ganjil"
                    />
                  </div>
                  <Button
                    onClick={createPeriode}
                    disabled={loading}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Buat Periode
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="kriteria" className="space-y-6">
            <Card className="bg-white/50 dark:bg-slate-800/50 backdrop-blur">
              <CardHeader>
                <CardTitle>Kelola Kriteria</CardTitle>
                <CardDescription>
                  {selectedPeriode
                    ? `Periode: ${currentPeriode?.periode}`
                    : 'Pilih periode terlebih dahulu'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-6">
                  <BobotInfo
                    totalBobot={totalBobot}
                    jumlahKriteria={kriteria.length}
                  />
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        disabled={!selectedPeriode}
                        onClick={() => {
                          setEditingKriteria(null);
                          setNewKriteria({
                            nama: '',
                            bobot: 1,
                            sifat: 'benefit'
                          });
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah Kriteria
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingKriteria
                            ? 'Edit Kriteria'
                            : 'Tambah Kriteria Baru'}
                        </DialogTitle>
                        <DialogDescription>
                          Isi detail kriteria penilaian
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="nama-kriteria">Nama Kriteria</Label>
                          <Input
                            id="nama-kriteria"
                            value={newKriteria.nama}
                            onChange={(e) =>
                              setNewKriteria((prev) => ({
                                ...prev,
                                nama: e.target.value
                              }))
                            }
                            placeholder="Contoh: Nilai Matematika"
                          />
                        </div>
                        <div>
                          <Label htmlFor="bobot">Bobot (1-5)</Label>
                          <Input
                            id="bobot"
                            type="number"
                            step="1"
                            min="1"
                            max="5"
                            value={newKriteria.bobot}
                            onChange={(e) =>
                              setNewKriteria((prev) => ({
                                ...prev,
                                bobot: Number.parseFloat(e.target.value) || 0
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="sifat">Sifat Kriteria</Label>
                          <Select
                            value={newKriteria.sifat}
                            onValueChange={(value: 'benefit' | 'cost') =>
                              setNewKriteria((prev) => ({
                                ...prev,
                                sifat: value
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="benefit">
                                {SIFAT_KRITERIA.benefit}
                              </SelectItem>
                              <SelectItem value="cost">
                                {SIFAT_KRITERIA.cost}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          onClick={createOrUpdateKriteria}
                          disabled={loading}
                          className="w-full"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {editingKriteria ? 'Update' : 'Simpan'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama Kriteria</TableHead>
                        <TableHead>Bobot</TableHead>
                        <TableHead>Sifat</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {kriteria.map((k) => (
                        <TableRow key={k.id_kriteria}>
                          <TableCell className="font-medium">
                            {k.nama}
                          </TableCell>
                          <TableCell>{k.bobot}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                k.sifat === 'benefit' ? 'default' : 'secondary'
                              }
                            >
                              {k.sifat}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingKriteria(k);
                                  setNewKriteria({
                                    nama: k.nama,
                                    bobot: k.bobot,
                                    sifat: k.sifat
                                  });
                                  setIsDialogOpen(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteKriteria(k.id_kriteria)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {kriteria.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Belum ada kriteria. Tambah kriteria untuk memulai penilaian.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mahasiswa" className="space-y-6">
            <Card className="bg-white/50 dark:bg-slate-800/50 backdrop-blur">
              <CardHeader>
                <CardTitle>Data Mahasiswa</CardTitle>
                <CardDescription>
                  Kelola data calon mahasiswa dan penilaian
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4 items-center flex-wrap">
                  <Dialog
                    open={isDialogMahasiswaOpen}
                    onOpenChange={setIsDialogMahasiswaOpen}
                  >
                    <DialogTrigger asChild>
                      <Button onClick={handleAddMahasiswa}>
                        <Plus className="w-4 h-4 mr-2" /> Tambah Manual
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {editingMahasiswa
                            ? 'Edit Mahasiswa'
                            : 'Tambah Mahasiswa'}
                        </DialogTitle>
                        <DialogDescription>
                          Masukkan data lengkap mahasiswa dan nilai untuk setiap
                          kriteria
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="nama-mahasiswa">
                              Nama Mahasiswa
                            </Label>
                            <Input
                              id="nama-mahasiswa"
                              value={newMahasiswa.nama}
                              onChange={(e) =>
                                setNewMahasiswa((prev) => ({
                                  ...prev,
                                  nama: e.target.value
                                }))
                              }
                              placeholder="Masukkan nama mahasiswa"
                            />
                          </div>
                          <div>
                            <Label htmlFor="gender">Gender</Label>
                            <Select
                              value={newMahasiswa.gender}
                              onValueChange={(value) =>
                                setNewMahasiswa((prev) => ({
                                  ...prev,
                                  gender: value
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih gender" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="L">Laki-laki</SelectItem>
                                <SelectItem value="P">Perempuan</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="asal-sekolah">Asal Sekolah</Label>
                            <Input
                              id="asal-sekolah"
                              value={newMahasiswa.asal_sekolah}
                              onChange={(e) =>
                                setNewMahasiswa((prev) => ({
                                  ...prev,
                                  asal_sekolah: e.target.value
                                }))
                              }
                              placeholder="Nama sekolah asal"
                            />
                          </div>
                          <div>
                            <Label htmlFor="jurusan-asal">Jurusan Asal</Label>
                            <Input
                              id="jurusan-asal"
                              value={newMahasiswa.jurusan_asal}
                              onChange={(e) =>
                                setNewMahasiswa((prev) => ({
                                  ...prev,
                                  jurusan_asal: e.target.value
                                }))
                              }
                              placeholder="IPA/IPS/SMK (opsional)"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="no-kontak">Nomor Kontak</Label>
                            <Input
                              id="no-kontak"
                              value={newMahasiswa.no_kontak}
                              onChange={(e) =>
                                setNewMahasiswa((prev) => ({
                                  ...prev,
                                  no_kontak: e.target.value
                                }))
                              }
                              placeholder="08123456789"
                            />
                          </div>
                          <div>
                            <Label htmlFor="alamat">Alamat</Label>
                            <Input
                              id="alamat"
                              value={newMahasiswa.alamat}
                              onChange={(e) =>
                                setNewMahasiswa((prev) => ({
                                  ...prev,
                                  alamat: e.target.value
                                }))
                              }
                              placeholder="Alamat lengkap (opsional)"
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label>Penilaian Kriteria</Label>
                          <div className="grid gap-3 max-h-60 overflow-y-auto">
                            {kriteria.map((k) => (
                              <div key={k.id_kriteria} className="space-y-1">
                                <Label className="text-sm font-medium">
                                  {k.nama} (Bobot: {k.bobot})
                                </Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={
                                    newMahasiswa.penilaian.find(
                                      (p) => p.id_kriteria === k.id_kriteria
                                    )?.nilai || 0
                                  }
                                  onChange={(e) =>
                                    handleNilaiChange(
                                      k.id_kriteria,
                                      e.target.value
                                    )
                                  }
                                  placeholder="Masukkan nilai"
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        <Button
                          onClick={createOrUpdateMahasiswa}
                          disabled={loading}
                          className="w-full"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {editingMahasiswa ? 'Update' : 'Simpan'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        document.getElementById('import-excel')?.click()
                      }
                      disabled={!selectedPeriode || kriteria.length === 0}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Impor Excel
                    </Button>
                    <input
                      id="import-excel"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleImportExcel}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead>Asal Sekolah</TableHead>
                        <TableHead>Kontak</TableHead>
                        {kriteria.map((k) => (
                          <TableHead
                            key={k.id_kriteria}
                            className="text-center"
                          >
                            {k.nama}
                          </TableHead>
                        ))}
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mahasiswa.map((m) => (
                        <TableRow key={m.id_calon}>
                          <TableCell className="font-medium">
                            {m.nama}
                          </TableCell>
                          <TableCell>{m.gender}</TableCell>
                          <TableCell>{m.asal_sekolah}</TableCell>
                          <TableCell>{m.no_kontak}</TableCell>
                          {kriteria.map((k) => {
                            const nilai = m.penilaian.find(
                              (p) => p.id_kriteria === k.id_kriteria
                            )?.nilai;
                            return (
                              <TableCell
                                key={k.id_kriteria}
                                className="text-center"
                              >
                                {nilai !== undefined ? nilai.toFixed(2) : '-'}
                              </TableCell>
                            );
                          })}
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditMahasiswa(m)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteMahasiswa(m.id_calon)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {mahasiswa.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Belum ada data mahasiswa. Tambah atau impor data untuk
                    memulai.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ranking" className="space-y-6">
            <Card className="bg-white/50 dark:bg-slate-800/50 backdrop-blur">
              <CardHeader>
                <CardTitle>Ranking TOPSIS</CardTitle>
                <CardDescription>
                  Hasil perhitungan ranking menggunakan metode TOPSIS
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-6">
                  <div className="text-sm text-muted-foreground">
                    Total Kandidat: {ranking.length}
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleExportRanking}
                    disabled={ranking.length === 0}
                  >
                    <FileDown className="w-4 h-4 mr-2" />
                    Ekspor Ranking
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-center">Peringkat</TableHead>
                        <TableHead>Nama Mahasiswa</TableHead>
                        <TableHead className="text-center">
                          Nilai Preferensi
                        </TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ranking.map((r) => (
                        <TableRow key={r.nama}>
                          <TableCell className="text-center font-bold">
                            <Badge
                              variant={
                                r.peringkat <= 10 ? 'default' : 'secondary'
                              }
                            >
                              #{r.peringkat}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {r.nama}
                          </TableCell>
                          <TableCell className="text-center">
                            {r.nilai_preferensi.toFixed(6)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={
                                r.peringkat <= 10 ? 'default' : 'destructive'
                              }
                            >
                              {r.peringkat <= 10 ? 'Lolos' : 'Tidak Lolos'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {ranking.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Belum ada data ranking. Pastikan ada data mahasiswa dan
                    kriteria yang valid untuk menghitung ranking.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enhanced Statistics */}
            {ranking.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GradientCard title="Statistik Kelulusan" gradient="green">
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {lolosCount}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Mahasiswa Lolos
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-red-600">
                        {tidakLolosCount}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Tidak Lolos
                      </div>
                    </div>
                  </div>
                </GradientCard>

                <GradientCard title="Distribusi Nilai" gradient="orange">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Nilai Tertinggi</span>
                      <span className="font-bold">
                        {ranking.length > 0
                          ? ranking[0].nilai_preferensi.toFixed(4)
                          : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Nilai Terendah</span>
                      <span className="font-bold">
                        {ranking.length > 0
                          ? ranking[
                              ranking.length - 1
                            ].nilai_preferensi.toFixed(4)
                          : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Rata-rata</span>
                      <span className="font-bold">{avgScore.toFixed(4)}</span>
                    </div>
                  </div>
                </GradientCard>

                <GradientCard title="Info Periode" gradient="blue">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Periode Aktif</span>
                      <span className="font-bold">
                        {currentPeriode?.periode || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Total Kriteria</span>
                      <span className="font-bold">{kriteria.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Total Bobot</span>
                      <span className="font-bold">{totalBobot}</span>
                    </div>
                  </div>
                </GradientCard>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
