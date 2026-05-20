import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Sparkles, 
  RefreshCw, 
  Trash2, 
  ShieldCheck, 
  CheckCircle2, 
  ToggleLeft, 
  ToggleRight,
  Database,
  Building,
  Activity,
  Key
} from 'lucide-react';
import { 
  getWorkspaceSettings, 
  saveWorkspaceSettings, 
  SettingsData as FirestoreSettingsData 
} from '../lib/firestoreService';

const DEFAULT_SETTINGS: FirestoreSettingsData = {
  companyName: 'AltLeads',
  companyOffering: 'Enterprise coaching, leadership modules, and sales reduction ramp solutions.',
  slaThreshold: 7.0,
  enableRoleResolution: true,
  modelTier: 'standard',
  scoringWeights: {
    greeting: 20,
    discovery: 20,
    valueProp: 20,
    objectionHandling: 20,
    closing: 20
  }
};

export default function Settings() {
  const [settings, setSettings] = useState<FirestoreSettingsData>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'standards' | 'profile' | 'system'>('standards');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const fetched = await getWorkspaceSettings();
        if (fetched) {
          setSettings(fetched);
        } else {
          // If no workspace settings, create initial default doc
          await saveWorkspaceSettings(DEFAULT_SETTINGS);
          setSettings(DEFAULT_SETTINGS);
        }
      } catch (err) {
        console.error('Failed to load shared workspace settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaveError(null);
      await saveWorkspaceSettings(settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to save settings to Firestore:', err);
      setSaveError('Failed to update workspace configuration in Firestore.');
    }
  };

  const handleResetCache = () => {
    if (window.confirm('Are you sure you want to delete all audited calls from the workspace? This action is permanent.')) {
      // Clear localStorage cache and direct reload
      localStorage.removeItem('callAudits');
      window.location.reload();
    }
  };

  const updateWeight = (key: keyof FirestoreSettingsData['scoringWeights'], val: number) => {
    setSettings(prev => {
      const updatedWeights = { ...prev.scoringWeights, [key]: val };
      return { ...prev, scoringWeights: updatedWeights };
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="w-12 h-12 border-4 border-[#F1F3F5] border-t-black rounded-full animate-spin"></div>
        <p className="text-[#6B7280] font-bold font-display text-lg">Loading shared workspace calibration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="bg-white p-8 rounded-3xl border border-[#E5E7EB] shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-black tracking-tight flex items-center gap-2">
            <Sliders className="w-6 h-6 text-black" />
            Workspace Calibration
          </h2>
          <p className="text-[#6B7280] mt-1.5 font-medium">
            Customize scoring parameters, business details, and model evaluation constraints in Firestore for all users.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {saveSuccess && (
            <div className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 flex items-center gap-2 animate-bounce">
              <CheckCircle2 className="w-3.5 h-3.5" /> Workspace Config Saved
            </div>
          )}
          {saveError && (
            <div className="text-xs font-semibold text-rose-600 bg-rose-50 px-4 py-2 rounded-xl border border-rose-100 flex items-center gap-2">
              {saveError}
            </div>
          )}
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex gap-2 p-1 bg-[#F1F3F5] rounded-2xl w-full max-w-md">
        <button
          onClick={() => setActiveTab('standards')}
          className={`flex-1 py-2 px-3 text-sm font-bold font-display rounded-xl transition-all ${activeTab === 'standards' ? 'bg-white text-black shadow-sm' : 'text-[#6B7280] hover:text-black'}`}
        >
          Scoring Standards
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-2 px-3 text-sm font-bold font-display rounded-xl transition-all ${activeTab === 'profile' ? 'bg-white text-black shadow-sm' : 'text-[#6B7280] hover:text-black'}`}
        >
          Company Profile
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`flex-1 py-2 px-3 text-sm font-bold font-display rounded-xl transition-all ${activeTab === 'system' ? 'bg-white text-black shadow-sm' : 'text-[#6B7280] hover:text-black'}`}
        >
          System Tools
        </button>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-[#E5E7EB] overflow-hidden shadow-sm">
        <div className="p-8 space-y-8">
          {activeTab === 'standards' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold font-display text-black flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#6B7280]" />
                  Quality Benchmarks
                </h3>
                <p className="text-xs text-[#6B7280] font-medium mt-1">Specify target score metrics and dimension weighting factors.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div>
                  <label className="block text-sm font-bold text-black font-display mb-2">Target SLA Score (1.0 - 10.0)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    min="1.0" 
                    max="10.0"
                    value={settings.slaThreshold}
                    onChange={(e) => setSettings(prev => ({ ...prev, slaThreshold: parseFloat(e.target.value) || 7.0 }))}
                    className="w-full bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-black focus:bg-white text-black font-mono"
                  />
                  <p className="text-xs text-[#6B7280] mt-1.5 font-medium">Calls with scores below this limit trigger alerts in the dashboard logs.</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-black font-display mb-2">Evaluation Model Environment</label>
                  <select
                    value={settings.modelTier}
                    onChange={(e) => setSettings(prev => ({ ...prev, modelTier: e.target.value as any }))}
                    className="w-full bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-black focus:bg-white text-black"
                  >
                    <option value="standard">Gemini 3.5 Flash (Optimized Speed)</option>
                    <option value="advanced">Gemini 1.5 Pro (Extreme Precision)</option>
                    <option value="quantum">Gemini Experimental Cognitive</option>
                  </select>
                  <p className="text-xs text-[#6B7280] mt-1.5 font-medium">Default server selection matches current container specifications.</p>
                </div>
              </div>

              {/* Multi-speaker resolution toggle */}
              <div className="flex justify-between items-center py-4 border-t border-b border-[#F1F3F5] mt-6">
                <div>
                  <h4 className="text-sm font-bold text-black font-display">Automated Role Resolution</h4>
                  <p className="text-xs text-[#6B7280] mt-0.5 font-medium">Use high-cognitive intelligence to separate Speaker A/B into Agent and Prospect roles.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings(prev => ({ ...prev, enableRoleResolution: !prev.enableRoleResolution }))}
                  className="text-black hover:opacity-80 transition-all focus:outline-none"
                >
                  {settings.enableRoleResolution ? (
                    <ToggleRight className="w-12 h-12 text-black" />
                  ) : (
                    <ToggleLeft className="w-12 h-12 text-[#6B7280]" />
                  )}
                </button>
              </div>

              {/* Weight Distribution */}
              <div className="space-y-4 pt-3">
                <h4 className="text-sm font-bold text-black font-display">Quality Pillars Priority Weighting (%)</h4>
                <p className="text-xs text-[#6B7280] font-medium">Adjust specific weight focus for scoring balances. Total should ideally sum to 100%.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-2">
                  {Object.keys(settings.scoringWeights).map((pillarKey) => (
                    <div key={pillarKey} className="bg-[#F8F9FA] p-4 rounded-2xl border border-[#E5E7EB] text-center">
                      <span className="text-xs font-bold font-display uppercase tracking-wider text-[#6B7280] block mb-2">{pillarKey}</span>
                      <input 
                        type="number"
                        min="0"
                        max="100"
                        value={(settings.scoringWeights as any)[pillarKey]}
                        onChange={(e) => updateWeight(pillarKey as any, parseInt(e.target.value) || 0)}
                        className="w-20 bg-white border border-[#E5E7EB] rounded-lg px-2 py-1.5 text-center text-sm font-bold text-black font-mono focus:outline-none focus:ring-1 focus:ring-black"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold font-display text-black flex items-center gap-2">
                  <Building className="w-5 h-5 text-[#6B7280]" />
                  Sales Context Profiles
                </h3>
                <p className="text-xs text-[#6B7280] font-medium mt-1">Specify product guidelines to feed into AI evaluation audits.</p>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-sm font-bold text-black font-display mb-2">Corporate Enterprise Name</label>
                  <input 
                    type="text" 
                    value={settings.companyName}
                    onChange={(e) => setSettings(prev => ({ ...prev, companyName: e.target.value }))}
                    className="w-full bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-black focus:bg-white text-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-black font-display mb-2">Core Product Offerings & Brand Keywords</label>
                  <textarea 
                    value={settings.companyOffering}
                    onChange={(e) => setSettings(prev => ({ ...prev, companyOffering: e.target.value }))}
                    rows={4}
                    className="w-full bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-black focus:bg-white text-black"
                  />
                  <p className="text-xs text-[#6B7280] mt-1.5 font-medium">This description establishes brand identification for the audit parser.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold font-display text-black flex items-center gap-2">
                  <Database className="w-5 h-5 text-[#6B7280]" />
                  Local Cache & Diagnostics
                </h3>
                <p className="text-xs text-[#6B7280] font-medium mt-1">Reset call history index, manage workspace memory, and review system configuration.</p>
              </div>

              {/* Shared Gemini Api Key section */}
              <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-black font-display flex items-center gap-2">
                  <Key className="w-4 h-4 text-[#6B7280]" /> Workspace Shared Gemini API Key
                </h4>
                <div>
                  <input 
                    type="password" 
                    placeholder="Enter your custom Gemini API key (e.g. AIzaSy...)"
                    value={settings.geminiApiKey || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, geminiApiKey: e.target.value }))}
                    className="w-full bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-black focus:bg-white text-black font-mono shadow-sm"
                  />
                  <p className="text-xs text-[#6B7280] mt-1.5 font-medium leading-relaxed">
                    If defined, this key is securely stored in your shared workspace Firestore database so other team members can also utilize it. If left empty, the application will fallback to the default workspace system API key.
                  </p>
                </div>
              </div>

              <div className="bg-[#FFF5F5] p-6 rounded-2xl border border-[#FEE2E2]">
                <h4 className="text-[14px] font-bold text-red-700 font-display flex items-center gap-2">
                  <Trash2 className="w-4 h-4" /> Danger Zone: Reset Call Audits
                </h4>
                <p className="text-xs text-red-600 font-medium mt-1 leading-relaxed">
                  Clear all analyzed audio files, custom-tracked scores, summaries, and logs stored in local web storage. Restores default system demonstration audio items immediately.
                </p>
                <button
                  type="button"
                  onClick={handleResetCache}
                  className="mt-4 flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition-all shadow-md cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Force Clean Cache & Reset Default Audits
                </button>
              </div>

              <div className="bg-[#F8F9FA] p-6 rounded-2xl border border-[#E5E7EB]">
                <h4 className="text-sm font-bold text-black font-display flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> System Environment
                </h4>
                <div className="grid grid-cols-2 gap-4 mt-3 text-xs font-mono text-[#6B7280] font-medium">
                  <div>Vite Bundler Channel: <span className="text-black">6.2.0</span></div>
                  <div>React Rendering Context: <span className="text-black font-semibold">React 19.x</span></div>
                  <div>Firestore Core Cache Sync: <span className="text-black font-semibold">Enabled</span></div>
                  <div>Gateway Interface Status: <span className="text-emerald-600 font-semibold">Active (Port 3000)</span></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Form Action Controls */}
        <div className="bg-[#F8F9FA] px-8 py-5 flex justify-end gap-3 border-t border-[#F1F3F5]">
          <button
            type="button"
            onClick={() => setSettings(DEFAULT_SETTINGS)}
            className="px-5 py-2.5 text-sm font-bold font-display rounded-xl text-[#6B7280] hover:text-black hover:bg-[#F1F3F5] transition-all focus:outline-none"
          >
            Reset Settings to Default
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 text-sm font-bold font-display bg-black hover:bg-[#1F2937] text-white rounded-xl transition-all shadow-md focus:outline-none"
          >
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}
