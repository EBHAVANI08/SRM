#!/usr/bin/env python3
"""
Phase 7 + Step 6 validation suite for LearnX AI ERP.

Tests:
  1. Cross-scope query rejection:
     - TEACHER cannot GET /api/fees/defaulters (no fee:view scope) → 403
     - IT_TEAM cannot GET /api/students (no student:view scope) → 403
     - STUDENT cannot POST /api/exams/marks (no exam:create scope) → 403
     - TEACHER cannot POST /api/fees/defaulters (no broadcast scope) → 403
  2. Allowed queries still work:
     - PRINCIPAL can GET /api/fees/defaulters → 200
     - ADMIN can GET /api/students → 200
     - TEACHER can GET /api/students → 200 (with field redaction)
  3. Orchestrator routes to new agents:
     - "transport delay on bus 14" → TransportAgent
     - "staff leave approval for tomorrow" → HRStaffingAgent
     - "safety incident in classroom" → SafetyAgent
  4. Concierge greeting personalization:
     - PRINCIPAL sees school-wide counts
     - TEACHER sees "my tasks" count
     - IT_TEAM sees "failed rule runs" count
  5. Digital Twin simulation can be run for a new rule
"""

import json
import urllib.request
import urllib.error
import sys

BASE = "http://localhost:3000"
ALL_TESTS = []
FAILED = []

def login(role_email):
    data = json.dumps({"email": role_email, "password": "demo1234"}).encode()
    req = urllib.request.Request(
        f"{BASE}/api/auth/login",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req) as r:
        body = json.loads(r.read())
    return body["token"], body["user"]["role"]

def api_call(method, path, token=None, body=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(
        f"{BASE}{path}",
        data=data,
        headers=headers,
        method=method,
    )
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read())
        except Exception:
            return e.code, {}

def record(name, passed, detail=""):
    ALL_TESTS.append({"name": name, "passed": passed, "detail": detail})
    mark = "✓" if passed else "✗"
    print(f"  {mark} {name}" + (f" — {detail}" if detail and not passed else ""))
    if not passed:
        FAILED.append(name)

# ============ Login all roles ============
print("\n=== Logging in all roles ===")
ROLES = {
    "SUPER_ADMIN": "superadmin@learnx.ai",
    "SCHOOL_HEAD": "principal@learnx.ai",
    "ADMIN": "admin@learnx.ai",
    "TEACHER": "teacher@learnx.ai",
    "STUDENT": "student@learnx.ai",
    "PARENT": "parent@learnx.ai",
    "RECEPTION": "reception@learnx.ai",
    "IT_TEAM": "it@learnx.ai",
}
tokens = {}
for role, email in ROLES.items():
    try:
        tok, r = login(email)
        tokens[role] = tok
        print(f"  ✓ {role} ({email})")
    except Exception as e:
        print(f"  ✗ {role} login failed: {e}")
        sys.exit(1)

# ============ Test 1: Cross-scope rejection ============
print("\n=== Test 1: Cross-scope query rejection (server-side enforcement) ===")

# TEACHER cannot GET /api/fees/defaulters
status, body = api_call("GET", "/api/fees/defaulters", token=tokens["TEACHER"])
record(
    "TEACHER blocked from /api/fees/defaulters",
    status == 403,
    f"got status {status}, body={body}",
)

# IT_TEAM cannot GET /api/students
status, body = api_call("GET", "/api/students", token=tokens["IT_TEAM"])
record(
    "IT_TEAM blocked from /api/students",
    status == 403,
    f"got status {status}, body={body}",
)

# STUDENT cannot POST /api/exams/marks
status, body = api_call("POST", "/api/exams/marks", token=tokens["STUDENT"],
                       body={"examId": "x", "studentId": "y", "marksObtained": 50, "totalMarks": 100})
record(
    "STUDENT blocked from /api/exams/marks",
    status == 403,
    f"got status {status}",
)

# TEACHER cannot POST /api/fees/defaulters (broadcast)
status, body = api_call("POST", "/api/fees/defaulters", token=tokens["TEACHER"],
                       body={"channel": "SMS"})
record(
    "TEACHER blocked from POST /api/fees/defaulters (broadcast)",
    status == 403,
    f"got status {status}",
)

# STUDENT cannot POST /api/attendance (create)
status, body = api_call("POST", "/api/attendance", token=tokens["STUDENT"],
                       body={"studentId": "x", "status": "PRESENT"})
record(
    "STUDENT blocked from POST /api/attendance",
    status == 403,
    f"got status {status}",
)

# ============ Test 2: Allowed queries still work ============
print("\n=== Test 2: Allowed queries still work ===")

# PRINCIPAL can GET /api/fees/defaulters
status, body = api_call("GET", "/api/fees/defaulters", token=tokens["SCHOOL_HEAD"])
record(
    "SCHOOL_HEAD can GET /api/fees/defaulters",
    status == 200,
    f"got status {status}",
)

# ADMIN can GET /api/students
status, body = api_call("GET", "/api/students", token=tokens["ADMIN"])
record(
    "ADMIN can GET /api/students",
    status == 200,
    f"got status {status}, count={body.get('count', 'n/a')}",
)

# TEACHER can GET /api/students (with field redaction)
status, body = api_call("GET", "/api/students", token=tokens["TEACHER"])
record(
    "TEACHER can GET /api/students (with redaction)",
    status == 200,
    f"got status {status}, count={body.get('count', 'n/a')}, scope={body.get('scope', 'n/a')}",
)

# PARENT can GET /api/students (children scope)
status, body = api_call("GET", "/api/students", token=tokens["PARENT"])
record(
    "PARENT can GET /api/students (children scope)",
    status == 200,
    f"got status {status}",
)

# IT_TEAM can GET /api/insights/feed (returns empty due to no student:view)
status, body = api_call("GET", "/api/insights/feed", token=tokens["IT_TEAM"])
record(
    "IT_TEAM gets empty insights feed (no student:view)",
    status == 200 and body.get("count", 0) == 0,
    f"got status {status}, count={body.get('count', 'n/a')}",
)

# ============ Test 3: Orchestrator routes to new agents ============
print("\n=== Test 3: Orchestrator routes to new agents (Transport, HR, Safety) ===")

def orchestrate(token, query):
    return api_call("POST", "/api/ai/orchestrate", token=token,
                    body={"messages": [{"role": "user", "content": query}]})

# Transport query
status, body = orchestrate(tokens["ADMIN"], "bus 14 is running late, notify parents on route")
record(
    "Transport query routes to TransportAgent",
    body.get("agentName") == "TransportAgent",
    f"got agent={body.get('agentName')}, confidence={body.get('routing', {}).get('confidence')}",
)

# HR/Staffing query
status, body = orchestrate(tokens["TEACHER"], "I need leave approval for tomorrow, who is my substitute?")
record(
    "HR query routes to HRStaffingAgent",
    body.get("agentName") == "HRStaffingAgent",
    f"got agent={body.get('agentName')}, confidence={body.get('routing', {}).get('confidence')}",
)

# Safety query
status, body = orchestrate(tokens["TEACHER"], "report a safety incident in classroom 8-B")
record(
    "Safety query routes to SafetyAgent",
    body.get("agentName") == "SafetyAgent",
    f"got agent={body.get('agentName')}, confidence={body.get('routing', {}).get('confidence')}",
)

# ============ Test 4: Concierge greeting personalization ============
print("\n=== Test 4: Concierge greeting personalization ===")

# PRINCIPAL
status, body = api_call("GET", "/api/ai/concierge", token=tokens["SCHOOL_HEAD"])
g = body.get("greeting", {})
record(
    "PRINCIPAL concierge greeting has school-wide counts",
    "active students" in g.get("body", "").lower() or "students" in g.get("body", "").lower(),
    f"body excerpt: {g.get('body', '')[:120]}",
)

# TEACHER
status, body = api_call("GET", "/api/ai/concierge", token=tokens["TEACHER"])
g = body.get("greeting", {})
record(
    "TEACHER concierge mentions 'my tasks' or 'assigned'",
    "task" in g.get("body", "").lower() or "assign" in g.get("body", "").lower(),
    f"body excerpt: {g.get('body', '')[:120]}",
)

# IT_TEAM
status, body = api_call("GET", "/api/ai/concierge", token=tokens["IT_TEAM"])
g = body.get("greeting", {})
record(
    "IT_TEAM concierge mentions rule runs or system",
    "rule" in g.get("body", "").lower() or "system" in g.get("body", "").lower(),
    f"body excerpt: {g.get('body', '')[:120]}",
)

# ============ Test 5: Digital Twin simulation can run ============
print("\n=== Test 5: Digital Twin simulation ===")

# PRINCIPAL can submit a simulation
status, body = api_call("POST", "/api/digital-twin/simulate", token=tokens["SCHOOL_HEAD"],
                       body={
                           "scenarioName": "Test: disable fee reminder rule for 7 days",
                           "windowDays": 30,
                           "overrides": {
                               "disableRuleIds": [],
                               "feeReminderCadenceDays": [14, 21, 28],
                           },
                       })
record(
    "PRINCIPAL can run Digital Twin simulation",
    status == 200 and (body.get("success") or body.get("runId")),
    f"got status {status}, body keys={list(body.keys())[:5]}",
)

# ============ Summary ============
print("\n" + "=" * 60)
total = len(ALL_TESTS)
passed = sum(1 for t in ALL_TESTS if t["passed"])
print(f"RESULT: {passed}/{total} tests passed")
if FAILED:
    print(f"FAILED: {FAILED}")
    sys.exit(1)
else:
    print("✓ ALL TESTS PASSED")
    sys.exit(0)
