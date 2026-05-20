import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  FileAudio, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  BarChart3, 
  MessageSquare, 
  Star,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Menu,
  PlayCircle
} from 'lucide-react';
import { 
  subscribeToCallAudits, 
  createCallAuditDoc, 
  updateCallAuditDoc, 
  deleteCallAuditDoc,
  CallAudit
} from '../lib/firestoreService';

const QUALITY_CRITERIA = [
  { key: 'greeting', label: 'Greeting & Introduction', desc: 'Clarity, brand mention, and rapport.' },
  { key: 'discovery', label: 'Discovery Questions', desc: 'Uncovering pain points and qualifying.' },
  { key: 'valueProp', label: 'Value Proposition', desc: 'Pitching solutions to specific needs.' },
  { key: 'objectionHandling', label: 'Objection Handling', desc: 'Calmness and effective rebuttals.' },
  { key: 'closing', label: 'Closing / Next Steps', desc: 'Call to action and confirmation.' }
];

const SAMPLE_AUDITS: CallAudit[] = [
  {
    id: 'sample-1',
    filename: 'Q3_Enterprise_Pitch_Sarah.mp3',
    status: 'completed',
    timestamp: Date.now() - 86400000,
    overallScore: 8.4,
    scores: {
      greeting: 9,
      discovery: 8,
      valueProp: 9,
      objectionHandling: 7,
      closing: 9
    },
    summary: "I connected with John from Acme Corp. We discussed our enterprise training solutions. He was very interested in the leadership modules but had concerns about implementation time. I asked probing questions about their current timeline and confirmed a follow-up demo for next Tuesday. Key note for senior: They have budget approval for Q4.",
    feedback: [
      "Excellent job tying the value proposition directly to their stated pain points.",
      "Work on pausing after addressing an objection to let the prospect process.",
      "Strong closing with a clear, scheduled next step."
    ],
    transcript: [
      { speaker: 'Agent', text: "Hi John, this is Sarah from AltLeads. How are you doing today?" },
      { speaker: 'Prospect', text: "I'm doing well, thanks. Just a bit busy." },
      { speaker: 'Agent', text: "I completely understand. I'm calling because I noticed Acme Corp is expanding its sales team, and I wanted to share how our training modules have helped similar companies reduce ramp time by 30%." },
      { speaker: 'Prospect', text: "That sounds interesting, but we're really concerned about how long it takes to implement a new system right now." },
      { speaker: 'Agent', text: "That's a valid concern. Our typical implementation takes less than two weeks, and we handle the heavy lifting. What is your ideal timeline for getting the new team up to speed?" }
    ]
  },
  {
    id: 'sample-2',
    filename: 'Inbound_Lead_Tech_Startup.wav',
    status: 'completed',
    timestamp: Date.now() - 172800000,
    overallScore: 6.2,
    scores: {
      greeting: 7,
      discovery: 5,
      valueProp: 6,
      objectionHandling: 5,
      closing: 8
    },
    summary: "Spoke with a founder of a new tech startup. They need basic sales training for their technical founders. I pitched the starter package. They thought it was too expensive. I offered a discount and we agreed to talk next month.",
    feedback: [
      "Need to ask more open-ended discovery questions to understand their specific needs before pitching.",
      "Avoid immediately offering a discount when faced with a price objection; build value first.",
      "Good job securing a follow-up, but try to make it more concrete than 'next month'."
    ],
    transcript: [
      { speaker: 'Agent', text: "Hello, thanks for calling AltLeads. How can I help you?" },
      { speaker: 'Prospect', text: "Hi, I'm looking for some sales training for my co-founder and me. We're mostly engineers." },
      { speaker: 'Agent', text: "Great. We have a starter package that is perfect for that. It's $5000." },
      { speaker: 'Prospect', text: "Oh, wow. That's a bit out of our budget right now." },
      { speaker: 'Agent', text: "I can offer a 10% discount if you sign up today." }
    ]
  }
];

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [audits, setAudits] = useState<CallAudit[]>(() => {
    const saved = localStorage.getItem('callAudits');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse cached audits local backup in dashboard', e);
      }
    }
    return [];
  });
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(() => {
    const saved = localStorage.getItem('callAudits');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed[0]?.id || null;
      } catch (e) {
        console.error('Failed to parse cached audits for ID', e);
      }
    }
    return null;
  });
  const [isDragging, setIsDragging] = useState(false);
  const [localAudios, setLocalAudios] = useState<Record<string, string>>({}); // Temp storage for uploaded audio blobs in current tab session
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to real-time audits in Firestore on mount
  useEffect(() => {
    const unsubscribe = subscribeToCallAudits(async (fetchedAudits) => {
      try {
        localStorage.setItem('callAudits', JSON.stringify(fetchedAudits));
      } catch (e) {
        console.error('Failed to save to local storage cache in dashboard', e);
      }

      if (fetchedAudits.length === 0) {
        // Bootstrap standard demo records on first connect
        for (const sample of SAMPLE_AUDITS) {
          await createCallAuditDoc(sample);
        }
      } else {
        setAudits(fetchedAudits);
        setSelectedAuditId(prev => {
          if (prev && fetchedAudits.some(a => a.id === prev)) return prev;
          return fetchedAudits[0]?.id || null;
        });
      }
    }, (error) => {
      console.error("Firestore subscriber error:", error);
    });
    return () => unsubscribe();
  }, []);

  const selectedAudit = audits.find(a => a.id === selectedAuditId);

  // Combine Firestore representations with temporary local session blobs if available
  const activeSelectedAudit = selectedAudit ? {
    ...selectedAudit,
    audioUrl: localAudios[selectedAudit.id] || selectedAudit.audioUrl
  } : null;

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
    });
  };

  const processCall = async (id: string, file: File) => {
    try {
      const base64Data = await fileToBase64(file);
      
      let mimeType = file.type;
      if (!mimeType) {
        if (file.name.toLowerCase().endsWith('.aac')) {
          mimeType = 'audio/aac';
        } else {
          mimeType = 'audio/mpeg';
        }
      }

      // Check for saved local settings custom API key and custom model selection
      let customApiKey: string | undefined = undefined;
      let selectedModel: string | undefined = undefined;
      const cachedSettings = localStorage.getItem('auditSettings');
      if (cachedSettings) {
        try {
          const parsed = JSON.parse(cachedSettings);
          if (parsed) {
            if (parsed.geminiApiKey && parsed.geminiApiKey.trim()) {
              customApiKey = parsed.geminiApiKey.trim();
            }
            if (parsed.customModel && parsed.customModel.trim()) {
              selectedModel = parsed.customModel.trim();
            }
          }
        } catch (e) {
          console.warn("Could not retrieve custom key or custom model from cache", e);
        }
      }

      const response = await fetch("/api/gemini/audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: base64Data,
          mimeType: mimeType,
          apiKey: customApiKey,
          model: selectedModel
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned error status ${response.status}`);
      }

      const result = await response.json();
      
      const sc = result.scores;
      const overall = (sc.greeting + sc.discovery + sc.valueProp + sc.objectionHandling + sc.closing) / 5;

      await updateCallAuditDoc(id, {
        status: 'completed',
        transcript: result.transcript,
        scores: result.scores,
        summary: result.summary,
        feedback: result.feedback,
        overallScore: Math.round(overall * 10) / 10
      });

    } catch (error: any) {
      console.error("Audit failed:", error);
      await updateCallAuditDoc(id, {
        status: 'error',
        errorMsg: error.message || "An unexpected error occurred during audio file analysis."
      });
    }
  };

  const handleFiles = async (files: FileList | File[]) => {
    const audioFiles = Array.from(files).filter((file: File) => file.type.startsWith('audio/') || file.name.toLowerCase().endsWith('.aac'));
    if (audioFiles.length === 0) return;

    for (const file of audioFiles) {
      const id = 'audit_' + Math.random().toString(36).substring(7) + '_' + Date.now();
      const tempBlobUrl = URL.createObjectURL(file);
      
      // Store blob URL locally in current browser tab session
      setLocalAudios(prev => ({ ...prev, [id]: tempBlobUrl }));

      const newAudit: CallAudit = {
        id,
        filename: file.name,
        status: 'pending',
        timestamp: Date.now()
      };

      try {
        await createCallAuditDoc(newAudit);
        // Transition instantly to processing state
        await updateCallAuditDoc(id, { status: 'processing' });
        
        processCall(id, file);
        setSelectedAuditId(id);
      } catch (err) {
        console.error("Failed to write processing call record to Firestore:", err);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeAudit = async (id: string) => {
    try {
      await deleteCallAuditDoc(id);
      if (selectedAuditId === id) setSelectedAuditId(null);
    } catch (err) {
      console.error("Failed to delete audit recording:", err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing': return <Clock className="w-4 h-4 text-amber-500 animate-pulse" />;
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-rose-500" />;
      default: return <Clock className="w-4 h-4 text-[#6B7280]" />;
    }
  };

  return (
    <div 
      className="flex h-full overflow-hidden relative bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-black/5 backdrop-blur-sm flex items-center justify-center border-4 border-black border-dashed m-4 rounded-[2rem]">
          <div className="bg-white p-10 rounded-3xl shadow-2xl flex flex-col items-center text-black">
            <Upload className="w-16 h-16 mb-4 animate-bounce" />
            <h2 className="text-3xl font-display font-bold tracking-tight">Drop audio files here</h2>
            <p className="text-[#6B7280] mt-2 font-medium">Supports MP3, WAV, AAC, etc.</p>
          </div>
        </div>
      )}
      
      {/* Sidebar */}
      {sidebarOpen && (
        <aside className="w-[320px] bg-[#F8F9FA] flex flex-col z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)] border-r border-[#E5E7EB]">
          <div className="p-6">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 bg-black hover:bg-[#1F2937] text-white font-bold py-3.5 px-4 rounded-2xl transition-all shadow-[0_4px_14px_0_rgb(0,0,0,0.2)]"
            >
              <Upload className="w-5 h-5" />
              Upload Calls
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
              multiple 
              accept="audio/*,.aac" 
            />
          </div>

          <nav className="flex-1 overflow-y-auto px-4 pb-6">
            <div className="text-xs font-bold uppercase tracking-widest text-[#6B7280] mb-4 px-2 font-display">Recent Audits</div>
            {audits.length === 0 ? (
              <div className="text-sm text-[#6B7280] px-2 italic">No calls uploaded yet.</div>
            ) : (
              <div className="space-y-2">
                {audits.map((audit) => (
                  <div 
                    key={audit.id}
                    onClick={() => setSelectedAuditId(audit.id)}
                    className={`group relative flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-200 ${selectedAuditId === audit.id ? 'bg-white shadow-[0_4px_20px_rgb(0,0,0,0.05)] border border-[#E5E7EB]' : 'hover:bg-white/60 border border-transparent'}`}
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#F1F3F5] flex items-center justify-center">
                      {getStatusIcon(audit.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate font-display ${selectedAuditId === audit.id ? 'text-black' : 'text-[#111827]'}`}>{audit.filename}</p>
                      <p className="text-xs text-[#6B7280] font-medium mt-0.5">
                        {audit.status === 'completed' ? `Score: ${audit.overallScore}/10` : audit.status === 'error' ? 'Failed' : audit.status}
                      </p>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeAudit(audit.id); }}
                      className="opacity-0 group-hover:opacity-100 p-2 hover:bg-rose-50 rounded-full text-rose-400 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </nav>
        </aside>
      )}

      <main className="flex-1 flex flex-col relative overflow-hidden bg-white">
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute top-8 left-8 z-30 p-2.5 bg-white/80 hover:bg-[#F1F3F5] rounded-xl text-black transition-all flex items-center justify-center shadow-md border border-[#E5E7EB] backdrop-blur-md cursor-pointer"
            title="Show Recent Audits"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {activeSelectedAudit ? (
          <div className="flex flex-col h-full font-medium">
            <header className="bg-white p-8 flex justify-between items-center z-10 border-b border-[#F1F3F5]">
              <div className="flex items-center gap-4">
                {sidebarOpen && (
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-2.5 hover:bg-[#F1F3F5] rounded-xl text-black transition-all flex items-center justify-center mr-2 border border-[#E5E7EB] shadow-sm bg-white"
                    title="Hide Recent Audits"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                <div className={!sidebarOpen ? "pl-14" : ""}>
                  <h2 className="text-3xl font-display font-bold text-black tracking-tight flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-white shadow-md">
                      <FileAudio className="w-6 h-6" />
                    </div>
                    {activeSelectedAudit.filename}
                  </h2>
                  <p className="text-sm text-[#6B7280] font-medium mt-2">
                    Audited on {new Date(activeSelectedAudit.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              {activeSelectedAudit.status === 'completed' && (
                <div className="flex items-center gap-6">
                  <div className="score-ring shadow-lg" style={{ '--score-deg': `${(activeSelectedAudit.overallScore || 0) * 36}deg` } as React.CSSProperties}>
                    <div className="score-ring-value">
                      {activeSelectedAudit.overallScore}
                    </div>
                  </div>
                </div>
              )}
            </header>

            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 overflow-y-auto p-8 transcript-container bg-[#F8F9FA] rounded-tl-3xl shadow-[inset_4px_4px_24px_rgba(0,0,0,0.02)]">
                <div className="max-w-3xl mx-auto space-y-8">
                  {activeSelectedAudit.status === 'processing' ? (
                    <div className="flex flex-col items-center justify-center h-64 text-[#6B7280] py-20">
                      <div className="w-12 h-12 border-4 border-[#F1F3F5] border-t-black rounded-full animate-spin mb-4"></div>
                      <p className="font-bold font-display text-lg text-black">Analyzing conversation with Gemini...</p>
                      <p className="text-sm mt-1">Transcribing and scoring performance using gemini-3.5-flash...</p>
                    </div>
                  ) : activeSelectedAudit.status === 'completed' ? (
                    <>
                      <div className="sticky top-0 glass-card py-4 px-6 rounded-2xl mb-8 z-10 flex items-center gap-4">
                        {activeSelectedAudit.audioUrl ? (
                          <audio src={activeSelectedAudit.audioUrl} controls className="flex-1 h-10" />
                        ) : (
                          <div className="flex-1 h-10 flex items-center text-sm text-[#6B7280] italic px-4 bg-[#F1F3F5] rounded-xl font-medium">
                            Audio recording unavailable for cached sessions.
                          </div>
                        )}
                      </div>
                      <div className="space-y-6">
                        {activeSelectedAudit.transcript?.map((line, i) => (
                          <div key={i} className={`flex gap-4 ${line.speaker === 'Agent' ? 'flex-row' : 'flex-row-reverse'}`}>
                            <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold font-display text-sm shadow-sm ${line.speaker === 'Agent' ? 'bg-black text-white' : 'bg-white text-black border border-[#E5E7EB]'}`}>
                               {line.speaker === 'Agent' ? 'AG' : 'PR'}
                            </div>
                            <div className={`max-w-[80%] rounded-2xl px-5 py-4 shadow-sm ${line.speaker === 'Agent' ? 'bg-white rounded-tl-none border border-[#E5E7EB]' : 'bg-black text-white rounded-tr-none'}`}>
                              <div className={`text-xs font-bold font-display mb-1.5 ${line.speaker === 'Agent' ? 'text-[#6B7280]' : 'text-gray-400'}`}>{line.speaker}</div>
                              <p className={`leading-relaxed text-[15px] ${line.speaker === 'Agent' ? 'text-[#111827]' : 'text-gray-100'}`}>{line.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-16 bg-white rounded-3xl border border-[#FFE4E6] p-10 max-w-xl mx-auto my-10 shadow-sm animate-fade-in">
                      <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-6 anim-pulse" />
                      <h3 className="text-2xl font-display font-bold text-black tracking-tight">Analysis Failed</h3>
                      <p className="text-rose-600 font-medium text-sm bg-rose-50 border border-rose-100 p-4 rounded-xl mt-4 text-left font-mono whitespace-pre-wrap break-words">
                        {activeSelectedAudit.errorMsg || "An unknown error occurred during parsing."}
                      </p>
                      
                      <div className="mt-6 text-left text-sm text-[#6B7280] space-y-2">
                        <p className="font-bold text-black">Common fixes:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Go to <strong>Settings (bottom-left gear icon) &gt; Secrets</strong> and check that <code>GEMINI_API_KEY</code> is correctly set.</li>
                          <li>Ensure your internet connection is active.</li>
                          <li>Check if the upload format is correct (compressed formats like MP3/AAC are highly recommended).</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <aside className="w-[420px] overflow-y-auto p-8 bg-white border-l border-[#F1F3F5]">
                {activeSelectedAudit.status === 'completed' && (
                  <div className="space-y-10">
                    <section>
                      <h3 className="text-xs font-bold font-display uppercase tracking-widest text-[#6B7280] mb-4 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Executive Summary
                      </h3>
                      <p className="text-[15px] text-[#111827] bg-[#F8F9FA] p-6 rounded-2xl leading-relaxed font-medium">
                        {activeSelectedAudit.summary}
                      </p>
                    </section>

                    <section>
                      <h3 className="text-xs font-bold font-display uppercase tracking-widest text-[#6B7280] mb-4 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Quality Pillars
                      </h3>
                      <div className="space-y-4">
                        {QUALITY_CRITERIA.map((item) => {
                          const score = (activeSelectedAudit.scores as any)[item.key] || 0;
                          return (
                            <div key={item.key} className="bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.04)]">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <div className="text-[15px] font-bold font-display text-black">{item.label}</div>
                                  <div className="text-xs text-[#6B7280] font-medium mt-0.5">{item.desc}</div>
                                </div>
                                <div className={`text-xl font-display font-black ${score >= 8 ? 'text-emerald-500' : score >= 6 ? 'text-amber-500' : 'text-rose-500'}`}>
                                  {score}<span className="text-xs text-[#6B7280] font-medium">/10</span>
                                </div>
                              </div>
                              <div className="h-2 w-full bg-[#F1F3F5] rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-1000 ${score >= 8 ? 'bg-emerald-500' : score >= 6 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                                  style={{ width: `${score * 10}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>

                    <section>
                      <h3 className="text-xs font-bold font-display uppercase tracking-widest text-[#6B7280] mb-4 flex items-center gap-2">
                        <Star className="w-4 h-4" />
                        Coaching Opportunities
                      </h3>
                      <div className="space-y-4">
                        {activeSelectedAudit.feedback?.map((f, i) => (
                          <div key={i} className="flex gap-4 text-[15px] p-5 bg-[#F8F9FA] rounded-2xl text-[#111827] font-medium">
                            <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold font-display shadow-sm">
                              {i + 1}
                            </div>
                            <span className="leading-relaxed">{f}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                )}
              </aside>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-[#F8F9FA] rounded-tl-3xl shadow-[inset_4px_4px_24px_rgba(0,0,0,0.02)] relative">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="absolute top-8 left-8 z-30 p-3 bg-white hover:bg-[#F1F3F5] rounded-2xl text-black transition-all flex items-center gap-2 shadow-md border border-[#E5E7EB] cursor-pointer"
                title="Show Recent Audits"
              >
                <Menu className="w-5 h-5" />
                <span className="text-sm font-bold font-display pr-1">Show Audits</span>
              </button>
            )}
            
            <div className="w-28 h-28 bg-white shadow-xl rounded-[2rem] flex items-center justify-center mb-8 border border-[#E5E7EB]">
              <Upload className="w-12 h-12 text-black animate-pulse" />
            </div>
            <h2 className="text-4xl font-display font-bold text-black tracking-tight">Ready to audit?</h2>
            <p className="text-[#6B7280] mt-4 max-w-md text-lg font-medium">
              Upload call recordings to start transcribing and evaluating your agents' performance using AI.
            </p>
            <div className="mt-12 grid grid-cols-3 gap-8 w-full max-w-4xl font-medium">
              <div className="bg-white p-8 rounded-3xl border border-[#E5E7EB] hover:shadow-lg transition-all text-left">
                <div className="w-12 h-12 bg-[#F8F9FA] rounded-2xl flex items-center justify-center mb-5 border border-[#E5E7EB]">
                  <MessageSquare className="w-6 h-6 text-black" />
                </div>
                <h4 className="font-bold font-display text-black text-lg">Automated Transcript</h4>
                <p className="text-sm text-[#6B7280] mt-2 font-medium leading-relaxed">Multi-speaker identification with automated role resolution.</p>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-[#E5E7EB] hover:shadow-lg transition-all text-left">
                <div className="w-12 h-12 bg-[#F8F9FA] rounded-2xl flex items-center justify-center mb-5 border border-[#E5E7EB]">
                  <BarChart3 className="w-6 h-6 text-black" />
                </div>
                <h4 className="font-bold font-display text-black text-lg">Scientific Scoring</h4>
                <p className="text-sm text-[#6B7280] mt-2 font-medium leading-relaxed">Data-driven scoring based on proven sales frameworks.</p>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-[#E5E7EB] hover:shadow-lg transition-all text-left">
                <div className="w-12 h-12 bg-[#F8F9FA] rounded-2xl flex items-center justify-center mb-5 border border-[#E5E7EB]">
                  <Star className="w-6 h-6 text-black" />
                </div>
                <h4 className="font-bold font-display text-black text-lg">Smart Feedback</h4>
                <p className="text-sm text-[#6B7280] mt-2 font-medium leading-relaxed">Actionable coaching points generated for every call.</p>
              </div>
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="mt-16 bg-black hover:bg-[#1F2937] text-white font-bold py-4 px-10 rounded-2xl transition-all shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center gap-3 text-lg"
            >
              Get Started Now
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
