'use client';

import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/tabs';
import { Badge } from '@components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@components/ui/dialog';
import { supabase } from '@/lib/supabase';
import {
  type Periode,
  type Kriteria,
  type CalonMahasiswa,
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
  Download,
  Plus,
  Save,
  Edit,
  Trash2,
  FileDown
} from 'lucide-react';
import { toast } from 'sonner';

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
    bobot: 0,
    sifat: 'benefit' as 'benefit' | 'cost'
  });
  const [editingKriteria, setEditingKriteria] = useState<Kriteria | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [newMahasiswa, setNewMahasiswa] = useState({
    nama: '',
    penilaian: [] as { id_kriteria: string; nilai: number }[]
  });
  const [editingMahasiswa, setEditingMahasiswa] =
    useState<CalonMahasiswaWithScores | null>(null);
  const [isDialogMahasiswaOpen, setIsDialogMahasiswaOpen] = useState(false);

  const resetMahasiswaForm = useCallback(() => {
    setNewMahasiswa({
      nama: '',
      penilaian: kriteria.map((k) => ({
        id_kriteria: k.id_kriteria,
        nilai: 0
      }))
    });
  }, [kriteria]);

  const handleNilaiChange = (kriteriaId: string, nilai: string) => {
    const numericValue = parseFloat(nilai) || 0;

    setNewMahasiswa((prev) => ({
      ...prev,
      penilaian: prev.penilaian.map((p) =>
        p.id_kriteria === kriteriaId ? { ...p, nilai: numericValue } : p
      )
    }));
  };

  const fetchPeriodes = useCallback(async () => {
    const { data, error } = await supabase
      .from('periode')
      .select('*')
      .order('periode', { ascending: false });

    if (error) {
      toast.error('Gagal memuat data periode');
    } else {
      setPeriodes(data || []);
      if (data && data.length > 0 && !selectedPeriode) {
        setSelectedPeriode(data[0].id_periode);
      }
    }
  }, [selectedPeriode]);

  const fetchKriteria = useCallback(async () => {
    if (!selectedPeriode) return;

    const { data, error } = await supabase
      .from('kriteria')
      .select('*')
      .eq('id_periode', selectedPeriode)
      .order('nama');

    if (error) {
      toast.error('Gagal memuat data kriteria');
    } else {
      setKriteria(data || []);
    }
  }, [selectedPeriode]);

  const fetchMahasiswa = useCallback(async () => {
    if (!selectedPeriode) return;

    const { data: mahasiswaData, error: mahasiswaError } = await supabase
      .from('calon_mahasiswa')
      .select('*')
      .eq('id_periode', selectedPeriode)
      .order('nama');

    if (mahasiswaError) {
      toast.error('Gagal memuat data mahasiswa');
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
      .in('id_calon', mahasiswaData?.map((m) => m.id_calon) || []);

    if (penilaianError) {
      toast.error('Gagal memuat data penilaian');
      return;
    }

    const mahasiswaWithScores =
      mahasiswaData?.map((mhs) => ({
        ...mhs,
        penilaian:
          penilaianData
            ?.filter((p) => p.id_calon === mhs.id_calon)
            .map((p) => ({
              id_kriteria: p.id_kriteria,
              nama_kriteria: (p.kriteria as any)?.nama || '',
              nilai: p.nilai
            })) || []
      })) || [];

    setMahasiswa(mahasiswaWithScores);
  }, [selectedPeriode]);

  const fetchRanking = useCallback(async () => {
    if (!selectedPeriode) return;

    const { data, error } = await supabase
      .from('v_topsis_ranking')
      .select('*')
      .order('peringkat');

    if (error) {
      toast.error('Gagal memuat ranking');
    } else {
      setRanking(data || []);
    }
  }, [selectedPeriode]);

  const createPeriode = async () => {
    if (!newPeriode.trim()) {
      toast.error('Nama periode tidak boleh kosong');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('periode')
      .insert([{ periode: newPeriode }])
      .select();

    if (error) {
      toast.error('Gagal membuat periode');
    } else {
      toast.success('Periode berhasil dibuat');
      setNewPeriode('');
      fetchPeriodes();
      if (data && data[0]) {
        setSelectedPeriode(data[0].id_periode);
      }
    }
    setLoading(false);
  };

  const createOrUpdateKriteria = async () => {
    if (!newKriteria.nama.trim() || !selectedPeriode) {
      toast.error('Nama kriteria tidak boleh kosong');
      return;
    }

    setLoading(true);
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

    if (error) {
      toast.error(
        `Gagal ${editingKriteria ? 'mengupdate' : 'membuat'} kriteria`
      );
    } else {
      toast.success(
        `Kriteria berhasil ${editingKriteria ? 'diupdate' : 'dibuat'}`
      );
      setNewKriteria({ nama: '', bobot: 0, sifat: 'benefit' });
      setEditingKriteria(null);
      setIsDialogOpen(false);
      fetchKriteria();
      fetchRanking();
    }
    setLoading(false);
  };

  const deleteKriteria = async (id: string) => {
    if (!confirm('Yakin ingin menghapus kriteria ini?')) return;

    setLoading(true);
    const { error } = await supabase
      .from('kriteria')
      .delete()
      .eq('id_kriteria', id);

    if (error) {
      toast.error('Gagal menghapus kriteria');
    } else {
      toast.success('Kriteria berhasil dihapus');
      fetchKriteria();
      fetchMahasiswa();
      fetchRanking();
    }
    setLoading(false);
  };

  const createOrUpdateMahasiswa = async () => {
    // Validasi yang lebih lengkap
    if (!newMahasiswa.nama.trim()) {
      toast.error('Nama mahasiswa tidak boleh kosong');
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

    // Validasi nilai penilaian
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
        // Update existing mahasiswa
        const { error: updateError } = await supabase
          .from('calon_mahasiswa')
          .update({ nama: newMahasiswa.nama })
          .eq('id_calon', id_calon);

        if (updateError) {
          console.error('Error updating mahasiswa:', updateError);
          throw new Error('Gagal mengupdate data mahasiswa');
        }

        // Delete existing penilaian
        const { error: deleteError } = await supabase
          .from('penilaian')
          .delete()
          .eq('id_calon', id_calon);

        if (deleteError) {
          console.error('Error deleting penilaian:', deleteError);
          throw new Error('Gagal menghapus penilaian lama');
        }
      } else {
        // Insert new mahasiswa
        const { data: inserted, error: insertError } = await supabase
          .from('calon_mahasiswa')
          .insert([
            {
              nama: newMahasiswa.nama,
              id_periode: selectedPeriode
            }
          ])
          .select();

        if (insertError) {
          console.error('Error inserting mahasiswa:', insertError);
          throw new Error('Gagal menambah data mahasiswa');
        }

        if (!inserted || !inserted[0]) {
          throw new Error('Tidak dapat mengambil ID mahasiswa baru');
        }

        id_calon = inserted[0].id_calon;
      }

      // Prepare penilaian data dengan validasi
      const penilaianToInsert = newMahasiswa.penilaian
        .filter((p) => p.id_kriteria && !isNaN(p.nilai)) // Filter invalid data
        .map((p) => ({
          id_calon,
          id_kriteria: p.id_kriteria,
          nilai: Number(p.nilai) // Ensure it's a number
        }));

      if (penilaianToInsert.length === 0) {
        throw new Error('Tidak ada data penilaian yang valid');
      }

      // Insert penilaian
      const { error: penilaianError } = await supabase
        .from('penilaian')
        .insert(penilaianToInsert);

      if (penilaianError) {
        console.error('Error inserting penilaian:', penilaianError);
        throw new Error('Gagal menyimpan data penilaian');
      }

      toast.success(
        editingMahasiswa
          ? 'Mahasiswa berhasil diperbarui'
          : 'Mahasiswa berhasil ditambahkan'
      );

      setIsDialogMahasiswaOpen(false);
      setEditingMahasiswa(null);
      resetMahasiswaForm();

      // Refresh data
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
    const { error } = await supabase
      .from('calon_mahasiswa')
      .delete()
      .eq('id_calon', id);
    if (error) {
      toast.error('Gagal menghapus mahasiswa');
    } else {
      toast.success('Mahasiswa berhasil dihapus');
      fetchMahasiswa();
      fetchRanking();
    }
    setLoading(false);
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

      // Insert mahasiswa
      const { data: insertedMahasiswa, error: mahasiswaError } = await supabase
        .from('calon_mahasiswa')
        .insert(
          mahasiswaData.map((m) => ({ ...m, id_periode: selectedPeriode }))
        )
        .select();

      if (mahasiswaError) throw mahasiswaError;

      // Insert penilaian
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
      fetchMahasiswa();
      fetchRanking();
    } catch {
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

  // Reset form ketika kriteria berubah
  useEffect(() => {
    if (kriteria.length > 0 && !editingMahasiswa) {
      resetMahasiswaForm();
    }
  }, [kriteria, editingMahasiswa, resetMahasiswaForm]);

  const totalBobot = kriteria.reduce((sum, k) => sum + k.bobot, 0);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Dashboard SPK Kelolosan Camaba
        </h1>
        <p className="text-gray-600">
          Kelola periode, kriteria dinamis, dan lihat ranking calon mahasiswa
        </p>
      </div>

      <Tabs defaultValue="periode" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="periode">Periode</TabsTrigger>
          <TabsTrigger value="kriteria">Kriteria</TabsTrigger>
          <TabsTrigger value="mahasiswa">Data Mahasiswa</TabsTrigger>
          <TabsTrigger value="ranking">Ranking TOPSIS</TabsTrigger>
        </TabsList>

        <TabsContent value="periode" className="space-y-6">
          {/* Periode Selection */}
          <Card>
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

          {/* Create New Periode */}
          <Card>
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
              <Button onClick={createPeriode} disabled={loading}>
                <Plus className="w-4 h-4 mr-2" />
                Buat Periode
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kriteria" className="space-y-6">
          <Card>
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
                <div className="text-sm text-gray-600">
                  Total Kriteria: {kriteria.length} | Total Bobot:{' '}
                  {totalBobot.toFixed(3)}
                  <Badge
                    variant={
                      Math.abs(totalBobot - 1.0) < 0.001
                        ? 'default'
                        : 'destructive'
                    }
                    className="ml-2"
                  >
                    {Math.abs(totalBobot - 1.0) < 0.001 ? 'Valid' : 'Invalid'}
                  </Badge>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      disabled={!selectedPeriode}
                      onClick={() => {
                        setEditingKriteria(null);
                        setNewKriteria({
                          nama: '',
                          bobot: 0,
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
                        <Label htmlFor="bobot">Bobot (0-1)</Label>
                        <Input
                          id="bobot"
                          type="number"
                          step="0.001"
                          min="0"
                          max="1"
                          value={newKriteria.bobot}
                          onChange={(e) =>
                            setNewKriteria((prev) => ({
                              ...prev,
                              bobot: parseFloat(e.target.value) || 0
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
                        <TableCell className="font-medium">{k.nama}</TableCell>
                        <TableCell>{k.bobot.toFixed(3)}</TableCell>
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
                <div className="text-center py-8 text-gray-500">
                  Belum ada kriteria. Tambah kriteria untuk memulai penilaian.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mahasiswa" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Mahasiswa</CardTitle>
              <CardDescription>
                Impor data dari Excel atau tambah manual
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
                  <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingMahasiswa
                          ? 'Edit Mahasiswa'
                          : 'Tambah Mahasiswa'}
                      </DialogTitle>
                      <DialogDescription>
                        Masuk kan nama dan nilai untuk setiap kriteria
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="nama-mahasiswa">Nama Mahasiswa</Label>
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

                      <div className="space-y-3">
                        <Label>Penilaian Kriteria</Label>
                        {kriteria.map((k) => (
                          <div key={k.id_kriteria} className="space-y-1">
                            <Label className="text-sm font-medium">
                              {k.nama} (Bobot: {k.bobot.toFixed(3)})
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
                                handleNilaiChange(k.id_kriteria, e.target.value)
                              }
                              placeholder="Masukkan nilai"
                            />
                          </div>
                        ))}
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

                {/* <Button
                  variant="outline"
                  onClick={handleExportTemplate}
                  disabled={kriteria.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Excel
                </Button> */}
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      {kriteria.map((k) => (
                        <TableHead key={k.id_kriteria} className="text-center">
                          {k.nama}
                        </TableHead>
                      ))}
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mahasiswa.map((m) => (
                      <TableRow key={m.id_calon}>
                        <TableCell className="font-medium">{m.nama}</TableCell>
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
                <div className="text-center py-8 text-gray-500">
                  Belum ada data mahasiswa. Tambah atau impor data untuk
                  memulai.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ranking" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ranking TOPSIS</CardTitle>
              <CardDescription>
                Hasil perhitungan ranking menggunakan metode TOPSIS
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-6">
                <div className="text-sm text-gray-600">
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
                            variant={r.peringkat <= 3 ? 'default' : 'secondary'}
                          >
                            #{r.peringkat}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{r.nama}</TableCell>
                        <TableCell className="text-center">
                          {r.nilai_preferensi.toFixed(6)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              r.peringkat <= 3 ? 'default' : 'destructive'
                            }
                          >
                            {r.peringkat <= 3 ? 'Lolos' : 'Tidak Lolos'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {ranking.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Belum ada data ranking. Pastikan ada data mahasiswa dan
                  kriteria yang valid untuk menghitung ranking.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistics Card */}
          {ranking.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Statistik Ranking</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {ranking.length}
                    </div>
                    <div className="text-sm text-gray-600">Total Kandidat</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {ranking.filter((r) => r.nilai_preferensi >= 0.6).length}
                    </div>
                    <div className="text-sm text-gray-600">Lolos</div>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {
                        ranking.filter(
                          (r) =>
                            r.nilai_preferensi >= 0.4 &&
                            r.nilai_preferensi < 0.6
                        ).length
                      }
                    </div>
                    <div className="text-sm text-gray-600">Pertimbangan</div>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {ranking.filter((r) => r.nilai_preferensi < 0.4).length}
                    </div>
                    <div className="text-sm text-gray-600">Tidak Lolos</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
