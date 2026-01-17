import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, School, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
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

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalSiswa: 0,
    totalGuru: 0,
    totalKelas: 0,
    totalPelanggaran: 0
  });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Note: Real attendance data aggregation is complex without backend function, keeping dummy chart for now or will remove if too misleading.
  // I will keep dummy chart for layout purposes but label it static.
  const DUMMY_ATTENDANCE = [
    { name: 'Sen', present: 1200, absent: 45 },
    { name: 'Sel', present: 1150, absent: 95 },
    { name: 'Rab', present: 1210, absent: 35 },
    { name: 'Kam', present: 1100, absent: 145 },
    { name: 'Jum', present: 1180, absent: 65 },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // 1. Fetch Counts
      const { count: siswaCount } = await supabase.from('siswa').select('*', { count: 'exact', head: true }).eq('status', 'aktif');
      const { count: guruCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'guru');
      const { count: kelasCount } = await supabase.from('kelas').select('*', { count: 'exact', head: true }).eq('status', 'aktif');
      // Count violations this month? Or total? Let's do total for now.
      const { count: pelanggaranCount } = await supabase.from('poin_pelanggaran').select('*', { count: 'exact', head: true });

      setStats({
        totalSiswa: siswaCount || 0,
        totalGuru: guruCount || 0,
        totalKelas: kelasCount || 0,
        totalPelanggaran: pelanggaranCount || 0
      });

      // 2. Fetch Logs
      const { data: logs } = await supabase
            .from('activity_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);
      if (logs) setRecentLogs(logs);

      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Siswa" 
          value={loading ? "..." : stats.totalSiswa.toLocaleString('id-ID')} 
          change="0%" // Todo: Calculate real logic
          isPositive={true} 
          icon={<Users size={24} />} 
        />
        <StatCard 
          title="Guru Aktif" 
          value={loading ? "..." : stats.totalGuru.toLocaleString('id-ID')} 
          change="0%" 
          isPositive={true} 
          icon={<GraduationCap size={24} />} 
        />
        <StatCard 
          title="Total Kelas" 
          value={loading ? "..." : stats.totalKelas.toLocaleString('id-ID')} 
          change="0" 
          isPositive={true} 
          icon={<School size={24} />} 
        />
        <StatCard 
          title="Pelanggaran Total" 
          value={loading ? "..." : stats.totalPelanggaran.toLocaleString('id-ID')} 
          change="0" 
          isPositive={false} 
          icon={<AlertCircle size={24} className="text-orange-500" />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Ringkasan Kehadiran (Demo)</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%" minHeight={300}>
              <BarChart data={DUMMY_ATTENDANCE}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Legend />
                <Bar dataKey="present" name="Hadir" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="absent" name="Absen" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Aktivitas Terbaru</h3>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {recentLogs.length === 0 ? (
               <p className="text-slate-500 text-sm">{loading ? 'Memuat...' : 'Belum ada aktivitas.'}</p>
            ) : (
                recentLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        (log.action || '').toUpperCase() === 'INSERT' ? 'bg-green-100 text-green-600' :
                        (log.action || '').toUpperCase() === 'DELETE' ? 'bg-red-100 text-red-600' :
                        'bg-blue-100 text-blue-600'
                    }`}>
                      {(log.action || '?').substring(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm text-slate-800 font-medium">{log.activity || log.description || 'No Description'}</p>
                      <p className="text-xs text-slate-400 mt-1">{new Date(log.created_at).toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
