import React, { useState, useEffect } from 'react';
import { Search, Mail, Plus, Edit2, Trash2, FileText } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import UserForm from './UserForm';
import { User } from '../types/database';
import { generatePDF } from '../lib/pdfGenerator';

const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // States for Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');

  // Derived filtered users
  const filteredUsers = users.filter(user => {
      const matchSearch = (user.nama_lengkap || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (user.username || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchRole = filterRole ? user.role === filterRole : true;
      return matchSearch && matchRole;
  });

  const fetchUsers = async () => {
    setLoading(true);
    // Fetch ALL users ordered by name. No filter by role.
    const { data } = await supabase
      .from('users')
      .select('*')
      .order('nama_lengkap');
    
    if (data) setUsers(data as any);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddNew = () => {
    setSelectedUser(null);
    setIsFormOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus user ini?')) return;
    
    try {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
      fetchUsers();
    } catch (error: any) {
      alert('Gagal menghapus user: ' + error.message);
    }
  };

  const handleSuccess = () => {
    fetchUsers();
  };

  const handleDownloadPDF = () => {
    const columns = ['No', 'Nama Lengkap', 'Role', 'NIP / Username', 'Email', 'Status'];
    const rows = users.map((user, index) => [
      index + 1,
      user.nama_lengkap,
      user.role.toUpperCase(),
      user.nip || user.username,
      user.email,
      user.status.toUpperCase()
    ]);
    generatePDF('Laporan Data Pengguna (User)', columns, rows, 'laporan_user');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Manajemen Pengguna (User)</h2>
          <p className="text-slate-500 text-sm mt-1">Kelola data semua pengguna sistem (Admin, Guru, Siswa).</p>
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
            onClick={handleAddNew}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus size={18} />
            <span>Tambah User</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex gap-4 w-full md:w-auto">
               <div className="relative w-full md:w-64">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                       <Search size={16} className="text-slate-400" />
                   </div>
                   <input
                       type="text"
                       placeholder="Cari user..."
                       className="pl-10 pr-4 py-2 w-full border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                   />
               </div>
               <div className="w-full md:w-auto">
                   <select 
                       className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                       value={filterRole}
                       onChange={(e) => setFilterRole(e.target.value)}
                   >
                       <option value="">Semua Role</option>
                       <option value="admin">Admin</option>
                       <option value="guru">Guru</option>
                       <option value="staff">Staff</option>
                   </select>
               </div>
            </div>
        </div>

        {loading ? (
             <div className="p-8 text-center text-slate-500">Memuat data user...</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
              <tr>
                <th className="p-4">Nama User</th>
                <th className="p-4">Role</th>
                <th className="p-4">Username / NIP</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="p-4 font-medium flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold overflow-hidden">
                        {user.foto ? (
                          <img src={user.foto} alt={user.nama_lengkap} className="w-full h-full object-cover" />
                        ) : (
                          user.nama_lengkap?.charAt(0) || 'U'
                        )}
                     </div>
                     <div>
                        {user.nama_lengkap || 'Tanpa Nama'}
                        <div className="text-xs text-slate-400">{user.email}</div>
                     </div>
                  </td>
                  <td className="p-4">
                     <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                        user.role === 'guru' ? 'bg-blue-100 text-blue-700' : 
                        user.role === 'staff' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'
                     }`}>
                        {user.role}
                     </span>
                  </td>
                  <td className="p-4 text-slate-600 font-mono text-sm">
                      {user.username} {user.nip ? ` / ${user.nip}` : ''}
                  </td> 
                  <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-xs capitalize ${
                          user.status === 'aktif' ? 'text-green-600 bg-green-50' : 'text-slate-400 bg-slate-100'
                      }`}>
                          {user.status}
                      </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleEdit(user)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(user.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500">Tidak ada user ditemukan.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {isFormOpen && (
        <UserForm 
          user={selectedUser}
          onClose={() => setIsFormOpen(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};

export default UserList;
