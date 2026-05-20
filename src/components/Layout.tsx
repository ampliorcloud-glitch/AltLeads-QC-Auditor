import React, { useState } from 'react';
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
  ShieldCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function AppLayout() {
  const { user, userRole, setUser, setUserRole } = useAuthStore();
  const location = useLocation();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setIsCollapsed(prev => {
      localStorage.setItem('sidebar_collapsed', String(!prev));
      return !prev;
    });
  };

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
      <div className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white shadow-[4px_0_24px_rgba(0,0,0,0.02)] flex flex-col z-10 transition-all duration-300 relative border-r border-[#E5E7EB]`}>
        {/* Sidebar Header & Toggle */}
        <div className="h-20 flex items-center px-6 justify-between border-b border-[#F1F3F5]">
          <div className="flex items-center overflow-hidden">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <span className="font-display font-bold text-xl tracking-tight ml-3 text-black">
                AltLeads
              </span>
            )}
          </div>
          
          <button 
            type="button"
            onClick={toggleSidebar} 
            className={`p-1.5 hover:bg-[#F1F3F5] rounded-xl text-[#6B7280] hover:text-black transition-all ${isCollapsed ? 'mx-auto mt-1' : ''}`}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
        
        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto py-6">
          <ul className="space-y-2 px-3">
            {navigation.map((item) => {
              if (item.adminOnly && userRole !== 'Admin') return null;
              
              const isActive = location.pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`flex items-center py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      isCollapsed ? 'justify-center px-0' : 'px-4'
                    } ${
                      isActive 
                        ? 'bg-black text-white shadow-[0_4px_14px_0_rgba(0,0,0,0.15)]' 
                        : 'text-[#6B7280] hover:bg-[#F8F9FA] hover:text-black'
                    }`}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <item.icon className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'} ${isActive ? 'text-white' : 'text-[#6B7280]'}`} />
                    {!isCollapsed && (
                      <span className="font-display">
                        {item.name}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Card & Logout Footer */}
        <div className={`${isCollapsed ? 'p-2' : 'p-4'} mt-auto border-t border-[#F1F3F5]`}>
          <div className={`p-3 rounded-2xl bg-[#F8F9FA] border border-[#E5E7EB] flex flex-col ${isCollapsed ? 'items-center gap-3' : 'gap-3'}`}>
            <div className="flex items-center">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-black to-gray-700 flex items-center justify-center text-white font-display font-bold shadow-sm flex-shrink-0">
                {user?.displayName?.charAt(0) || 'A'}
              </div>
              {!isCollapsed && (
                <div className="ml-3 overflow-hidden">
                  <p className="text-sm font-bold font-display truncate text-black">{user?.displayName || 'Admin User'}</p>
                  <p className="text-xs text-[#6B7280] font-medium truncate">{userRole || 'Admin'}</p>
                </div>
              )}
            </div>
            
            <button
              onClick={handleLogout}
              className={`flex items-center justify-center font-bold text-black hover:bg-black/5 rounded-lg transition-all ${
                isCollapsed ? 'p-2 w-9 h-9 border border-[#E5E7EB] bg-white shadow-sm' : 'w-full px-3 py-2 text-xs border border-[#E5E7EB] bg-white shadow-sm'
              }`}
              title="Sign Out"
            >
              <LogOut className={`w-3.5 h-3.5 ${isCollapsed ? '' : 'mr-2'}`} />
              {!isCollapsed && "Sign Out"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 flex items-center px-10 border-b border-[#F1F3F5] bg-white">
          <h1 className="text-2xl font-display font-bold text-black tracking-tight">
            {navigation.find(n => n.href === location.pathname)?.name || 'Dashboard'}
          </h1>
        </header>
        <main className="flex-1 overflow-y-auto px-10 py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
