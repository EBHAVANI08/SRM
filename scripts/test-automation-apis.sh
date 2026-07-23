#!/bin/bash
# End-to-end test of 4 new automation APIs + sidebar size verification
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
echo "=== Test 1: POST /api/academic-events (create event) ==="
curl -s -X POST http://127.0.0.1:3000/api/academic-events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Annual Sports Day","date":"2026-12-15","type":"EVENT","gradeScope":"All"}' \
  --max-time 15 | python3 -m json.tool 2>/dev/null | head -15

echo ""
echo "=== Test 2: POST /api/achievements (record achievement) ==="
curl -s -X POST http://127.0.0.1:3000/api/achievements \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"studentName":"Test Student","grade":"Grade 7-A","category":"ACADEMIC","title":"Math Olympiad Cleared","achievementDate":"2026-07-23","points":40,"badge":"🥇"}' \
  --max-time 15 | python3 -m json.tool 2>/dev/null | head -15

echo ""
echo "=== Test 3: POST /api/learning-outcomes (create outcome) ==="
curl -s -X POST http://127.0.0.1:3000/api/learning-outcomes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code":"TEST.G7.99","description":"Test outcome for verification","subject":"Mathematics","grade":"Grade 7","bloomLevel":"Apply","masteryPercentage":75,"lessonsLinked":3,"studentsMastered":30,"studentsTotal":40}' \
  --max-time 15 | python3 -m json.tool 2>/dev/null | head -15

echo ""
echo "=== Test 4: POST /api/report-cards (save report card) ==="
curl -s -X POST http://127.0.0.1:3000/api/report-cards \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"studentId":"test-student-001","term":"MID_TERM","overallPercentage":85,"overallGrade":"A2","overallRank":3,"attendancePercentage":94,"teacherRemark":"Excellent performance","status":"PUBLISHED"}' \
  --max-time 15 | python3 -m json.tool 2>/dev/null | head -15

echo ""
echo "=== Test 5: GET /api/academic-events (verify persistence) ==="
curl -s "http://127.0.0.1:3000/api/academic-events" -H "Authorization: Bearer $TOKEN" --max-time 15 | python3 -c "
import sys, json
d = json.loads(sys.stdin.read())
print('Success:', d.get('success'))
events = d.get('events', [])
print('Total events:', len(events))
for e in events[:3]:
    print(f\"  - {e.get('title')} ({e.get('type')}) on {e.get('date','')[:10]}\")
" 2>/dev/null

echo ""
echo "=== Server alive ==="
ps -p $SERVER_PID > /dev/null && echo "✅" || echo "❌"
