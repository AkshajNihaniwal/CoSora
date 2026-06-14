# CoSora — Quick Reference Guide

**Status:** ✅ Fully Operational Locally  
**Frontend:** http://localhost:3000  
**Backend API:** http://localhost:4000  
**Database:** PostgreSQL 15 (localhost:5432)  
**Cache:** Redis 7 (localhost:6379)

---

## 🔐 Login Credentials (All Password: `CoSora2024!`)

### ADMIN Users (3 accounts)

```
┌─────────────────────────────────────────────┐
│ GENERAL COUNSEL (Admin) — Full Access        │
├─────────────────────────────────────────────┤
│ User ID:  2A14-355D-773B-01DA               │
│ Password: CoSora2024!                       │
│ Authority: All domains, system config       │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ HEAD OF LEGAL (Admin) — Full Access         │
├─────────────────────────────────────────────┤
│ User ID:  2829-646B-E0AD-8129               │
│ Password: CoSora2024!                       │
│ Authority: All domains, audit logs          │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ MANAGING PARTNER (Admin) — Full Access      │
├─────────────────────────────────────────────┤
│ User ID:  197A-B326-F85D-7FFA               │
│ Password: CoSora2024!                       │
│ Authority: Override any decision            │
└─────────────────────────────────────────────┘
```

---

### EDITOR Users (6 accounts)

```
┌─────────────────────────────────────────────┐
│ CONTRACT EDITOR — Contract Management       │
├─────────────────────────────────────────────┤
│ User ID:  1449-B16D-76D7-EFBF               │
│ Password: CoSora2024!                       │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ EMPLOYMENT EDITOR — Employment & Labour     │
├─────────────────────────────────────────────┤
│ User ID:  3D90-A186-0ABE-DCB8               │
│ Password: CoSora2024!                       │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ IP EDITOR — IP Management & M&A             │
├─────────────────────────────────────────────┤
│ User ID:  C27B-2B05-EB03-052B               │
│ Password: CoSora2024!                       │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ PRIVACY EDITOR — Data Privacy               │
├─────────────────────────────────────────────┤
│ User ID:  3E72-093E-E2C7-2495               │
│ Password: CoSora2024!                       │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ REGULATOR EDITOR — Regulatory Affairs       │
├─────────────────────────────────────────────┤
│ User ID:  8F39-5FBE-27BB-A531               │
│ Password: CoSora2024!                       │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ PROPERTY EDITOR — Real Estate & Litigation  │
├─────────────────────────────────────────────┤
│ User ID:  D34B-74B8-DB44-B43E               │
│ Password: CoSora2024!                       │
└─────────────────────────────────────────────┘
```

---

### REVIEWER Users (3 accounts)

```
┌─────────────────────────────────────────────┐
│ FINANCE HEAD — Contract > $100K Approval    │
├─────────────────────────────────────────────┤
│ User ID:  16B0-6A5F-106F-0DD6               │
│ Password: CoSora2024!                       │
│ Authority: Finance approvals                │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ HR HEAD — Employment Policy Approval        │
├─────────────────────────────────────────────┤
│ User ID:  1433-B095-620A-AC53               │
│ Password: CoSora2024!                       │
│ Authority: HR approvals                     │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ COMPLIANCE OFFICER — Regulatory Approval    │
├─────────────────────────────────────────────┤
│ User ID:  B66F-8209-BD2B-9E9E               │
│ Password: CoSora2024!                       │
│ Authority: Compliance approvals             │
└─────────────────────────────────────────────┘
```

---

## 📊 System Status

| Component | Status | URL/Port | Notes |
|-----------|--------|----------|-------|
| **PostgreSQL** | ✅ Running | localhost:5432 | Database (cosora / cosora) |
| **Redis** | ✅ Running | localhost:6379 | Cache & Job Queue |
| **Backend API** | ✅ Running | localhost:4000 | Express.js Server |
| **Frontend Web** | ✅ Running | localhost:3000 | Next.js Application |
| **Azure OpenAI** | ⚙️ Demo Mode | — | MockAIProvider active |
| **Email Service** | ⚙️ Optional | — | Ethereal SMTP available |

---

## 🎯 What to Test

### For ADMIN (General Counsel):
1. Log in with `2A14-355D-773B-01DA` / `CoSora2024!`
2. View all tasks and documents
3. Try to approve/reject a task at HITL gate
4. View complete audit logs
5. Check system settings

### For EDITOR (Contract Editor):
1. Log in with `1449-B16D-76D7-EFBF` / `CoSora2024!`
2. See contract-scoped tasks
3. Try to upload a new document
4. Submit for approval (cannot approve)
5. Add comments to documents

### For REVIEWER (Finance Head):
1. Log in with `16B0-6A5F-106F-0DD6` / `CoSora2024!`
2. See pending approvals
3. Review document details
4. Approve/reject with comments
5. Cannot edit documents

---

## 💡 Demo Tasks Available

The seeded database includes 10 sample tasks:

1. **Vendor MSA Review** — Contracts, Stage: Awaiting HITL
2. **GDPR Compliance Audit** — Privacy, Stage: In Progress
3. **Employment Termination** — Employment, Stage: Awaiting HITL
4. **Patent Filing Review** — IP, Stage: In Progress
5. **Board Resolution Draft** — Corporate, Stage: In Progress
6. **Acquisition Due Diligence** — M&A, Stage: In Progress
7. **Regulatory Inquiry Response** — Regulatory, Stage: Awaiting HITL
8. **Office Lease Renewal** — Property, Stage: In Progress
9. **Litigation Strategy Memo** — Litigation, Stage: Escalated
10. **Anti-Bribery Policy Update** — Policy, Stage: Awaiting HITL

---

## 🔧 Quick Commands

### Start Everything
```bash
cd /Users/akshajnihaniwal/Desktop/CoSora
npm run dev
```

### Restart Services
```bash
# Stop (Ctrl+C in terminal running npm run dev)
# Then restart
npm run dev
```

### Reset Database
```bash
cd backend
npm run db:seed    # Re-seed all demo data
```

### View Database
```bash
# Connect to PostgreSQL
psql postgresql://cosora:cosora@localhost:5432/cosora

# Useful queries:
SELECT * FROM "User";
SELECT * FROM "Task";
SELECT * FROM "AuditLog" ORDER BY "createdAt" DESC LIMIT 5;
```

### View Redis Cache
```bash
redis-cli
KEYS *
GET session:*
FLUSHALL  # Clear all cache (careful!)
```

---

## 🎨 Brand Guidelines (In Use)

**Color Scheme:**
- Background: #0A0A0A (Deep Black)
- Accent: #FF6F00 (Orange) — "C" and "S" in CoSora
- Secondary: #FFB700 (Golden)
- Text: #E0E0E0 (Light Gray)

**Font:** EB Garamond (serif, legal documents)

**Logo:** Already using transparent PNG with brand colors

---

## 🚀 Next Steps for Hackathon

### Frontend Enhancements (if time):
- [ ] Add more sample tasks to dashboard
- [ ] Implement real document upload feature
- [ ] Add task creation form for Editors
- [ ] Enhance HITL approval UI

### Backend Enhancements (if time):
- [ ] Connect to real Azure OpenAI (add credentials)
- [ ] Implement CLM integration stubs
- [ ] Add email sending functionality
- [ ] Create knowledge base search

### Documentation:
- ✅ README.md — Complete
- ✅ PROJECT_DOCUMENT.md — Comprehensive
- ✅ PROJECT_DECK_OUTLINE.md — Ready for PDF
- ✅ This credentials file

---

## 📧 Contact & Support

**Team Members:**
- **Akshaj Nihaniwal** — Tech Lead & Full-Stack Architect
- **Ayush Samor** — Frontend Lead & UI/UX Designer  
- **Lakshya Chowdhry** — AI/Agent Specialist & Integration Lead

---

**Happy Testing! 🚀**

*All 12 demo tasks are ready in the system. Log in and explore!*
