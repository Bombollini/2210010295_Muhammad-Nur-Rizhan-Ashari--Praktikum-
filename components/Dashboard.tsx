import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, School, AlertCircle } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
  AreaChart, Area
} from 'recharts';
import { StatCardProps } from '../types';
import { supabase } from '../lib/supabaseClient';

const StatCard: React.FC<StatCardProps> = ({ title, value, change, isPositive, icon }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between">
    <div>
      <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      {change && (
        <p className={`text-xs mt-2 font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? '+' : ''}{change} dari bulan lalu
        </p>
      )}
    </div>
    <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
      {icon}
    </div>
  </div>
);

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalSiswa: 0,
    totalGuru: 0,
    totalKelas: 0,
    totalPelanggaran: 0
  });

  const [studentDistData, setStudentDistData] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [pointsTrendData, setPointsTrendData] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        // 1. Fetch Counts
        const { count: siswaCount } = await supabase.from('siswa').select('*', { count: 'exact', head: true }).eq('status', 'aktif');
        const { count: guruCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'guru');
        const { count: kelasCount } = await supabase.from('kelas').select('*', { count: 'exact', head: true });
        const { count: pelanggaranCount } = await supabase.from('poin_pelanggaran').select('*', { count: 'exact', head: true });

        setStats({
          totalSiswa: siswaCount || 0,
          totalGuru: guruCount || 0,
          totalKelas: kelasCount || 0,
          totalPelanggaran: pelanggaranCount || 0
        });

        // 2. Fetch Data for Student Distribution (Bar Chart)
        const { data: classes } = await supabase.from('kelas').select('id, nama_kelas');
        const { data: students } = await supabase.from('siswa').select('kelas_id');
        
        if (classes && students) {
          const distMap: Record<string, number> = {};
          
          // Initialize map with 0
          classes.forEach((c: any) => distMap[c.nama_kelas] = 0);
          
          // Count students
          students.forEach((s: any) => {
            const cls = classes.find((c: any) => c.id === s.kelas_id);
            if (cls) {
               distMap[cls.nama_kelas] = (distMap[cls.nama_kelas] || 0) + 1;
            }
          });

          const distChartData = Object.keys(distMap).map(key => ({
            name: key,
            students: distMap[key]
          }));
          setStudentDistData(distChartData);
        }

        // 3. Fetch Data for Attendance (Pie Chart) - Real Data for Today
        const today = new Date().toISOString().split('T')[0];
        const { data: attendanceDataDB } = await supabase
          .from('absensi')
          .select('status')
          .eq('tanggal', today);

        if (attendanceDataDB && attendanceDataDB.length > 0) {
           const statusCounts: Record<string, number> = { hadir: 0, izin: 0, sakit: 0, alfa: 0 };
           attendanceDataDB.forEach((record: any) => {
              const status = record.status?.toLowerCase() || 'hadir'; // Default to hadir if null, though schema should enforce
              if (statusCounts[status] !== undefined) {
                 statusCounts[status]++;
              }
           });

           const realAttendance = [
             { name: 'Hadir', value: statusCounts.hadir },
             { name: 'Izin', value: statusCounts.izin },
             { name: 'Sakit', value: statusCounts.sakit },
             { name: 'Alfa', value: statusCounts.alfa },
           ];
           // Filter output to only show statuses with value > 0 to keep chart clean? Or keep all. Keeping all for consistency.
           setAttendanceData(realAttendance);
        } else {
            // No data for today yet
             setAttendanceData([
              { name: 'Belum ada data data', value: 1 } // Placeholder gray
            ]);
        }

        // 4. Fetch Data for Points Trend (Area Chart) - Real Data Last 6 Months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const { data: pointsDataDB } = await supabase
          .from('poin_pelanggaran')
          .select('tanggal, poin')
          .gte('tanggal', sixMonthsAgo.toISOString().split('T')[0])
          .order('tanggal', { ascending: true });

        if (pointsDataDB) {
           const monthlyPoints: Record<string, number> = {};
           const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
           
           // Initialize current 6 months to 0 so we have continuous line
           for (let i = 5; i >= 0; i--) {
               const d = new Date();
               d.setMonth(d.getMonth() - i);
               const key = monthNames[d.getMonth()];
               monthlyPoints[key] = 0;
           }

           pointsDataDB.forEach((record: any) => {
               const d = new Date(record.tanggal);
               const key = monthNames[d.getMonth()];
               // Check if key exists (is within our window)
               if (monthlyPoints[key] !== undefined) {
                   monthlyPoints[key] += record.poin;
               }
           });

           const trendChartData = Object.keys(monthlyPoints).map(key => ({
               name: key,
               points: monthlyPoints[key]
           }));
           setPointsTrendData(trendChartData);
        }

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Siswa" value={stats.totalSiswa || 0} change="0%" isPositive={true} icon={<Users size={24} />} />
        <StatCard title="Guru Aktif" value={stats.totalGuru || 0} change="0%" isPositive={true} icon={<GraduationCap size={24} />} />
        <StatCard title="Total Kelas" value={stats.totalKelas || 0} change="0" isPositive={true} icon={<School size={24} />} />
        <StatCard title="Pelanggaran Total" value={stats.totalPelanggaran || 0} change="0" isPositive={false} icon={<AlertCircle size={24} className="text-orange-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graph 1: Student Distribution (Bar) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Distribusi Siswa per Kelas</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={studentDistData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="students" name="Siswa" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graph 2: Attendance Stats (Pie) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Statistik Kehadiran Hari Ini</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attendanceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {attendanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Graph 3: Points Trend (Area) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Tren Poin Pelanggaran & Prestasi</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={pointsTrendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              <Area type="monotone" dataKey="points" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
