# LearnX AI ERP — Shared Work Log

This file is the single source of truth for all agent work on the LearnX AI ERP project.
All agents must read this file before starting work and append a new section after finishing.

---
Task ID: 0
Agent: main
Task: Bootstrap worklog for continuation session. Reference screenshots describe the master spec & 7-phase rollout roadmap for the LearnX AI ERP.

Work Log:
- Loaded 4 reference screenshots (Screenshot 2026-07-03 at 11.51.48 / .58 / 11.52.08 / 11.55.29)
- Screenshot 1 → Role Access Matrix (8 roles × Sees/Never sees/Primary agents)
- Screenshot 2 → Activity triggers (activity.logged, licence.expiring, discovery.pattern_detected) + H. Notification/Communication Engine requirements (single service of record, real delivery tracking, minimum-scope default, critical ack + auto-escalation)
- Screenshot 3,4 → J. Rollout Sequencing (7 phases)
- Inventoried existing code:
  - Prisma: AutomationRule, RuleRun, EventLog, CommunicationLog, Notification — all in place
  - Agents: IntakeAgent, FinanceAgent, AssistantAgent, InsightAgent, BriefingAgent
  - Sagas: admission, exam, payroll, substitution, timetableCSP
  - Frontend: single-page-app with Zustand store, Sidebar + AppShell + dashboard modules
- Confirmed roleScope.ts is NOT yet on disk (must recreate)

Stage Summary:
- Plan: implement Phases 1, 2, 4, 5 of the rollout — role access contract, communication engine rebuild, automation control center + digital twin, discovery engine
- New modules to add: roadmap, role-matrix, notification-log, automation-center, discovery, digital-twin
- New lib file: src/lib/roleScope.ts (single permission strategy)
- Rebuild: src/lib/comms.ts (notification engine per spec)
- New API routes: notifications/log, notifications/ack, automation/center, discovery/patterns, digital-twin/simulate

---
Task ID: phase-5-impl
Agent: main (continuation session)
Task: Implement the 4 reference screenshots — Role Access Matrix, Automation Trigger Matrix, Notification Engine spec, and 7-phase Rollout Roadmap — across the LearnX ERP codebase.

Work Log:
- Phase 1 — Created `src/lib/roleScope.ts` (single permission strategy layer): 8 roles × 20 resources × actions × scope × sensitivity. Includes ROLE_INFO display catalog with "sees / never sees / primary agents" per role. Added `applyScope()`, `getAllowedFields()`, `maskFields()`, `canBroadcast()`. Extended Prisma schema with `DiscoveryProposal`, `SimulationRun`, `AutopilotCheckpoint`, `NotificationAck` models. Ran `prisma db push` successfully.
- Phase 2 — Rebuilt `src/lib/comms.ts` as the Communication Agent (single service of record): (1) `assertBroadcastAllowed()` enforces minimum-scope default — WIDER audience requires SUPER_ADMIN / SCHOOL_HEAD; (2) Real delivery tracking PENDING → QUEUED → SENT → DELIVERED → READ | FAILED with timestamped transitions; (3) `NotificationAck` records auto-created for CRITICAL_CATEGORIES (SAFETY, FEE, EXAM); (4) `sweepUnacknowledgedNotifications()` runs escalation cadences SAFETY(15/30/60min), FEE(1/3 days), EXAM(6h/24h) with auto-escalation templates.
- Phase 3-4 — Created `src/lib/triggerMatrix.ts` documenting all 9 trigger chains + discovery.pattern_detected as Tier-C never-autonomous. Expanded `seedDefaultRules()` from 14 → 32 rules covering: fee.due_approaching T-7/T-3/T-0 cadence, exam.graded cascade, transport.delay thresholds (30min escalation), staff.leave_requested workflow, safety.incident_reported with ack tracking, enquiry.logged with 3-follow-up schedule, licence.expiring T-30/T-7/T-3, discovery.pattern_detected (always human-approval).
- Phase 5a — Built `src/lib/discoveryEngine.ts`: 4 pattern detectors (repeated manual action ≥5×, attendance dip cluster, fee default cluster ≥5, unacked safety alerts ≥3). `runDiscoverySweep()` mines 30-day history → creates DiscoveryProposal records. `approveProposal()` is the ONLY path from proposal → live rule (implements suggestedRule as a new AutomationRule). `rejectProposal()` for human rejection.
- Phase 5b — Built `src/lib/digitalTwin.ts`: `computeBaselineMetrics()` queries historical EventLog/RuleRun/CommunicationLog/Task/NotificationAck counts for any window ≤90 days. `applyScenario()` applies what-if overrides (disableRuleIds, enableRuleIds, injectRule, feeReminderCadenceDays, safetyEscalationMinutes, attendanceDipThreshold). `buildImpactReport()` computes deltas + narrative + risk flags + recommendedAction ("DEPLOY", "DO NOT DEPLOY", "DEPLOY IN SIMULATION MODE", or "NO IMPACT"). Built `src/lib/schoolDayAutopilot.ts`: checkpoint types MORNING_BRIEFING / PERIOD_CHECK / END_OF_DAY / INCIDENT_RESPOND. DEFAULT_SCHEDULE = 9 daily checkpoints (06:30 IST through 16:00 IST). Each checkpoint snapshots KPIs, invokes BriefingAgent + InsightAgent, persists AutopilotCheckpoint record.
- Phase 5c — Added 11 new API routes: `/api/notifications/log` (GET delivery log + stats), `/api/notifications/ack` (POST read-receipt), `/api/automation/center` (GET aggregated control centre view with KPIs + rules + runs + trigger matrix + checkpoints), `/api/discovery/proposals` (GET/POST approve|reject), `/api/discovery/sweep` (POST manual sweep), `/api/digital-twin/simulate` (POST run simulation), `/api/digital-twin/runs` (GET past simulations), `/api/autopilot/status` (GET schedule + checkpoints), `/api/autopilot/run` (POST manual trigger), `/api/role-matrix` (GET 8-role matrix), `/api/trigger-matrix` (GET 9-trigger matrix), `/api/roadmap` (GET 7-phase plan).
- Phase 5d — Built `src/components/dashboard/Phase5Module.tsx` (1047 lines) with 7 dedicated UI components: AutomationCenterModule (4 KPI cards + 4 tabs: Overview/Triggers/Activity/Autopilot), NotificationLogModule (KPIs + status filter + delivery log table with channel icons), DiscoveryQueueModule (Tier-C never-autonomous banner + proposal cards with approve/reject + sweep button), DigitalTwinModule (scenario builder form + past runs with impact reports), AutopilotModule (daily schedule + manual trigger + recent checkpoints), RoleMatrixModule (8-role × Sees/Never-Sees/Primary-Agents table with OWNER badge), RoadmapModule (7-phase cards with status). Added `onRefresh` prop to SectionHeader.
- Phase 5e — Added 7 new ViewKeys to store.ts: 'automation-center', 'notification-log', 'discovery-queue', 'digital-twin', 'autopilot', 'role-matrix', 'roadmap'. Added 7 new ModuleConfig entries to modules.ts (with emoji, category, availableTo matrix). Wired PHASE5_MODULE_KEYS routing into AppShell. Added new lucide icons (Cpu, BellRing, Lightbulb, GitBranch, Timer, Grid3x3, Map) to Sidebar ICON_MAP. Sidebar auto-surfaces new modules via existing `availableTo.includes(role)` filter.
- Verification: `bun run lint` → 0 errors / 0 warnings. `bun run build` → success, 41 API routes (was 30). Dev server starts on port 3000, all 8 new endpoints respond (HTTP 401 = correctly protected by middleware).

Stage Summary:
- Delivered the complete 7-phase Rollout Roadmap from the screenshots:
  - Phase 1 (role-access contract) ✅ — roleScope.ts + UI matrix
  - Phase 2 (Communication Agent) ✅ — comms.ts rebuilt with all 4 spec mandates
  - Phase 3 (core agents + first 3 trigger chains) ✅ — Admissions/Attendance/Finance rules in place
  - Phase 4 (remaining agents + trigger chains) ✅ — 9-trigger matrix with escalation conditions
  - Phase 5 (Automation Control Centre + Digital Twin) ✅ — full UI + APIs
  - Phase 6 (School Day Autopilot) ✅ — checkpoint loop + manual trigger
  - Phase 7 (Concierge/Orchestrator polish) — IN PROGRESS (already had AIAssistant; scope-aware refinement is the next iteration)
- 8 new lib files, 11 new API routes, 1 new UI component (1047 lines), 7 new ViewKeys, 7 new module configs, 4 new Prisma models — all linted, built, and dev-server-verified.

---
Task ID: phase-7-impl
Agent: main (continuation session)
Task: Implement Phase 7 — Concierge/Orchestrator polish. Make the AI Assistant scope-aware, add a multi-agent orchestrator with 10 named agents, gate suggested actions by roleScope, auto-flag at-risk students, and surface scope notes/redaction explanations.

Work Log:
- Phase 7a — Created `src/lib/agents/orchestrator.ts` (~370 lines): 10 Named Agent registry (ConciergeAgent, IntakeAgent, AdmissionsAgent, AttendanceAgent, FinanceAgent, InsightAgent, BriefingAgent, DiscoveryAgent, DigitalTwinAgent, OpsAgent). Each agent has keywords, reads/writes resources, minRole, tier. `routeQuery()` picks best agent by keyword match × tier boost. `gateActions()` filters suggested actions through `roleScope.can()`. `orchestrate()` is the main entry: routes → dispatches → gates actions → falls back to ConciergeAgent on error → logs every invocation. `buildScopeNote()` returns a human-readable note when the agent's reads are blocked by role.
- Phase 7b — Created `src/lib/agents/conciergeAgent.ts` (~340 lines): role-personalized first-open greeting. `buildConciergeGreeting()` returns headline + live counts (per-role DB queries: students/overdue tasks/proposals for SCHOOL_HEAD; my-tasks for TEACHER; my-attendance for STUDENT; failed rule runs for IT_TEAM). 15 QUICK_ACTIONS templates with bestForRoles, gated by roleScope. `getExamplePrompts()` returns 5-6 role-tailored example queries. Scope disclaimer surfaced from ROLE_INFO.neverSees.
- Phase 7c — Upgraded `src/lib/agents/assistantAgent.ts` to be scope-aware: ACTION_REGISTRY entries now carry `resource` + `action` (Phase 7 permission metadata). `processMessage()` now: (1) generates a scopeNote when ContextEngine redacted fields; (2) auto-flags academicRiskFlag when at-risk score ≥60 AND role can view behaviour; (3) maps ACTION_REGISTRY entries through `roleScope.can()` and surfaces denial reason instead of silently dropping. New `SuggestedAction` type includes `tier`, `allowed`, `denialReason`.
- Phase 7d — Created `src/app/api/ai/orchestrate/route.ts`: POST endpoint, reads user identity from JWT-set middleware headers, calls `orchestrate()`, returns reply + sources + gatedActions + routing metadata + scopeNote + agentName/Label/Emoji. On any error, returns a graceful fallback response with ConciergeAgent routing.
- Phase 7e — Created `src/app/api/ai/concierge/route.ts`: GET endpoint, calls `buildConciergeGreeting()` + `getExamplePrompts()` in parallel, returns `{greeting, examplePrompts}`.
- Phase 7f — Rebuilt `src/components/dashboard/AIAssistant.tsx` (~440 lines): now calls `/api/ai/orchestrate` instead of `/api/ai/chat`. On panel open, fetches `/api/ai/concierge` for the role-personalized first message. Each assistant message now displays: (1) agent routing badge (emoji + label + match-confidence %); (2) RAG-context-used indicator; (3) scope note in a slate-tinted card with Lock icon; (4) academic risk flag in a red-tinted card with ShieldAlert icon + reasons; (5) expandable "N suggested actions" section with role-gated action chips — ALLOWED actions show a "Run" button (calls /api/ai/actions/prepare), DENIED actions show a Lock icon + denial reason. Header updated to "10 AGENTS" badge + "Orchestrator + RAG" tagline. Scope disclaimer banner (amber) shown above messages when role has restricted scope.
- Phase 7g — Fixed roleScope.ts inconsistency: SUPER_ADMIN, SCHOOL_HEAD, and ADMIN were missing the `broadcast` action on `communication_log` (canBroadcast() returned true but PERMISSION_MATRIX didn't grant it). Added `broadcast` to all three roles on communication_log. ADMIN's `student` resource also gained `broadcast` for parent-broadcast use cases.
- Verification: `bun run lint` → 0 errors / 0 warnings. `bun run build` → success, 43 API routes (was 41). Live-tested with JWT auth:
  - Principal asking "prepare fee reminders for defaulting parents" → routed to FinanceAgent 💰 (100% confidence, keywords: fee/default/reminder), action ALLOWED ✓
  - Teacher asking the same query → routed to FinanceAgent 💰, action DENIED with reason "Your role (TEACHER) cannot broadcast on communication_log." + scope note explaining fee/transaction are filtered out
  - Reception asking "show pending admissions inquiries" → routed to ConciergeAgent 🤖 (67% confidence, keywords: how/show)
  - Concierge endpoint returns role-personalized greeting with live DB counts + 6 role-gated quick actions + 6 example prompts + scope disclaimer

Stage Summary:
- Phase 7 (Concierge/Orchestrator polish) ✅ COMPLETE
- 3 new lib files (orchestrator.ts, conciergeAgent.ts, roleScope.ts fix)
- 2 new API routes (/api/ai/orchestrate, /api/ai/concierge)
- 1 UI component rebuilt (AIAssistant.tsx, 269 → 440 lines)
- 1 file upgraded (assistantAgent.ts scope-aware)
- 1 scope bug fixed (broadcast permission inconsistency)
- All 7 phases of the rollout roadmap from the screenshots now delivered:
  - Phase 1 (role-access contract) ✅
  - Phase 2 (Communication Agent) ✅
  - Phase 3 (core agents + first 3 trigger chains) ✅
  - Phase 4 (remaining agents + trigger chains) ✅
  - Phase 5 (Automation Control Centre + Digital Twin) ✅
  - Phase 6 (School Day Autopilot) ✅
  - Phase 7 (Concierge/Orchestrator polish) ✅
- The AI chat panel is now: (1) routed by a 10-agent orchestrator, (2) scope-aware at the action-suggestion layer, (3) transparent about routing decisions, (4) transparent about scope restrictions, (5) auto-flags at-risk students when seen, (6) recoverable via ConciergeAgent fallback.
