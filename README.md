# CoSora — Enterprise Legal AI Automation Platform

**CoSora** is a cutting-edge enterprise legal department AI automation platform, named after **Cornellia Sorabji** (1866–1954) — the first Indian woman to study law at Oxford University.

CoSora automates complex legal workflows using a **distributed multi-agent AI system** built on the **Microsoft Azure AI stack**. Twelve specialized legal agents are orchestrated by a central AI agent, processing every task through a standardized **L0–L9 pipeline** with mandatory **human-in-the-loop (HITL) approvals** and immutable **audit logging** for complete compliance.

---

## 🎯 Problem Statement

### Challenges in Modern Legal Operations

1. **Manual Task Bottlenecks** — Legal teams manually handle repetitive document review, classification, and initial analysis
2. **Slow Approval Cycles** — Multi-department approvals (Finance, Compliance, HR) delay contract execution
3. **Compliance Risk** — Limited audit trails and human errors in document handling
4. **Cross-Department Silos** — Finance, HR, and Legal teams work in isolation without integrated workflows
5. **CLM Integration Gaps** — Existing Contract Lifecycle Management (CLM) software lacks AI-powered automation
6. **Government Compliance** — Litigation and regulatory communication requires careful tracking and human oversight
7. **Enterprise Policy Management** — Board decisions and policy changes are not systematically tracked
8. **Scalability Issues** — As enterprises grow, legal operations struggle to keep pace

### Impact on Enterprise

- ⏱️ **30-40% time waste** on routine legal tasks
- 💰 **Higher operational costs** due to manual processes
- ⚠️ **Compliance violations** from inconsistent handling
- 🔄 **Slow contract cycles** affecting business revenue

---

## ✅ Solution Overview

CoSora provides an **intelligent, compliant, and transparent legal automation engine** that:

### Core Capabilities

1. **AI-Powered Document Analysis**
   - Automated contract classification, risk identification, clause extraction
   - Intelligent legal context matching (Indian legal framework integrated)
   - Smart document comparison and version control

2. **Multi-Agent Orchestration**
   - 12 specialized legal agents (Classification, Risk Analysis, Clause Extraction, etc.)
   - Intelligent workflow routing based on document type and risk level
   - Real-time coordination through central Orchestrator

3. **Human-in-the-Loop (HITL) Governance**
   - **Mandatory approval gates** at critical stages (L3, L6, L7, L8)
   - Password-based approval on desktop
   - **Biometric authentication** on mobile (for Admin users only)
   - Role-based decision authority

4. **Comprehensive Audit System**
   - Immutable audit chain (blockchain-inspired SHA256 hashing)
   - Complete action history with actor, timestamp, and changes
   - Compliance-ready audit logs

5. **Enterprise Integration**
   - **Email Integration** — Share documents via email, track external communications
   - **CLM Integration** — Seamless connection with existing CLM platforms
   - **Department Approvals** — Built-in Finance, Accounting, HR approval workflows
   - **External Communication Monitoring** — Receive government/lawyer emails, notify appropriate admins

6. **Corporate Governance Management**
   - Tracks board decisions, policy changes, meeting resolutions
   - Maintains policy version history
   - Manual input for corporate decisions and their downstream effects

7. **Litigation Support System**
   - Agent drafts litigation strategies and responses
   - **Never directly contacts** external lawyers, judges, government agencies
   - **Notifications only** — Admin users receive alerts about incoming government emails
   - Helps coordinate internal response

8. **Mobile Admin Dashboard** *(Coming Soon)*
   - Real-time monitoring of all documents and workflows
   - Stage tracking for each contract/document
   - Biometric HITL approvals
   - Push notifications for critical approvals

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                              │
├─────────────────────────────────────────────────────────────────────────┤
│  Next.js 14 Frontend  │  Mobile App (React Native)  │  Admin Dashboard │
│  (Web Portal)         │  (Biometric HITL)           │  (Real-time)     │
└──────────┬────────────────────────┬──────────────────────────────────────┘
           │ REST API + WebSocket (Socket.io)
┌──────────▼─────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                                 │
├──────────────────────────────────────────────────────────────────────────┤
│  Express.js Backend Server                                              │
│  ├─ Authentication (JWT + Refresh Tokens)                              │
│  ├─ RBAC Middleware (Admin/Editor/Reviewer)                            │
│  ├─ HITL Approval Engine                                               │
│  ├─ Audit Log System (Immutable Chain)                                 │
│  ├─ Email Service (SMTP Integration)                                   │
│  ├─ Document Upload & Analysis                                         │
│  └─ WebSocket Server (Real-time Updates)                               │
└──────────┬─────────────────────────────────────────────────────────────┘
           │
┌──────────▼─────────────────────────────────────────────────────────────┐
│                      AI ORCHESTRATION LAYER                            │
├──────────────────────────────────────────────────────────────────────────┤
│  Central Orchestrator Agent (Azure OpenAI GPT-4)                        │
│  ├─ Workflow Intelligence                                               │
│  ├─ Agent Coordination                                                  │
│  ├─ Context Management                                                  │
│  └─ Decision Routing                                                    │
│                                                                          │
│  12 Specialized Legal Agents:                                           │
│  ├─ Classification Agent                                               │
│  ├─ Risk Analyzer                                                      │
│  ├─ Clause Extraction                                                  │
│  ├─ Compliance Checker                                                 │
│  ├─ Indian Legal Context Matcher                                       │
│  ├─ Employment Specialist                                              │
│  ├─ IP Rights Agent                                                    │
│  ├─ Data Privacy Agent                                                 │
│  ├─ M&A Specialist                                                     │
│  ├─ Litigation Advisor                                                 │
│  ├─ Policy Curator                                                     │
│  └─ Knowledge Base Navigator                                           │
└──────────┬─────────────────────────────────────────────────────────────┘
           │
┌──────────┴──────────────────────┬──────────────────────────────────────┐
│                                 │                                      │
│                                 │                                      │
▼                                 ▼                                      ▼
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐
│   PostgreSQL 15      │  │     Redis 7          │  │  File Storage    │
│   + Prisma ORM       │  │  (Bull Job Queue)    │  │  (Local/Azure)   │
│                      │  │  (Cache Layer)       │  │                  │
│  ✓ User Management   │  │  ✓ Async Jobs       │  │  ✓ Contracts    │
│  ✓ Task Pipeline     │  │  ✓ Real-time Sync   │  │  ✓ Documents    │
│  ✓ Approvals         │  │  ✓ Rate Limiting    │  │  ✓ Drafts       │
│  ✓ Audit Logs        │  │  ✓ Session Cache    │  │  ✓ Uploaded PDFs │
│  ✓ Documents         │  │                      │  │                  │
│  ✓ Notifications     │  │                      │  │                  │
└──────────────────────┘  └──────────────────────┘  └──────────────────┘
```

### Data Flow: Task Processing Pipeline (L0–L9)

```
L0: INTAKE
↓ (Document uploaded)
→ Classification Agent → Determines legal domain
↓
L1: CLASSIFICATION
↓ 
→ Risk Analyzer → Assigns risk score (1-5)
↓
L2: RISK ASSESSMENT
↓ 
→ Clause Extraction Agent → Extracts key clauses
↓
L3: CLAUSE ANALYSIS ⚠️ HITL GATE 1 (Password Required)
↓ (Admin/Editor reviews initial analysis)
→ Compliance Checker → Validates against policies
↓
L4: COMPLIANCE CHECK
↓ 
→ Domain Specialist (Contract/IP/Employment/etc)
↓
L5: DOMAIN ANALYSIS
↓ 
L6: CROSS-DEPT APPROVAL ⚠️ HITL GATE 2 (Password Required)
↓ (Finance Head approves if contract > threshold)
→ Finance, HR, Compliance Reviewers
↓
L7: EXECUTIVE REVIEW ⚠️ HITL GATE 3 (Biometric on Mobile, Password on Desktop)
↓ (Head of Legal reviews final recommendations)
→ Policy Curator → Updates corporate governance
↓
L8: FINAL APPROVAL ⚠️ HITL GATE 4 (Biometric on Mobile, Password on Desktop)
↓ (General Counsel final sign-off)
→ Email Service → Share with stakeholders
↓
L9: EXECUTION
↓ (Document finalized, archived)
✓ COMPLETE
```

---

## 👥 Team & Roles

| Team Member | Role | Responsibilities |
|-------------|------|------------------|
| **Akshaj Nihaniwal** | **Tech Lead & Full-Stack Architect** | System architecture, backend infrastructure (Node.js + Express + PostgreSQL + Redis), database schema design, DevOps & deployment, Azure integration, JWT auth & RBAC security implementation, API development |
| **Ayush Samor** | **Frontend Engineer & Real-Time Systems** | Next.js 14 frontend engineering, WebSocket & Socket.io real-time pipeline, audit log live streaming, HITL approval flow implementation, Office 365 add-in development (Word & Outlook), Microsoft Graph API integration |
| **Lakshya Chowdhry** | **AI/Agent Specialist & Integration Lead** | Multi-agent orchestration on Azure AI Foundry, Azure OpenAI prompt engineering for all 12 specialist agents, RAG pipeline setup on Azure AI Search, CLM integrations (Ironclad, DocuSign, SAP Ariba), email classification service, legal knowledge base curation |

---

## 🔑 User Types & Authority Levels

### Assignment & Management

> **Important:** User type assignment is **completely decided by the enterprise itself**. The role mapping below is a guideline; actual assignment depends on organizational structure.

> **Role Changes:** Any change in user type requires **unanimous approval from all Admin users** for security and governance compliance.

### User Type 1: ADMIN

**Authority Level:** Complete Control

**Default Enterprise Roles:**
- General Counsel (Head of Legal)
- Head of Legal Department
- Managing Partner / COO
- Compliance Officer
- Chief Legal Officer

**Permissions:**
- ✅ View ALL tasks, documents, and workflows
- ✅ HITL approval at all stages (L3, L6, L7, L8)
- ✅ Override any workflow decision
- ✅ Reject documents at any stage
- ✅ User management (create/edit/deactivate users)
- ✅ System configuration and settings
- ✅ View complete audit logs
- ✅ Access mobile app with **biometric HITL approval**
- ✅ Receive government/external communication alerts
- ✅ Manage corporate governance decisions

**Login Credentials (Demo):**
```
ADMIN
General Counsel — 001D-415A-3516-6481
Head of Legal — F66C-630D-9610-9900
Managing Partner — A74A-92E1-9C18-EC4E

EDITOR
Contract Editor — 24DC-68CA-DDAF-7B5E
Employment Editor — 219A-4EE2-03BE-ACC8
IP Editor — 9CBB-01D0-0029-5C48
Privacy Editor — 9176-4E15-97DE-9024
Regulator Editor — 4521-034F-0F1A-E3D1
Property Editor — BD92-E9EA-CB92-EEF4

REVIEWER
Finance Head — A8C3-398B-67FB-D6C6
HR Head — 1FAD-8521-B9E8-51DD
Compliance Officer — 71C8-6ADC-DD4A-A792

Password for all users : CoSora2024!
```

---

### User Type 2: EDITOR

**Authority Level:** Domain-Specific Task Creation & Editing

**Default Enterprise Roles:**
- Senior Legal Counsel (domain specialists)
- Contract Managers
- Employment Law Specialists
- IP Counsel
- Data Privacy Officer
- Policy Drafters
- Property/Real Estate Specialists

**Permissions:**
- ✅ Create NEW tasks within assigned domain(s)
- ✅ Edit draft documents
- ✅ Generate AI-powered initial drafts
- ✅ Submit documents for HITL approval
- ✅ Add comments and annotations
- ✅ View assigned tasks and related documents
- ✅ Access collaboration features (email sharing)
- ❌ Cannot approve at HITL gates
- ❌ Cannot view other domain's sensitive docs
- ❌ Cannot access system settings

**Login Credentials (Demo):**
```
User ID: 1449-B16D-76D7-EFBF  (Contract Editor)
User ID: 3D90-A186-0ABE-DCB8  (Employment Editor)
User ID: C27B-2B05-EB03-052B  (IP Editor)
User ID: 3E72-093E-E2C7-2495  (Privacy Editor)
User ID: 8F39-5FBE-27BB-A531  (Regulator Editor)
User ID: D34B-74B8-DB44-B43E  (Property Editor)
Password: CoSora2024! (all editors)
```

---

### User Type 3: REVIEWER

**Authority Level:** Cross-Department Approval

**Default Enterprise Roles:**
- Finance Head (CFO, Finance Manager)
- HR Head (Chief People Officer)
- Compliance Officer / Risk Manager
- Accounting Manager
- Department Directors (Finance, HR, Compliance)

**Permissions:**
- ✅ Review documents submitted for approval
- ✅ HITL approval/rejection at assigned gates (L6, L7)
- ✅ Add comments and feedback on clauses
- ✅ View department-relevant tasks
- ✅ Receive approval notifications
- ❌ Cannot edit documents
- ❌ Cannot create new tasks
- ❌ Cannot access system settings
- ❌ Cannot override decisions

**Login Credentials (Demo):**
```
User ID: 16B0-6A5F-106F-0DD6  (Finance Head)
User ID: 1433-B095-620A-AC53  (HR Head)
User ID: B66F-8209-BD2B-9E9E  (Compliance Officer)
Password: CoSora2024! (all reviewers)
```

---

## 🤖 The 12 Specialized Legal Agents

Each agent is specialized in a specific legal domain and collaborates with others:

1. **Classification Agent** — Determines legal domain (Contract, Employment, IP, etc.)
2. **Risk Analyzer** — Calculates risk score based on key indicators
3. **Clause Extraction Agent** — Identifies and extracts critical clauses
4. **Compliance Checker** — Validates against enterprise policies
5. **Indian Legal Context Matcher** — Ensures compliance with Indian legal framework
6. **Employment & Labour Specialist** — Reviews employment agreements, compliance
7. **IP & Patent Specialist** — Analyzes intellectual property clauses
8. **Data Privacy & Security Agent** — GDPR/data privacy compliance
9. **M&A Specialist** — Acquisition and merger analysis
10. **Litigation Advisor** — Litigation strategy and defense (draft only, no external contact)
11. **Policy Curator** — Manages corporate governance and policy updates
12. **Knowledge Base Navigator** — Retrieves relevant precedents and templates

---

## 🌐 Integration Capabilities

### Email Integration
- Share contracts/documents securely via email
- Internal and external email support
- Document version control with email history
- Automatic notification on document changes

### CLM Software Integration
- Connect with existing CLM platforms (DocuSign, Ironclad, etc.)
- Bi-directional sync of contract data
- Approval workflow integration
- Contract repository connection

### Department Approval Workflows
- **Finance Approvals** — For contracts > threshold amount
- **HR Approvals** — For employment/policy documents
- **Compliance Approvals** — For regulatory/data privacy docs
- **Accounting Approvals** — For financial implications

### Government/External Communication
- Receive and track government inquiries
- Monitor litigation correspondence
- **Alert relevant admins** (never reply directly)
- Maintain communication audit trail

---

## ⚖️ HITL & Approval System

### How It Works

**HITL Gates:**
- **L3 (Clause Analysis)** — Editor + Admin password required
- **L6 (Cross-Dept Approval)** — Reviewer password required
- **L7 (Executive Review)** — Head of Legal password required
- **L8 (Final Approval)** — General Counsel password required

**Desktop Approval:** Password authentication
**Mobile Admin App:** Biometric (fingerprint/face recognition)

### Audit Trail

Every approval is logged with:
- Actor name and role
- Timestamp
- Decision (approve/reject)
- Comments
- SHA256 hash chain (immutable)

---

## 🔐 Authentication & Security

- **JWT Token-Based Authentication** (15-minute expiry)
- **Refresh Token** (7-day validity)
- **Role-Based Access Control (RBAC)**
- **Domain-Scoped Visibility** (Editors see only assigned domains)
- **Immutable Audit Logs** (SHA256 blockchain-like hashing)
- **Password Hashing** (bcryptjs with 12 rounds)

---

## 🛠️ Technology Stack

### Microsoft AI Stack Integration ⭐

CoSora is **100% built on the Microsoft AI ecosystem** for hackathon compliance:

| Component | Microsoft Service | Purpose |
|-----------|-------------------|---------|
| **LLM Engine** | Azure OpenAI (GPT-4 Turbo) | Central Orchestrator & agent reasoning |
| **Embedding Model** | Azure OpenAI Embeddings | Document similarity search, semantic matching |
| **AI Coordination** | Azure Cognitive Services | Multi-agent orchestration and routing |
| **Dev Platform** | GitHub Copilot | Code generation and development assistance |
| **ML Framework** | Azure ML (Optional Future) | Model training and fine-tuning |
| **Power Platform** | Power Automate (Optional) | Low-code workflow automation |
| **Cloud Infrastructure** | Azure (Optional Production) | Container hosting, storage, compute |

**Why Azure OpenAI?**
- ✅ Enterprise-grade security and compliance
- ✅ Consistent pricing (no token overage surprises)
- ✅ ISO 27001, SOC 2 Type II certified
- ✅ Data residency in India available
- ✅ API compatible with OpenAI, easy to migrate

### Backend Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | Node.js 18+ | Server runtime |
| **Framework** | Express.js 4.18 | REST API server |
| **Database** | PostgreSQL 15 | Primary data store with JSONB support |
| **ORM** | Prisma 5.22 | Type-safe database client |
| **Cache** | Redis 7 | Session storage, job queue, rate limiting |
| **Job Queue** | Bull.js | Async task processing (AI drafting, email) |
| **Authentication** | JWT + bcryptjs | Secure token-based auth |
| **Real-time** | Socket.io 4 | WebSocket for live updates |
| **File Storage** | Local / Azure Blob | Document storage (configurable) |
| **Validation** | Zod | Runtime schema validation |
| **Logging** | Winston | Structured logging |
| **Environment** | dotenv | Configuration management |

### Frontend Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 14 | React + Server Components |
| **Styling** | Tailwind CSS 3 | Utility-first CSS |
| **UI Components** | Shadcn/ui | Headless component library |
| **State Management** | React Context + Zustand | Client state management |
| **Real-time** | Socket.io Client | Live task updates |
| **Form Handling** | React Hook Form | Efficient form processing |
| **API Client** | Axios | HTTP client with interceptors |
| **Font** | EB Garamond | Serif typeface for legal documents |

### DevOps & Deployment

| Tool | Purpose |
|------|---------|
| **Docker** | Containerization (Postgres, Redis) |
| **Docker Compose** | Local development orchestration |
| **npm Scripts** | Build automation |
| **Prisma Migrations** | Database versioning |
| **Environment Variables** | Configuration management |

### Color Palette

Our brand uses a sophisticated dark theme for a legal tech platform:

```
Primary: #0A0A0A (Deep Black - Background)
Accent 1: #FF6F00 (Vivid Orange - CTAs, highlights)
Accent 2: #FFB700 (Golden Orange - Secondary accents)
Text Light: #E0E0E0 (Light Gray - Primary text)
Text Muted: #2F2F2F (Dark Gray - Secondary text)
```

**Usage:**
- CoSora "C" and "S": #FF6F00
- Approval buttons: #FF6F00
- Status badges: #FFB700
- Background: #0A0A0A
- Text: #E0E0E0

---

## 🚀 Quick Start Guide

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker (optional, for Postgres + Redis)

### 1. Start Infrastructure

**Option A: Using Docker Compose**
```bash
docker compose up -d
```

**Option B: Using Homebrew (macOS)**
```bash
brew services start postgresql@15
brew services start redis
```

### 2. Install Dependencies

```bash
npm run install:all
```

This installs packages for both `backend/` and `frontend/`.

### 3. Configure Environment

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

**Backend .env setup:**
```env
DATABASE_URL="postgresql://cosora:cosora@localhost:5432/cosora"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-jwt-secret-min-32-chars-change-in-production"
JWT_REFRESH_SECRET="your-refresh-secret-min-32-chars-change-in-production"

# Azure OpenAI (leave blank for MockAIProvider in demo mode)
AZURE_OPENAI_ENDPOINT=""
AZURE_OPENAI_KEY=""
AZURE_OPENAI_DEPLOYMENT="gpt-4o"

# Email (optional, use Ethereal for dev)
SMTP_HOST="smtp.ethereal.email"
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""

# App
PORT=4000
FRONTEND_URL="http://localhost:3000"
NODE_ENV="development"
```

### 4. Initialize Database

```bash
cd backend
npm run db:generate      # Generate Prisma Client
npm run db:push         # Create database schema
npm run db:seed         # Seed with demo data
```

### 5. Start Development Servers

```bash
# From project root
npm run dev
```

Output:
```
[0] CoSora API running on http://localhost:4000
[1] ▲ Next.js 14.2.35
[1]   - Local: http://localhost:3000
[1]   ✓ Ready in 2.3s
```

### 6. Access the Application

- **Frontend:** http://localhost:3000/login
- **API Docs:** http://localhost:4000/health
- **Demo Credentials:** See section below

---

## 📱 Login Credentials (Demo)

### All Accounts Password: `CoSora2024!`

#### ADMIN Accounts (Complete System Control)

| Name | User ID | Access |
|------|---------|--------|
| General Counsel | `2A14-355D-773B-01DA` | All domains, HITL approval, system config |
| Head of Legal | `2829-646B-E0AD-8129` | All domains, HITL approval, audit logs |
| Managing Partner | `197A-B326-F85D-7FFA` | All domains, override any decision |

#### EDITOR Accounts (Domain-Specific Task Creation)

| Name | User ID | Domain Scope |
|------|---------|------|
| Contract Editor | `1449-B16D-76D7-EFBF` | Contracts, Compliance |
| Employment Editor | `3D90-A186-0ABE-DCB8` | Employment, Corporate Governance |
| IP Editor | `C27B-2B05-EB03-052B` | IP Management, M&A |
| Privacy Editor | `3E72-093E-E2C7-2495` | Data Privacy, Risk Management |
| Regulator Editor | `8F39-5FBE-27BB-A531` | Regulatory, Policy Drafting |
| Property Editor | `D34B-74B8-DB44-B43E` | Property/Leasing, Litigation |

#### REVIEWER Accounts (Cross-Department Approval)

| Name | User ID | Approval Authority |
|------|---------|------------------|
| Finance Head | `16B0-6A5F-106F-0DD6` | Contracts > threshold, Financial impact |
| HR Head | `1433-B095-620A-AC53` | Employment, Policy, People impact |
| Compliance Officer | `B66F-8209-BD2B-9E9E` | Regulatory, Data Privacy, Risk |

---

## 🧪 Demo Mode

**Leave `AZURE_OPENAI_ENDPOINT` and `AZURE_OPENAI_KEY` blank** to use the built-in `MockAIProvider`:

✅ Generates realistic legal document drafts (simulated)  
✅ Simulates agent responses with realistic delays  
✅ **No Azure credentials required** for testing  
✅ Perfect for development and demos


---

## 📊 API Routes

### Authentication
- `POST /api/auth/login` — User login
- `POST /api/auth/logout` — User logout
- `POST /api/auth/register` — Create user (Admin only)
- `POST /api/auth/refresh` — Refresh JWT token

### Tasks
- `GET /api/tasks` — List tasks (filtered by role)
- `POST /api/tasks` — Create new task (Editor)
- `GET /api/tasks/:id` — Get task details
- `POST /api/tasks/:id/advance` — Advance stage with HITL
- `POST /api/tasks/:id/comment` — Add comments

### Approvals (HITL)
- `POST /api/approvals` — Create approval
- `POST /api/approvals/:id/approve` — Approve with password
- `POST /api/approvals/:id/reject` — Reject with reason
- `GET /api/approvals/pending` — Pending approvals

### Documents
- `POST /api/documents/upload` — Upload contract/document
- `GET /api/documents/:id` — Download document
- `GET /api/documents/:id/versions` — Document versions
- `POST /api/documents/:id/share` — Email share

### Audit
- `GET /api/audit/logs` — Paginated audit logs
- `GET /api/audit/verify` — Verify audit chain integrity
- `GET /api/audit/export` — Export audit logs (PDF/CSV)

### Agents
- `POST /api/agents/analyze` — Trigger document analysis
- `GET /api/agents/status` — Agent processing status
- `GET /api/agents/logs` — Agent execution logs

---

## 📁 Project Structure

```
cosora/
├── backend/
│   ├── src/
│   │   ├── index.ts                    # Express server entry
│   │   ├── config.ts                   # Configuration & constants
│   │   ├── middleware/
│   │   │   ├── auth.ts                 # JWT authentication
│   │   │   ├── rbac.ts                 # Role-based access control
│   │   │   └── validate.ts             # Input validation
│   │   ├── routes/                     # API endpoints
│   │   │   ├── auth.ts, tasks.ts, approvals.ts
│   │   │   ├── documents.ts, agents.ts, audit.ts
│   │   │   └── ...
│   │   ├── services/                   # Business logic
│   │   │   ├── documentService.ts
│   │   │   ├── taskAssistantService.ts
│   │   │   ├── emailService.ts
│   │   │   ├── auditService.ts
│   │   │   └── ...
│   │   ├── agents/                     # AI Agents
│   │   │   ├── base.ts                 # BaseAgent class
│   │   │   ├── orchestrator.ts         # Central Orchestrator
│   │   │   ├── aiProviderImpl.ts        # Azure OpenAI/Mock
│   │   │   └── specialists/            # Domain specialists
│   │   ├── lib/
│   │   │   └── prisma.ts               # Prisma client singleton
│   │   ├── jobs/
│   │   │   └── slaMonitor.ts           # Background job: SLA tracking
│   │   ├── prisma/
│   │   │   ├── schema.prisma           # Database schema
│   │   │   ├── seed.ts                 # Demo data seeding
│   │   │   └── migrations/             # Database migrations
│   │   └── socket/
│   │       └── index.ts                # WebSocket handlers
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
│
├── frontend/
│   ├── app/
│   │   ├── (auth)/                     # Auth pages (public)
│   │   │   └── login/page.tsx
│   │   ├── (admin)/                    # Admin-only pages
│   │   ├── (editor)/                   # Editor-only pages
│   │   ├── (reviewer)/                 # Reviewer-only pages
│   │   ├── layout.tsx                  # Root layout
│   │   └── page.tsx                    # Home redirect
│   ├── components/
│   │   ├── layout/                     # Header, sidebar, footer
│   │   ├── ui/                         # Shadcn UI components
│   │   └── providers/                  # Context providers
│   ├── lib/
│   │   ├── api.ts                      # API client
│   │   ├── socket.ts                   # Socket.io setup
│   │   ├── upload.ts                   # File upload utilities
│   │   └── utils.ts                    # Helper functions
│   ├── public/
│   │   └── logo.png                    # CoSora logo
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js
│   ├── tailwind.config.ts
│   └── .env.local
│
├── docker-compose.yml                  # Local development infrastructure
├── package.json                        # Root npm scripts
└── README.md                           # This file
```

---

## 🔧 Advanced Configuration

### Using Production Azure OpenAI

Update `backend/.env`:
```env
AZURE_OPENAI_ENDPOINT="-"
AZURE_OPENAI_KEY="-"
AZURE_OPENAI_DEPLOYMENT="-"  # Or your deployment name
```

### Email Integration (Production)

Set up Gmail, Outlook, or custom SMTP:

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@company.com"
SMTP_PASS="your-app-password"
SMTP_FROM="legal@company.com"
INTERNAL_EMAIL_DOMAIN="company.com"
```

### Document Storage (Production)

Switch to Azure Blob Storage:

```env
STORAGE_PROVIDER="azure"
AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;..."
AZURE_STORAGE_CONTAINER="cosora-documents"
```

### Database Backup

```bash
# Backup PostgreSQL
pg_dump postgresql://cosora:cosora@localhost:5432/cosora > backup.sql

# Restore
psql postgresql://cosora:cosora@localhost:5432/cosora < backup.sql
```

---

## 📈 Scalability & Performance

### Caching Strategy
- **Task data:** Redis cache, TTL 5 minutes
- **Audit logs:** PostgreSQL + read replicas
- **Document metadata:** Redis + query optimization
- **Session storage:** Redis with JWT validation

### Rate Limiting
- API: 100 requests/minute per user
- Email sending: 10 emails/minute per user
- AI agent calls: Queued via Bull with concurrency 3

### Database Indexes
- `User.userId` (unique)
- `Task.assignedToId`, `Task.status`, `Task.currentStage`
- `Approval.taskId`, `Approval.approverId`
- `AuditLog.actorId`, `AuditLog.createdAt`

---

## 🔐 Security Best Practices

✅ **Authentication:** JWT with 15-min expiry + refresh tokens (7 days)  
✅ **Authorization:** RBAC middleware on all protected routes  
✅ **Password Security:** bcryptjs with 12 rounds + salt  
✅ **Audit Trail:** Immutable SHA256 hash chain  
✅ **CORS:** Domain-scoped, credentials enabled  
✅ **Input Validation:** Zod runtime schema validation  
✅ **SQL Injection Prevention:** Prisma parameterized queries  
✅ **XSS Protection:** Next.js automatic escaping  
✅ **HTTPS:** Enabled in production  

---

## 🤝 Contributing

### Adding a New Specialist Agent

1. Create `backend/src/agents/specialists/yourAgent.ts`:

```typescript
import { BaseAgent } from '../base';

export class YourAgent extends BaseAgent {
  name = 'your-agent';
  domain = 'YOUR_LEGAL_DOMAIN';

  async execute(context: any): Promise<string> {
    // Your agent logic
    return 'Agent response';
  }
}
```

2. Register in `backend/src/agents/base.ts`:

```typescript
import { YourAgent } from './specialists/yourAgent';

// In createAgent():
case 'your-agent':
  return new YourAgent(this.aiProvider);
```

3. Add domain mapping in `backend/src/config.ts`:

```typescript
export const AGENT_DOMAIN_MAP = {
  YOUR_LEGAL_DOMAIN: ['your-agent', 'orchestrator']
};
```

---

## 📞 Support & Contact

### Team

| Name | Email | Role |
|------|-------|------|
| Akshaj Nihaniwal | akshajnihaniwal@gmail.com | Tech Lead & Full-Stack Architect |
| Ayush Samor | ayushsamor21@gmail.com | Frontend Engineer & Real-Time Systems |
| Lakshya Chowdhry | chowdhrylakshya@gmail.com | AI/Agent Specialist & Integration Lead |
### For Questions:
- 🐛 Issues: GitHub Issues

---

## 📄 License

CoSora is proprietary software. All rights reserved.

---

## 🙏 Acknowledgments

- Named after **Cornellia Sorabji** (1866–1954) — First Indian woman to study law at Oxford University
- Built with ❤️ for enterprises automating their legal operations
- Powered by Microsoft Azure AI Stack

**CoSora — Automating Enterprise Legal Operations with AI Intelligence** ⚖️🤖
