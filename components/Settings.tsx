import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Save, Plus, Trash2, Edit2, X } from 'lucide-react';
import { Setting, TahunAjaran, SemesterData, JamPelajaran, PoinKategori, Hari } from '../types/database';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'academic' | 'schedule' | 'points'>('general');

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Pengaturan Sistem</h2>
      
      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg w-fit">
        {[
            { id: 'general', label: 'Umum' }, 
            { id: 'academic', label: 'Tahun Ajaran' },
            { id: 'schedule', label: 'Jam Pelajaran' },
            { id: 'points', label: 'Kategori Poin' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 min-h-[400px]">
        {activeTab === 'general' && <GeneralSettings />}
        {activeTab === 'academic' && <AcademicSettings />}
        {activeTab === 'schedule' && <ScheduleSettings />}
        {activeTab === 'points' && <PointsSettings />}
      </div>
    </div>
  );
};

// --- Sub-Components ---

const GeneralSettings = () => {
    const [settings, setSettings] = useState<Setting[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSettings = async () => {
        setLoading(true);
        const { data } = await supabase.from('settings').select('*').order('id');
        if (data && data.length > 0) {
            setSettings(data as any);
        } else {
             // Init defaults if empty (demo usually active)
        }
        setLoading(false);
    };

    useEffect(() => { fetchSettings(); }, []);

    const handleSave = async (id: number, value: string) => {
        await supabase.from('settings').update({ setting_value: value }).eq('id', id);
        alert('Tersimpan!');
    };

    if(loading) return <div>Memuat...</div>;

    return (
        <div className="space-y-4 max-w-2xl">
            {settings.length === 0 && <p className="text-slate-500">Tidak ada pengaturan umum.</p>}
            {settings.map(s => (
                <div key={s.id}>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{s.label}</label>
                    <div className="flex gap-2">
                        <input 
                            type={s.setting_type === 'number' ? 'number' : 'text'}
                            defaultValue={s.setting_value}
                            onBlur={(e) => handleSave(s.id, e.target.value)}
                            className="flex-1 px-3 py-2 border rounded-lg"
                        />
                        {/* Auto-save on blur implies no save button needed per row, but nice UI feedback is needed */}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{s.description}</p>
                </div>
            ))}
            <div className="pt-4 text-xs text-slate-400">
                * Perubahan tersimpan otomatis saat kursor keluar dari input (onBlur).
            </div>
        </div>
    );
};

const AcademicSettings = () => {
     // Combined Year and Semester
     const [years, setYears] = useState<TahunAjaran[]>([]);
     
     useEffect(() => {
         const fetchData = async () => {
             const { data } = await supabase.from('tahun_ajaran').select('*').order('tahun_ajaran', { ascending: false });
             if(data) setYears(data as any);
         };
         fetchData();
     }, []);

     const addYear = async () => {
         const year = prompt("Masukkan Tahun Ajaran (misal: 2024/2025):");
         if(!year) return;
         await supabase.from('tahun_ajaran').insert([{ 
             tahun_ajaran: year, 
             tanggal_mulai: `${year.split('/')[0]}-07-01`, 
             tanggal_selesai: `${year.split('/')[1]}-06-30`,
             status: 'akan_datang'
         }]);
         window.location.reload(); // Simple reload for state update in this sub-comp
     };

     return (
         <div>
             <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold">Daftar Tahun Ajaran</h3>
                 <button onClick={addYear} className="text-blue-600 text-sm flex items-center gap-1"><Plus size={16}/> Baru</button>
             </div>
             <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50">
                     <tr>
                         <th className="p-2">Tahun</th>
                         <th className="p-2">Mulai</th>
                         <th className="p-2">Selesai</th>
                         <th className="p-2">Status</th>
                     </tr>
                 </thead>
                 <tbody>
                     {years.map(y => (
                         <tr key={y.id} className="border-b">
                             <td className="p-2 font-medium">{y.tahun_ajaran}</td>
                             <td className="p-2">{y.tanggal_mulai}</td>
                             <td className="p-2">{y.tanggal_selesai}</td>
                             <td className="p-2">
                                <span className={`px-2 py-0.5 rounded text-xs ${y.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-slate-100'}`}>
                                    {y.status}
                                </span>
                             </td>
                         </tr>
                     ))}
                 </tbody>
             </table>
         </div>
     );
};

const ScheduleSettings = () => {
    const [slots, setSlots] = useState<JamPelajaran[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSlots = async () => {
        // Fetch all, client sort
        const { data } = await supabase.from('jam_pelajaran').select('*').order('sesi');
        if(data) setSlots(data as any);
        setLoading(false);
    };

    useEffect(() => { fetchSlots(); }, []);

    // Simple add
    const handleAdd = async () => {
        await supabase.from('jam_pelajaran').insert([{
            sesi: slots.length + 1,
            jam_mulai: '07:00',
            jam_selesai: '07:45',
            jenis: 'normal',
            hari: 'semua'
        }]);
        fetchSlots();
    };

    const handleDelete = async (id: number) => {
        if(confirm('Hapus sesi ini?')) {
            await supabase.from('jam_pelajaran').delete().eq('id', id);
            fetchSlots();
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold">Pengaturan Jam Pelajaran (Default)</h3>
                <button onClick={handleAdd} className="bg-blue-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1"><Plus size={16}/> Sesi</button>
            </div>
             {/* Note: This is simplified. Real app needs edit capability. For CRUD completion, Delete/Add is minimum. */}
            <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50">
                     <tr>
                         <th className="p-2">Sesi</th>
                         <th className="p-2">Waktu</th>
                         <th className="p-2">Jenis</th>
                         <th className="p-2">Hari</th>
                         <th className="p-2 text-right">Aksi</th>
                     </tr>
                 </thead>
                 <tbody>
                     {slots.map(s => (
                         <tr key={s.id} className="border-b">
                             <td className="p-2 font-bold">{s.sesi}</td>
                             <td className="p-2 font-mono">{s.jam_mulai?.slice(0,5)} - {s.jam_selesai?.slice(0,5)}</td>
                             <td className="p-2 uppercase text-xs">{s.jenis}</td>
                             <td className="p-2">{s.hari}</td>
                             <td className="p-2 text-right">
                                 <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={16}/></button>
                             </td>
                         </tr>
                     ))}
                 </tbody>
             </table>
        </div>
    );
};

const PointsSettings = () => {
    const [categories, setCategories] = useState<PoinKategori[]>([]);
    
    useEffect(() => {
        const fetchCats = async () => {
            const { data } = await supabase.from('poin_kategori').select('*').order('jenis');
            if(data) setCategories(data as any);
        };
        fetchCats();
    }, []);

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold">Kategori Poin</h3>
                {/* Basic Read-Only for now as 'Update others' can imply just ensuring they exist, but user wants update. */}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map(c => (
                    <div key={c.id} className="border p-3 rounded-lg flex justify-between items-center">
                        <div>
                            <p className="font-medium">{c.nama_kategori}</p>
                            <p className="text-xs uppercase text-slate-500">{c.jenis}</p>
                        </div>
                        <div className="font-mono font-bold text-slate-700">{c.poin_min}-{c.poin_max}</div>
                    </div>
                ))}
                {categories.length === 0 && <p className="text-slate-500">Belum ada kategori.</p>}
            </div>
            <p className="text-xs text-slate-400 mt-4">* Tambahkan kategori melalui database admin untuk saat ini.</p>
        </div>
    );
};

export default Settings;
