import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  orderBy, 
  onSnapshot
} from 'firebase/firestore';
import { db, auth } from './firebase';

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
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
       })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
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

const SETTINGS_DOC_ID = 'workspace';
const SETTINGS_COLLECTION = 'settings';
const CALLS_COLLECTION = 'call_audits';

// Settings Accessors
export async function getWorkspaceSettings(): Promise<SettingsData | null> {
  const path = `${SETTINGS_COLLECTION}/${SETTINGS_DOC_ID}`;
  
  const timeoutPromise = new Promise<null>((_, reject) => 
    setTimeout(() => reject(new Error("Firestore loading timed out")), 3500)
  );

  try {
    const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
    
    const snap = await Promise.race([
      getDoc(docRef),
      timeoutPromise
    ]) as any;

    if (snap && snap.exists()) {
      const data = snap.data() as SettingsData;
      // Backup to localStorage cache
      localStorage.setItem('auditSettings', JSON.stringify(data));
      return data;
    }
    
    // Fallback to local storage if document doesn't exist
    const saved = localStorage.getItem('auditSettings');
    if (saved) {
      try {
        return JSON.parse(saved) as SettingsData;
      } catch (e) {
        console.error('Failed to parse cached settings local backup', e);
      }
    }
    return null;
  } catch (error) {
    console.warn("Firestore settings load failed or timed out. Falling back to local storage cache.", error);
    
    // Fallback to local storage cache on any error/timeout
    const saved = localStorage.getItem('auditSettings');
    if (saved) {
      try {
        return JSON.parse(saved) as SettingsData;
      } catch (e) {
        console.error('Failed to parse cached settings local backup in exception path', e);
      }
    }
    return null;
  }
}

export async function saveWorkspaceSettings(settings: SettingsData): Promise<void> {
  const path = `${SETTINGS_COLLECTION}/${SETTINGS_DOC_ID}`;
  try {
    // Sync to local backup instantly
    localStorage.setItem('auditSettings', JSON.stringify(settings));
    
    const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
    const writePromise = setDoc(docRef, {
      ...settings,
      updatedAt: Date.now()
    }, { merge: true });
    
    const timeoutPromise = new Promise<void>((_, reject) => 
      setTimeout(() => reject(new Error("Firestore save timed out")), 3500)
    );
    
    await Promise.race([writePromise, timeoutPromise]);
  } catch (error) {
    console.warn("Firestore save failed or timed out. Settings are backed up in local storage cache.", error);
  }
}

// Call Audits Accessors
export function subscribeToCallAudits(onUpdate: (audits: CallAudit[]) => void, onError?: (error: Error) => void) {
  const q = query(collection(db, CALLS_COLLECTION), orderBy('timestamp', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const audits: CallAudit[] = [];
    snapshot.forEach((snap) => {
      audits.push({ id: snap.id, ...snap.data() } as CallAudit);
    });
    onUpdate(audits);
  }, (error) => {
    try {
      handleFirestoreError(error, OperationType.LIST, CALLS_COLLECTION);
    } catch (err: any) {
      if (onError) onError(err);
    }
  });
}

export async function createCallAuditDoc(audit: CallAudit): Promise<void> {
  const path = `${CALLS_COLLECTION}/${audit.id}`;
  try {
    // Exclude localized temporary audioUrl from Firestore
    const { audioUrl, ...firestoreData } = audit;
    await setDoc(doc(db, CALLS_COLLECTION, audit.id), firestoreData);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateCallAuditDoc(id: string, updates: Partial<CallAudit>): Promise<void> {
  const path = `${CALLS_COLLECTION}/${id}`;
  try {
    const { audioUrl, ...firestoreUpdates } = updates;
    await updateDoc(doc(db, CALLS_COLLECTION, id), firestoreUpdates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteCallAuditDoc(id: string): Promise<void> {
  const path = `${CALLS_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, CALLS_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
