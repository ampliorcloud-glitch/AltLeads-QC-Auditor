
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Upload, 
  FileAudio, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Play, 
  ChevronRight, 
  BarChart3, 
  MessageSquare, 
  Star,
  Download,
  Trash2,
  X,
  Volume2
} from 'lucide-react';

// Types
interface TranscriptSegment {
  speaker: 'Agent' | 'Prospect';
  text: string;
}

interface EvaluationScores {
  greeting: number;
  discovery: number;
  valueProp: number;
  objectionHandling: number;
  closing: number;
}

interface CallAudit {
  id: string;
  filename: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  transcript?: TranscriptSegment[];
  scores?: EvaluationScores;
  summary?: string;
  overallScore?: number;
  feedback?: string[];
  audioUrl?: string;
  timestamp: number;
}

const QUALITY_CRITERIA = [
  { key: 'greeting', label: 'Greeting & Introduction', desc: 'Clarity, brand mention, and rapport.' },
  { key: 'discovery', label: 'Discovery Questions', desc: 'Uncovering pain points and qualifying.' },
  { key: 'valueProp', label: 'Value Proposition', desc: 'Pitching solutions to specific needs.' },
  { key: 'objectionHandling', label: 'Objection Handling', desc: 'Calmness and effective rebuttals.' },
  { key: 'closing', label: 'Closing / Next Steps', desc: 'Call to action and confirmation.' }
];

const App: React.FC = () => {
  const [audits, setAudits] = useState<CallAudit[]>(() => {
    const saved = localStorage.getItem('callAudits');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Clear blob URLs as they won't work across sessions
        return parsed.map((a: CallAudit) => ({
          ...a,
          audioUrl: a.audioUrl?.startsWith('blob:') ? undefined : a.audioUrl
        }));
      } catch (e) {
        console.error('Failed to parse cached audits', e);
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('callAudits', JSON.stringify(audits));
  }, [audits]);

  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedAudit = audits.find(a => a.id === selectedAuditId);

  // Helper: File to Base64
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
    // Create new GoogleGenAI instance right before the call to ensure fresh configuration usage.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
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

      // Using gemini-3-flash-preview for generous free tier limits and fast audio processing.
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            },
            {
              text: `You are an expert sales manager auditing a lead generation call. 
              1. Transcribe the audio exactly, identifying two speakers: the 'Agent' and the 'Prospect'.
              2. Score the agent's performance from 1 to 10 on: greeting, discovery, valueProp, objectionHandling, and closing.
              3. Provide a brief overall summary and 3 actionable feedback points for improvement.
              Return the response in valid JSON format.`
            }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              transcript: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    speaker: { type: Type.STRING, enum: ['Agent', 'Prospect'] },
                    text: { type: Type.STRING }
                  },
                  required: ['speaker', 'text']
                }
              },
              scores: {
                type: Type.OBJECT,
                properties: {
                  greeting: { type: Type.NUMBER },
                  discovery: { type: Type.NUMBER },
                  valueProp: { type: Type.NUMBER },
                  objectionHandling: { type: Type.NUMBER },
                  closing: { type: Type.NUMBER }
                },
                required: ['greeting', 'discovery', 'valueProp', 'objectionHandling', 'closing']
              },
              summary: { type: Type.STRING },
              feedback: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ['transcript', 'scores', 'summary', 'feedback']
          }
        }
      });

      // Extract generated text directly from the response object.
      const result = JSON.parse(response.text || '{}');
      
      // Calculate overall score
      const sc = result.scores;
      const overall = (sc.greeting + sc.discovery + sc.valueProp + sc.objectionHandling + sc.closing) / 5;

      setAudits(prev => prev.map(a => a.id === id ? {
        ...a,
        status: 'completed',
        transcript: result.transcript,
        scores: result.scores,
        summary: result.summary,
        feedback: result.feedback,
        overallScore: Math.round(overall * 10) / 10
      } : a));

    } catch (error) {
      console.error("Audit failed:", error);
      setAudits(prev => prev.map(a => a.id === id ? { ...a, status: 'error' } : a));
    }
  };

  const handleFiles = (files: FileList | File[]) => {
    const newAudits: CallAudit[] = [];
    Array.from(files).forEach((file: File) => {
      // Check if it's an audio file or .aac
      if (!file.type.startsWith('audio/') && !file.name.toLowerCase().endsWith('.aac')) {
         return;
      }

      const id = Math.random().toString(36).substring(7);
      const url = URL.createObjectURL(file);
      
      const newAudit: CallAudit = {
        id,
        filename: file.name,
        status: 'processing',
        timestamp: Date.now(),
        audioUrl: url
      };
      newAudits.push(newAudit);
      processCall(id, file);
    });

    if (newAudits.length > 0) {
      setAudits(prev => [...newAudits, ...prev]);
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

  const removeAudit = (id: string) => {
    setAudits(prev => prev.filter(a => a.id !== id));
    if (selectedAuditId === id) setSelectedAuditId(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing': return <Clock className="w-4 h-4 text-amber-500 animate-pulse" />;
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-rose-500" />;
      default: return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div 
      className="flex h-screen overflow-hidden relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-indigo-500/20 backdrop-blur-sm flex items-center justify-center border-4 border-indigo-500 border-dashed m-4 rounded-3xl">
          <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center text-indigo-600">
            <Upload className="w-16 h-16 mb-4 animate-bounce" />
            <h2 className="text-2xl font-bold">Drop audio files here</h2>
            <p className="text-slate-500 mt-2">Supports MP3, WAV, AAC, etc.</p>
          </div>
        </div>
      )}
      {/* Sidebar */}
      <aside className="w-80 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">CallAuditor</h1>
          </div>
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-xl transition-all shadow-lg shadow-indigo-500/20"
          >
            <Upload className="w-4 h-4" />
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

        <nav className="flex-1 overflow-y-auto px-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4 px-2">Recent Audits</div>
          {audits.length === 0 ? (
            <div className="text-sm text-slate-500 px-2 italic">No calls uploaded yet.</div>
          ) : (
            <div className="space-y-1">
              {audits.map((audit) => (
                <div 
                  key={audit.id}
                  onClick={() => setSelectedAuditId(audit.id)}
                  className={`group relative flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedAuditId === audit.id ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/50'}`}
                >
                  <div className="flex-shrink-0">
                    {getStatusIcon(audit.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{audit.filename}</p>
                    <p className="text-xs text-slate-500">
                      {audit.status === 'completed' ? `${audit.overallScore}/10` : audit.status}
                    </p>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeAudit(audit.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </nav>
        
        <div className="p-4 bg-slate-950/50 text-xs border-t border-slate-800">
          <div className="flex justify-between items-center text-slate-500">
            <span>Powered by Gemini 3 Flash</span>
            <div className="flex gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Live
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-slate-50 flex flex-col relative overflow-hidden">
        {selectedAudit ? (
          <div className="flex flex-col h-full">
            {/* Header Area */}
            <header className="bg-white border-b border-slate-200 p-6 flex justify-between items-center shadow-sm z-10">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <FileAudio className="w-5 h-5 text-indigo-600" />
                  {selectedAudit.filename}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Audited on {new Date(selectedAudit.timestamp).toLocaleDateString()}
                </p>
              </div>
              
              {selectedAudit.status === 'completed' && (
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-sm text-slate-500 font-medium">Overall Score</div>
                    <div className="text-3xl font-black text-indigo-600 leading-none">{selectedAudit.overallScore}<span className="text-lg text-slate-400">/10</span></div>
                  </div>
                </div>
              )}
            </header>

            <div className="flex-1 flex overflow-hidden">
              {/* Transcript Pane */}
              <div className="flex-1 overflow-y-auto p-8 transcript-container bg-white border-r border-slate-200">
                <div className="max-w-3xl mx-auto space-y-8">
                  {selectedAudit.status === 'processing' ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                      <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                      <p className="font-medium">Transcribing and analyzing conversation...</p>
                    </div>
                  ) : selectedAudit.status === 'completed' ? (
                    <>
                      <div className="sticky top-0 bg-white/95 backdrop-blur py-4 border-b mb-8 z-10 flex items-center gap-4">
                        {selectedAudit.audioUrl ? (
                          <audio src={selectedAudit.audioUrl} controls className="flex-1 h-10" />
                        ) : (
                          <div className="flex-1 h-10 flex items-center text-sm text-slate-500 italic px-4 bg-slate-50 rounded-lg border border-slate-200">
                            Audio recording unavailable for cached sessions.
                          </div>
                        )}
                      </div>
                      <div className="space-y-6">
                        {selectedAudit.transcript?.map((line, i) => (
                          <div key={i} className={`flex gap-4 ${line.speaker === 'Agent' ? 'flex-row' : 'flex-row-reverse'}`}>
                            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs ${line.speaker === 'Agent' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'}`}>
                              {line.speaker === 'Agent' ? 'AG' : 'PR'}
                            </div>
                            <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${line.speaker === 'Agent' ? 'bg-indigo-50 border border-indigo-100 rounded-tl-none' : 'bg-slate-50 border border-slate-100 rounded-tr-none'}`}>
                              <div className="text-xs font-semibold text-slate-500 mb-1">{line.speaker}</div>
                              <p className="text-slate-700 leading-relaxed text-sm">{line.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-20">
                      <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-slate-900">Analysis Failed</h3>
                      <p className="text-slate-500 max-w-sm mx-auto mt-2">There was an issue processing this audio file. Please try a different format or re-upload.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Scorecard Sidebar */}
              <aside className="w-[400px] overflow-y-auto p-6 bg-slate-50/50">
                {selectedAudit.status === 'completed' && (
                  <div className="space-y-8">
                    {/* Summary */}
                    <section>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Executive Summary
                      </h3>
                      <p className="text-sm text-slate-700 bg-white p-4 rounded-xl border border-slate-200 leading-relaxed shadow-sm italic">
                        "{selectedAudit.summary}"
                      </p>
                    </section>

                    {/* Quality Pillars */}
                    <section>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Quality Pillars
                      </h3>
                      <div className="space-y-4">
                        {QUALITY_CRITERIA.map((item) => {
                          const score = (selectedAudit.scores as any)[item.key] || 0;
                          return (
                            <div key={item.key} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <div className="text-sm font-bold text-slate-900">{item.label}</div>
                                  <div className="text-[10px] text-slate-400">{item.desc}</div>
                                </div>
                                <div className={`text-lg font-black ${score >= 8 ? 'text-emerald-500' : score >= 6 ? 'text-amber-500' : 'text-rose-500'}`}>
                                  {score}<span className="text-[10px] text-slate-300">/10</span>
                                </div>
                              </div>
                              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
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

                    {/* Feedback */}
                    <section>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                        <Star className="w-4 h-4" />
                        Coaching Opportunities
                      </h3>
                      <div className="space-y-3">
                        {selectedAudit.feedback?.map((f, i) => (
                          <div key={i} className="flex gap-3 text-sm p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg text-indigo-900">
                            <div className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
                              {i + 1}
                            </div>
                            {f}
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
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-24 h-24 bg-indigo-50 text-indigo-400 rounded-3xl flex items-center justify-center mb-6">
              <Upload className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Ready to audit?</h2>
            <p className="text-slate-500 mt-2 max-w-sm">
              Upload call recordings to start transcribing and evaluating your agents' performance using AI.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-6 w-full max-w-3xl">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-left">
                <MessageSquare className="w-6 h-6 text-indigo-500 mb-3" />
                <h4 className="font-bold text-slate-900 text-sm">Automated Transcript</h4>
                <p className="text-xs text-slate-500 mt-1">Multi-speaker identification with timestamp sync.</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-left">
                <BarChart3 className="w-6 h-6 text-emerald-500 mb-3" />
                <h4 className="font-bold text-slate-900 text-sm">Scientific Scoring</h4>
                <p className="text-xs text-slate-500 mt-1">Data-driven scoring based on proven sales frameworks.</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-left">
                <Star className="w-6 h-6 text-amber-500 mb-3" />
                <h4 className="font-bold text-slate-900 text-sm">Smart Feedback</h4>
                <p className="text-xs text-slate-500 mt-1">Actionable coaching points generated for every call.</p>
              </div>
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="mt-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-2xl transition-all shadow-xl shadow-indigo-500/20 flex items-center gap-2"
            >
              Get Started Now
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
