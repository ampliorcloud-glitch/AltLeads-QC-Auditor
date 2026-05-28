import React, { useState, useEffect } from 'react';
import { 
  Users as UsersIcon, 
  Search, 
  Plus, 
  Edit2, 
  Trash2,
  PhoneCall,
  Star,
  X
} from 'lucide-react';

interface AgentData {
  id: string;
  name: string;
  email: string;
  campaign: string;
  status: 'Active' | 'Inactive';
  createdAt?: any;
}

const SAMPLE_AGENTS: AgentData[] = [
  {
    id: 'agent_sample_1',
    name: 'Sarah Jenkins',
    email: 'sarah.j@altleads.com',
    status: 'Active',
    campaign: 'Q3 B2B Tech Outreach',
    createdAt: new Date()
  },
  {
    id: 'agent_sample_2',
    name: 'Michael Chen',
    email: 'michael.c@altleads.com',
    status: 'Active',
    campaign: 'Healthcare Inbound 2024',
    createdAt: new Date()
  },
  {
    id: 'agent_sample_3',
    name: 'David Rodriguez',
    email: 'david.r@altleads.com',
    status: 'Inactive',
    campaign: 'Legacy Reactivation',
    createdAt: new Date()
  },
  {
    id: 'agent_sample_4',
    name: 'Emily Watson',
    email: 'emily.w@altleads.com',
    status: 'Active',
    campaign: 'Q3 B2B Tech Outreach',
    createdAt: new Date()
  }
];

export default function Agents() {
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AgentData | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<Partial<AgentData>>({
    name: '',
    email: '',
    campaign: '',
    status: 'Active'
  });

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const saved = localStorage.getItem('local_agents');
      if (saved) {
        try {
          setAgents(JSON.parse(saved));
        } catch (e) {
          setAgents(SAMPLE_AGENTS);
        }
      } else {
        setAgents(SAMPLE_AGENTS);
        localStorage.setItem('local_agents', JSON.stringify(SAMPLE_AGENTS));
      }
    } catch (error) {
      console.error("Error fetching agents:", error);
      setAgents(SAMPLE_AGENTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleOpenModal = (agent?: AgentData) => {
    if (agent) {
      setEditingAgent(agent);
      setFormData({
        name: agent.name,
        email: agent.email,
        campaign: agent.campaign,
        status: agent.status
      });
    } else {
      setEditingAgent(null);
      setFormData({
        name: '',
        email: '',
        campaign: '',
        status: 'Active'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAgent(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAgent) {
        const updatedAgents = agents.map(a => 
          a.id === editingAgent.id ? { ...a, ...formData } as AgentData : a
        );
        setAgents(updatedAgents);
        localStorage.setItem('local_agents', JSON.stringify(updatedAgents));
      } else {
        const newId = `agent_${Date.now()}`;
        const newAgent = {
          id: newId,
          name: formData.name,
          email: formData.email,
          campaign: formData.campaign,
          status: formData.status,
          createdAt: new Date()
        } as AgentData;
        
        const updatedAgents = [...agents, newAgent];
        setAgents(updatedAgents);
        localStorage.setItem('local_agents', JSON.stringify(updatedAgents));
      }
      handleCloseModal();
    } catch (error) {
      console.error("Error saving agent:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this agent?")) {
      try {
        const updatedAgents = agents.filter(a => a.id !== id);
        setAgents(updatedAgents);
        localStorage.setItem('local_agents', JSON.stringify(updatedAgents));
      } catch (error) {
        console.error("Error deleting agent:", error);
      }
    }
  };

  const filteredAgents = agents.filter(a => 
    a.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.campaign?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate some mock stats for the cards
  const getMockStats = (id: string) => {
    // Deterministic mock stats based on ID string length/chars
    const num = id.length + id.charCodeAt(id.length - 1);
    return {
      calls: 120 + (num % 50),
      score: 85 + (num % 14)
    };
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header Actions */}
      <div className="flex justify-between items-center mb-8">
        <div className="relative w-80">
          <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-[#6B7280]" />
          <input 
            type="text" 
            placeholder="Search agents..." 
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
          Add Agent
        </button>
      </div>

      {/* Agents Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <UsersIcon className="w-16 h-16 text-[#E5E7EB] mx-auto mb-4" />
          <h3 className="text-2xl font-display font-bold text-black tracking-tight">No agents found</h3>
          <p className="text-[#6B7280] mt-2 font-medium">Get started by adding a new agent.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent) => {
            const stats = getMockStats(agent.id);
            return (
              <div key={agent.id} className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all p-8 group relative overflow-hidden">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#F1F3F5] text-black flex items-center justify-center font-display font-bold text-xl shadow-sm">
                      {agent.name?.charAt(0) || 'A'}
                    </div>
                    <div>
                      <h3 className="font-bold font-display text-black text-lg">{agent.name}</h3>
                      <p className="text-sm text-[#6B7280] font-medium mt-0.5">{agent.email}</p>
                    </div>
                  </div>
                </div>
                
                <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleOpenModal(agent)}
                    className="p-2 text-[#6B7280] hover:text-black hover:bg-[#F1F3F5] rounded-xl transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(agent.id)}
                    className="p-2 text-[#6B7280] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#6B7280] font-bold font-display uppercase tracking-wider text-xs">Campaign</span>
                    <span className="font-bold text-black">{agent.campaign || 'Unassigned'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#6B7280] font-bold font-display uppercase tracking-wider text-xs">Status</span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold font-display uppercase tracking-wider ${
                      agent.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-[#F1F3F5] text-[#6B7280]'
                    }`}>
                      {agent.status}
                    </span>
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-[#F1F3F5] grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-display font-bold text-black">{stats.calls}</div>
                    <div className="text-[10px] font-bold font-display uppercase tracking-widest text-[#6B7280] mt-2 flex items-center justify-center gap-1.5">
                      <PhoneCall className="w-3.5 h-3.5" /> Audits
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-display font-bold text-black">{stats.score}</div>
                    <div className="text-[10px] font-bold font-display uppercase tracking-widest text-[#6B7280] mt-2 flex items-center justify-center gap-1.5">
                      <Star className="w-3.5 h-3.5" /> Avg Score
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="px-8 py-6 flex justify-between items-center">
              <h3 className="text-2xl font-display font-bold text-black tracking-tight">
                {editingAgent ? 'Edit Agent' : 'Add New Agent'}
              </h3>
              <button onClick={handleCloseModal} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F1F3F5] text-[#6B7280] hover:bg-black hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 pt-2 space-y-5">
              <div>
                <label className="block text-sm font-bold font-display text-black mb-2">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 bg-[#F8F9FA] border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-black font-medium text-[#111827] transition-all"
                  placeholder="Jane Smith"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold font-display text-black mb-2">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 bg-[#F8F9FA] border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-black font-medium text-[#111827] transition-all"
                  placeholder="jane@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-bold font-display text-black mb-2">Campaign / Project</label>
                <input 
                  type="text" 
                  value={formData.campaign}
                  onChange={(e) => setFormData({...formData, campaign: e.target.value})}
                  className="w-full px-4 py-3 bg-[#F8F9FA] border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-black font-medium text-[#111827] transition-all"
                  placeholder="e.g. B2B Tech Leads"
                />
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
                  {editingAgent ? 'Save Changes' : 'Add Agent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
