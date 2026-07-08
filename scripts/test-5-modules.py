#!/usr/bin/env python3
"""
Comprehensive test of all 5 modules — starts dev server, logs in, tests each module API,
and reports exactly what's broken.
"""
import json, urllib.request, urllib.error, time, sys, subprocess, os

BASE = "http://localhost:3000"
RESULTS = []

def ensure_server():
    """Start dev server if not running, wait for it to be ready."""
    try:
        urllib.request.urlopen(f"{BASE}/api/health", timeout=3).read()
        return True
    except: pass
    print("  Starting dev server...", flush=True)
    proc = subprocess.Popen(
        ["bun", "run", "dev"],
        stdout=open("/home/z/my-project/dev.log", "a"),
        stderr=subprocess.STDOUT,
        cwd="/home/z/my-project",
        start_new_session=True,
    )
    for i in range(40):
        time.sleep(1)
        try:
            urllib.request.urlopen(f"{BASE}/api/health", timeout=3).read()
            print(f"  Dev server ready after {i+1}s", flush=True)
            return True
        except: continue
    return False

def login(email="principal@learnx.ai"):
    data = json.dumps({"email": email, "password": "demo1234"}).encode()
    req = urllib.request.Request(f"{BASE}/api/auth/login", data=data,
        headers={"Content-Type": "application/json"}, method="POST")
    body = json.loads(urllib.request.urlopen(req, timeout=15).read())
    return body.get("token",""), body.get("user",{})

def api_get(path, token):
    req = urllib.request.Request(f"{BASE}{path}", headers={"Authorization": f"Bearer {token}"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        try: return e.code, json.loads(e.read())
        except: return e.code, {"error": "non-json"}
    except Exception as e:
        return -1, {"error": str(e)}

def test(name, ok, detail=""):
    RESULTS.append((name, ok, detail))
    mark = "✓" if ok else "✗"
    print(f"  {mark} {name}" + (f" — {detail}" if detail and not ok else ""), flush=True)

# ═══════════════════════════════════════════════════════════════════════
print("\n" + "=" * 60)
print("  COMPREHENSIVE 5-MODULE TEST")
print("=" * 60, flush=True)

if not ensure_server():
    print("✗ Could not start dev server")
    sys.exit(1)

print("\n=== Login ===", flush=True)
token, user = login()
test("Login as principal", bool(token), f"user={user.get('name')} role={user.get('role')}")
if not token:
    sys.exit(1)

# ─── Module 1: Role Matrix ─────────────────────────────────────────────
print("\n=== Module 1: Role Matrix ===", flush=True)
s, b = api_get("/api/role-matrix", token)
test("API returns 200", s == 200, f"got {s}")
test("Returns 8 roles", b.get("count") == 8, f"got {b.get('count')}")
roles = b.get("roles", [])
if roles:
    test("First role has sees/neverSees/primaryAgents",
         bool(roles[0].get("sees") and roles[0].get("neverSees") is not None and roles[0].get("primaryAgents")),
         f"role={roles[0].get('role')}")
    test("All 8 roles have primaryAgents",
         all(r.get("primaryAgents") for r in roles),
         f"{sum(1 for r in roles if r.get('primaryAgents'))}/8 have agents")

# ─── Module 2: Automation Center ───────────────────────────────────────
print("\n=== Module 2: Automation Center ===", flush=True)
s, b = api_get("/api/automation/center", token)
test("API returns 200", s == 200, f"got {s}")
test("Has KPIs", bool(b.get("kpis")), f"kpis={b.get('kpis')}")
test("Has rules array", "rules" in b, f"rules count={len(b.get('rules',[]))}")
test("Has triggerMatrix", "triggerMatrix" in b, f"triggers={len(b.get('triggerMatrix',[]))}")
test("Has recentRuns", "recentRuns" in b, f"runs={len(b.get('recentRuns',[]))}")
test("Has checkpoints", "checkpoints" in b, f"checkpoints={len(b.get('checkpoints',[]))}")
rules = b.get("rules", [])
if rules:
    r = rules[0]
    test("First rule has name/tier/enabled",
         bool(r.get("name") and r.get("tier") and r.get("enabled") is not None),
         f"name={r.get('name','?')[:30]} tier={r.get('tier')}")

# ─── Module 3: Autopilot Status ────────────────────────────────────────
print("\n=== Module 3: Autopilot Status ===", flush=True)
s, b = api_get("/api/autopilot/status", token)
test("API returns 200", s == 200, f"got {s}")
test("Has schedule array", "schedule" in b, f"schedule items={len(b.get('schedule',[]))}")
test("Has checkpoints array", "checkpoints" in b, f"checkpoints={len(b.get('checkpoints',[]))}")
sched = b.get("schedule", [])
if sched:
    test("Schedule items have type + time",
         bool(sched[0].get("type") and sched[0].get("time") is not None),
         f"first: {sched[0].get('type')} @ {sched[0].get('time')}")
    test("Has 9 daily checkpoints", len(sched) == 9, f"got {len(sched)}")

# ─── Module 4: Notification Log ────────────────────────────────────────
print("\n=== Module 4: Notification Log ===", flush=True)
s, b = api_get("/api/notifications/log", token)
test("API returns 200", s == 200, f"got {s}")
test("Has logs array", "logs" in b, f"logs={len(b.get('logs',[]))}")
test("Has stats object", "stats" in b, f"stats={b.get('stats')}")
logs = b.get("logs", [])
if logs:
    l = logs[0]
    test("Log has channel/status/body",
         bool(l.get("channel") and l.get("status") and l.get("body")),
         f"channel={l.get('channel')} status={l.get('status')}")

# ─── Module 5: Agent Matrix ────────────────────────────────────────────
print("\n=== Module 5: Agent Matrix ===", flush=True)
s, b = api_get("/api/agent-matrix", token)
test("API returns 200", s == 200, f"got {s}")
c = b.get("counts", {})
test("Has 10 spec agents", c.get("spec") == 10, f"got {c.get('spec')}")
test("Has 13+ total agents", c.get("total", 0) >= 13, f"got {c.get('total')}")
sa = b.get("specAgents", [])
if sa:
    a = sa[0]
    test("Agent has owns/autonomousActions/proposeOnlyActions",
         bool(a.get("owns") and a.get("autonomousActions") and a.get("proposeOnlyActions")),
         f"agent={a.get('name')}")
    test("All spec agents have capability metadata",
         all(a.get("owns") and a.get("autonomousActions") and a.get("proposeOnlyActions") for a in sa),
         f"{sum(1 for a in sa if a.get('owns') and a.get('autonomousActions') and a.get('proposeOnlyActions'))}/{len(sa)} complete")

# ─── Summary ───────────────────────────────────────────────────────────
print("\n" + "=" * 60, flush=True)
passed = sum(1 for _, ok, _ in RESULTS if ok)
total = len(RESULTS)
print(f"RESULT: {passed}/{total} tests passed", flush=True)
failed = [(n, d) for n, ok, d in RESULTS if not ok]
if failed:
    print(f"\nFAILED:")
    for n, d in failed:
        print(f"  ✗ {n}: {d}")
sys.exit(0 if passed == total else 1)
