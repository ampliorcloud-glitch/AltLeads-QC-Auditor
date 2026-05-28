export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: 'dev-admin',
      email: 'dev@example.com',
      emailVerified: true,
      isAnonymous: false,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Local Storage Operation Logging: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface TranscriptSegment {
  speaker: 'Agent' | 'Prospect';
  text: string;
}

export interface EvaluationScores {
  greeting: number;
  discovery: number;
  valueProp: number;
  objectionHandling: number;
  closing: number;
}

export interface CallAudit {
  id: string;
  filename: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  transcript?: TranscriptSegment[];
  scores?: EvaluationScores;
  summary?: string;
  overallScore?: number;
  feedback?: string[];
  audioUrl?: string; // Keep local url if needed, won't save in firestore
  timestamp: number;
  errorMsg?: string;
}

export interface SettingsData {
  companyName: string;
  companyOffering: string;
  slaThreshold: number;
  enableRoleResolution: boolean;
  modelTier: 'standard' | 'quantum' | 'advanced';
  scoringWeights: {
    greeting: number;
    discovery: number;
    valueProp: number;
    objectionHandling: number;
    closing: number;
  };
  geminiApiKey?: string;
  customModel?: string;
  updatedAt?: number;
}

// Global set of listeners for call audits database changes
const auditListeners = new Set<(audits: CallAudit[]) => void>();

// Helper to load audits from local storage
function loadLocalAudits(): CallAudit[] {
  const saved = localStorage.getItem('callAudits');
  if (saved) {
    try {
      return JSON.parse(saved) as CallAudit[];
    } catch (e) {
      console.error('Failed to parse cached audits', e);
    }
  }
  return [];
}

// Helper to save audits to local storage and notify active subscribers
function saveLocalAudits(audits: CallAudit[]): void {
  localStorage.setItem('callAudits', JSON.stringify(audits));
  notifyAuditListeners(audits);
}

function notifyAuditListeners(audits: CallAudit[]): void {
  auditListeners.forEach(listener => {
    try {
      listener(audits);
    } catch (e) {
      console.error("Error invoking subscriber", e);
    }
  });
}

// Settings Accessors
export async function getWorkspaceSettings(): Promise<SettingsData | null> {
  const saved = localStorage.getItem('auditSettings');
  if (saved) {
    try {
      return JSON.parse(saved) as SettingsData;
    } catch (e) {
      console.error('Failed to parse cached settings local backup', e);
    }
  }
  return null;
}

export async function saveWorkspaceSettings(settings: SettingsData): Promise<void> {
  localStorage.setItem('auditSettings', JSON.stringify({
    ...settings,
    updatedAt: Date.now()
  }));
}

// Call Audits Accessors (Mocking real-time subscription using LocalStorage event bus and subscribers list)
export function subscribeToCallAudits(onUpdate: (audits: CallAudit[]) => void, onError?: (error: Error) => void) {
  auditListeners.add(onUpdate);
  
  // Deliver current state immediately
  onUpdate(loadLocalAudits());

  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'callAudits') {
      const audits = loadLocalAudits();
      onUpdate(audits);
    }
  };
  window.addEventListener('storage', handleStorageChange);

  return () => {
    auditListeners.delete(onUpdate);
    window.removeEventListener('storage', handleStorageChange);
  };
}

export async function createCallAuditDoc(audit: CallAudit): Promise<void> {
  const audits = loadLocalAudits();
  const index = audits.findIndex(a => a.id === audit.id);
  
  // Exclude localized raw data or temporary audioUrl
  const { audioUrl, ...persistedAudit } = audit;
  
  if (index >= 0) {
    audits[index] = { ...audits[index], ...persistedAudit } as CallAudit;
  } else {
    audits.unshift(persistedAudit as CallAudit);
  }
  
  saveLocalAudits(audits);
}

export async function updateCallAuditDoc(id: string, updates: Partial<CallAudit>): Promise<void> {
  const audits = loadLocalAudits();
  const index = audits.findIndex(a => a.id === id);
  if (index >= 0) {
    const { audioUrl, ...persistedUpdates } = updates;
    audits[index] = { ...audits[index], ...persistedUpdates } as CallAudit;
    saveLocalAudits(audits);
  }
}

export async function deleteCallAuditDoc(id: string): Promise<void> {
  const audits = loadLocalAudits();
  const filtered = audits.filter(a => a.id !== id);
  saveLocalAudits(filtered);
}
