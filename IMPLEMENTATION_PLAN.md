# AltLeads-QC v2.0: Implementation & Tracking Plan

**Based on PRD v2.1**
**Status:** 🟢 Phase 1 Complete | 🟡 Phase 2 Ready to Start

This document tracks the step-by-step implementation of AltLeads-QC v2.0. As features are completed, their status will be updated here.

## Phase 1: Foundation & Core Setup (Sprint 1)
**Goal:** Establish the database, authentication, and core management interfaces.

| Status | Feature | Description | Technical Tasks |
| :--- | :--- | :--- | :--- |
| ✅ | **1.1 Firebase Setup** | Initialize Auth, Firestore, and Storage. | Connect `firebaseConfig`, setup Auth provider, initialize DB. |
| ✅ | **1.2 Auth & Routing** | Protected routes and role-based access. | Login screen, Admin/TL/Agent role routing. |
| ✅ | **1.3 Agent Management** | CRUD operations for Agents. | UI for adding/editing agents, Firestore `agents` collection. |
| ✅ | **1.4 User Management** | CRUD for Admins, TLs, QC Managers. | UI for adding/editing users, Firestore `users` collection. |
| ✅ | **1.5 Project Setup** | Create projects and define probing questions. | UI for projects, Firestore `projects` & `probing_questions` collections. |

## Phase 2: AI Integration & Processing (Sprint 2)
**Goal:** Upgrade the upload and transcription pipeline using Gemini 3.1 Flash-Lite.

| Status | Feature | Description | Technical Tasks |
| :--- | :--- | :--- | :--- |
| ⏳ | **2.1 Call Upload UI** | Drag-drop interface linking to Projects/Agents. | File uploader, metadata assignment, upload to Firebase Storage. |
| ⏳ | **2.2 Gemini 3.1 Integration** | Connect to `gemini-3.1-flash-lite-preview`. | Update API calls, handle rate limits/errors. |
| ⏳ | **2.3 Transcription Engine** | Speaker diarization and timestamping. | Prompt engineering for Agent/Prospect separation. |
| ⏳ | **2.4 Transcript Viewer** | UI to view and edit the generated transcript. | Timeline UI, speaker highlighting. |

## Phase 3: Scoring & Feedback Workflow (Sprint 3)
**Goal:** Implement the complex 100-point scoring logic and automated feedback.

| Status | Feature | Description | Technical Tasks |
| :--- | :--- | :--- | :--- |
| ⏳ | **3.1 Scoring Engine** | 100-point criteria + Probing Q validation. | AI prompt update for complex scoring math and validation. |
| ⏳ | **3.2 Feedback Generation** | AI narrative generation (Strengths/Improvements). | Prompt engineering for constructive feedback. |
| ⏳ | **3.3 Email Integration** | Send feedback to agents via email. | Integrate email service (e.g., SendGrid or Firebase Extension). |
| ⏳ | **3.4 Response Interface** | Agent Acknowledge/Dispute buttons. | UI for agents to respond, Firestore `feedback_responses`. |

## Phase 4: Dashboards & Analytics (Sprint 4)
**Goal:** Provide visibility into performance at the Agent, Team, and Project levels.

| Status | Feature | Description | Technical Tasks |
| :--- | :--- | :--- | :--- |
| ⏳ | **4.1 Agent Scorecard** | Individual performance metrics and trends. | Data aggregation, charting (Recharts). |
| ⏳ | **4.2 Team Lead Dashboard** | Aggregate team metrics and rankings. | Team-level queries, alert notifications. |
| ⏳ | **4.3 Project Report** | Project-level analytics and probing effectiveness. | Project-level queries, recommendation UI. |

## Phase 5: Dispute Resolution & Polish (Sprint 5 & 6)
**Goal:** Finalize workflows, add advanced search, and polish the UI.

| Status | Feature | Description | Technical Tasks |
| :--- | :--- | :--- | :--- |
| ⏳ | **5.1 Dispute Workflow** | TL review, approve/reject, score override. | UI for TLs to manage disputes, update `call_scores`. |
| ⏳ | **5.2 Advanced Search** | Multi-criteria search across all audits. | Complex Firestore queries, filter UI. |
| ⏳ | **5.3 Audit Trail** | Track all changes to scores and feedback. | History logging UI. |
| ⏳ | **5.4 Final Polish** | Responsive design, error handling, testing. | CSS refinement, edge-case testing. |

---
*Note: This file will be updated continuously as we progress through the phases.*
