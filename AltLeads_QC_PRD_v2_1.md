# PRODUCT REQUIREMENTS DOCUMENT (PRD)
## AltLeads-QC: Lead Quality Assurance Platform v2.0

**Project Name:** AltLeads-QC (Call Recording QC → Lead QC Upgrade)  
**Version:** 2.0 (Full Platform)  
**Date:** March 17, 2026  
**Prepared by:** Ankit Sundriyal  
**Status:** Ready for Development  
**AI Implementation Tool:** AI Studio (Hosted on AI Studio infrastructure)

---

## SECTION 1: PRODUCT OVERVIEW

### 1.1 Executive Summary
AltLeads-QC v2.0 is a comprehensive **Lead Quality Assurance (QC) platform** designed to automate the evaluation of lead generation calls, agent performance, and team productivity. The system processes call recordings, generates intelligent transcripts, applies data-driven scoring, and provides actionable feedback to agents, team leads, and management.

**Core Transformation:**
- **V1.0:** Call QC only (upload recording → transcript + random scoring)
- **V2.0:** Lead QC platform (multi-agent ecosystem, project-based QC, performance dashboards, feedback workflow)

### 1.2 Problem Statement
Currently, quality assurance is:
- **Manual & Time-Consuming:** Each call requires manual review
- **Inconsistent:** Scoring lacks standardized criteria
- **Non-Actionable:** No feedback mechanism or dispute resolution
- **Siloed:** Agent records, project criteria, and scoring are disconnected
- **Opaque:** No visibility into team lead or project-level performance

### 1.3 Proposed Solution
A unified, database-driven platform that:
- Connects agents, projects, and QC workflows
- Auto-scores calls using AI + configurable criteria
- Delivers personalized feedback via email
- Provides multi-level dashboards (Agent, Team Lead, Project, Executive)
- Enables agent feedback acknowledgment & dispute handling

### 1.4 Success Metrics
- **QC Coverage:** 100% of lead calls evaluated (vs. manual sampling)
- **Feedback Delivery:** <1 hour from QC completion to agent email
- **Agent Engagement:** >80% acknowledgment rate within 48 hours
- **Dispute Resolution:** <5% dispute rate; resolved within 2 business days
- **Data Accuracy:** Lead scoring aligns with conversion rate; min. 85% correlation

---

## SECTION 2: FEATURES & FUNCTIONALITY

### 2.1 Core Features (Must-Have)

#### **Feature 1: Agent Management**
*Timeline: Week 1-2*

**Description:** Centralized repository of all agents with their contact information and metadata.

**Functionality:**
- Add/Edit/Delete agents with required fields:
  - Full Name
  - Employee ID / Unique Code
  - Email Address (for feedback delivery)
  - Phone Number (optional)
  - Team Lead Assignment
  - Department / Role (e.g., "Lead Gen Agent")
  - Join Date
  - Status (Active / Inactive / On Leave)
  
- Bulk import agents via CSV
- Search & filter agents
- View agent activity summary (calls processed, avg. score, feedback history)

**Database Fields:**
```
agents {
  agent_id (PK)
  full_name
  employee_id (UNIQUE)
  email
  phone
  team_lead_id (FK → users)
  department
  join_date
  status
  created_at
  updated_at
}
```

**UI Components:**
- Agent management table with sort/filter
- Add Agent modal form
- Bulk upload CSV dropzone
- Agent detail card

---

#### **Feature 1.5: User Management (Admins, TLs, QC Managers)**
*Timeline: Week 1-2*

**Description:** Centralized repository for managing system users who are not agents (e.g., Team Leads, QC Managers, Admins).

**Functionality:**
- Add/Edit/Delete users with required fields:
  - Full Name
  - Email Address
  - Role (Admin, TeamLead, QCManager, Viewer)
  - Status (Active / Inactive)
- Assign Team Leads to specific teams/projects
- Manage access control and permissions based on role

**Database Fields:**
```
users {
  user_id (PK)
  full_name
  email (UNIQUE)
  role (ENUM)
  status
  created_at
  updated_at
}
```

**UI Components:**
- User management table with role filters
- Add/Edit User modal form
- Role assignment dropdowns

---

#### **Feature 2: Project Setup & Probing Questions**
*Timeline: Week 1-2*

**Description:** Define QC projects with specific evaluation criteria, probing questions, and scoring parameters.

**Functionality:**
- Create new project with:
  - Project Name (e.g., "B2B Lead Gen - Q1 2026")
  - Description / Objective
  - Start Date & End Date
  - Associated Team Lead(s)
  - Target Audience / Prospect Profile
  
- Define Probing Questions (3-10 per project):
  - Question text
  - Expected answer keywords
  - Weight/Importance (1-5)
  - Optional: Correct answer reference
  
- Configure Scoring Criteria (AI will reference these):
  - Greeting Quality (weight %)
  - Discovery / Probing (weight %)
  - Value Proposition Communication (weight %)
  - Objection Handling (weight %)
  - Closing Technique (weight %)
  - Lead Qualification Accuracy (weight %)
  - Custom criteria (defined by QC manager)
  
- Set Pass/Fail thresholds
- Link projects to agents

**Database Fields:**
```
projects {
  project_id (PK)
  project_name
  description
  start_date
  end_date
  team_lead_id (FK)
  status
  created_at
  updated_at
}

probing_questions {
  question_id (PK)
  project_id (FK)
  question_text
  expected_keywords
  weight
  reference_answer
  order_index
  created_at
}

scoring_criteria {
  criteria_id (PK)
  project_id (FK)
  criteria_name
  weight_percentage
  min_score
  max_score
  description
  created_at
}
```

**UI Components:**
- Project creation wizard (multi-step form)
- Probing questions builder (drag-drop reorder)
- Scoring criteria matrix
- Project detail dashboard
- Criteria weighting visual (pie chart)

---

#### **Feature 3: Call Upload & Processing**
*Timeline: Week 1-3*

**Description:** Interface to upload call recordings and process them through AI for transcription and scoring.

**Functionality:**
- Drag-drop file upload or file selector
- Supported formats: MP3, WAV, AAC, OGG, WebM
- File size limit: 500MB
- Assign metadata before processing:
  - Select Agent
  - Select Project
  - Call date/time
  - Prospect name (optional)
  - Lead source (optional)
  
- Real-time processing status:
  - Uploading
  - Processing (with progress %)
  - Transcribing
  - Scoring
  - Completed / Error
  
- Error handling & retry logic
- Batch upload support (up to 10 files at once)

**AI Processing Parameters (Gemini 3.1 Flash-Lite Preview):**
- Model: `gemini-3.1-flash-lite-preview`
- Free tier: Available in Google AI Studio for testing
- Paid tier: $0.25 per 1M text/image/video input tokens, $0.50 per 1M audio input tokens, $1.50 per 1M output tokens
- Status: Preview (rate limits may be restrictive; model behavior may evolve before stable release)

**Database Fields:**
```
call_audits {
  audit_id (PK)
  agent_id (FK)
  project_id (FK)
  filename
  file_url (stored on AI Studio)
  upload_status (uploading, processing, completed, error)
  processing_start_time
  processing_end_time
  call_date
  prospect_name
  lead_source
  created_at
  updated_at
}
```

**UI Components:**
- Upload dropzone with drag-drop
- File queue list with progress bars
- Upload history table
- Processing status tracker
- Error notification system

---

#### **Feature 4: AI Transcript Generation & Speaker Separation**
*Timeline: Week 2-3*

**Description:** Process uploaded audio to generate transcript with speaker identification (Agent vs. Prospect).

**Functionality:**
- Automatic speaker diarization (identify who is speaking)
- Label speakers as:
  - Agent (internal team member)
  - Prospect (external lead)
  
- Timestamp each speaker's dialogue (mm:ss format)
- Clean up filler words (optional: show/hide "um", "uh", etc.)
- Provide confidence scores for accuracy
- Allow manual editing of transcript for corrections

**AI Prompt Template (for Gemini 3.1 Flash-Lite):**
```
Transcribe this call recording and:
1. Identify and label speakers as "Agent" or "Prospect"
2. Include timestamps for each speaker turn (mm:ss)
3. Ensure accuracy of technical terms and prospect names
4. Flag any unclear audio segments
5. Output as JSON: [{speaker, timestamp, text}]
```

**Database Fields:**
```
transcripts {
  transcript_id (PK)
  audit_id (FK → call_audits)
  transcript_json (array of speaker turns)
  word_count
  duration_seconds
  clarity_score (1-10)
  manual_edit_flag
  created_at
  updated_at
}

speaker_segments {
  segment_id (PK)
  transcript_id (FK)
  speaker_label (Agent, Prospect)
  start_timestamp
  end_timestamp
  text
  confidence_score
  order_index
}
```

**UI Components:**
- Transcript viewer with timeline scrubber
- Speaker turn highlighting
- Edit mode for corrections
- Download transcript (PDF/TXT)
- Confidence badge

---

#### **Feature 5: AI-Driven Call Scoring**
*Timeline: Week 2-4 | CRITICAL: Customizable by Jaskirat*

**Description:** Automatically score each call based on:
- Project's predefined probing questions
- Scoring criteria (weighted)
- Lead qualification accuracy
- Agent's communication quality

**Scoring Components:**

**A. Criteria-Based Scoring (Customizable)**
- For each project criterion (Greeting, Discovery, Objection Handling, etc.):
  - AI scores on 0-10 scale
  - Applies project-specific weight
  - Calculates component score
  
**B. Probing Question Validation**
- Check if agent asked each probing question
- Validate if prospect gave expected answer
- Award points for correct probing: 0/partial/full credit
- Aggregate probing score (weighted)

**C. Lead Qualification Scoring (by Jaskirat)**
- Evaluate if correct lead type was identified
- Check if lead matches target ICP
- Validate qualification framework application
- Score lead fit accuracy

**D. Overall Call Score Calculation**
```
Total Score = (Criteria Score * 0.60) + (Probing Score * 0.25) + (Lead Qualification Score * 0.15)
Max Score: 100
Pass Threshold: 70 (configurable per project)
```

**AI Prompt Template:**
```
Analyze this call transcript and score based on:
1. Project criteria weights: {criteria_json}
2. Required probing questions: {probing_json}
3. Lead qualification framework: {qualification_rules}
4. Provide detailed breakdown: {component_scores}
5. Highlight key moments supporting each score
6. Output JSON: {total_score, components, reasoning}
```

**Database Fields:**
```
call_scores {
  score_id (PK)
  audit_id (FK)
  total_score (0-100)
  scoring_date
  scorer_type (AI, Manual, Dispute_Override)
  components_json {
    greeting_score,
    discovery_score,
    value_prop_score,
    objection_score,
    closing_score,
    lead_qualification_score,
    custom_criteria_scores
  }
  probing_scores_json {
    question_id: {asked: bool, answered_correctly: bool, score: int}
  }
  reasoning_text
  created_at
  updated_at
}
```

**UI Components:**
- Score card (circular progress + numeric)
- Component breakdown (bar chart or table)
- Probing question checklist (✓/✗/partial)
- Reasoning narrative
- Score history trend (if multiple calls)

---

#### **Feature 6: Feedback Generation & Email Delivery**
*Timeline: Week 3-4*

**Description:** Auto-generate personalized feedback based on scoring, package into email, and deliver to agent & team lead.

**Functionality:**

**Feedback Generation:**
- AI generates 3-5 actionable feedback points:
  - Strengths (2 points: what agent did well)
  - Improvement Areas (2-3 points: specific gaps)
  - Recommended Actions (concrete next steps)
  
- Reference specific call moments (timestamps)
- Tone: Constructive, encouraging, data-driven

**Email Template:**
```
Subject: QC Feedback – Your Call with [Prospect Name] – Score: [XX/100]

Hi [Agent Name],

Thank you for your call with [Prospect Name] on [Date]. 
Here's your QC feedback:

**Call Score: [XX/100]** | Status: [PASS/NEEDS IMPROVEMENT]

**What You Did Well:**
1. [Specific praise with example]
2. [Another strength]

**Areas for Improvement:**
1. [Specific gap with recommendation]
2. [Another gap]

**Next Steps:**
- Review [specific question/technique]
- Practice [specific skill]
- Your TL will schedule a coaching session by [Date]

Questions? Reply to this email or contact [TL Name].

Best regards,
[QC Team/System Name]

---
[Feedback Acknowledgment Link] [Dispute Link]
```

**Email Delivery:**
- Send to Agent immediately after QC completes
- CC Team Lead
- Include:
  - Full feedback narrative
  - Call transcript (if <10 pages)
  - Score breakdown
  - Quick action links (Acknowledge / Dispute)
  
- Delivery via: SendGrid / AWS SES / Gmail API
- Retry logic if delivery fails

**Database Fields:**
```
feedback {
  feedback_id (PK)
  audit_id (FK)
  agent_id (FK)
  team_lead_id (FK)
  strengths_json (array of strings)
  improvement_areas_json (array)
  recommended_actions_json (array)
  email_template_used
  email_sent_timestamp
  email_status (pending, sent, bounced, failed)
  created_at
  updated_at
}

email_logs {
  log_id (PK)
  feedback_id (FK)
  recipient_email
  recipient_type (agent, team_lead)
  sent_timestamp
  status
  bounce_reason (if failed)
  created_at
}
```

**UI Components:**
- Feedback preview modal (before send)
- Email delivery status tracker
- Retry send button
- Email template customization form
- Delivery analytics (open rate, click rate)

---

#### **Feature 7: Agent Feedback Response Interface**
*Timeline: Week 4*

**Description:** Allow agents to acknowledge feedback or dispute scoring, with team lead oversight.

**Functionality:**

**Response Options:**
1. **Acknowledge:** Agent accepts feedback
   - Button: "I understand this feedback"
   - Auto-logs timestamp & agent confirmation
   - Triggers optional coaching workflow
   
2. **Dispute:** Agent contests scoring
   - Opens form:
     - Select disputed score component
     - Reason for dispute (text: 50-500 chars)
     - Optional: Add evidence/reference (timestamps)
   - Auto-routes to Team Lead for review
   - TL can: Accept dispute (override score) / Reject dispute (uphold score)
   - Original score vs. overridden score both tracked

**Status Workflow:**
```
Feedback Sent → Agent Awaiting Response (48 hrs)
                    ↓
        (Acknowledge or Dispute)
                    ↓
    Acknowledged    |    Disputed
         ↓          |        ↓
    Coaching Log    |   TL Review Pending
                    |        ↓
                (Accept or Reject Dispute)
                    |
            Override Score / Uphold Score
```

**Database Fields:**
```
feedback_responses {
  response_id (PK)
  feedback_id (FK)
  agent_id (FK)
  response_type (acknowledge, dispute)
  response_timestamp
  dispute_reason (if dispute)
  dispute_evidence_timestamps
  status (pending, acknowledged, disputed, resolved)
  created_at
  updated_at
}

dispute_resolutions {
  resolution_id (PK)
  response_id (FK)
  team_lead_id (FK)
  resolution_type (accept_dispute, reject_dispute)
  override_score (if accepted)
  reason_notes
  resolved_timestamp
  created_at
}
```

**UI Components:**
- Email inline action buttons (Acknowledge / Dispute)
- Dispute form modal
- Dispute status dashboard (for TL)
- Resolution approval interface
- Response history log

---

### 2.2 Advanced Features (Should-Have)

#### **Feature 8: Agent Scorecard / Performance Dashboard**
*Timeline: Week 5-6*

**Description:** Visual dashboard showing individual agent performance metrics over time.

**Functionality:**
- Aggregate metrics (all calls in date range):
  - Total calls processed
  - Average score
  - Score distribution (histogram)
  - Pass rate %
  - Trend (improving/declining/stable)
  - Last QC date
  
- Performance by project
- Performance by criterion (radar chart)
- Top/bottom probing questions
- Feedback acknowledgment rate
- Dispute rate & resolution rate

- Filters: Date range, Project, Status
- Export: PDF, CSV, Email daily/weekly digest

**Database Queries:**
```
SELECT 
  agent_id,
  COUNT(*) as total_calls,
  AVG(total_score) as avg_score,
  COUNT(CASE WHEN total_score >= 70 THEN 1 END) as pass_count,
  COUNT(CASE WHEN total_score < 70 THEN 1 END) as fail_count,
  MAX(scoring_date) as last_qc_date
FROM call_scores
WHERE agent_id = ? AND scoring_date BETWEEN ? AND ?
GROUP BY agent_id;
```

**UI Components:**
- Score gauge (circular progress indicator)
- Trend sparkline (score over time)
- Metric cards (calls, avg, pass rate)
- Radar chart (criteria performance)
- Recent audits table
- Export buttons

---

#### **Feature 9: Team Lead Performance Dashboard**
*Timeline: Week 6*

**Description:** Aggregate view of all agents under a Team Lead, with team-level insights.

**Functionality:**
- Team metrics:
  - Total calls processed (team-wide)
  - Team average score
  - Team pass rate
  - Agent ranking (top/bottom performers)
  - Performance variance (consistency)
  - Coaching completion rate
  - Dispute resolution time (avg)
  
- Drill-down: Click agent name → Agent Scorecard
- Alerts:
  - Agent score dropping (week-over-week)
  - High dispute rate
  - Feedback acknowledgment <80%
  
- Team health score (composite metric)
- Export: Team report (PDF)

**UI Components:**
- Team overview cards
- Agent ranking table (sortable)
- Performance heatmap (agents vs. criteria)
- Alert notifications
- Team comparison graph

---

#### **Feature 10: Project-Level Performance Report**
*Timeline: Week 6*

**Description:** Analytics specific to a project, showing cumulative quality, top/bottom agents, criteria effectiveness.

**Functionality:**
- Project summary:
  - Total calls processed
  - Project average score
  - Pass rate %
  - On-target vs. off-target leads (if tracked)
  - Top performing agents
  - Bottom performing agents
  - Most/least effective probing questions
  
- Trend: Score trajectory (improving/declining)
- Lead quality metrics:
  - % of leads meeting ICP
  - % of leads with clear next steps
  - Estimated conversion impact (if follow-up data linked)
  
- Recommendation engine:
  - Suggest agents for additional training
  - Highlight questions causing confusion
  - Recommend process changes

**UI Components:**
- Project KPI cards
- Agent performance ranking (specific to project)
- Probing question effectiveness chart
- Trend chart (score over project duration)
- Recommendation cards with action buttons

---

### 2.3 Data & Reporting Features

#### **Feature 11: Advanced Search & Filtering**
*Timeline: Week 5*

**Functionality:**
- Multi-criteria search across all calls:
  - Agent name / ID
  - Project
  - Score range
  - Date range
  - Prospect name
  - Lead source
  - Score status (Pass / Fail / Disputed)
  
- Saved filters (e.g., "Failed calls from Q1")
- Quick filters (Last 7 days, Last 30 days, This month, etc.)

---

#### **Feature 12: Call History & Audit Trail**
*Timeline: Week 5*

**Functionality:**
- Searchable database of all processed calls
- Show: Agent, Prospect, Date, Score, Status, Transcript, Feedback
- Audit trail: Track all changes
  - Original score → Disputed → Overridden score
  - Who made change, when, reason
  
- Filter by any field
- Export call list

---

#### **Feature 13: Data Analytics & Insights**
*Timeline: Week 6-7*

**Functionality:**
- Heatmaps: Agent performance matrix
- Correlations:
  - Call duration vs. score
  - Probing questions asked vs. lead conversion
  - Agent experience vs. performance
  
- Predictive insights:
  - Which leads are high-probability conversions
  - Which agents need intervention
  - Which processes are breaking down

---

---

## SECTION 3: TECHNICAL ARCHITECTURE

### 3.1 Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Frontend** | React 18, TypeScript, Vite | SPA, responsive design |
| **Styling** | Tailwind CSS, Lucide React | Pre-built component system |
| **Backend / API** | Node.js + Express (or Python FastAPI) | REST API, hosted on AI Studio |
| **Database** | Firestore (Google Cloud) OR PostgreSQL | Persistent storage, scalable |
| **Authentication** | Firebase Auth OR Supabase Auth | User management, SSO-ready |
| **Storage** | Google Cloud Storage OR AWS S3 | Audio file storage (encrypted) |
| **AI / LLM** | Google Gemini API using `gemini-3.1-flash-lite-preview` | Audio transcription, lead scoring, summary generation, structured outputs, feedback generation |
| **Email** | SendGrid OR AWS SES | Feedback delivery |
| **Hosting** | AI Studio (provided) | All infrastructure managed |
| **Monitoring** | Cloud Logging, Error tracking (Sentry) | Debug & performance insights |

---

### 3.2 Database Schema (Relational Model)

```sql
-- Users (Team Leads, Admins, QC Managers)
CREATE TABLE users (
  user_id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  role ENUM('Admin', 'TeamLead', 'QCManager', 'Agent', 'Viewer'),
  team_id FK (to teams table),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Teams
CREATE TABLE teams (
  team_id UUID PRIMARY KEY,
  team_name VARCHAR(255),
  team_lead_id FK (to users),
  department VARCHAR(100),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Agents (Lead generation agents)
CREATE TABLE agents (
  agent_id UUID PRIMARY KEY,
  full_name VARCHAR(255),
  employee_id VARCHAR(100) UNIQUE,
  email VARCHAR(255),
  phone VARCHAR(20),
  team_lead_id FK (to users),
  department VARCHAR(100),
  join_date DATE,
  status ENUM('Active', 'Inactive', 'OnLeave'),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Projects (QC projects)
CREATE TABLE projects (
  project_id UUID PRIMARY KEY,
  project_name VARCHAR(255),
  description TEXT,
  start_date DATE,
  end_date DATE,
  team_lead_id FK (to users),
  status ENUM('Active', 'Archived', 'Planning'),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Probing Questions (linked to projects)
CREATE TABLE probing_questions (
  question_id UUID PRIMARY KEY,
  project_id FK (to projects),
  question_text TEXT,
  expected_keywords TEXT,
  weight INT (1-5),
  reference_answer TEXT,
  order_index INT,
  created_at TIMESTAMP
);

-- Scoring Criteria (linked to projects)
CREATE TABLE scoring_criteria (
  criteria_id UUID PRIMARY KEY,
  project_id FK (to projects),
  criteria_name VARCHAR(255),
  weight_percentage DECIMAL(5,2),
  min_score INT,
  max_score INT,
  description TEXT,
  created_at TIMESTAMP
);

-- Call Audits (main table for processed calls)
CREATE TABLE call_audits (
  audit_id UUID PRIMARY KEY,
  agent_id FK (to agents),
  project_id FK (to projects),
  filename VARCHAR(500),
  file_url VARCHAR(1000),
  upload_status ENUM('Uploading', 'Processing', 'Completed', 'Error'),
  processing_start_time TIMESTAMP,
  processing_end_time TIMESTAMP,
  call_date TIMESTAMP,
  prospect_name VARCHAR(255),
  lead_source VARCHAR(100),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Transcripts
CREATE TABLE transcripts (
  transcript_id UUID PRIMARY KEY,
  audit_id FK (to call_audits),
  transcript_json JSONB,
  word_count INT,
  duration_seconds INT,
  clarity_score INT (1-10),
  manual_edit_flag BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Speaker Segments (within transcripts)
CREATE TABLE speaker_segments (
  segment_id UUID PRIMARY KEY,
  transcript_id FK (to transcripts),
  speaker_label ENUM('Agent', 'Prospect'),
  start_timestamp INT,
  end_timestamp INT,
  text TEXT,
  confidence_score DECIMAL(3,2),
  order_index INT
);

-- Call Scores (scoring results)
CREATE TABLE call_scores (
  score_id UUID PRIMARY KEY,
  audit_id FK (to call_audits),
  total_score DECIMAL(5,2),
  scoring_date TIMESTAMP,
  scorer_type ENUM('AI', 'Manual', 'DisputeOverride'),
  components_json JSONB,
  probing_scores_json JSONB,
  reasoning_text TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Feedback
CREATE TABLE feedback (
  feedback_id UUID PRIMARY KEY,
  audit_id FK (to call_audits),
  agent_id FK (to agents),
  team_lead_id FK (to users),
  strengths_json JSONB,
  improvement_areas_json JSONB,
  recommended_actions_json JSONB,
  email_template_used VARCHAR(100),
  email_sent_timestamp TIMESTAMP,
  email_status ENUM('Pending', 'Sent', 'Bounced', 'Failed'),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Email Logs
CREATE TABLE email_logs (
  log_id UUID PRIMARY KEY,
  feedback_id FK (to feedback),
  recipient_email VARCHAR(255),
  recipient_type ENUM('Agent', 'TeamLead'),
  sent_timestamp TIMESTAMP,
  status ENUM('Pending', 'Sent', 'Bounced', 'Failed'),
  bounce_reason TEXT,
  created_at TIMESTAMP
);

-- Feedback Responses (Agent acknowledgment / dispute)
CREATE TABLE feedback_responses (
  response_id UUID PRIMARY KEY,
  feedback_id FK (to feedback),
  agent_id FK (to agents),
  response_type ENUM('Acknowledge', 'Dispute'),
  response_timestamp TIMESTAMP,
  dispute_reason TEXT,
  dispute_evidence_timestamps TEXT,
  status ENUM('Pending', 'Acknowledged', 'Disputed', 'Resolved'),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Dispute Resolutions (Team Lead review of disputes)
CREATE TABLE dispute_resolutions (
  resolution_id UUID PRIMARY KEY,
  response_id FK (to feedback_responses),
  team_lead_id FK (to users),
  resolution_type ENUM('AcceptDispute', 'RejectDispute'),
  override_score DECIMAL(5,2),
  reason_notes TEXT,
  resolved_timestamp TIMESTAMP,
  created_at TIMESTAMP
);
```

### 3.3 API Endpoints (REST)

**Base URL:** `https://altleads-qc.ai-studio.com/api/v1`

| Method | Endpoint | Purpose |
|--------|----------|---------|
| **AGENTS** | | |
| POST | `/agents` | Create agent |
| GET | `/agents` | List all agents |
| GET | `/agents/{agent_id}` | Get agent details |
| PUT | `/agents/{agent_id}` | Update agent |
| DELETE | `/agents/{agent_id}` | Delete agent |
| POST | `/agents/bulk-upload` | CSV bulk upload |
| **PROJECTS** | | |
| POST | `/projects` | Create project |
| GET | `/projects` | List projects |
| GET | `/projects/{project_id}` | Get project details |
| PUT | `/projects/{project_id}` | Update project |
| **PROBING QUESTIONS** | | |
| POST | `/projects/{project_id}/questions` | Add question to project |
| PUT | `/projects/{project_id}/questions/{question_id}` | Update question |
| DELETE | `/projects/{project_id}/questions/{question_id}` | Delete question |
| **CALL AUDITS** | | |
| POST | `/audits/upload` | Upload call recording |
| GET | `/audits` | List audits (with filters) |
| GET | `/audits/{audit_id}` | Get audit details |
| GET | `/audits/{audit_id}/transcript` | Get transcript |
| GET | `/audits/{audit_id}/scores` | Get scores & feedback |
| **SCORING** | | |
| POST | `/audits/{audit_id}/score` | Trigger AI scoring |
| GET | `/audits/{audit_id}/score` | Get score result |
| **FEEDBACK** | | |
| POST | `/audits/{audit_id}/feedback/send` | Generate & send feedback |
| GET | `/feedback/{feedback_id}` | Get feedback details |
| **FEEDBACK RESPONSES** | | |
| POST | `/feedback/{feedback_id}/acknowledge` | Agent acknowledges |
| POST | `/feedback/{feedback_id}/dispute` | Agent disputes |
| **DASHBOARDS** | | |
| GET | `/agents/{agent_id}/scorecard` | Agent performance |
| GET | `/teams/{team_id}/dashboard` | Team Lead dashboard |
| GET | `/projects/{project_id}/report` | Project report |
| **SEARCH & FILTERS** | | |
| GET | `/audits/search` | Advanced search |
| GET | `/analytics/insights` | Data insights |

### 3.4 AI Processing Pipeline

**Flow: Upload → Transcription → Scoring → Feedback**

```
1. User uploads audio file
   ↓
2. File stored in cloud storage (S3 / GCS)
   ↓
3. Send to Gemini 3.1 Flash-Lite Preview for processing:
   - Model: gemini-3.1-flash-lite-preview
   - Single unified call handles transcription + analysis
   ↓
4. Receive structured output (JSON):
   - [{speaker, timestamp, text}, ...]
   - Transcript analysis
   - Component scores
   ↓
5. Process results through scoring logic:
   a) Extract probing questions asked
   b) Evaluate against project criteria
   c) Assign component scores
   d) Calculate total score
   ↓
6. Generate feedback narrative (same Gemini call or follow-up):
   - 2 strengths
   - 2-3 improvements
   - 3 action items
   ↓
7. Compose email & send via SendGrid
   ↓
8. Log email delivery status
   ↓
9. Wait for agent response (Acknowledge / Dispute)
```

**Note on Gemini 3.1 Flash-Lite Preview (Preview Status):**
- Currently in preview; free tier available in Google AI Studio for testing
- Rate limits may be more restrictive than stable models
- Model behavior and capabilities may evolve before stable release
- Plan to migrate to stable release once available

### 3.5 Authentication & Authorization

**Methods:**
- Firebase Auth (Google Sign-in, Email/Password)
- OR Supabase Auth with OAuth

**Roles & Permissions:**
```
Admin:
  - All endpoints (full access)
  - User & project management
  - System settings
  
TeamLead:
  - View all agents on their team
  - View all projects assigned
  - Approve/reject disputes
  - Export reports
  - Email configuration
  
QCManager:
  - Upload calls
  - Trigger scoring
  - View all audits
  - Manage projects & criteria
  - View all dashboards
  
Agent:
  - View own scorecard
  - View own feedback history
  - Acknowledge / dispute feedback
  
Viewer:
  - Read-only access to dashboards
  - No edit / upload permissions
```

---

## SECTION 4: IMPLEMENTATION TIMELINE & ROADMAP

### Phase Overview

| Phase | Sprint | Weeks | Focus | Deliverable |
|-------|--------|-------|-------|------------|
| **Alpha** | 1-2 | 1-2 weeks | Core: Agents, Projects, Upload, Scoring | MVP working end-to-end |
| **Beta** | 3-4 | 3-4 weeks | Feedback, Dashboards, Email delivery | Full feature parity |
| **Release** | 5-6 | 5-7 weeks | Polish, Testing, Docs | Production-ready |

---

### Detailed Sprint Breakdown

#### **SPRINT 1 (Weeks 1-2): Foundation & Core Setup**

| Feature | Task | Assignee | Duration | Status |
|---------|------|----------|----------|--------|
| **Database Setup** | Design schema, create tables, set up cloud DB | AI Studio | 2 days | — |
| **Authentication** | Firebase/Supabase setup, user roles | AI Studio | 2 days | — |
| **Frontend Boilerplate** | React app setup, routing, UI framework | AI Studio | 2 days | — |
| **Agent Management** | Add/edit/delete agents, CSV bulk upload | AI Studio | 3 days | — |
| **Project Setup** | Create project, add probing questions, criteria | AI Studio | 3 days | — |
| **Call Upload** | Drag-drop interface, file validation | AI Studio | 2 days | — |

**Deliverable:** Basic UI + DB, agents & projects manageable

---

#### **SPRINT 2 (Weeks 2-3): AI Integration & Transcription**

| Feature | Task | Duration | Status |
|---------|------|----------|--------|
| **Gemini API Integration** | API setup, auth, structured outputs config | 2 days | — |
| **Transcription Pipeline** | Send audio to Gemini → receive JSON transcripts | 2 days | — |
| **Speaker Diarization** | Identify Agent vs. Prospect in output | 1 day | — |
| **Transcript Viewer UI** | Timeline scrubber, speaker highlighting | 2 days | — |
| **Error Handling** | Rate limit handling, retry logic, fallback config | 1 day | — |

**Deliverable:** Upload → Transcription working (core v1 maintained)

---

#### **SPRINT 3 (Weeks 3-4): Scoring & Feedback**

| Feature | Task | Duration | Status |
|---------|------|----------|--------|
| **Scoring Engine** | Implement criteria-based scoring | 3 days | — |
| **Probing Q Validation** | Check questions, map answers | 2 days | — |
| **Lead Qualification Logic** | Integrate Jaskirat's criteria (TBD) | 2 days | — |
| **Feedback Generation** | AI-generated narratives (Gemini) | 2 days | — |
| **Email Integration** | SendGrid setup, template, delivery | 2 days | — |
| **Feedback Response UI** | Acknowledge/Dispute buttons | 2 days | — |

**Deliverable:** Full feedback workflow, email delivery

---

#### **SPRINT 4 (Weeks 4-5): Dashboards & Analytics**

| Feature | Task | Duration | Status |
|---------|------|----------|--------|
| **Agent Scorecard** | Individual performance dashboard | 3 days | — |
| **Team Lead Dashboard** | Aggregate team metrics | 2 days | — |
| **Project Report** | Project-level analytics | 2 days | — |
| **Search & Filters** | Multi-criteria search | 2 days | — |
| **Charts & Visualizations** | Graphs, heatmaps, trend lines | 2 days | — |

**Deliverable:** All dashboards functional, searchable

---

#### **SPRINT 5 (Weeks 5-6): Dispute Resolution & Polish**

| Feature | Task | Duration | Status |
|---------|------|----------|--------|
| **Dispute Workflow** | TL review, approve/reject, score override | 3 days | — |
| **Dispute Status Tracking** | Dashboard for pending disputes | 1 day | — |
| **Performance Optimization** | Query optimization, caching | 2 days | — |
| **Error Handling** | Comprehensive error messages | 1 day | — |
| **UI Polish** | Responsive design, accessibility | 2 days | — |

**Deliverable:** Dispute workflow complete, app polished

---

#### **SPRINT 6 (Weeks 6-7): Testing, Docs & Launch**

| Feature | Task | Duration | Status |
|---------|------|----------|--------|
| **QA Testing** | End-to-end testing, bug fixes | 3 days | — |
| **Documentation** | API docs, user guide, admin guide | 2 days | — |
| **Training Materials** | Video tutorials, screenshots | 2 days | — |
| **Performance Testing** | Load testing, scalability checks | 1 day | — |
| **Production Deployment** | Launch on AI Studio | 1 day | — |

**Deliverable:** Production-ready system, fully documented

---

### Timeline Summary

```
Week 1-2:   ████ Agent Management + Project Setup
Week 2-3:   ████ Transcription (Gemini 3.1 Flash-Lite)
Week 3-4:   ████ Scoring + Feedback + Email
Week 4-5:   ████ Dashboards + Analytics
Week 5-6:   ████ Dispute Resolution + Polish
Week 6-7:   ████ Testing + Documentation + Launch

Total Duration: 6-7 weeks
Estimated Effort: 280-320 person-hours (AI Studio dev time)
```

---

## SECTION 5: FEATURES ADDED BY ANKIT (VS. ORIGINAL V1)

| Original V1 | V2.0 Addition | Week Introduced | Justification |
|------------|---------------|-----------------|--------------|
| Upload call, get transcript | **Multi-agent ecosystem** | Week 1-2 | Scale to team |
| Random scoring | **Configurable scoring criteria** | Week 3-4 | Alignment with Amplior QM |
| No context | **Project-based framework** | Week 1-2 | Contextual QC |
| No feedback | **Email feedback delivery** | Week 3-4 | Agent development |
| One-way evaluation | **Agent dispute response** | Week 4-5 | Fairness & accuracy |
| Manual dashboards | **Agent Scorecard** | Week 4-5 | Individual coaching |
| No team visibility | **Team Lead Dashboard** | Week 4-5 | Team management |
| Basic reporting | **Project + Analytics reports** | Week 4-5 | Executive visibility |
| — | **Advanced search & audit trail** | Week 5 | Compliance & debugging |
| — | **Gemini 3.1 Flash-Lite integration** | Week 2-3 | Cost-effective, unified AI processing |

---

## SECTION 6: KEY CUSTOMIZATIONS & INTEGRATIONS NEEDED

### 6.1 Scoring Customization (CRITICAL)

**Owner:** Jaskirat (Scoring Framework)  
**Timeline:** Before Week 3

**Requirements:**
- Define weighted scoring criteria (vs. basic 5-parameter model)
- Specify lead qualification logic:
  - What makes a "qualified" lead?
  - What are disqualifying factors?
  - How to evaluate ICP fit?
  - How to score probing question responses?
  
- Provide example call transcripts with expected scores (for QA)
- Define pass/fail thresholds per project

**Deliverable:** JSON config file with scoring rules

```json
{
  "scoring_framework": "AltLeads_Amplior_v1",
  "total_max_score": 100,
  "pass_threshold": 70,
  "criteria": [
    {
      "name": "Greeting Quality",
      "weight": 8,
      "max_points": 10,
      "rubric": "..."
    },
    {
      "name": "Probing Questions",
      "weight": 25,
      "max_points": 25,
      "questions": [
        {
          "question": "What is your current process?",
          "weight": 5,
          "keywords": ["process", "workflow", "currently"]
        }
      ]
    },
    {
      "name": "Lead Qualification",
      "weight": 30,
      "max_points": 30,
      "rules": {
        "icp_fit": "...",
        "budget_signal": "...",
        "decision_maker": "..."
      }
    }
  ]
}
```

---

### 6.2 Email Integration

**Owner:** Ankit or IT Team  
**Timeline:** Week 3

**Setup Required:**
- SendGrid API key (or AWS SES)
- Email sender address (noreply@altleads.com)
- Email template design (HTML)
- Unsubscribe link (GDPR compliance)

---

### 6.3 CRM Integration (Future - Phase 2)

**Potential Integrations:**
- **Zoho CRM:** Link leads to calls, track conversion
- **HubSpot:** Auto-create contact records
- **Salesforce:** Sync call scores to records

**Timeline:** Post-launch (Phase 2)

---

## SECTION 7: SUCCESS CRITERIA & KPIs

| KPI | Target | Owner | Frequency |
|-----|--------|-------|-----------|
| QC Coverage | 100% of lead calls processed | Ankit | Daily |
| Feedback Delivery Time | <1 hour from QC complete | AI Studio | Daily |
| Agent Acknowledgment Rate | >80% within 48 hours | Ankit | Weekly |
| Dispute Rate | <5% of all QCs | Ankit | Weekly |
| Dispute Resolution Time | <2 business days | Ankit | Weekly |
| Score Accuracy | >85% correlation with conversion | Ankit | Monthly |
| System Uptime | >99% | AI Studio | Monthly |
| API Response Time | <2 sec (avg) | AI Studio | Daily |
| Email Delivery Rate | >98% | SendGrid | Daily |

---

## SECTION 8: RISK MITIGATION & CONTINGENCY

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Gemini API rate limit exceeded** | Transcription delay | Queue processing, request quota increase, monitor usage |
| **Gemini preview model behavior changes** | Scoring/transcription quality shifts | Document baseline performance, maintain fallback model config |
| **Poor transcription quality** | Bad scoring | Manual edit interface + QA sampling |
| **Email delivery failure** | Agents don't get feedback | Retry logic + in-app notification fallback |
| **Database performance** | Dashboard slow | Query optimization, indexing, caching |
| **Agent disputes overwhelm TL** | Backlog builds | Set SLA, escalate to admin if needed |
| **Scoring inconsistency** | Low trust in system | Calibration session, sample audits, training |

---

## SECTION 9: DEPLOYMENT & HOSTING

**Platform:** AI Studio (fully managed)

**Deployment Steps:**
1. Connect GitHub repo to AI Studio
2. Configure environment variables (API keys, DB credentials)
3. Run database migrations
4. Deploy frontend + backend containers
5. Set up monitoring & alerting
6. Configure backup & recovery procedures
7. DNS setup (altleads-qc.ai-studio.com)

**Post-Deployment:**
- Daily health checks (uptime, API latency)
- Weekly backups
- Monthly security review
- Quarterly performance optimization

---

## SECTION 10: FUTURE ROADMAP (Post-Launch)

### Phase 2 (Q2 2026): Integrations & Advanced Analytics
- CRM integrations (Zoho, HubSpot)
- Advanced AI (predictive lead scoring, agent coaching)
- Multi-language support
- Mobile app (React Native)

### Phase 3 (Q3 2026): Scaling & Customization
- Multi-tenant support (white-label)
- Custom scoring models (per client)
- Real-time dashboards (WebSocket updates)
- Slack/Teams integration for notifications

### Phase 4 (Q4 2026+): Enterprise Features
- Advanced compliance (SOC 2, GDPR)
- Workforce management (scheduling, forecasting)
- Advanced reporting (custom dashboards)
- API marketplace for partners

---

## SECTION 11: SUCCESS CHECKLIST

**Pre-Launch:**
- [ ] All database tables created & indexed
- [ ] Authentication working (user login, roles)
- [ ] Agent management CRUD complete
- [ ] Project setup & probing questions functional
- [ ] Call upload processing working
- [ ] Transcription (Gemini) integrated
- [ ] Scoring engine implemented per Jaskirat spec
- [ ] Feedback generation & email delivery working
- [ ] Dispute workflow tested
- [ ] All dashboards rendering correctly
- [ ] Search & filters functional
- [ ] Error handling comprehensive
- [ ] UI responsive on mobile/tablet
- [ ] API documentation complete
- [ ] User guide & training materials ready
- [ ] QA testing passed (no critical bugs)
- [ ] Performance testing OK (<2 sec response time)
- [ ] Backup & disaster recovery tested
- [ ] Production deployment verified

---

## SECTION 12: APPENDIX

### A. Glossary
- **QC:** Quality Assurance / Quality Control
- **Agent:** Lead generation representative making outbound calls
- **Prospect:** Potential customer / lead being called
- **Project:** A defined QC initiative with specific goals, criteria, and agents
- **Probing Question:** A question asked by the agent to qualify the lead
- **Scoring Criteria:** Dimensions on which a call is evaluated
- **Lead Qualification:** Process of determining if a lead meets buyer criteria (ICP, budget, authority, etc.)
- **Dispute:** Agent's objection to a score; reviewed by Team Lead
- **Feedback:** AI-generated insights delivered to agent after QC
- **SLA:** Service Level Agreement (e.g., <2 hr response time)

### B. Contact & Support

**Project Owner:** Ankit Sundriyal  
**Development Partner:** AI Studio  
**Scoring Framework:** Jaskirat (to provide rules & rubric)

**Questions?**
- Email: ankit@altleads.com
- Slack: #alt-leads-qc-dev

---

**Document Version:** 2.1  
**Last Updated:** March 17, 2026  
**Status:** Ready for Development  
**AI Model:** Gemini 3.1 Flash-Lite Preview (Free tier for testing, paid tier for production)  
**Next Step:** Send to AI Studio for development kickoff