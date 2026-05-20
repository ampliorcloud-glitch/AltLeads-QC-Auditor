import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  FileAudio, 
  Award, 
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { 
  subscribeToCallAudits, 
  CallAudit 
} from '../lib/firestoreService';

const QUALITY_CRITERIA_KEYS = [
  { key: 'greeting', label: 'Greeting' },
  { key: 'discovery', label: 'Discovery' },
  { key: 'valueProp', label: 'Value Prop' },
  { key: 'objectionHandling', label: 'Objections' },
  { key: 'closing', label: 'Closing' }
];

export default function Analytics() {
  const [audits, setAudits] = useState<CallAudit[]>(() => {
    const saved = localStorage.getItem('callAudits');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.filter((a: any) => a.status === 'completed');
      } catch (e) {
        console.error('Failed to parse cached analytics backup', e);
      }
    }
    return [];
  });
  const [loading, setLoading] = useState(audits.length === 0);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 3500);

    const unsubscribe = subscribeToCallAudits((fetchedAudits) => {
      clearTimeout(timeoutId);
      const completedOnly = fetchedAudits.filter((a) => a.status === 'completed');
      setAudits(completedOnly);
      
      try {
        localStorage.setItem('callAudits', JSON.stringify(fetchedAudits));
      } catch (e) {
        console.error('Failed to save to local storage cache', e);
      }
      
      setLoading(false);
    }, (error) => {
      console.error('Failed to stream real-time audits for analytics:', error);
      clearTimeout(timeoutId);
      setLoading(false);
    });
    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="w-12 h-12 border-4 border-[#F1F3F5] border-t-black rounded-full animate-spin"></div>
        <p className="text-[#6B7280] font-bold font-display text-lg">Assembling real-time behavioral insights...</p>
      </div>
    );
  }

  // Compute stats
  const totalCalls = audits.length;
  const avgOverallScore = totalCalls > 0
    ? Number((audits.reduce((acc, a) => acc + (a.overallScore || 0), 0) / totalCalls).toFixed(1))
    : 0;

  // Compute pillar averages
  const pillarAverages = QUALITY_CRITERIA_KEYS.map(pillar => {
    let totalScore = 0;
    let count = 0;
    audits.forEach(audit => {
      if (audit.scores && typeof (audit.scores as any)[pillar.key] === 'number') {
        totalScore += (audit.scores as any)[pillar.key];
        count++;
      }
    });
    return {
      pillar: pillar.label,
      score: count > 0 ? Number((totalScore / count).toFixed(1)) : 0
    };
  });

  // Find top pillar & poorest pillar
  const sortedPillars = [...pillarAverages].sort((a, b) => b.score - a.score);
  const topPillar = sortedPillars[0] || { pillar: 'None', score: 0 };
  const lowestPillar = sortedPillars[sortedPillars.length - 1] || { pillar: 'None', score: 0 };

  // Trend data grouped by date
  const trendData = [...audits]
    .sort((a, b) => a.timestamp - b.timestamp)
    .map(audit => ({
      name: new Date(audit.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      score: audit.overallScore || 0,
      filename: audit.filename
    }));

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Header and overview explanation */}
      <div className="bg-white p-8 rounded-3xl border border-[#E5E7EB] shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-black tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-black" />
            Performance Insights
          </h2>
          <p className="text-[#6B7280] mt-1.5 font-medium">
            Real-time aggregate grading, dimension scoring, and behavioral agent analytics.
          </p>
        </div>
        <div className="text-xs font-mono font-medium text-black bg-[#F1F3F5] px-4 py-2 rounded-xl border border-[#E5E7EB] flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5" />
          Last 30 Days Activity
        </div>
      </div>

      {/* Grid of Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] hover:shadow-lg transition-all">
          <div className="w-10 h-10 bg-[#F8F9FA] rounded-xl flex items-center justify-center mb-4 border border-[#E5E7EB]">
            <FileAudio className="w-5 h-5 text-black" />
          </div>
          <div className="text-[#6B7280] text-xs font-bold uppercase tracking-wider font-display">Reviewed Calls</div>
          <div className="text-3xl font-black text-black mt-2 font-display">{totalCalls}</div>
          <div className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg mt-3 inline-flex items-center gap-1.5 border border-emerald-100">
            <CheckCircle2 className="w-3 h-3" /> Fully Audited
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] hover:shadow-lg transition-all">
          <div className="w-10 h-10 bg-[#F8F9FA] rounded-xl flex items-center justify-center mb-4 border border-[#E5E7EB]">
            <TrendingUp className="w-5 h-5 text-black" />
          </div>
          <div className="text-[#6B7280] text-xs font-bold uppercase tracking-wider font-display">Average Score</div>
          <div className="text-3xl font-black text-black mt-2 font-display">{avgOverallScore}<span className="text-sm font-medium text-[#6B7280]">/10</span></div>
          <div className="text-xs text-black font-semibold bg-[#F1F3F5] px-2.5 py-1 rounded-lg mt-3 inline-block border border-[#E5E7EB]">
            SLA Standard: 7.0
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] hover:shadow-lg transition-all">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-4 border border-emerald-100">
            <Award className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-[#6B7280] text-xs font-bold uppercase tracking-wider font-display">Highest Pillar</div>
          <div className="text-xl font-bold text-black mt-2 truncate font-display">{topPillar.pillar}</div>
          <div className="text-sm font-black text-emerald-600 mt-1">{topPillar.score}<span className="text-xs font-medium text-[#6B7280]">/10 avg</span></div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] hover:shadow-lg transition-all">
          <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center mb-4 border border-rose-100">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
          </div>
          <div className="text-[#6B7280] text-xs font-bold uppercase tracking-wider font-display">Coaching Focus</div>
          <div className="text-xl font-bold text-black mt-2 truncate font-display">{lowestPillar.pillar}</div>
          <div className="text-sm font-black text-rose-500 mt-1">{lowestPillar.score}<span className="text-xs font-medium text-[#6B7280]">/10 avg</span></div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Core Pillars Score Analysis (Radar/Bar view) */}
        <div className="bg-white p-8 rounded-3xl border border-[#E5E7EB] lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold font-display text-black">Quality Pillars Score Evaluation</h3>
              <p className="text-[#6B7280] text-xs font-medium mt-1">Average grades across five core conversational competencies.</p>
            </div>
            <div className="w-3 h-3 bg-black rounded-full" />
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pillarAverages} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F3F5" />
                <XAxis dataKey="pillar" tickLine={false} style={{ fontSize: '12px', fontWeight: 'bold', fontFamily: 'Inter' }} stroke="#6B7280" />
                <YAxis domain={[0, 10]} tickLine={false} style={{ fontSize: '11px', fontFamily: 'monospace' }} stroke="#6B7280" />
                <Tooltip 
                  cursor={{ fill: '#F8F9FA' }}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', fontFamily: 'Inter' }}
                />
                <Bar dataKey="score" name="Average Grade" radius={[8, 8, 0, 0]}>
                  {pillarAverages.map((entry, index) => (
                    <rect
                      key={`rect-${index}`}
                      fill={entry.score >= 8 ? '#10B981' : entry.score >= 6 ? '#F59E0B' : '#EF4444'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Competencies Distribution radar */}
        <div className="bg-white p-8 rounded-3xl border border-[#E5E7EB] flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold font-display text-black">Competency Layout</h3>
            <p className="text-[#6B7280] text-xs font-medium mt-1">Symmetrical strength and weakness projection.</p>
          </div>

          <div className="h-64 w-full flex items-center justify-center py-4">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={pillarAverages}>
                <PolarGrid stroke="#F1F3F5" />
                <PolarAngleAxis dataKey="pillar" tick={{ fill: '#6B7280', fontSize: 10, fontWeight: 'bold' }} />
                <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: '#6B7280', fontSize: 9 }} />
                <Radar name="Performance" dataKey="score" stroke="#000000" fill="#000000" fillOpacity={0.07} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-xs text-[#6B7280] font-medium bg-[#F8F9FA] p-3 rounded-xl border border-[#E5E7EB] text-center">
            Scores reflect verified multi-criteria diagnostics.
          </div>
        </div>
      </div>

      {/* Progress Over Time Line Chart */}
      <div className="bg-white p-8 rounded-3xl border border-[#E5E7EB]">
        <div>
          <h3 className="text-lg font-bold font-display text-black">Individual Call Trend Profile</h3>
          <p className="text-[#6B7280] text-xs font-medium mt-1">Audit timeline showcasing quality variance from session to session.</p>
        </div>

        <div className="h-72 w-full mt-8">
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#111827" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#111827" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F3F5" />
                <XAxis dataKey="name" tickLine={false} style={{ fontSize: '11.5px', fontWeight: 'bold', fontFamily: 'Inter' }} stroke="#6B7280" />
                <YAxis domain={[0, 10]} tickLine={false} style={{ fontSize: '11px', fontFamily: 'monospace' }} stroke="#6B7280" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', fontFamily: 'Inter' }}
                  labelStyle={{ fontWeight: 'bold', color: 'black' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  name="Overall Score" 
                  stroke="#000000" 
                  strokeWidth={3} 
                  dot={{ r: 5, stroke: 'white', strokeWidth: 2, fill: '#000000' }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-[#6B7280] italic">
              Timeline trend maps will automatically populate when calls are analyzed.
            </div>
          )}
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-3xl border border-[#E5E7EB] overflow-hidden">
        <div className="p-8 border-b border-[#F1F3F5]">
          <h3 className="text-lg font-bold font-display text-black">Performance Audit Log</h3>
          <p className="text-[#6B7280] text-xs font-medium mt-1">Breakdown of specific records and their quality dimension metrics.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#F1F3F5] bg-[#F8F9FA] text-xs font-bold uppercase tracking-wider text-[#6B7280] font-display">
                <th className="p-5 pl-8">File Name</th>
                <th className="p-5">Grade</th>
                <th className="p-5 text-center">Greeting</th>
                <th className="p-5 text-center">Discovery</th>
                <th className="p-5 text-center">Value Prop</th>
                <th className="p-5 text-center">Objections</th>
                <th className="p-5 text-center">Closing</th>
                <th className="p-5 pr-8">Date</th>
              </tr>
            </thead>
            <tbody>
              {audits.map((audit) => (
                <tr key={audit.id} className="border-b border-[#F1F3F5] hover:bg-[#F8F9FA]/50 transition-colors text-[14px] font-medium text-black">
                  <td className="p-5 pl-8 font-bold font-display max-w-xs truncate">{audit.filename}</td>
                  <td className="p-5">
                    <span className={`inline-flex items-center justify-center font-display font-black text-xs px-2.5 py-1 rounded-full ${
                      (audit.overallScore || 0) >= 8 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                      (audit.overallScore || 0) >= 6 ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                      'bg-rose-50 text-rose-600 border border-rose-100'
                    }`}>
                      {audit.overallScore || 'N/A'}
                    </span>
                  </td>
                  <td className="p-5 text-center font-mono">
                    <span className={(audit.scores?.greeting || 0) >= 8 ? 'text-emerald-500 font-bold' : (audit.scores?.greeting || 0) >= 6 ? 'text-amber-500' : 'text-rose-500'}>
                      {audit.scores?.greeting ?? '-'}
                    </span>
                  </td>
                  <td className="p-5 text-center font-mono">
                    <span className={(audit.scores?.discovery || 0) >= 8 ? 'text-emerald-500 font-bold' : (audit.scores?.discovery || 0) >= 6 ? 'text-amber-500' : 'text-rose-500'}>
                      {audit.scores?.discovery ?? '-'}
                    </span>
                  </td>
                  <td className="p-5 text-center font-mono">
                    <span className={(audit.scores?.valueProp || 0) >= 8 ? 'text-emerald-500 font-bold' : (audit.scores?.valueProp || 0) >= 6 ? 'text-amber-500' : 'text-rose-500'}>
                      {audit.scores?.valueProp ?? '-'}
                    </span>
                  </td>
                  <td className="p-5 text-center font-mono">
                    <span className={(audit.scores?.objectionHandling || 0) >= 8 ? 'text-emerald-500 font-bold' : (audit.scores?.objectionHandling || 0) >= 6 ? 'text-amber-500' : 'text-rose-500'}>
                      {audit.scores?.objectionHandling ?? '-'}
                    </span>
                  </td>
                  <td className="p-5 text-center font-mono">
                    <span className={(audit.scores?.closing || 0) >= 8 ? 'text-emerald-500 font-bold' : (audit.scores?.closing || 0) >= 6 ? 'text-amber-500' : 'text-rose-500'}>
                      {audit.scores?.closing ?? '-'}
                    </span>
                  </td>
                  <td className="p-5 pr-8 text-[#6B7280] font-medium text-xs font-mono">
                    {new Date(audit.timestamp).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
