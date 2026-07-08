# STEP 0 — MANDATORY AUDIT (v4 Directive)
# LearnX AI School ERP — Current State vs. Level 4 Target

## 1. Codebase Structure

| Layer | Technology | Status |
|---|---|---|
| Frontend | Next.js 16 + TypeScript + Tailwind + shadcn/ui | ✅ 35 modules, 8 role portals |
| Backend API | Next.js API Routes (35 endpoints) | ✅ JWT auth, CRUD, sagas |
| Database | Prisma ORM + SQLite (69 models) | ✅ Connected, seeded |
| Auth | JWT (jose) + middleware.ts | ✅ All API routes protected |
| AI | z-ai-web-dev-sdk (GLM-4) | ⚡ Single model, no agent separation |
| Automation | Rules engine (30 rules) + event bus + outbox | ✅ But no Control Centre UI |
| Comms | CommunicationLog table, templates | ❌ No real delivery tracking, no retry, no acknowledgement |
| Role Scope | roleScope.ts with PERMISSION_MATRIX | ✅ Step 1 done (previous session) |

## 2. Role Access — Current State

### What EXISTS:
- `roleScope.ts` with full PERMISSION_MATRIX for all 8 roles ✅
- Students API applies row-level filtering via `applyScope()` ✅
- Dashboard shows role-specific KPIs via `useRoleKPIs()` ✅
- Context Engine redacts fields by role ✅
- Middleware verifies JWT on all API routes ✅

### GAPS:
- Only Students API uses roleScope — other APIs (attendance, fees, exams) don't yet
- No UI-level widget filtering by role in ModuleView (all modules show same data)
- Search (TopBar) doesn't filter by role scope
- No Reception limited directory view

## 3. Notification System — Current State (CRITICAL GAP)

| Requirement | Current | Gap |
|---|---|---|
| Single notification service | `sendCommunication()` exists | ✅ But only 51 lines, very basic |
| Delivery status: queued→sent→delivered→read→failed | Only PENDING→SENT (instant, fake) | ❌ No real tracking |
| Retry on failure | None | ❌ |
| Acknowledgement tracking | None | ❌ |
| Auto-escalation for critical | None | ❌ |
| Audience scoping (minimum relevant) | None — sends to specified recipientId | ❌ |
| Notification Log screen | API exists, no UI | ❌ |

## 4. AI Assistant — Current State

| Requirement | Current | Gap |
|---|---|---|
| Single generic chatbot | `assistantAgent.ts` with `chatWithAssistant()` | ⚡ Single agent, no domain separation |
| Multi-agent architecture | 5 agents exist (Intake, Finance, Assistant, Insight, Briefing) | ⚡ But no Orchestrator, no 10 named domain agents |
| Agent audit trail | `AgentInvocation` table exists | ✅ |
| Role-scoped retrieval | `ragService.ts` with scope pre-filter | ✅ |
| Automation explainability | Assistant can read activity feed | ⚡ But no UI for it |
| Concierge agent per role | Single assistant for all roles | ❌ No per-role concierge |

## 5. Automation Engine — Current State

| Requirement | Current | Gap |
|---|---|---|
| Event bus | EventLog + EventOutbox + relay | ✅ |
| Rules as data | 30 AutomationRule records | ✅ |
| Control Centre UI | API exists (`/api/automation/rules`) | ❌ No UI screen |
| Activity Log UI | API exists (`/api/automation/activity`) | ❌ No UI screen |
| Simulation mode | Supported in rules engine | ✅ But no Digital Twin impact report |
| Discovery Engine | Not built | ❌ |
| Digital Twin | Not built | ❌ |
| 9 trigger chains | All 9 built as rules | ✅ |

## 6. School Day Autopilot — Current State

| Requirement | Current | Gap |
|---|---|---|
| Scheduled checkpoint loops | Not built | ❌ |
| Morning brief per role | `BriefingAgent` exists | ⚡ But not auto-generated, no Autopilot |
| Autopilot console | Not built | ❌ |
| End-of-day summary | Not built | ❌ |

## 7. Missing Sagas

The following saga files are MISSING (were lost during server restarts):
- `admissionSaga.ts` — was built in Phase 2, now missing from `src/lib/sagas/`
- `substitutionSaga.ts` — was built in Phase 4, now missing
- `payrollSaga.ts` — was built in Phase 4, now missing

Only `academicSaga.ts` survived.

## 8. Priority Implementation Plan

### Phase A: Fix Critical Gaps
1. Rebuild missing sagas (admission, substitution, payroll)
2. Rebuild comms.ts with real delivery tracking, retry, acknowledgement
3. Apply roleScope to remaining APIs (attendance, fees, exams)

### Phase B: Agent Architecture (Step 2)
1. Build Orchestrator Agent (routes to domain agents)
2. Build 10 named domain agents with scoped prompts
3. Each agent has: system prompt, tool allowlist, data scope, audit trail

### Phase C: Automation Engine UI (Step 3)
1. Build Automation Control Centre screen (list/toggle/edit rules)
2. Build Automation Activity Log screen
3. Build Discovery Engine (pattern mining → proposals)
4. Build Digital Twin simulator

### Phase D: School Day Autopilot (Step 4)
1. Build scheduled checkpoint loops
2. Build Autopilot console
3. Build morning/evening briefs

### Phase E: Concierge Agent (Step 5)
1. Per-role concierge with scoped retrieval
2. Automation explainability
3. Academic-risk flag surfacing
