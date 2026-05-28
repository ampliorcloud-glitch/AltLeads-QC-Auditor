import React from 'react';
import { useAuthStore } from '../store/authStore';
import { LogIn, ShieldCheck } from 'lucide-react';

export default function Login() {
  const { setUser, setUserRole, setLoading } = useAuthStore();
  const [error, setError] = React.useState('');

  const handleLogin = async () => {
    try {
      setError('');
      setLoading(true);
      // Clean mock local user bypassing remote auth completely
      const mockUser = {
        uid: 'dev-admin',
        email: 'dev@example.com',
        displayName: 'Dev Admin'
      };
      
      setUser(mockUser as any);
      setUserRole('Admin');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F3F5] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-black rounded-2xl flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="mt-8 text-center text-4xl font-display font-bold text-black tracking-tight">
          AltLeads-QC
        </h2>
        <p className="mt-2 text-center text-sm font-medium text-[#6B7280] uppercase tracking-widest">
          Lead Quality Assurance Platform v2.0
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:rounded-3xl sm:px-12">
          {error && (
            <div className="mb-6 bg-rose-50 border-none text-rose-600 px-4 py-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}
          
          <button
            onClick={handleLogin}
            className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-[0_4px_14px_0_rgb(0,0,0,0.2)] text-sm font-bold text-white bg-black hover:bg-[#1F2937] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all"
          >
            <LogIn className="w-5 h-5 mr-2" />
            Sign in with Google
          </button>
          
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#F1F3F5]" />
              </div>
              <div className="relative flex justify-center text-xs font-bold font-display uppercase tracking-widest">
                <span className="px-4 bg-white text-[#9CA3AF]">
                  Local Sandbox Access Protocol
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
