import React, { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface UserFormProps {
  user?: any;
  onClose: () => void;
  onSuccess: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ user, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    id: '', 
    username: '',
    password: '',
    nama_lengkap: '',
    jenis_kelamin: 'L',
    nip: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    alamat: '',
    no_telepon: '',
    email: '',
    role: 'guru',
    jabatan: '',
    bidang_studi: '',
    status: 'aktif',
    foto: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        id: user.id || '',
        username: user.username || '',
        password: '', // Keep empty
        nama_lengkap: user.nama_lengkap || '',
        jenis_kelamin: user.jenis_kelamin || 'L',
        nip: user.nip || '',
        tempat_lahir: user.tempat_lahir || '',
        tanggal_lahir: user.tanggal_lahir || '',
        alamat: user.alamat || '',
        no_telepon: user.no_telepon || '',
        email: user.email || '',
        role: user.role || 'guru',
        jabatan: user.jabatan || '',
        bidang_studi: user.bidang_studi || '',
        status: user.status || 'aktif',
        foto: user.foto || ''
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let photoUrl = formData.foto;

      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `users/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, selectedFile);
        
        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
        
        photoUrl = publicUrlData.publicUrl;
      }

      const payload: any = {
        username: formData.username || formData.email?.split('@')[0],
        nama_lengkap: formData.nama_lengkap,
        jenis_kelamin: formData.jenis_kelamin,
        nip: formData.nip || null,
        tempat_lahir: formData.tempat_lahir || null,
        tanggal_lahir: formData.tanggal_lahir || null,
        alamat: formData.alamat || null,
        no_telepon: formData.no_telepon || null,
        email: formData.email,
        role: formData.role,
        jabatan: formData.jabatan || null,
        bidang_studi: formData.bidang_studi || null,
        status: formData.status,
        foto: photoUrl
      };

      if (formData.password) {
        payload.password = formData.password; 
      } else if (!user) {
         payload.password = '123456'; 
      }

      if (user) {
        // UPDATE existing user (Data only)
        // Note: Password update is not handled here for simplicity, or needs separate endpoint.
        const { password, ...updatePayload } = payload; // Exclude password from public update
        const { error } = await supabase.from('users').update(updatePayload).eq('id', user.id);
        if (error) throw error;
      } else {
        // CREATE new user (Auth + Data)
        const { data, error } = await supabase.rpc('create_new_user', {
            email: payload.email,
            password: payload.password,
            nama_lengkap: payload.nama_lengkap,
            role: payload.role,
            username: payload.username,
            nip: payload.nip,
            jenis_kelamin: payload.jenis_kelamin,
            tempat_lahir: payload.tempat_lahir,
            tanggal_lahir: payload.tanggal_lahir,
            alamat: payload.alamat,
            no_telepon: payload.no_telepon,
            jabatan: payload.jabatan,
            bidang_studi: payload.bidang_studi,
            foto: payload.foto
        });

        if (error) throw error;
        if (data && !data.success) {
            throw new Error(data.error || 'Failed to create user');
        }
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      alert('Gagal menyimpan data user: ' + error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 flex-shrink-0">
          <h3 className="font-bold text-slate-800">{user ? 'Edit User' : 'Tambah User Baru'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-2">
          {/* Form Content matches prompt fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                  <input required className="input-field" value={formData.nama_lengkap} onChange={e => setFormData({...formData, nama_lengkap: e.target.value})} placeholder="Nama Lengkap" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">NIP (Jika Guru)</label>
                  <input className="input-field" value={formData.nip} onChange={e => setFormData({...formData, nip: e.target.value})} placeholder="Nomor Induk Pegawai" />
               </div>

               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input type="email" required className="input-field" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                  <input required className="input-field" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
               </div>
               
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <input type="password" className="input-field" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder={user ? "Kosongkan jika tetap" : "Default: 123456"} />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                  <select className="input-field" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                      <option value="admin">Admin</option>
                      <option value="guru">Guru</option>
                      <option value="staff">Staff</option>
                  </select>
               </div>
                
               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Tempat Lahir</label>
                 <input className="input-field" value={formData.tempat_lahir} onChange={e => setFormData({...formData, tempat_lahir: e.target.value})} />
               </div>
               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Lahir</label>
                 <input type="date" className="input-field" value={formData.tanggal_lahir} onChange={e => setFormData({...formData, tanggal_lahir: e.target.value})} />
               </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Alamat</label>
             <textarea className="input-field h-20" value={formData.alamat} onChange={e => setFormData({...formData, alamat: e.target.value})} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Jabatan</label>
                <input className="input-field" value={formData.jabatan} onChange={e => setFormData({...formData, jabatan: e.target.value})} />
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bidang Studi (Guru)</label>
                <input className="input-field" value={formData.bidang_studi} onChange={e => setFormData({...formData, bidang_studi: e.target.value})} />
             </div>
             <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Jenis Kelamin</label>
                  <select className="input-field" value={formData.jenis_kelamin} onChange={e => setFormData({...formData, jenis_kelamin: e.target.value})}>
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                  </select>
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select className="input-field" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                      <option value="aktif">Aktif</option>
                      <option value="nonaktif">Nonaktif</option>
                      <option value="pensiun">Pensiun</option>
                      <option value="pindah">Pindah</option>
                  </select>
               </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Foto Profil</label>
                <div className="flex gap-2 items-center">
                    <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                        <Upload size={16} /> Pilih Foto
                        <input type="file" className="hidden" accept="image/*" onChange={e => setSelectedFile(e.target.files ? e.target.files[0] : null)} />
                    </label>
                    <span className="text-xs text-slate-500">{selectedFile ? selectedFile.name : 'Belum ada file'}</span>
                </div>
             </div>
          </div>

          <div className="pt-4 flex gap-3 justify-end border-t border-slate-100 mt-4">
            <button type="button" onClick={onClose} className="btn-secondary">Batal</button>
            <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Menyimpan...' : 'Simpan'}</button>
          </div>
        </form>
      </div>
      <style>{`
        .input-field {
            width: 100%;
            padding: 0.5rem 1rem;
            border: 1px solid #e2e8f0;
            border-radius: 0.5rem;
            outline: none;
            transition: all 0.2s;
        }
        .input-field:focus {
            ring: 2px;
            ring-color: #3b82f6;
            border-color: transparent;
        }
        .btn-primary {
            padding: 0.5rem 1rem;
            background-color: #2563eb;
            color: white;
            font-weight: 500;
            border-radius: 0.5rem;
            transition: background-color 0.2s;
        }
        .btn-primary:hover {
            background-color: #1d4ed8;
        }
        .btn-primary:disabled {
            opacity: 0.5;
        }
        .btn-secondary {
            padding: 0.5rem 1rem;
            color: #475569;
            font-weight: 500;
            border-radius: 0.5rem;
            transition: background-color 0.2s;
        }
        .btn-secondary:hover {
            background-color: #f1f5f9;
        }
      `}</style>
    </div>
  );
};

export default UserForm;
