# CoSora — Local Hosting Login Credentials

## ✅ Setup Complete!

Your CoSora Legal Department Automation platform is now running locally.

---

## 🌐 Access URLs

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:3002 |
| **Backend API** | http://localhost:4000 |
| **Database** | PostgreSQL on localhost:5432 |
| **Cache** | Redis on localhost:6379 |

---

## 🔑 Default Password (All Users)

```
CoSora2024!
```

---

## 👥 User Accounts

### 🔐 ADMIN Users (3 accounts)

| Name | User ID | Role | Domains |
|------|---------|------|---------|
| General Counsel | `2A14-355D-773B-01DA` | Admin | All Legal Domains |
| Head of Legal | `2829-646B-E0AD-8129` | Admin | All Legal Domains |
| Managing Partner | `197A-B326-F85D-7FFA` | Admin | All Legal Domains |

**Login Example:**
```
User ID: 2A14-355D-773B-01DA
Password: CoSora2024!
```

---

### ✏️ EDITOR Users (6 accounts)

| Name | User ID | Role | Domains |
|------|---------|------|---------|
| Contract Editor | `1449-B16D-76D7-EFBF` | Editor | Contract Management, Legal Compliance |
| Employment Editor | `3D90-A186-0ABE-DCB8` | Editor | Employment/Labour, Corporate Governance |
| IP Editor | `C27B-2B05-EB03-052B` | Editor | IP Management, M&A |
| Privacy Editor | `3E72-093E-E2C7-2495` | Editor | Data Privacy, Risk Management |
| Regulator Editor | `8F39-5FBE-27BB-A531` | Editor | Regulator Liaison, Policy Drafting |
| Property Editor | `D34B-74B8-DB44-B43E` | Editor | Property/Leasing, Litigation |

**Login Example:**
```
User ID: 1449-B16D-76D7-EFBF
Password: CoSora2024!
```

---

### 👁️ REVIEWER Users (3 accounts)

| Name | User ID | Role | Domains |
|------|---------|------|---------|
| Finance Head | `16B0-6A5F-106F-0DD6` | Reviewer | Contract Management, M&A |
| HR Head | `1433-B095-620A-AC53` | Reviewer | Employment/Labour, Policy Drafting |
| Compliance Officer | `B66F-8209-BD2B-9E9E` | Reviewer | Legal Compliance, Data Privacy |

**Login Example:**
```
User ID: 16B0-6A5F-106F-0DD6
Password: CoSora2024!
```

---

## 🚀 Getting Started

1. **Open Frontend:** http://localhost:3002
2. **Click Login**
3. **Enter any User ID from above** (e.g., `2A14-355D-773B-01DA`)
4. **Password:** `CoSora2024!`
5. **Explore the platform!**

---

## 📋 What's Included

✓ Multi-agent AI orchestrator  
✓ 12 specialist legal agents  
✓ Task management (L0-L9 pipeline)  
✓ HITL (Human-in-the-Loop) approvals  
✓ Audit trail with immutable logging  
✓ RBAC (Role-Based Access Control)  
✓ Knowledge base system  
✓ Document analysis  
✓ Email notifications  
✓ WebSocket real-time updates  

---

## 🔧 System Services Status

| Service | Status | Port |
|---------|--------|------|
| PostgreSQL 15 | ✅ Running | 5432 |
| Redis 7 | ✅ Running | 6379 |
| Backend API | ✅ Running | 4000 |
| Frontend (Next.js) | ✅ Running | 3002 |

---

## 💡 Tips

- **ADMIN:** Can manage users, view all tasks, configure system settings
- **EDITOR:** Can create and edit tasks, generate documents, update content
- **REVIEWER:** Can approve/reject tasks, review documents, provide feedback

- Each user has **domain-specific** access (you'll only see relevant legal domains)
- All actions are **audit-logged** for compliance
- Tasks flow through **L0-L9 stages** with HITL checkpoints

---

## 🛑 Stopping Services

To stop the development servers:
```bash
# Press Ctrl+C in the terminal running npm run dev
```

To stop PostgreSQL and Redis:
```bash
brew services stop postgresql@15
brew services stop redis
```

---

**Happy Automating! 🎉**
