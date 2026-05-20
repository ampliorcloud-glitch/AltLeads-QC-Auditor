import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, setDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import { 
  ShieldCheck, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Plus, 
  Search,
  UserCheck,
  UserX,
  Mail,
  X
} from 'lucide-react';

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  role: 'Admin' | 'TL' | 'QC_Manager' | 'Viewer';
  status: 'Active' | 'Inactive';
  createdAt?: any;
  lastLogin?: any;
}

const SAMPLE_USERS: UserData[] = [
  {
    uid: 'user_sample_1',
    email: 'admin@altleads.com',
    displayName: 'Admin User',
    role: 'Admin',
    status: 'Active',
    createdAt: { seconds: Date.now() / 1000 }
  },
  {
    uid: 'user_sample_2',
    email: 'manager@altleads.com',
    displayName: 'QC Manager',
    role: 'QC_Manager',
    status: 'Active',
    createdAt: { seconds: Date.now() / 1000 - 86400 }
  },
  {
    uid: 'user_sample_3',
    email: 'tl@altleads.com',
    displayName: 'Team Lead',
    role: 'TL',
    status: 'Active',
    createdAt: { seconds: Date.now() / 1000 - 172800 }
  },
  {
    uid: 'user_sample_4',
    email: 'viewer@altleads.com',
    displayName: 'Viewer User',
    role: 'Viewer',
    status: 'Inactive',
    createdAt: { seconds: Date.now() / 1000 - 259200 }
  }
];

export default function Users() {
  const { userRole } = useAuthStore();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<Partial<UserData>>({
    email: '',
    displayName: '',
    role: 'Viewer',
    status: 'Active'
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'users'), orderBy('displayName'));
      const querySnapshot = await getDocs(q);
      const usersData: UserData[] = [];
      querySnapshot.forEach((doc) => {
        usersData.push({ uid: doc.id, ...doc.data() } as UserData);
      });
      
      if (usersData.length === 0) {
        setUsers(SAMPLE_USERS);
      } else {
        setUsers(usersData);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers(SAMPLE_USERS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenModal = (user?: UserData) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        status: user.status
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        displayName: '',
        role: 'Viewer',
        status: 'Active'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Update existing user
        try {
          if (!editingUser.uid.startsWith('user_sample_')) {
            const userRef = doc(db, 'users', editingUser.uid);
            await updateDoc(userRef, {
              role: formData.role,
              status: formData.status,
              displayName: formData.displayName
            });
          }
        } catch (error) {
          console.warn("Firestore error, updating local state only", error);
        }
        
        const updatedUsers = users.map(u => 
          u.uid === editingUser.uid ? { ...u, ...formData } as UserData : u
        );
        setUsers(updatedUsers);
      } else {
        const newUid = `user_${Date.now()}`;
        const newUser = {
          uid: newUid,
          email: formData.email,
          displayName: formData.displayName,
          role: formData.role,
          status: formData.status,
          createdAt: new Date()
        } as UserData;
        
        try {
          await setDoc(doc(db, 'users', newUid), {
            email: formData.email,
            displayName: formData.displayName,
            role: formData.role,
            status: formData.status,
            createdAt: new Date()
          });
        } catch (error) {
          console.warn("Firestore error, adding to local state only", error);
        }
        
        setUsers([...users, newUser]);
      }
      handleCloseModal();
    } catch (error) {
      console.error("Error saving user:", error);
    }
  };

  const handleDelete = async (uid: string) => {
    if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      try {
        if (!uid.startsWith('user_sample_')) {
          try {
            await deleteDoc(doc(db, 'users', uid));
          } catch (error) {
            console.warn("Firestore error, deleting from local state only", error);
          }
        }
        setUsers(users.filter(u => u.uid !== uid));
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  const filteredUsers = users.filter(u => 
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (userRole !== 'Admin') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-[#6B7280] bg-white rounded-3xl shadow-sm p-10">
        <ShieldCheck className="w-16 h-16 mb-4 text-[#E5E7EB]" />
        <h2 className="text-2xl font-display font-bold text-black tracking-tight">Access Denied</h2>
        <p className="mt-2 font-medium">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header Actions */}
      <div className="flex justify-between items-center mb-8">
        <div className="relative w-80">
          <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-[#6B7280]" />
          <input 
            type="text" 
            placeholder="Search users..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border-none rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] focus:outline-none focus:ring-2 focus:ring-black font-medium text-[#111827] placeholder:text-[#9CA3AF] transition-all"
          />
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-black hover:bg-[#1F2937] text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-[0_4px_14px_0_rgb(0,0,0,0.2)]"
        >
          <Plus className="w-5 h-5" />
          Add User
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[15px] text-[#111827]">
            <thead className="bg-[#F8F9FA] text-[#6B7280] font-display font-bold uppercase tracking-widest text-xs">
              <tr>
                <th className="px-8 py-5">User</th>
                <th className="px-8 py-5">Role</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5">Joined</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F3F5]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-[#6B7280]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-[#6B7280] font-medium">
                    No users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.uid} className="hover:bg-[#F8F9FA] transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#F1F3F5] text-black flex items-center justify-center font-display font-bold text-lg shadow-sm">
                          {user.displayName?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className="font-bold font-display text-black text-base">{user.displayName || 'Unnamed User'}</div>
                          <div className="text-sm text-[#6B7280] flex items-center gap-1.5 mt-0.5 font-medium">
                            <Mail className="w-3.5 h-3.5" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold font-display uppercase tracking-wider
                        ${user.role === 'Admin' ? 'bg-black text-white' : 
                          user.role === 'QC_Manager' ? 'bg-blue-50 text-blue-700' : 
                          user.role === 'TL' ? 'bg-emerald-50 text-emerald-700' : 
                          'bg-[#F1F3F5] text-[#6B7280]'}`}
                      >
                        {user.role?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        {user.status === 'Active' ? (
                          <><UserCheck className="w-4 h-4 text-emerald-500" /> <span className="text-emerald-700 font-bold text-sm">Active</span></>
                        ) : (
                          <><UserX className="w-4 h-4 text-[#9CA3AF]" /> <span className="text-[#6B7280] font-bold text-sm">Inactive</span></>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-[#6B7280] font-medium text-sm">
                      {user.createdAt ? new Date(user.createdAt?.seconds * 1000).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenModal(user)}
                          className="p-2 text-[#6B7280] hover:text-black hover:bg-[#F1F3F5] rounded-xl transition-all"
                          title="Edit User"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(user.uid)}
                          className="p-2 text-[#6B7280] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="px-8 py-6 flex justify-between items-center">
              <h3 className="text-2xl font-display font-bold text-black tracking-tight">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h3>
              <button onClick={handleCloseModal} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F1F3F5] text-[#6B7280] hover:bg-black hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 pt-2 space-y-5">
              <div>
                <label className="block text-sm font-bold font-display text-black mb-2">Display Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.displayName}
                  onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                  className="w-full px-4 py-3 bg-[#F8F9FA] border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-black font-medium text-[#111827] transition-all"
                  placeholder="John Doe"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold font-display text-black mb-2">Email Address</label>
                <input 
                  type="email" 
                  required
                  disabled={!!editingUser}
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className={`w-full px-4 py-3 bg-[#F8F9FA] border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-black font-medium transition-all ${editingUser ? 'text-[#9CA3AF] cursor-not-allowed' : 'text-[#111827]'}`}
                  placeholder="john@example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold font-display text-black mb-2">Role</label>
                  <select 
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                    className="w-full px-4 py-3 bg-[#F8F9FA] border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-black font-medium text-[#111827] transition-all appearance-none"
                  >
                    <option value="Viewer">Viewer</option>
                    <option value="TL">Team Lead</option>
                    <option value="QC_Manager">QC Manager</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-bold font-display text-black mb-2">Status</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                    className="w-full px-4 py-3 bg-[#F8F9FA] border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-black font-medium text-[#111827] transition-all appearance-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-3 text-[#6B7280] hover:text-black hover:bg-[#F1F3F5] font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-3 bg-black hover:bg-[#1F2937] text-white font-bold rounded-xl transition-all shadow-[0_4px_14px_0_rgb(0,0,0,0.2)]"
                >
                  {editingUser ? 'Save Changes' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
