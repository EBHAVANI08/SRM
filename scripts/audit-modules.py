#!/usr/bin/env python3
"""Audit all 5 broken modules + fees + students to find what's broken."""
import json, urllib.request, urllib.error, time, sys, subprocess, os

BASE = "http://localhost:3000"

def ensure_server():
    try:
        urllib.request.urlopen(f"{BASE}/api/health", timeout=3).read()
        return True
    except: pass
    print("  Starting dev server...")
    subprocess.Popen(["bun","run","dev"], stdout=open("/home/z/my-project/dev.log","a"),
        stderr=subprocess.STDOUT, cwd="/home/z/my-project", start_new_session=True)
    for i in range(30):
        time.sleep(1)
        try:
            urllib.request.urlopen(f"{BASE}/api/health", timeout=3).read()
            print(f"  Ready after {i+1}s"); return True
        except: continue
    return False

def login(email="principal@learnx.ai"):
    data = json.dumps({"email": email, "password": "demo1234"}).encode()
    req = urllib.request.Request(f"{BASE}/api/auth/login", data=data,
        headers={"Content-Type":"application/json"}, method="POST")
    return json.loads(urllib.request.urlopen(req, timeout=10).read())["token"]

def get(path, token):
    req = urllib.request.Request(f"{BASE}{path}", headers={"Authorization": f"Bearer {token}"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        try: return e.code, json.loads(e.read())
        except: return e.code, {}
    except Exception as e:
        return -1, {"error": str(e)}

if not ensure_server():
    print("✗ server failed"); sys.exit(1)

print("\n=== Login ===")
token = login()
print(f"  ✓ {token[:30]}...")

print("\n=== /api/role-matrix ===")
s, b = get("/api/role-matrix", token)
print(f"  HTTP {s}")
print(f"  keys: {list(b.keys())}")
if 'roles' in b:
    print(f"  roles: {len(b['roles'])}")
    if b['roles']: print(f"  first: {json.dumps(b['roles'][0])[:200]}")
elif 'matrix' in b:
    print(f"  matrix keys: {list(b['matrix'].keys())}")

print("\n=== /api/automation/center ===")
s, b = get("/api/automation/center", token)
print(f"  HTTP {s}")
print(f"  keys: {list(b.keys())}")
for k,v in b.items():
    if isinstance(v, list): print(f"  {k}: list[{len(v)}]")
    elif isinstance(v, dict): print(f"  {k}: dict keys={list(v.keys())[:5]}")
    else: print(f"  {k}: {str(v)[:60]}")

print("\n=== /api/autopilot/status ===")
s, b = get("/api/autopilot/status", token)
print(f"  HTTP {s}")
print(f"  keys: {list(b.keys())}")
for k,v in b.items():
    if isinstance(v, list): print(f"  {k}: list[{len(v)}]")
    elif isinstance(v, dict): print(f"  {k}: dict keys={list(v.keys())[:5]}")
    else: print(f"  {k}: {str(v)[:60]}")

print("\n=== /api/notifications/log ===")
s, b = get("/api/notifications/log", token)
print(f"  HTTP {s}")
print(f"  keys: {list(b.keys())}")
for k,v in b.items():
    if isinstance(v, list):
        print(f"  {k}: list[{len(v)}]")
        if v: print(f"    first: {json.dumps(v[0])[:200]}")
    else: print(f"  {k}: {str(v)[:60]}")

print("\n=== /api/agent-matrix ===")
s, b = get("/api/agent-matrix", token)
print(f"  HTTP {s}")
print(f"  keys: {list(b.keys())}")
print(f"  counts: {b.get('counts')}")

print("\n=== /api/students?limit=2 ===")
s, b = get("/api/students?limit=2", token)
print(f"  HTTP {s}")
print(f"  count: {b.get('count')}")
for s in b.get('students',[])[:2]:
    print(f"  id={s.get('id','')[:12]} fn=\"{s.get('fullName','')}\" fn=\"{s.get('firstName','')}\" ln=\"{s.get('lastName','')}\"")
    print(f"    keys: {list(s.keys())[:10]}")

print("\n=== /api/fees/defaulters ===")
s, b = get("/api/fees/defaulters", token)
print(f"  HTTP {s}")
print(f"  count: {b.get('count')}")
for d in b.get('defaulters',[])[:2]:
    print(f"  - {d.get('studentName','')} id={d.get('studentId','')[:12]} due={d.get('totalDue')}")

print("\n=== /api/entities/STUDENT/<id>/timeline ===")
# get first student id
s, b = get("/api/students?limit=1", token)
if b.get('students'):
    sid = b['students'][0]['id']
    s, b = get(f"/api/entities/STUDENT/{sid}/timeline", token)
    print(f"  HTTP {s} for student {sid[:12]}")
    print(f"  keys: {list(b.keys())}")
    for k,v in b.items():
        if isinstance(v, list): print(f"  {k}: list[{len(v)}]")
