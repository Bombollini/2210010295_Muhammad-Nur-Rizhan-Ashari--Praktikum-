import React, { useState, useEffect } from 'react';
import { Search, Plus, Save, Calendar, BookOpen, Clock } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { Kelas, MataPelajaran, Siswa, AbsensiRecord } from '../types';

const AttendanceList: React.FC = () => {
  const [classes, setClasses] = useState<Kelas[]>([]);
  const [subjects, setSubjects] = useState<MataPelajaran[]>([]);
  
  const [selectedClass, setSelectedClass] = useState<number | ''>('');
  const [selectedSubject, setSelectedSubject] = useState<number | ''>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  // Default session to 1, hidden from user as per request
  const selectedSession = 1;
  
  const [students, setStudents] = useState<Siswa[]>([]);
  const [attendanceData, setAttendanceData] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);

  // 1. Fetch Classes on Mount
  useEffect(() => {
    const fetchClasses = async () => {
      const { data, error } = await supabase
        .from('kelas')
        .select('id, nama_kelas, tingkat, jurusan')
        .eq('status', 'aktif')
        .order('nama_kelas');
      
      if (error) {
        console.error('Error fetching classes:', error);
      } else if (data) {
        setClasses(data);
        if (data.length > 0) setSelectedClass(data[0].id);
      }
    };
    fetchClasses();
  }, []);

  // 2. Fetch Subjects when Class changes
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!selectedClass) {
        setSubjects([]);
        return;
      }

      const currentClass = classes.find(c => c.id === selectedClass);
      if (!currentClass) return;

      // Fetch all active subjects and filter client-side for flexibility
      // Matches if: mapel.kelas_id == class.id OR (mapel.kelas_id is null AND mapel.tingkat == class.tingkat/semua)
      const { data, error } = await supabase
        .from('mata_pelajaran')
        .select('*')
        .eq('status', 'aktif')
        .order('nama_mapel');

      if (error) {
        console.error('Error fetching subjects:', error);
      } else if (data) {
        const filteredSubjects = data.filter((s: any) => {
             const exactMatch = s.kelas_id === selectedClass;
             const generalMatch = !s.kelas_id && (s.tingkat === 'semua' || s.tingkat === currentClass.tingkat);
             return exactMatch || generalMatch;
        });
        setSubjects(filteredSubjects);
        if (filteredSubjects.length > 0) setSelectedSubject(filteredSubjects[0].id);
        else setSelectedSubject('');
      }
    };
    fetchSubjects();
  }, [selectedClass, classes]);

  // 3. Fetch Students & Existing Attendance
  useEffect(() => {
    if (selectedClass && selectedSubject && selectedDate) {
      fetchAttendanceData();
    }
  }, [selectedClass, selectedSubject, selectedDate]);

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      // Fetch Students
      const { data: studentsData, error: studentError } = await supabase
        .from('siswa')
        .select('id, nama_lengkap, nis')
        .eq('kelas_id', selectedClass)
        .eq('status', 'aktif')
        .order('nama_lengkap');

      if (studentError) throw studentError;

      // Fetch Existing Attendance
      const { data: existingAttendance, error: attendanceError } = await supabase
        .from('absensi')
        .select('siswa_id, status')
        .eq('mapel_id', selectedSubject)
        .eq('tanggal', selectedDate)
        .eq('sesi', selectedSession);

      if (attendanceError) throw attendanceError;

      const statusMap: Record<number, string> = {};
      existingAttendance?.forEach((record: any) => {
        statusMap[record.siswa_id] = record.status;
      });

      // Initialize state (Default: 'hadir' if not set)
      const initialData: Record<number, string> = {};
      studentsData?.forEach((student: any) => {
        initialData[student.id] = statusMap[student.id] || 'hadir';
      });

      setStudents(studentsData || []);
      setAttendanceData(initialData);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      alert('Gagal memuat data presensi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId: number, status: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const saveAttendance = async () => {
    if (!selectedClass || !selectedSubject) return;
    setLoading(true);

    try {
      const recordsToUpsert = students.map(student => ({
        siswa_id: student.id,
        mapel_id: selectedSubject,
        tanggal: selectedDate,
        sesi: selectedSession, // Always 1
        status: attendanceData[student.id],
        metode_absen: 'manual'
      }));

      const { error } = await supabase
        .from('absensi')
        .upsert(recordsToUpsert, { onConflict: 'siswa_id, mapel_id, tanggal, sesi' });

      if (error) throw error;
      
      alert('Presensi berhasil disimpan!');
    } catch (error: any) {
      console.error('Error saving attendance:', error);
      alert('Gagal menyimpan presensi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Presensi Mata Pelajaran</h2>
          <p className="text-slate-500 text-sm mt-1">Kelola kehadiran siswa per sesi pelajaran.</p>
        </div>
        <button 
          onClick={saveAttendance}
          disabled={loading || students.length === 0 || !selectedSubject}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
        >
          <Save size={18} />
          <span>Simpan Presensi</span>
        </button>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Class Selector */}
        <div>
           <label className="block text-sm font-medium text-slate-700 mb-1">Kelas</label>
           <div className="relative">
             <select 
               className="w-full border border-slate-200 rounded-lg pl-3 pr-8 py-2 outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
               value={selectedClass}
               onChange={(e) => setSelectedClass(Number(e.target.value))}
             >
                {classes.length === 0 && <option value="">Tidak ada kelas aktif</option>}
                {classes.map(c => <option key={c.id} value={c.id}>{c.nama_kelas} ({c.jurusan})</option>)}
             </select>
             <div className="absolute right-3 top-2.5 pointer-events-none text-slate-500">
               <BookOpen size={16} />
             </div>
           </div>
        </div>

        {/* Subject Selector */}
        <div>
           <label className="block text-sm font-medium text-slate-700 mb-1">Mata Pelajaran</label>
           <select 
             className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
             value={selectedSubject}
             onChange={(e) => setSelectedSubject(Number(e.target.value))}
             disabled={!selectedClass}
           >
              {!selectedClass ? <option>Pilih Kelas Dulu</option> : 
               subjects.length === 0 ? <option>Tidak ada mapel</option> : null}
              {subjects.map(s => <option key={s.id} value={s.id}>{s.nama_mapel}</option>)}
           </select>
        </div>

        {/* Date Selector */}
        <div>
           <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
           <div className="relative">
             <input 
               type="date" 
               className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
               value={selectedDate}
               onChange={(e) => setSelectedDate(e.target.value)}
             />
           </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
             <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-slate-500">Memuat data siswa...</p>
             </div>
        ) : !selectedSubject ? (
             <div className="p-12 text-center text-slate-500">
               <BookOpen size={48} className="mx-auto text-slate-300 mb-3" />
               <p>Silakan pilih Kelas dan Mata Pelajaran untuk melihat daftar siswa.</p>
             </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-100">
                <tr>
                  <th className="p-4 w-12">No</th>
                  <th className="p-4">Nama Siswa</th>
                  <th className="p-4">NIS</th>
                  <th className="p-4 text-center w-24">Hadir</th>
                  <th className="p-4 text-center w-24">Sakit</th>
                  <th className="p-4 text-center w-24">Izin</th>
                  <th className="p-4 text-center w-24">Alfa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student, index) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-slate-400 text-sm">{index + 1}</td>
                    <td className="p-4 font-medium text-slate-800">{student.nama_lengkap}</td>
                    <td className="p-4 text-slate-500 font-mono text-sm">{student.nis}</td>
                    
                    {[
                      { key: 'hadir', color: 'text-green-600', bg: 'bg-green-50' }, 
                      { key: 'sakit', color: 'text-blue-600', bg: 'bg-blue-50' }, 
                      { key: 'izin', color: 'text-yellow-600', bg: 'bg-yellow-50' }, 
                      { key: 'alfa', color: 'text-red-600', bg: 'bg-red-50' }
                    ].map((statusOpt) => (
                      <td key={statusOpt.key} className="p-4 text-center">
                         <label className={`cursor-pointer inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-slate-100 transition-all ${attendanceData[student.id] === statusOpt.key ? statusOpt.bg : ''}`}>
                           <input 
                             type="radio" 
                             name={`status-${student.id}`}
                             checked={attendanceData[student.id] === statusOpt.key}
                             onChange={() => handleStatusChange(student.id, statusOpt.key)}
                             className={`w-5 h-5 ${statusOpt.color} focus:ring-0 border-gray-300`}
                           />
                         </label>
                      </td>
                    ))}
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-slate-500">Tidak ada data siswa aktif di kelas ini.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceList;
