import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { 
  LayoutDashboard, 
  Users, 
  FolderKanban, 
  UploadCloud, 
  BarChart3, 
  Settings,
  LogOut,
  ShieldCheck
} from 'lucide-react';

export default function AppLayout() {
  const { user, userRole, setUser, setUserRole } = useAuthStore();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setUserRole(null);
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Upload Audits', href: '/upload', icon: UploadCloud },
    { name: 'Projects', href: '/projects', icon: FolderKanban },
    { name: 'Agents', href: '/agents', icon: Users },
    { name: 'Users', href: '/users', icon: ShieldCheck, adminOnly: true },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-[#F1F3F5] text-[#111827] font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-[4px_0_24px_rgba(0,0,0,0.02)] flex flex-col z-10">
        <div className="h-20 flex items-center px-8">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center mr-3">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">AltLeads</span>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6">
          <ul className="space-y-2 px-4">
            {navigation.map((item) => {
              if (item.adminOnly && userRole !== 'Admin') return null;
              
              const isActive = location.pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive 
                        ? 'bg-black text-white shadow-md' 
                        : 'text-[#6B7280] hover:bg-[#F8F9FA] hover:text-black'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-[#6B7280]'}`} />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-6">
          <div className="glass-panel rounded-2xl p-4 mb-4">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-display font-bold shadow-sm">
                {user?.displayName?.charAt(0) || 'A'}
              </div>
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-bold font-display truncate text-black">{user?.displayName || 'Admin User'}</p>
                <p className="text-xs text-[#6B7280] font-medium truncate">{userRole || 'Admin'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center w-full px-3 py-2 text-xs font-bold text-black bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 flex items-center px-10">
          <h1 className="text-2xl font-display font-bold text-black tracking-tight">
            {navigation.find(n => n.href === location.pathname)?.name || 'Dashboard'}
          </h1>
        </header>
        <main className="flex-1 overflow-y-auto px-10 pb-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
