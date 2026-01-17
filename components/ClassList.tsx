import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, FileText } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { Kelas, User, TahunAjaran, SemesterData } from '../types/database';
import { generatePDF } from '../lib/pdfGenerator';

const ClassList: React.FC = () => {
  const [classes, setClasses] = useState<Kelas[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Reference Data
  const [years, setYears] = useState<TahunAjaran[]>([]);
  
  const [formData, setFormData] = useState({
    id: '', 
    nama_kelas: '', 
    wali_kelas_id: '', 
    kapasitas: 30, 
    tingkat: 'X',
    jurusan: '',
    ruangan: '',
    tahun_ajaran: '',
    semester: 'ganjil',
    status: 'aktif'
  });

  const fetchData = async () => {
    setLoading(true);
    
    // Classes
    const { data: classesData } = await supabase
      .from('kelas')
      .select('*, wali_kelas:wali_kelas_id(nama_lengkap)')
      .order('nama_kelas');
    if (classesData) setClasses(classesData as any);

    // Teachers
    const { data: teacherData } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'guru')
      .order('nama_lengkap');
    if (teacherData) setTeachers(teacherData as any);

    // Years (Assuming created via Settings)
    const { data: yearData } = await supabase.from('tahun_ajaran').select('*').eq('status', 'aktif');
    if(yearData) setYears(yearData as any);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const generatedKode = `${formData.tingkat}-${formData.nama_kelas.replace(/\s+/g, '').toUpperCase()}`;
      
      const payload = {
        kode_kelas: generatedKode,
        nama_kelas: formData.nama_kelas,
        wali_kelas_id: formData.wali_kelas_id ? parseInt(formData.wali_kelas_id) : null,
        kapasitas: formData.kapasitas,
        tingkat: formData.tingkat,
        jurusan: formData.jurusan || null,
        ruangan: formData.ruangan || null,
        tahun_ajaran: formData.tahun_ajaran || null, // Should match active year if possible
        semester: formData.semester,
        status: formData.status
      };

      let error;
      if (formData.id) {
        const { error: updateError } = await supabase.from('kelas').update(payload).eq('id', parseInt(formData.id));
        error = updateError;
      } else {
        const { error: insertError } = await supabase.from('kelas').insert([payload]);
        error = insertError;
      }

      if (error) throw error;
      setIsFormOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error saving class:', error);
      alert('Error saving class: ' + (error.message || JSON.stringify(error)));
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Hapus kelas ini?')) {
      await supabase.from('kelas').delete().eq('id', id);
      fetchData();
    }
  };

  const openForm = (cls?: any) => {
    if (cls) {
      setFormData({ 
          id: cls.id, 
          nama_kelas: cls.nama_kelas, 
          wali_kelas_id: cls.wali_kelas_id || '', 
          kapasitas: cls.kapasitas || 30,
          tingkat: cls.tingkat || 'X',
          jurusan: cls.jurusan || '',
          ruangan: cls.ruangan || '',
          tahun_ajaran: cls.tahun_ajaran || (years.length > 0 ? years[0].tahun_ajaran : ''),
          semester: cls.semester || 'ganjil',
          status: cls.status || 'aktif'
      });
    } else {
      setFormData({ 
          id: '', 
          nama_kelas: '', 
          wali_kelas_id: '', 
          kapasitas: 30, 
          tingkat: 'X',
          jurusan: '',
          ruangan: '',
          tahun_ajaran: years.length > 0 ? years[0].tahun_ajaran : '',
          semester: 'ganjil',
          status: 'aktif'
      });
    }
    setIsFormOpen(true);
  };

  const handleDownloadPDF = () => {
    const columns = ['No', 'Kelas', 'Wali Kelas', 'Jurusan', 'Ruangan', 'Kapasitas'];
    const rows = classes.map((cls, index) => [
      index + 1,
      `${cls.tingkat} ${cls.nama_kelas}`,
      cls.wali_kelas?.nama_lengkap || '-',
      cls.jurusan || '-',
      cls.ruangan || '-',
      cls.kapasitas
    ]);
    generatePDF('Laporan Data Kelas', columns, rows, 'laporan_kelas');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Manajemen Kelas</h2>
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
            <Plus size={18} /> Tambah Kelas
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? <div className="p-8 text-center text-slate-500">Memuat data...</div> : (
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
            <tr>
              <th className="p-4">Kelas</th>
              <th className="p-4">Wali Kelas</th>
              <th className="p-4">Jurusan</th>
              <th className="p-4">Ruang</th>
              <th className="p-4">Kapasitas</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {classes.map(cls => (
              <tr key={cls.id} className="hover:bg-slate-50">
                <td className="p-4 font-medium">
                    {cls.tingkat} {cls.nama_kelas}
                    <div className="text-xs text-slate-400">{cls.tahun_ajaran} ({cls.semester})</div>
                </td>
                <td className="p-4">{cls.wali_kelas?.nama_lengkap || '-'}</td>
                <td className="p-4">{cls.jurusan || '-'}</td>
                <td className="p-4">{cls.ruangan || '-'}</td>
                <td className="p-4">{cls.kapasitas}</td>
                <td className="p-4 text-right">
                   <div className="flex justify-end gap-2">
                     <button onClick={() => openForm(cls)} className="p-1.5 text-slate-400 hover:text-amber-600"><Edit2 size={16} /></button>
                     <button onClick={() => handleDelete(cls.id)} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                   </div>
                </td>
              </tr>
            ))}
            {classes.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">Tidak ada kelas.</td></tr>}
          </tbody>
        </table>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h3 className="font-bold">{formData.id ? 'Edit Kelas' : 'Kelas Baru'}</h3>
              <button onClick={() => setIsFormOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium mb-1">Tingkat</label>
                    <select required className="w-full border p-2 rounded" value={formData.tingkat} onChange={e => setFormData({...formData, tingkat: e.target.value})}>
                      <option value="X">10 (X)</option>
                      <option value="XI">11 (XI)</option>
                      <option value="XII">12 (XII)</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium mb-1">Nama Kelas (Suffix)</label>
                    <input required className="w-full border p-2 rounded" value={formData.nama_kelas} onChange={e => setFormData({...formData, nama_kelas: e.target.value})} placeholder="e.g. IPA 1" />
                 </div>
              </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Jurusan (Opsional)</label>
                    <input className="w-full border p-2 rounded" value={formData.jurusan} onChange={e => setFormData({...formData, jurusan: e.target.value})} placeholder="e.g. MIPA" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Ruangan</label>
                    <input className="w-full border p-2 rounded" value={formData.ruangan} onChange={e => setFormData({...formData, ruangan: e.target.value})} placeholder="e.g. R.101" />
                  </div>
               </div>

              <div>
                <label className="block text-sm font-medium mb-1">Wali Kelas</label>
                <select className="w-full border p-2 rounded" value={formData.wali_kelas_id} onChange={e => setFormData({...formData, wali_kelas_id: e.target.value})}>
                  <option value="">Pilih Guru</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.nama_lengkap}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                  <div>
                     <label className="block text-sm font-medium mb-1">Kapasitas</label>
                     <input type="number" required className="w-full border p-2 rounded" value={formData.kapasitas} onChange={e => setFormData({...formData, kapasitas: parseInt(e.target.value)})} />
                  </div>
                  <div>
                     <label className="block text-sm font-medium mb-1">Tahun Ajaran</label>
                     <input className="w-full border p-2 rounded" value={formData.tahun_ajaran} onChange={e => setFormData({...formData, tahun_ajaran: e.target.value})} placeholder="2024/2025" />
                  </div>
                   <div>
                     <label className="block text-sm font-medium mb-1">Semester</label>
                     <select className="w-full border p-2 rounded" value={formData.semester} onChange={e => setFormData({...formData, semester: e.target.value})}>
                          <option value="ganjil">Ganjil</option>
                          <option value="genap">Genap</option>
                     </select>
                  </div>
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

export default ClassList;
