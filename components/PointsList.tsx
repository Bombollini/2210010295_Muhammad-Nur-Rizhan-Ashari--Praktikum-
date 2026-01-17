import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Award, AlertCircle, X, FileText } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { Siswa, PoinPelanggaran, PoinKategori } from '../types/database';
import { generatePDF } from '../lib/pdfGenerator';

const PointsList: React.FC = () => {
  const [violations, setViolations] = useState<PoinPelanggaran[]>([]);
  const [students, setStudents] = useState<Siswa[]>([]);
  const [categories, setCategories] = useState<PoinKategori[]>([]); 
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Simplified for now: We focus on Violations first as per typical use case, or we use a toggle.
  // The user asked for "Poin Siswa" update.
  // Let's support adding Violations primarily for now, as achievements are rarer.
  // But ideally we support both. 
  // Given urgency, I will support adding "Pelanggaran" fully first.
  
  const [formData, setFormData] = useState({
    siswa_id: '',
    jenis_pelanggaran: 'ringan',
    kategori_pelanggaran: '',
    deskripsi: '',
    poin: 5,
    tanggal: new Date().toISOString().split('T')[0],
    sanksi: '',
    lokasi: 'Sekolah'
  });

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch Violations
    const { data: vData } = await supabase
      .from('poin_pelanggaran')
      .select('*, siswa:siswa_id(nama_lengkap, kelas:kelas_id(nama_kelas))')
      .order('tanggal', { ascending: false });
    if(vData) setViolations(vData as any);

    // Fetch Students
    const { data: sData } = await supabase.from('siswa').select('id, nama_lengkap, nis, kelas:kelas_id(nama_kelas)').eq('status', 'aktif').order('nama_lengkap');
    if(sData) setStudents(sData as any);

    // Fetch Categories (Reference)
    const { data: cData } = await supabase.from('poin_kategori').select('*').eq('jenis', 'pelanggaran');
    if(cData) setCategories(cData as any);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
          siswa_id: parseInt(formData.siswa_id),
          jenis_pelanggaran: formData.jenis_pelanggaran,
          kategori_pelanggaran: formData.kategori_pelanggaran || 'Umum',
          deskripsi: formData.deskripsi,
          poin: formData.poin,
          tanggal: formData.tanggal,
          sanksi: formData.sanksi || null,
          lokasi: formData.lokasi,
          status: 'pending'
      };

      const { error } = await supabase.from('poin_pelanggaran').insert([payload]);
      if (error) throw error;
      
      setIsFormOpen(false);
      fetchData();
      // Reset form
      setFormData({
        siswa_id: '',
        jenis_pelanggaran: 'ringan',
        kategori_pelanggaran: '',
        deskripsi: '',
        poin: 5,
        tanggal: new Date().toISOString().split('T')[0],
        sanksi: '',
        lokasi: 'Sekolah'
     });
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Hapus log pelanggaran ini?')) {
      await supabase.from('poin_pelanggaran').delete().eq('id', id);
      fetchData();
    }
  };

  const handleDownloadPDF = () => {
    const columns = ['No', 'Tanggal', 'Siswa', 'Kelas', 'Jenis', 'Poin', 'Kategori', 'Deskripsi'];
    const rows = violations.map((v, index) => [
      index + 1,
      v.tanggal,
      v.siswa?.nama_lengkap || '-',
      (v.siswa as any)?.kelas?.nama_kelas || '-',
      v.jenis_pelanggaran.toUpperCase(),
      v.poin,
      v.kategori_pelanggaran,
      v.deskripsi
    ]);
    generatePDF('Laporan Pelanggaran Siswa', columns, rows, 'laporan_pelanggaran');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Catatan Pelanggaran Siswa</h2>
          <p className="text-slate-500 text-sm mt-1">Monitoring kedisiplinan siswa.</p>
        </div>
        <div className="flex gap-2">
           <button 
            onClick={handleDownloadPDF}
            className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
          >
            <FileText size={18} />
            <span>Download PDF</span>
          </button>
          <button 
            onClick={() => setIsFormOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus size={18} /> Catat Pelanggaran
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? <div className="p-8 text-center text-slate-500">Memuat data...</div> : (
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
            <tr>
              <th className="p-4">Tanggal</th>
              <th className="p-4">Siswa</th>
              <th className="p-4">Jenis</th>
              <th className="p-4">Poin</th>
              <th className="p-4">Deskripsi</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {violations.map(v => (
              <tr key={v.id} className="hover:bg-slate-50">
                <td className="p-4 text-slate-600 text-sm font-mono">
                  {v.tanggal}
                </td>
                <td className="p-4 font-medium">
                  {v.siswa?.nama_lengkap} 
                  <div className="text-xs text-slate-400">{(v.siswa as any)?.kelas?.nama_kelas}</div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                    v.jenis_pelanggaran === 'berat' ? 'bg-red-100 text-red-700' : 
                    v.jenis_pelanggaran === 'sedang' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {v.jenis_pelanggaran}
                  </span>
                </td>
                <td className="p-4 font-bold text-red-600">
                  +{v.poin}
                </td>
                <td className="p-4 text-slate-600 text-sm">
                    <div className="font-medium">{v.kategori_pelanggaran}</div>
                    {v.deskripsi}
                </td>
                <td className="p-4 text-right">
                   <button onClick={() => handleDelete(v.id)} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {violations.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">Belum ada pelanggaran tercatat.</td></tr>}
          </tbody>
        </table>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-4 border-b flex justify-between items-center bg-red-50 rounded-t-xl">
              <h3 className="font-bold text-red-800">Catat Pelanggaran</h3>
              <button onClick={() => setIsFormOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Siswa</label>
                <select 
                  required 
                  className="w-full border p-2 rounded" 
                  value={formData.siswa_id} 
                  onChange={e => setFormData({...formData, siswa_id: e.target.value})}
                >
                  <option value="">Pilih Siswa</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.nama_lengkap} ({(s.kelas as any)?.nama_kelas || 'No Class'})</option>)}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium mb-1">Kategori</label>
                    <select 
                        required
                        className="w-full border p-2 rounded"
                        value={formData.kategori_pelanggaran}
                        onChange={e => {
                            const val = e.target.value;
                            const cat = categories.find(c => c.nama_kategori === val);
                            setFormData({
                                ...formData, 
                                kategori_pelanggaran: val,
                                poin: cat ? cat.poin_min : 5 // Auto-set points min
                            });
                        }}
                    >
                        <option value="">Pilih Kategori</option>
                        {categories.map(c => <option key={c.id} value={c.nama_kategori}>{c.nama_kategori}</option>)}
                        <option value="Lainnya">Lainnya</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium mb-1">Jenis Pelanggaran</label>
                    <select className="w-full border p-2 rounded" value={formData.jenis_pelanggaran} onChange={e => setFormData({...formData, jenis_pelanggaran: e.target.value})}>
                        <option value="ringan">Ringan</option>
                        <option value="sedang">Sedang</option>
                        <option value="berat">Berat</option>
                    </select>
                 </div>
              </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium mb-1">Poin</label>
                    <input type="number" required className="w-full border p-2 rounded" value={formData.poin} onChange={e => setFormData({...formData, poin: parseInt(e.target.value)})} />
                 </div>
                 <div>
                    <label className="block text-sm font-medium mb-1">Tanggal</label>
                    <input type="date" required className="w-full border p-2 rounded" value={formData.tanggal} onChange={e => setFormData({...formData, tanggal: e.target.value})} />
                 </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Deskripsi Kejadian</label>
                <textarea required className="w-full border p-2 rounded" rows={3} value={formData.deskripsi} onChange={e => setFormData({...formData, deskripsi: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Sanksi / Tindak Lanjut</label>
                <input className="w-full border p-2 rounded" value={formData.sanksi} onChange={e => setFormData({...formData, sanksi: e.target.value})} placeholder="Contoh: Skorsing 3 hari" />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded">Batal</button>
                <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PointsList;
