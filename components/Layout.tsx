import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  Calendar, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  BookOpen,
  ClipboardList,
  Award
} from 'lucide-react';
import { APP_NAME } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

const Layout: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { signOut, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [profile, setProfile] = useState<any>(null);

    // Menu Configuration
    const menuItems = [
        {
            category: 'Utama',
            items: [
                { label: 'Dashboard', path: '/', icon: LayoutDashboard, allowedRoles: ['admin', 'guru', 'staff'] }
            ]
        },
        {
            category: 'Manajemen Pengguna',
            items: [
                { label: 'Users', path: '/users', icon: Users, allowedRoles: ['admin'] }
            ]
        },
        {
            category: 'Akademik',
            items: [
                { label: 'Siswa', path: '/students', icon: GraduationCap, allowedRoles: ['admin', 'staff'] },
                { label: 'Kelas', path: '/classes', icon: BookOpen, allowedRoles: ['admin', 'staff'] },
                { label: 'Mata Pelajaran', path: '/subjects', icon: BookOpen, allowedRoles: ['admin', 'staff'] },
                { label: 'Jadwal', path: '/schedule', icon: Calendar, allowedRoles: ['admin', 'staff'] }
            ]
        },
        {
            category: 'Administrasi',
            items: [
                { label: 'Kehadiran', path: '/attendance', icon: ClipboardList, allowedRoles: ['admin', 'guru'] },
                { label: 'Poin Siswa', path: '/points', icon: Award, allowedRoles: ['admin', 'guru'] },
                { label: 'Pengaturan', path: '/settings', icon: Settings, allowedRoles: ['admin'] } // Admin only usually
            ]
        }
    ];

    useEffect(() => {
        if(user) {
            const fetchProfile = async () => {
                 // Try fetching by auth_id (new column)
                 let { data, error } = await supabase.from('users').select('*').eq('auth_id', user.id).single();
                 
                 // Fallback: Try fetching by email if auth_id is not set
                 if (!data && user.email) {
                    const { data: userData } = await supabase.from('users').select('*').eq('email', user.email).single();
                    data = userData;
                 }

                 if (data) {
                     setProfile(data);
                 }
            };
            fetchProfile();
        }
    }, [user]);
  
    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const NavItem = ({ path, icon: Icon, label }: { path: string, icon: any, label: string }) => {
        const isActive = location.pathname === path;
        return (
            <button
                onClick={() => {
                    navigate(path);
                    setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
                <Icon size={20} />
                <span>{label}</span>
            </button>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/20 z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="h-full flex flex-col">
                    <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                            <GraduationCap size={18} />
                        </div>
                        <span className="text-xl font-bold text-slate-900">{APP_NAME}</span>
                    </div>

                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                        {menuItems.map((group, index) => {
                            // Filter items based on role
                            // Default to 'admin' if profile is not loaded yet (prevents disappearing sidebar)
                            const userRole = profile?.role || 'admin';
                            
                            const visibleItems = group.items.filter(item => {
                                if (userRole === 'admin') return true;
                                return item.allowedRoles.includes(userRole);
                            });

                            if (visibleItems.length === 0) return null;

                            return (
                                <div key={index}>
                                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-4 mt-6 first:mt-2">
                                        {group.category}
                                    </div>
                                    {visibleItems.map((item, itemIndex) => (
                                        <NavItem 
                                            key={itemIndex} 
                                            path={item.path} 
                                            icon={item.icon} 
                                            label={item.label} 
                                        />
                                    ))}
                                </div>
                            );
                        })}
                    </nav>

                    <div className="p-4 border-t border-slate-100">
                        <button 
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                        >
                            <LogOut size={20} />
                            <span>Keluar</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                {/* Header */}
                <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 lg:px-8">
                    <button 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg lg:hidden"
                    >
                        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>

                    <div className="flex items-center gap-4 ml-auto">
                        <div className="flex flex-col items-end hidden sm:block">
                            <span className="text-sm font-medium text-slate-900">{profile?.nama_lengkap || user?.email}</span>
                            <span className="text-xs text-slate-500">{profile?.role || 'Admin'}</span>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-white shadow-sm overflow-hidden text-blue-600 flex items-center justify-center font-bold">
                                {profile?.foto ? (
                                    <img src={profile.foto} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    (profile?.nama_lengkap || user?.email || 'U').charAt(0).toUpperCase()
                                )}
                        </div>
                    </div>
                </header>

                {/* View Content */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Layout;
