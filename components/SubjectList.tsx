import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, FileText } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { MataPelajaran, User } from '../types/database';
import { generatePDF } from '../lib/pdfGenerator';

const SubjectList: React.FC = () => {
  const [subjects, setSubjects] = useState<MataPelajaran[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const [formData, setFormData] = useState({ 
      id: '', 
      nama_mapel: '', 
      kode_mapel: '', 
      deskripsi: '', 
      kkm: 75,
      kategori: 'umum',
      tingkat: 'semua',
      jurusan: '',
      guru_id: '',
      semester: 'tahunan',
      tahun_ajaran: '',
      jam_per_minggu: 2
  });

  const fetchData = async () => {
    setLoading(true);
    const { data: subjectData } = await supabase
        .from('mata_pelajaran')
        .select('*, guru:guru_id(nama_lengkap)')
        .order('nama_mapel');
    if (subjectData) setSubjects(subjectData as any);

    const { data: userData } = await supabase.from('users').select('*').eq('role', 'guru').order('nama_lengkap');
    if (userData) setTeachers(userData as any);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        nama_mapel: formData.nama_mapel,
        kode_mapel: formData.kode_mapel,
        deskripsi: formData.deskripsi,
        kkm: formData.kkm,
        kategori: formData.kategori,
        tingkat: formData.tingkat,
        jurusan: formData.jurusan || null,
        guru_id: formData.guru_id ? parseInt(formData.guru_id) : null,
        semester: formData.semester,
        tahun_ajaran: formData.tahun_ajaran || null,
        jam_per_minggu: formData.jam_per_minggu,
        status: 'aktif'
      };

      console.log('Sending Payload:', payload);

      let error;
      if (formData.id) {
        const { error: updateError } = await supabase.from('mata_pelajaran').update(payload).eq('id', parseInt(formData.id));
        error = updateError;
      } else {
        const { error: insertError } = await supabase.from('mata_pelajaran').insert([payload]);
        error = insertError;
      }

      if (error) throw error;
      setIsFormOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error saving subject:', error);
      console.error('Full Error Details:', JSON.stringify(error, null, 2));
      alert(`Gagal menyimpan Mapel.\n\nPesan: ${error.message}\nDetail: ${JSON.stringify(error)}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Hapus mata pelajaran ini?')) {
      await supabase.from('mata_pelajaran').delete().eq('id', id);
      fetchData();
    }
  };

  const openForm = (sub?: any) => {
    if (sub) {
      setFormData({ 
          id: sub.id, 
          nama_mapel: sub.nama_mapel, 
          kode_mapel: sub.kode_mapel || '', 
          deskripsi: sub.deskripsi || '',
          kkm: sub.kkm || 75,
          kategori: sub.kategori || 'umum',
          tingkat: sub.tingkat || 'semua',
          jurusan: sub.jurusan || '',
          guru_id: sub.guru_id || '',
          semester: sub.semester || 'tahunan',
          tahun_ajaran: sub.tahun_ajaran || '',
          jam_per_minggu: sub.jam_per_minggu || 2
      });
    } else {
      setFormData({ 
          id: '', 
          nama_mapel: '', 
          kode_mapel: '', 
          deskripsi: '', 
          kkm: 75,
          kategori: 'umum',
          tingkat: 'semua',
          jurusan: '',
          guru_id: '',
          semester: 'tahunan',
          tahun_ajaran: '',
          jam_per_minggu: 2
      });
    }
    setIsFormOpen(true);
  };

  const handleDownloadPDF = () => {
    const columns = ['No', 'Kode', 'Nama Mapel', 'Guru Pengampu', 'Kategori', 'Tingkat', 'KKM'];
    const rows = subjects.map((sub, index) => [
      index + 1,
      sub.kode_mapel || '-',
      sub.nama_mapel,
      sub.guru?.nama_lengkap || '-',
      sub.kategori.toUpperCase(),
      sub.tingkat,
      sub.kkm
    ]);
    generatePDF('Laporan Mata Pelajaran', columns, rows, 'laporan_mapel');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Manajemen Mata Pelajaran</h2>
        <div className="flex gap-2">
           <button 
            onClick={handleDownloadPDF}
            className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
          >
            <FileText size={18} />
            <span>Download PDF</span>
          </button>
          <button 
            onClick={() => openForm()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus size={18} /> Tambah Mapel
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? <div className="p-8 text-center text-slate-500">Memuat data...</div> : (
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
            <tr>
              <th className="p-4">Kode</th>
              <th className="p-4">Nama Mapel</th>
              <th className="p-4">Guru Pengampu</th>
              <th className="p-4">Kategori</th>
              <th className="p-4">Tingkat</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {subjects.map(sub => (
              <tr key={sub.id} className="hover:bg-slate-50">
                <td className="p-4 font-mono text-sm">{sub.kode_mapel || '-'}</td>
                <td className="p-4 font-medium">
                    {sub.nama_mapel}
                    <div className="text-xs text-slate-400">KKM: {sub.kkm} | {sub.jam_per_minggu} Jam/Mg</div>
                </td>
                <td className="p-4">{sub.guru?.nama_lengkap || '-'}</td>
                <td className="p-4 capitalize">{sub.kategori}</td>
                <td className="p-4 capitalize">{sub.tingkat}</td>
                <td className="p-4 text-right">
                   <div className="flex justify-end gap-2">
                     <button onClick={() => openForm(sub)} className="p-1.5 text-slate-400 hover:text-amber-600"><Edit2 size={16} /></button>
                     <button onClick={() => handleDelete(sub.id)} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                   </div>
                </td>
              </tr>
            ))}
            {subjects.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">Tidak ada mata pelajaran.</td></tr>}
          </tbody>
        </table>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50 rounded-t-xl sticky top-0">
              <h3 className="font-bold">{formData.id ? 'Edit Mapel' : 'Mapel Baru'}</h3>
              <button onClick={() => setIsFormOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium mb-1">Kode Mapel (Max 10)</label>
                    <input required maxLength={10} className="w-full border p-2 rounded" value={formData.kode_mapel} onChange={e => setFormData({...formData, kode_mapel: e.target.value})} placeholder="e.g. MTK-X" />
                 </div>
                 <div>
                    <label className="block text-sm font-medium mb-1">Nama Mapel</label>
                    <input required className="w-full border p-2 rounded" value={formData.nama_mapel} onChange={e => setFormData({...formData, nama_mapel: e.target.value})} />
                 </div>
              </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium mb-1">Kategori</label>
                    <select className="w-full border p-2 rounded" value={formData.kategori} onChange={e => setFormData({...formData, kategori: e.target.value})}>
                        <option value="umum">Umum</option>
                        <option value="jurusan">Jurusan</option>
                        <option value="peminatan">Peminatan</option>
                        <option value="ekstrakurikuler">Ekstrakurikuler</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium mb-1">Tingkat</label>
                     <select className="w-full border p-2 rounded" value={formData.tingkat} onChange={e => setFormData({...formData, tingkat: e.target.value})}>
                        <option value="semua">Semua</option>
                        <option value="X">Kelas 10 (X)</option>
                        <option value="XI">Kelas 11 (XI)</option>
                        <option value="XII">Kelas 12 (XII)</option>
                    </select>
                 </div>
              </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium mb-1">KKM</label>
                    <input type="number" required className="w-full border p-2 rounded" value={formData.kkm} onChange={e => setFormData({...formData, kkm: parseInt(e.target.value)})} />
                 </div>
                 <div>
                    <label className="block text-sm font-medium mb-1">Jam Per Minggu</label>
                    <input type="number" required className="w-full border p-2 rounded" value={formData.jam_per_minggu} onChange={e => setFormData({...formData, jam_per_minggu: parseInt(e.target.value)})} />
                 </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Guru Pengampu (Koordinator)</label>
                <select className="w-full border p-2 rounded" value={formData.guru_id} onChange={e => setFormData({...formData, guru_id: e.target.value})}>
                  <option value="">Pilih Guru</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.nama_lengkap}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium mb-1">Semester</label>
                    <select className="w-full border p-2 rounded" value={formData.semester} onChange={e => setFormData({...formData, semester: e.target.value})}>
                          <option value="tahunan">Tahunan (Ganjil & Genap)</option>
                          <option value="ganjil">Ganjil</option>
                          <option value="genap">Genap</option>
                     </select>
                 </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Jurusan (Opsional)</label>
                    <input className="w-full border p-2 rounded" value={formData.jurusan} onChange={e => setFormData({...formData, jurusan: e.target.value})} placeholder="Khusus jurusan tertentu..." />
                 </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Deskripsi</label>
                <textarea className="w-full border p-2 rounded" value={formData.deskripsi} onChange={e => setFormData({...formData, deskripsi: e.target.value})} />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded">Batal</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectList;
