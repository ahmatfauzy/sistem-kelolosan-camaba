"use client";

import type React from "react";
import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { supabase } from "@/lib/supabase";
import {
  type Periode,
  type CalonMahasiswa,
  type RankingResult,
  KRITERIA_LABELS,
} from "@/lib/types";
import { exportToExcel, importFromExcel } from "@/lib/excel-utils";
import { Upload, Download, Plus, Save } from "lucide-react";
import { toast } from "sonner";

export default function DashboardPage() {
  const [periodes, setPeriodes] = useState<Periode[]>([]);
  const [selectedPeriode, setSelectedPeriode] = useState<string>("");
  const [currentPeriode, setCurrentPeriode] = useState<Periode | null>(null);
  const [mahasiswa, setMahasiswa] = useState<CalonMahasiswa[]>([]);
  const [ranking, setRanking] = useState<RankingResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [newPeriode, setNewPeriode] = useState("");
  const [weights, setWeights] = useState({
    w1: 0.15,
    w2: 0.15,
    w3: 0.15,
    w4: 0.15,
    w5: 0.15,
    w6: 0.15,
    w7: 0.1,
  });

  const fetchPeriodes = useCallback(async () => {
    const { data, error } = await supabase
      .from("periode")
      .select("*")
      .order("periode", { ascending: false });

    if (error) {
      toast.error("Gagal memuat data periode");
    } else {
      setPeriodes(data || []);
      if (data && data.length > 0 && !selectedPeriode) {
        setSelectedPeriode(data[0].id_periode);
      }
    }
  }, [selectedPeriode]);

  const fetchMahasiswa = useCallback(async () => {
    if (!selectedPeriode) return;

    const { data, error } = await supabase
      .from("calon_mahasiswa")
      .select("*")
      .eq("id_periode", selectedPeriode)
      .order("nama");

    if (error) {
      toast.error("Gagal memuat data mahasiswa");
    } else {
      setMahasiswa(data || []);
    }
  }, [selectedPeriode]);

  const fetchRanking = useCallback(async () => {
    if (!selectedPeriode) return;

    const { data, error } = await supabase
      .from("v_topsis_ranking")
      .select("*")
      .eq("id_periode", selectedPeriode)
      .order("peringkat");

    if (error) {
      toast.error("Gagal memuat ranking");
    } else {
      setRanking(data || []);
    }
  }, [selectedPeriode]);

  useEffect(() => {
    fetchPeriodes();
  }, [fetchPeriodes]);

  useEffect(() => {
    if (selectedPeriode) {
      fetchMahasiswa();
      fetchRanking();
      const periode = periodes.find((p) => p.id_periode === selectedPeriode);
      if (periode) {
        setCurrentPeriode(periode);
        setWeights({
          w1: periode.w1,
          w2: periode.w2,
          w3: periode.w3,
          w4: periode.w4,
          w5: periode.w5,
          w6: periode.w6,
          w7: periode.w7,
        });
      }
    }
  }, [selectedPeriode, periodes, fetchMahasiswa, fetchRanking]);

  const createPeriode = async () => {
    if (!newPeriode.trim()) {
      toast.error("Nama periode tidak boleh kosong");
      return;
    }

    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
    if (Math.abs(totalWeight - 1.0) > 0.001) {
      toast.error("Total bobot harus sama dengan 1.0");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("periode")
      .insert([{ periode: newPeriode, ...weights }])
      .select();

    if (error) {
      toast.error("Gagal membuat periode");
    } else {
      toast.success("Periode berhasil dibuat");
      setNewPeriode("");
      fetchPeriodes();
      if (data && data[0]) {
        setSelectedPeriode(data[0].id_periode);
      }
    }
    setLoading(false);
  };

  const updateWeights = async () => {
    if (!selectedPeriode) return;

    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
    if (Math.abs(totalWeight - 1.0) > 0.001) {
      toast.error("Total bobot harus sama dengan 1.0");
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("periode")
      .update(weights)
      .eq("id_periode", selectedPeriode);

    if (error) {
      toast.error("Gagal mengupdate bobot");
    } else {
      toast.success("Bobot berhasil diupdate");
      fetchPeriodes();
      fetchRanking();
    }
    setLoading(false);
  };

  const handleImportExcel = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !selectedPeriode) return;

    try {
      setLoading(true);
      const data = await importFromExcel(file);

      const dataWithPeriode = data.map((item) => ({
        ...item,
        id_periode: selectedPeriode,
      }));

      const { error } = await supabase
        .from("calon_mahasiswa")
        .insert(dataWithPeriode);

      if (error) throw error;

      toast.success(`${data.length} data berhasil diimpor`);
      fetchMahasiswa();
      fetchRanking();
    } catch {
      toast.error("Gagal mengimpor data");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };

  const handleExportExcel = () => {
    if (ranking.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    const exportData = ranking.map((item) => ({
      Peringkat: item.peringkat,
      Nama: item.nama,
      "Nilai Preferensi": item.nilai_preferensi.toFixed(4),
      "D+": item.d_plus.toFixed(4),
      "D-": item.d_min.toFixed(4),
    }));

    exportToExcel(exportData, `ranking-${currentPeriode?.periode || "data"}`);
    toast.success("Data berhasil diekspor");
  };

  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Dashboard SPK Kelolosan Camaba
        </h1>
        <p className="text-gray-600">
          Kelola periode, bobot kriteria, dan lihat ranking calon mahasiswa
        </p>
      </div>

      <Tabs defaultValue="periode" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="periode">Periode & Bobot</TabsTrigger>
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
              <div className="flex gap-4">
                <Select
                  value={selectedPeriode}
                  onValueChange={setSelectedPeriode}
                >
                  <SelectTrigger className="flex-1">
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
              </div>
            </CardContent>
          </Card>

          {/* Create New Periode */}
          <Card>
            <CardHeader>
              <CardTitle>Buat Periode Baru</CardTitle>
              <CardDescription>
                Tambah periode baru dengan bobot kriteria
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

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(KRITERIA_LABELS).map(([key, label]) => (
                  <div key={key}>
                    <Label htmlFor={key}>{label}</Label>
                    <Input
                      id={key}
                      type="number"
                      step="0.001"
                      min="0"
                      max="1"
                      value={weights[key as keyof typeof weights]}
                      onChange={(e) =>
                        setWeights((prev) => ({
                          ...prev,
                          [key]: Number.parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  Total Bobot:{" "}
                  <Badge
                    variant={
                      Math.abs(totalWeight - 1.0) < 0.001
                        ? "default"
                        : "destructive"
                    }
                  >
                    {totalWeight.toFixed(3)}
                  </Badge>
                </div>
                <Button onClick={createPeriode} disabled={loading}>
                  <Plus className="w-4 h-4 mr-2" />
                  Buat Periode
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Update Weights */}
          {currentPeriode && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Edit Bobot Kriteria - {currentPeriode.periode}
                </CardTitle>
                <CardDescription>
                  Ubah bobot untuk periode yang dipilih
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(KRITERIA_LABELS).map(([key, label]) => (
                    <div key={key}>
                      <Label htmlFor={`edit-${key}`}>{label}</Label>
                      <Input
                        id={`edit-${key}`}
                        type="number"
                        step="0.001"
                        min="0"
                        max="1"
                        value={weights[key as keyof typeof weights]}
                        onChange={(e) =>
                          setWeights((prev) => ({
                            ...prev,
                            [key]: Number.parseFloat(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    Total Bobot:{" "}
                    <Badge
                      variant={
                        Math.abs(totalWeight - 1.0) < 0.001
                          ? "default"
                          : "destructive"
                      }
                    >
                      {totalWeight.toFixed(3)}
                    </Badge>
                  </div>
                  <Button onClick={updateWeights} disabled={loading}>
                    <Save className="w-4 h-4 mr-2" />
                    Update Bobot
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="mahasiswa" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Calon Mahasiswa</CardTitle>
              <CardDescription>
                {selectedPeriode
                  ? `Periode: ${currentPeriode?.periode}`
                  : "Pilih periode terlebih dahulu"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <div>
                  <Input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleImportExcel}
                    className="hidden"
                    id="excel-import"
                  />
                  <Label htmlFor="excel-import">
                    <Button
                      variant="outline"
                      asChild
                      disabled={!selectedPeriode || loading}
                    >
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        Import Excel
                      </span>
                    </Button>
                  </Label>
                </div>
                <Button
                  variant="outline"
                  onClick={handleExportExcel}
                  disabled={mahasiswa.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </Button>
              </div>

              {currentPeriode && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold mb-2">
                    Bobot Kriteria Saat Ini:
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    {Object.entries(KRITERIA_LABELS).map(([key, label]) => (
                      <div key={key}>
                        <span className="font-medium">{label}:</span>{" "}
                        {(
                          currentPeriode[key as keyof Periode] as number
                        ).toFixed(3)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Asal Sekolah</TableHead>
                      <TableHead>Nilai Rata-rata</TableHead>
                      <TableHead>Nilai Matematika</TableHead>
                      <TableHead>Minat Teknologi</TableHead>
                      <TableHead>Minat Eksakta</TableHead>
                      <TableHead>Analisis</TableHead>
                      <TableHead>Verbal</TableHead>
                      <TableHead>Numerik</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mahasiswa.map((mhs) => (
                      <TableRow key={mhs.id_calon}>
                        <TableCell className="font-medium">
                          {mhs.nama}
                        </TableCell>
                        <TableCell>{mhs.gender}</TableCell>
                        <TableCell>{mhs.asal_sekolah}</TableCell>
                        <TableCell>{mhs.nilai_rata_rata}</TableCell>
                        <TableCell>{mhs.nilai_matematika}</TableCell>
                        <TableCell>{mhs.minat_teknologi || "-"}</TableCell>
                        <TableCell>{mhs.minat_eksat || "-"}</TableCell>
                        <TableCell>{mhs.analisis || "-"}</TableCell>
                        <TableCell>{mhs.verbal || "-"}</TableCell>
                        <TableCell>{mhs.numerik || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {mahasiswa.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Belum ada data calon mahasiswa. Import data dari Excel untuk
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
                Hasil ranking menggunakan metode TOPSIS
                {selectedPeriode
                  ? ` - Periode: ${currentPeriode?.periode}`
                  : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-6">
                <div className="text-sm text-gray-600">
                  Total Calon Mahasiswa: {ranking.length}
                </div>
                <Button
                  variant="outline"
                  onClick={handleExportExcel}
                  disabled={ranking.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Ranking
                </Button>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Peringkat</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Nilai Preferensi</TableHead>
                      <TableHead>D+ (Jarak ke Solusi Ideal)</TableHead>
                      <TableHead>D- (Jarak ke Solusi Negatif)</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ranking.map((item) => (
                      <TableRow key={item.id_calon}>
                        <TableCell>
                          <Badge
                            variant={
                              item.peringkat <= 70 ? "default" : "secondary"
                            }
                          >
                            #{item.peringkat}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.nama}
                        </TableCell>
                        <TableCell>
                          {item.nilai_preferensi.toFixed(4)}
                        </TableCell>
                        <TableCell>{item.d_plus.toFixed(4)}</TableCell>
                        <TableCell>{item.d_min.toFixed(4)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              item.peringkat <= 70 ? "default" : "outline"
                            }
                          >
                            {item.peringkat <= 70 ? "Lulus" : "Tidak Lulus"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {ranking.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Belum ada data ranking. Pastikan sudah ada data calon
                  mahasiswa dan bobot kriteria sudah diatur.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
