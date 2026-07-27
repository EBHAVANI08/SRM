#!/bin/bash
# End-to-end test of the full automation chain in one shot
set -e
cd /home/z/my-project
pkill -f "bun.*server\.js" 2>/dev/null || true
sleep 1

NODE_ENV=production bun .next/standalone/server.js > server.log 2>&1 &
SERVER_PID=$!

for i in 1 2 3 4 5 6 7 8 9 10; do
  if curl -s -o /dev/null --max-time 2 http://127.0.0.1:3000/ 2>/dev/null; then
    echo "Server ready after ${i}s"
    break
  fi
  sleep 1
done

TOKEN=$(curl -s -X POST http://127.0.0.1:3000/api/auth/login -H 'Content-Type: application/json' -d '{"email":"superadmin@learnx.ai","password":"demo1234"}' --max-time 15 | python3 -c "import sys,json; print(json.loads(sys.stdin.read()).get('token',''))" 2>/dev/null)
echo "Token: ${TOKEN:0:30}..."

echo ""
echo "=== Test: POST /api/staff (create staff → credentials email + audit + alert) ==="
STAFF_RESP=$(curl -s -X POST http://127.0.0.1:3000/api/staff \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Automated","lastName":"TestTeacher","email":"auto.test.teacher@learnx.edu","phone":"+91 99000 11111","designation":"Teacher","department":"Mathematics","subjectSpecialization":"Mathematics|Algebra","dob":"1990-01-15","gender":"Female","joiningDate":"2026-07-23","role":"TEACHER"}' \
  --max-time 30)
echo "$STAFF_RESP" | python3 -c "
import sys, json
d = json.loads(sys.stdin.read())
print('Success:', d.get('success'))
print('Staff ID:', d.get('staff', {}).get('id', 'N/A')[:30] if d.get('staff') else 'N/A')
print('Employee ID:', d.get('employeeId'))
print('Message:', d.get('message'))
if d.get('error'): print('Error:', d.get('error'))
" 2>&1

echo ""
echo "=== Verify AuditLog + CommunicationLog entries ==="
bun run scripts/check-audit.js 2>&1 | tail -40

echo ""
echo "=== Server alive ==="
ps -p $SERVER_PID > /dev/null && echo "✅" || echo "❌ Died"
