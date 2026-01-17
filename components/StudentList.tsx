import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, FileText } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import StudentForm from './StudentForm';
import { Siswa, Kelas } from '../types/database';
import { generatePDF } from '../lib/pdfGenerator';

const StudentList: React.FC = () => {
  const [students, setStudents] = useState<Siswa[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [classes, setClasses] = useState<Kelas[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [page, setPage] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState<Siswa | null>(null);
  const ITEMS_PER_PAGE = 5;

  // Fetch Classes for Filter
  useEffect(() => {
    const fetchClasses = async () => {
      // Changed: 'classes' -> 'kelas', 'name' -> 'nama_kelas'
      const { data } = await supabase.from('kelas').select('id, nama_kelas').eq('status', 'aktif').order('nama_kelas');
      if (data) setClasses(data as any);
    };
    fetchClasses();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    // Changed: 'students' -> 'siswa'
    let query = supabase.from('siswa').select('*, kelas:kelas_id(nama_kelas)', { count: 'exact' });

    if (selectedClass) {
      query = query.eq('kelas_id', selectedClass);
    }

    if (searchTerm) {
      // Changed: 'name' -> 'nama_lengkap'
      query = query.or(`nama_lengkap.ilike.%${searchTerm}%,nis.ilike.%${searchTerm}%`);
    }

    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) {
      console.error('Error fetching siswa:', error);
    } else {
      setStudents(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
        fetchStudents();
    }, 500);
    return () => clearTimeout(timeout);
  }, [searchTerm, selectedClass, page]);

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus siswa ini?')) return;
    
    try {
      const { error } = await supabase.from('siswa').delete().eq('id', id);
      if (error) throw error;
      fetchStudents();
    } catch (error: any) {
      alert('Gagal menghapus siswa: ' + error.message);
    }
  };

  const handleEdit = (student: Siswa) => {
    setSelectedStudent(student);
    setIsFormOpen(true);
  };

  const handleAddNewStudent = () => {
    setSelectedStudent(null);
    setIsFormOpen(true);
  };
  
  const handleDownloadPDF = () => {
    const columns = ['No', 'NIS', 'Nama Lengkap', 'Kelas', 'Alamat'];
    const rows = students.map((student, index) => [
      index + 1,
      student.nis,
      student.nama_lengkap,
      (student.kelas as any)?.nama_kelas || '-',
      student.alamat || '-'
    ]);
    generatePDF('Laporan Data Siswa', columns, rows, 'laporan_siswa');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Manajemen Siswa</h2>
          <p className="text-slate-500 text-sm mt-1">Kelola data siswa.</p>
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
            onClick={handleAddNewStudent}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus size={18} />
            <span>Tambah Siswa</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex gap-4 w-full md:w-auto">
             <div className="relative w-full md:w-64">
                <input
                  type="text"
                  placeholder="Cari nama atau NIS..."
                  className="pl-4 pr-4 py-2 w-full border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={searchTerm}
                  onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPage(1); 
                  }}
                />
             </div>
             <div className="w-full md:w-48">
                <select 
                   className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                   value={selectedClass}
                   onChange={(e) => {
                       setSelectedClass(e.target.value);
                       setPage(1); 
                   }}
                >
                   <option value="">Semua Kelas</option>
                   {classes.map(c => <option key={c.id} value={c.id}>{c.nama_kelas}</option>)}
                </select>
             </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
             <div className="p-8 text-center text-slate-500">Memuat data siswa...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-100">
                  <th className="p-4">Siswa</th>
                  <th className="p-4">NIS</th>
                  <th className="p-4">Kelas</th>
                  <th className="p-4">Alamat</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
                            {student.foto ? (
                                <img src={student.foto} alt={student.nama_lengkap} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-bold">{student.nama_lengkap.charAt(0)}</div>
                            )}
                         </div>
                         <span className="font-medium text-slate-900">{student.nama_lengkap}</span>
                    </td>
                    <td className="p-4 text-slate-600 font-mono">{student.nis}</td>
                    <td className="p-4 text-slate-600">{(student.kelas as any)?.nama_kelas || '-'}</td>
                    <td className="p-4 text-slate-600 truncate max-w-xs">{student.alamat}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(student)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors" 
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(student.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" 
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50">
             <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-white border border-slate-200 rounded text-sm disabled:opacity-50 hover:bg-slate-50"
             >
                Sebelumnya
             </button>
             <span className="text-sm text-slate-600">Halaman {page}</span>
             <button 
                onClick={() => setPage(p => p + 1)}
                disabled={students.length < ITEMS_PER_PAGE}
                className="px-4 py-2 bg-white border border-slate-200 rounded text-sm disabled:opacity-50 hover:bg-slate-50"
             >
                Selanjutnya
             </button>
        </div>
      </div>

      {isFormOpen && (
        <StudentForm 
          student={selectedStudent} 
          onClose={() => setIsFormOpen(false)} 
          onSuccess={() => {
            fetchStudents();
            setIsFormOpen(false);
          }} 
        />
      )}
    </div>
  );
};

export default StudentList;

