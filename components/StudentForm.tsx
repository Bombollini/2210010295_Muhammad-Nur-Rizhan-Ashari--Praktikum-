import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { Siswa, Kelas } from '../types/database';

interface StudentFormProps {
  student?: Siswa | null;
  onClose: () => void;
  onSuccess: () => void;
}

const StudentForm: React.FC<StudentFormProps> = ({ student, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nis: '',
    nisn: '',
    nama_lengkap: '',
    jenis_kelamin: 'L',
    kelas_id: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    alamat: '',
    nama_ayah: '',
    nama_ibu: '',
    no_telepon: '',
    foto: ''
  });
  const [classes, setClasses] = useState<Kelas[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchClasses = async () => {
      const { data } = await supabase.from('kelas').select('*').eq('status', 'aktif');
      if (data) setClasses(data as any);
    };
    fetchClasses();
  }, []);

  useEffect(() => {
    if (student) {
      setFormData({
        nis: student.nis,
        nisn: student.nisn || '',
        nama_lengkap: student.nama_lengkap,
        jenis_kelamin: student.jenis_kelamin,
        kelas_id: student.kelas_id?.toString() || '',
        tempat_lahir: student.tempat_lahir || '',
        tanggal_lahir: student.tanggal_lahir || '',
        alamat: student.alamat || '',
        nama_ayah: student.nama_ayah || '',
        nama_ibu: student.nama_ibu || '',
        no_telepon: student.no_telepon || '',
        foto: student.foto || ''
      });
    }
  }, [student]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

      let finalPhotoUrl = formData.foto;

      if (selectedFile) {
        setLoading(true);
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `siswa/${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, selectedFile);

        if (uploadError) {
           console.error(uploadError);
           alert("Gagal upload foto: " + uploadError.message);
        } else {
             const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
             finalPhotoUrl = data.publicUrl;
        }
      }

      try {
        const payload = {
            nis: formData.nis,
            nisn: formData.nisn,
            nama_lengkap: formData.nama_lengkap,
            jenis_kelamin: formData.jenis_kelamin,
            kelas_id: formData.kelas_id ? parseInt(formData.kelas_id) : null,
            tempat_lahir: formData.tempat_lahir,
            tanggal_lahir: formData.tanggal_lahir || null,
            alamat: formData.alamat,
            nama_ayah: formData.nama_ayah,
            nama_ibu: formData.nama_ibu,
            no_telepon: formData.no_telepon,
            foto: finalPhotoUrl
        };

        if (student) {
          // Update
          const { error } = await supabase
            .from('siswa')
            .update(payload)
            .eq('id', student.id);
          
          if (error) throw error;
        } else {
          // Create
          const { error } = await supabase
            .from('siswa')
            .insert([payload]);
          
          if (error) throw error;
        }
        onSuccess();
        onClose();
      } catch (error: any) {
        alert('Gagal menyimpan data siswa: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
          <h3 className="font-bold text-slate-800">{student ? 'Edit Siswa' : 'Tambah Siswa Baru'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Main Info */}
          <div className="md:col-span-2">
            <h4 className="text-sm font-bold text-blue-600 mb-2 uppercase tracking-wider">Data Utama</h4>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">NIS <span className="text-red-500">*</span></label>
            <input 
              type="text" required value={formData.nis}
              onChange={e => setFormData({...formData, nis: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">NISN <span className="text-red-500">*</span></label>
            <input 
              type="text" required value={formData.nisn}
              onChange={e => setFormData({...formData, nisn: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap <span className="text-red-500">*</span></label>
            <input 
              type="text" required value={formData.nama_lengkap}
              onChange={e => setFormData({...formData, nama_lengkap: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Jenis Kelamin</label>
             <select 
                value={formData.jenis_kelamin}
                onChange={e => setFormData({...formData, jenis_kelamin: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
             >
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
             </select>
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Kelas</label>
             <select 
                value={formData.kelas_id}
                onChange={e => setFormData({...formData, kelas_id: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
             >
                <option value="">Pilih Kelas</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.nama_kelas}</option>)}
             </select>
          </div>

          {/* Personal Info */}
          <div className="md:col-span-2 mt-2">
            <h4 className="text-sm font-bold text-blue-600 mb-2 uppercase tracking-wider">Data Pribadi</h4>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tempat Lahir</label>
            <input 
              type="text" value={formData.tempat_lahir}
              onChange={e => setFormData({...formData, tempat_lahir: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Lahir</label>
            <input 
              type="date" value={formData.tanggal_lahir}
              onChange={e => setFormData({...formData, tanggal_lahir: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          
          <div className="md:col-span-2">
             <label className="block text-sm font-medium text-slate-700 mb-1">Alamat</label>
             <textarea 
               value={formData.alamat}
               onChange={e => setFormData({...formData, alamat: e.target.value})}
               className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none"
             ></textarea>
          </div>

           {/* Parents Info */}
           <div className="md:col-span-2 mt-2">
            <h4 className="text-sm font-bold text-blue-600 mb-2 uppercase tracking-wider">Data Orang Tua</h4>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nama Ayah</label>
            <input 
              type="text" value={formData.nama_ayah}
              onChange={e => setFormData({...formData, nama_ayah: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nama Ibu</label>
            <input 
              type="text" value={formData.nama_ibu}
              onChange={e => setFormData({...formData, nama_ibu: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">No. Telepon (Ortu/Siswa)</label>
            <input 
              type="text" value={formData.no_telepon}
              onChange={e => setFormData({...formData, no_telepon: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Foto Siswa</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={e => {
                if(e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0]);
              }}
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div className="md:col-span-2 pt-4 flex gap-3 justify-end border-t border-slate-100 mt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-50 font-medium rounded-lg transition-colors"
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentForm;
