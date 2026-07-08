# STEP 0 — MANDATORY AUDIT
# LearnX AI School ERP — Current State vs. Target State

## 1. Codebase Structure

| Layer | Technology | Current State |
|---|---|---|
| Frontend | Next.js 16 + TypeScript + Tailwind + shadcn/ui | ✅ Rich UI, 35 modules, 8 role portals |
| Backend API | Next.js API Routes (35 endpoints) | ✅ JWT auth, CRUD for students/attendance/fees/exams |
| Database | Prisma ORM + SQLite (49+ models) | ✅ Connected, seeded with 3 students, 2 staff |
| Auth | JWT (jose) + middleware.ts | ✅ All API routes protected |
| AI | z-ai-web-dev-sdk (GLM-4) | ✅ 5 agents, RAG, extraction, injection defense |
| Automation | Rules engine + event bus + outbox | ✅ 30 rules, 5 sagas, simulation mode |
| Comms | Communication Service with templates | ⚡ Partial — no real delivery tracking |

## 2. Role-Based Access — GAPS IDENTIFIED

### What EXISTS (UI layer only):
- Sidebar filters modules by `availableTo.includes(user.role)` — ✅ Teacher doesn't see HRMS, Student doesn't see Admissions
- Login issues JWT with role + permissions array — ✅
- Middleware verifies JWT on all `/api/*` routes — ✅
- Context Engine redacts fields by role (Teacher: financial/identity redacted, Parent: behavioral redacted) — ✅
- Some API routes check `hasPermission()` (exams/publish, payroll, leave/approve) — ✅

### What's MISSING (the gaps):
| Gap | Impact | Affected Roles |
|---|---|---|
| **Dashboard shows same KPIs to ALL roles** | Teacher sees whole-school enrollment + fee collection; Student sees staff count | Teacher, Student, Parent, Reception |
| **ModuleView shows same data to ALL roles** | Teacher sees all students (not just her sections); Parent sees all students; Student sees all students | Teacher, Student, Parent |
| **Students API returns ALL students** | No row-level filtering by teacher's sections or parent's children | Teacher, Parent, Student |
| **FrontDesk/Security/Attendance/Fees modules** | No role check — any role can access any module's UI | All roles |
| **Search returns ALL people** | Teacher can search and see any student's full biodata; Parent can see other families | Teacher, Parent, Student |
| **No Teacher class/section scoping** | Teacher API queries don't filter by assigned sections | Teacher |
| **No Parent household scoping** | Parent API queries don't filter by their children | Parent |
| **No Student self-scoping** | Student API queries don't filter to own records | Student |
| **No Reception limited directory** | Reception can access full student records | Reception |
| **IT can see PII in API responses** | IT role gets metadata-only redaction but API routes still return full data | IT |

## 3. Notification System — CURRENT STATE

| Aspect | Current | Required |
|---|---|---|
| Mechanism | `sendCommunication()` in `comms.ts` writes to `CommunicationLog` table | Single Notification Service consumed by all modules |
| Delivery status | `PENDING → SENT` (instantly marked SENT, no real delivery) | `queued → sent → delivered → read → failed` with retry |
| Retry logic | ❌ None | Required on failure |
| Acknowledgement tracking | ❌ None | Required for critical categories (safety, fee overdue, exam results) |
| Auto-escalation | ❌ None | Unacknowledged critical alerts must escalate |
| Notification Log screen | `GET /api/communications` returns logs | Needs filterable UI screen for Admin/Principal/IT |
| Channel routing | Hardcoded per template | Per-notification-type channel configuration |
| Audience scoping | ❌ No scoping — sends to specified recipientId only | Default to minimum relevant audience |

## 4. Automation Engine — CURRENT STATE

| Aspect | Current | Required |
|---|---|---|
| Event bus | ✅ EventLog + EventOutbox + relay worker | Same |
| Rules engine | ✅ 30 rules, conditions AST, actions array | Same |
| Rules as data | ✅ `AutomationRule` table, editable via API | Same |
| Automation Control Centre UI | ❌ No UI screen | Admin/Principal/IT screen to toggle/edit rules |
| Automation Activity Log | ✅ `RuleRun` table + `GET /api/automation/activity` | Needs UI screen |
| Simulation mode | ✅ Supported in rules engine | Same |
| Manual override toggle | ✅ `enabled` field on rules | Needs UI toggle |
| Reversibility | ⚡ Partial (tasks can be closed, comms can't be unsent) | Documented compensating actions |
| Trigger chains (9 required) | ✅ All 9 built (admission, attendance, fees, exams, transport, leave, safety, enquiry, licence) | Same |

## 5. Data Model — CURRENT STATE

All required models exist in Prisma schema:
- Student, Staff, Parent, Household, PersonRelationship ✅
- Fee, FeeInstallment, Transaction ✅
- Attendance, StaffAttendance, LeaveRequest ✅
- Exam, ExamScore, ReportCard ✅
- Vehicle, Route, TransportAssignment ✅
- Hostel, HostelRoom, HostelAllocation ✅
- HealthRecord, BehaviorRecord, SafetyAlert ✅
- Document, EventLog, EventOutbox ✅
- AutomationRule, RuleRun, WorkflowDefinition, WorkflowInstance ✅
- CommunicationLog, Task, InsightCard ✅
- AiActionPlan, AgentInvocation ✅
- AtRiskScore, FeatureFlag, Policy ✅
- DedupeCandidate, ProfileCompleteness ✅

## 6. Priority Action Plan

### Phase 1 (Step 1): Role-Based Access Enforcement
1. Create `src/lib/roleScope.ts` — single permission policy layer
2. Apply to all API routes (row-level filtering)
3. Redesign dashboard widgets per role
4. Filter ModuleView data by role scope
5. Filter search results by role scope

### Phase 2 (Step 3): Notification Engine Rebuild
1. Add delivery status tracking (queued → sent → delivered → read → failed)
2. Add retry logic
3. Add acknowledgement tracking for critical categories
4. Add auto-escalation for unacknowledged alerts
5. Build Notification Log UI screen

### Phase 3 (Step 2): Automation Control Centre UI
1. Build Automation Control Centre screen (list/toggle/edit rules)
2. Build Automation Activity Log screen (viewable/filterable/exportable)
3. Verify all 9 trigger chains work end-to-end

### Phase 4 (Step 4): AI Assistant Scope Awareness
1. Filter RAG retrieval by role scope (already done in contextEngine)
2. Add automation explainability (AI reads from Activity Log)
3. Surface academic-risk flags to career counselling
