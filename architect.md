# AltLeads-QC: Architecture & Technical Documentation

**Date:** March 17, 2026
**Status:** Active Development
**Version:** 1.0 (Local Cache + Gemini Flash)

## 1. Overview
AltLeads-QC is a React-based web application designed to automate the Quality Assurance (QA) process for lead generation calls. It aligns with the **Amplior Quality Manual**, evaluating call recordings to generate transcripts, score agent performance, and produce actionable executive summaries.

## 2. Tech Stack
*   **Frontend:** React 18, TypeScript, Vite
*   **Styling:** Tailwind CSS, Lucide React (Icons)
*   **AI / LLM:** Google Gemini API (`@google/genai`) - specifically using `gemini-3-flash-preview` for fast, cost-effective multimodal audio processing.
*   **Storage (Current):** Browser `localStorage` (for caching reports and transcripts).
*   **Storage (Planned):** Firebase (Firestore for database, Firebase Auth for user management).

## 3. Core Workflows

### A. Audio Upload & Processing
1. User uploads an audio file (MP3, WAV, AAC) via drag-and-drop or file selector.
2. The file is read locally and converted to a Base64 string.
3. The Base64 audio data and its MIME type are sent directly to the Gemini API.

### B. AI Analysis & Prompting
The application uses a highly specific prompt to instruct the Gemini model. 
Current Prompt Directives:
1.  **Transcription:** Transcribe the audio exactly, identifying 'Agent' and 'Prospect'.
2.  **Scoring (Current 5-point system):** Score from 1-10 on greeting, discovery, valueProp, objectionHandling, and closing.
3.  **Executive Summary:** Written from the Agent's (caller's) perspective as a concise narrative detailing:
    *   Who was connected with.
    *   Services/trainings discussed.
    *   Prospect's interest/needs.
    *   Confirmation of key probing questions asked.
    *   Stated next steps.
    *   Important information for the senior/manager.
4.  **Feedback:** Provide 3 actionable feedback points.

### C. Data Persistence
*   **Current State:** Audit metadata, scores, summaries, and transcripts are saved to `localStorage`. Because audio files (Blob URLs) expire when the browser closes, cached sessions display a "recording unavailable" fallback while preserving the text report.
*   **Future State:** Reports will be pushed to a Firestore `call_audits` collection, tied to a specific authenticated `userId`.

## 4. Data Models

### Current `CallAudit` Interface
```typescript
interface CallAudit {
  id: string;
  filename: string;
  status: 'processing' | 'completed' | 'error';
  timestamp: number;
  overallScore?: number;
  scores?: {
    greeting: number;
    discovery: number;
    valueProp: number;
    objectionHandling: number;
    closing: number;
  };
  summary?: string;
  feedback?: string[];
  transcript?: { speaker: string; text: string }[];
  audioUrl?: string;
}
```

## 5. Roadmap & Future Enhancements

### Phase 1: Database & Authentication (Next Step)
*   Integrate Firebase Authentication (Google Sign-in).
*   Integrate Cloud Firestore to store audit history persistently across devices.
*   Update data model to include `userId`.

### Phase 2: Amplior Quality Manual Alignment
*   Transition from the basic 5-parameter scorecard to the **10-parameter, 100-point scorecard** defined in the Amplior Quality Manual v1.0.
*   New parameters will include: Right Prospect/Persona Fit, Account/ICP Relevance, Pitch Quality, Interest/Need Signal, Qualification Depth, Engagement Strength, Multi-Channel Support, Meeting Readiness, CRM/Data Accuracy, and Process Adherence.
*   Implement Auto-Fail / Zero Tolerance criteria logic.

---
*Note: This document is a living architecture file and will be updated as new features (like Firebase and the 100-point scorecard) are integrated.*
