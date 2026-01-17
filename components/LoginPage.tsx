import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { GraduationCap } from 'lucide-react';
import { APP_NAME } from '../constants';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('staff'); // Default role
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (isSignUp) {
        // Sign Up Logic
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: role, 
            },
          },
        });
        
        if (error) throw error;
        
        setSuccessMessage('Registrasi berhasil! Silakan cek email Anda atau login.');
        setIsSignUp(false); // Switch back to login view
        setPassword('');
      } else {
        // Login Logic
        console.log('Attempting login for:', email);
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        console.log('Login Result:', { data, error });

        if (error) {
            console.error('Login Error Object:', error);
            throw error;
        }
        
        console.log('Login Successful, navigating...');
        navigate('/');
      }
    } catch (error: any) {
      console.error('Catch Block Error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-600 text-white mb-4">
            <GraduationCap size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{APP_NAME}</h1>
          <p className="text-slate-500 mt-2">Sistem Manajemen Sekolah</p>
        </div>
        
        <form onSubmit={handleAuth} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg">
              {successMessage}
            </div>
          )}
          
          {isSignUp && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={isSignUp}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Nama Anda"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Peran (Role)</label>
                <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                disabled={loading}
              >
                <option value="guru">Guru</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
              </div>
            </>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Alamat Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="nama@sekolah.sch.id"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Kata Sandi</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors shadow-sm mt-2 disabled:opacity-50"
          >
            {loading ? 'Memproses...' : (isSignUp ? 'Buat Akun' : 'Masuk')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600">
            {isSignUp ? 'Sudah punya akun?' : "Belum punya akun?"}
            <button 
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setSuccessMessage(null);
              }}
              className="ml-2 text-blue-600 font-medium hover:underline"
            >
              {isSignUp ? 'Masuk' : 'Daftar'}
            </button>
          </p>
        </div>

        <div className="mt-6 text-center text-xs text-slate-400">
          &copy; {new Date().getFullYear()} {APP_NAME}. Hak cipta dilindungi.
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
