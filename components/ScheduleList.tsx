import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, FileText } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { JadwalKelas, Kelas, MataPelajaran, Hari } from '../types/database';
import { generatePDF } from '../lib/pdfGenerator';

const ScheduleList: React.FC = () => {
  const [schedules, setSchedules] = useState<JadwalKelas[]>([]);
  const [classes, setClasses] = useState<Kelas[]>([]);
  const [subjects, setSubjects] = useState<MataPelajaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeYear, setActiveYear] = useState('2024/2025'); // Default fallback
  
  // Note: 'sesi' is required in new schema, separate logic or manual input? 
  // Spec: 'hari' enum matches UI. 'jam_mulai'/'jam_selesai' are in 'jam_pelajaran' table ref by 'sesi'.
  // However, simple CRUD might want manual input or fetching 'sesi'.
  // For now, I will assume we can still use manual start/end time or I must join with jam_pelajaran.
  // The 'jadwal_kelas' table HAS 'sesi' (INT), but NOT 'start_time'/'end_time'.
  // Wait, the spec 'jadwal_kelas' table ONLY has 'id', 'hari', 'sesi', 'mapel_id', 'kelas_id', 'guru_id', 'ruangan', 'tahun_ajaran', 'semester'.
  // It does NOT have 'jam_mulai'. It references 'sesi'.
  // The 'jam_pelajaran' table has 'sesi', 'jam_mulai', 'jam_selesai'.
  // So I need to fetch 'jam_pelajaran' to show times.
  
  // To verify: "6. TABEL: JADWAL_KELAS ... sesi INT ... "
  // "5. TABEL: JAM_PELAJARAN ... id, sesi, jam_mulai, jam_selesai ..."
  
  // Complex Refactor: I need to handle 'Sesi' selection in form.
  const [sessions, setSessions] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);

  const [formData, setFormData] = useState({ 
    id: '', 
    kelas_id: '', 
    mapel_id: '', 
    guru_id: '',
    hari: 'Senin' as Hari, 
    sesi: 1, 
    ruangan: '' 
  });

  const fetchData = async () => {
    setLoading(true);
     
    // Fetch Schedules with relations
    // We need to join jam_pelajaran separately if Supabase supports it, or just fetch all jams.
    // Supabase can't join arbitrary tables effectively on non-FK unless defined. 
    // 'jadwal_kelas' doesn't explicitly FK 'sesi' to 'jam_pelajaran.sesi' in my SQL (it was just INT).
    // I will fetch all sessions.
    const { data: sessionData } = await supabase.from('jam_pelajaran').select('*').order('sesi');
    setSessions(sessionData || []);

    const { data: scheduleData, error } = await supabase
      .from('jadwal_kelas')
      .select(`
        *, 
        kelas:kelas_id(nama_kelas), 
        mapel:mapel_id(nama_mapel)
      `)
      .order('hari');
      // Note: 'hari' ordering alphabetically 'Jumat' vs 'Senin' is wrong. Need custom sort in JS.
    
    if (scheduleData) {
        // Sort days manually
        const dayOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
        const sorted = (scheduleData as any[]).sort((a,b) => {
             const da = dayOrder.indexOf(a.hari);
             const db = dayOrder.indexOf(b.hari);
             if(da === db) return a.sesi - b.sesi; 
             return da - db;
        });
        setSchedules(sorted);
    } else {
        console.error(error);
    }

    const { data: classData } = await supabase.from('kelas').select('id, nama_kelas').eq('status', 'aktif');
    if (classData) setClasses(classData as any);

    const { data: subjectData } = await supabase.from('mata_pelajaran').select('id, nama_mapel').eq('status', 'aktif');
    if (subjectData) setSubjects(subjectData as any);

    const { data: teacherData } = await supabase.from('users').select('id, nama_lengkap').eq('role', 'guru');
    if (teacherData) setTeachers(teacherData as any);

    // Fetch Active Year
    const { data: yearData } = await supabase.from('tahun_ajaran').select('tahun_ajaran').eq('status', 'aktif').single();
    if (yearData) setActiveYear(yearData.tahun_ajaran);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        kelas_id: parseInt(formData.kelas_id),
        mapel_id: parseInt(formData.mapel_id),
        guru_id: formData.guru_id ? parseInt(formData.guru_id) : null,
        hari: formData.hari,
        sesi: formData.sesi,
        ruangan: formData.ruangan,
        tahun_ajaran: activeYear, 
        semester: 'ganjil'
      };

      // Check for existing schedule with same Slot (Class + Day + Session)
      const { data: existing } = await supabase
        .from('jadwal_kelas')
        .select('id')
        .eq('kelas_id', payload.kelas_id)
        .eq('hari', payload.hari)
        .eq('sesi', payload.sesi)
        .eq('tahun_ajaran', payload.tahun_ajaran)
        .eq('semester', payload.semester)
        .maybeSingle();

      if (existing && existing.id !== (formData.id ? parseInt(formData.id) : -1)) {
        alert('Gagal: Jadwal untuk Kelas, Hari, dan Sesi ini sudah ada!');
        setLoading(false);
        return;
      }

      let error;
      if (formData.id) {
         const { error: updateError } = await supabase.from('jadwal_kelas').update(payload).eq('id', formData.id);
         error = updateError;
      } else {
         const { error: insertError } = await supabase.from('jadwal_kelas').insert([payload]);
         error = insertError;
      }

      if (error) throw error;

      setIsFormOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error saving schedule:', error);
      alert('Gagal menyimpan jadwal: ' + (error.message || JSON.stringify(error)));
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Hapus jadwal ini?')) {
      await supabase.from('jadwal_kelas').delete().eq('id', id);
      fetchData();
    }
  };

  const openForm = (sch?: any) => {
    if (sch) {
      setFormData({ 
        id: sch.id, 
        kelas_id: sch.kelas_id, 
        mapel_id: sch.mapel_id, 
        guru_id: sch.guru_id || '',
        hari: sch.hari,
        sesi: sch.sesi,
        ruangan: sch.ruangan || ''
      });
    } else {
      setFormData({ 
        id: '', 
        kelas_id: '', 
        mapel_id: '', 
        guru_id: '',
        hari: 'Senin', 
        sesi: 1, 
        ruangan: '' 
      });
    }
    setIsFormOpen(true);
  };

  const getSessionTime = (sesiNum: number) => {
      const s = sessions.find(s => s.sesi === sesiNum);
      if(s) return `${s.jam_mulai?.slice(0,5)} - ${s.jam_selesai?.slice(0,5)}`;
      return `Sesi ${sesiNum}`;
  };

  const handleDownloadPDF = () => {
    const columns = ['No', 'Hari', 'Sesi', 'Kelas', 'Mapel', 'Ruangan'];
    const rows = schedules.map((sch, index) => [
      index + 1,
      sch.hari,
      getSessionTime(sch.sesi),
      sch.kelas?.nama_kelas || '-',
      sch.mapel?.nama_mapel || '-',
      sch.ruangan || '-'
    ]);
    generatePDF('Laporan Jadwal Pelajaran', columns, rows, 'laporan_jadwal');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Jadwal Pelajaran</h2>
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
            <Plus size={18} /> Tambah Jadwal
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? ( <div className="p-8 text-center">Memuat jadwal...</div> ) : (
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
            <tr>
              <th className="p-4">Hari</th>
              <th className="p-4">Sesi / Waktu</th>
              <th className="p-4">Kelas</th>
              <th className="p-4">Mapel</th>
              <th className="p-4">Ruangan</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {schedules.map(sch => (
              <tr key={sch.id} className="hover:bg-slate-50">
                <td className="p-4 font-medium">
                    {sch.hari}
                </td>
                <td className="p-4 text-sm font-mono">{getSessionTime(sch.sesi)}</td>
                <td className="p-4">{sch.kelas?.nama_kelas || '-'}</td>
                <td className="p-4">{sch.mapel?.nama_mapel || '-'}</td>
                <td className="p-4 text-slate-600">{sch.ruangan || '-'}</td>
                <td className="p-4 text-right">
                   <div className="flex justify-end gap-2">
                     <button onClick={() => openForm(sch)} className="p-1.5 text-slate-400 hover:text-amber-600"><Edit2 size={16} /></button>
                     <button onClick={() => handleDelete(sch.id)} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                   </div>
                </td>
              </tr>
            ))}
            {schedules.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">Tidak ada jadwal.</td></tr>}
          </tbody>
        </table>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold">{formData.id ? 'Edit Jadwal' : 'Jadwal Baru'}</h3>
              <button onClick={() => setIsFormOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium mb-1">Kelas</label>
                    <select required className="w-full border p-2 rounded" value={formData.kelas_id} onChange={e => setFormData({...formData, kelas_id: e.target.value})}>
                      <option value="">Pilih Kelas</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.nama_kelas}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium mb-1">Mapel</label>
                    <select required className="w-full border p-2 rounded" value={formData.mapel_id} onChange={e => setFormData({...formData, mapel_id: e.target.value})}>
                      <option value="">Pilih Mapel</option>
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.nama_mapel}</option>)}
                    </select>
                 </div>
              </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Guru Pengampu</label>
                    <select className="w-full border p-2 rounded" value={formData.guru_id} onChange={e => setFormData({...formData, guru_id: e.target.value})}>
                      <option value="">Pilih Guru</option>
                      {teachers.map(t => <option key={t.id} value={t.id}>{t.nama_lengkap}</option>)}
                    </select>
                </div>
              
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Hari</label>
                    <select className="w-full border p-2 rounded" value={formData.hari} onChange={e => setFormData({...formData, hari: e.target.value as Hari})}>
                       {['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Sesi</label>
                     <select required className="w-full border p-2 rounded" value={formData.sesi} onChange={e => setFormData({...formData, sesi: parseInt(e.target.value)})}>
                      {sessions.length > 0 ? (
                           sessions.map(s => <option key={s.sesi} value={s.sesi}>Sesi {s.sesi} ({s.jam_mulai?.slice(0,5)})</option>)
                      ) : (
                           [1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n}</option>)
                      )}
                    </select>
                  </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Ruangan</label>
                <input className="w-full border p-2 rounded" value={formData.ruangan} onChange={e => setFormData({...formData, ruangan: e.target.value})} placeholder="Contoh: 101" />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-slate-600">Batal</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleList;
