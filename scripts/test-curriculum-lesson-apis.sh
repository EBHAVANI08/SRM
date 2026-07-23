#!/bin/bash
# Start server, login, test both APIs, all in one shot
set -e
cd /home/z/my-project
pkill -f "bun.*server\.js" 2>/dev/null || true
sleep 1

NODE_ENV=production bun .next/standalone/server.js > server.log 2>&1 &
SERVER_PID=$!

# Wait for ready
for i in 1 2 3 4 5 6 7 8 9 10; do
  if curl -s -o /dev/null --max-time 2 http://127.0.0.1:3000/ 2>/dev/null; then
    echo "Server ready after ${i}s"
    break
  fi
  sleep 1
done

# Login
TOKEN=$(curl -s -X POST http://127.0.0.1:3000/api/auth/login -H 'Content-Type: application/json' -d '{"email":"superadmin@learnx.ai","password":"demo1234"}' --max-time 15 | python3 -c "import sys,json; print(json.loads(sys.stdin.read()).get('token',''))" 2>/dev/null)
echo "Token: ${TOKEN:0:30}..."

echo ""
echo "=== Test 1: /api/curriculum/generate ==="
RESP1=$(curl -s -X POST http://127.0.0.1:3000/api/curriculum/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"board":"CBSE","grade":"Grade 6","subject":"Mathematics","totalWeeks":40,"periodsPerWeek":5,"periodDuration":40}' \
  --max-time 90)
echo "$RESP1" | head -c 800
echo "..."

echo ""
echo ""
echo "=== Test 2: /api/lesson-plan/generate ==="
RESP2=$(curl -s -X POST http://127.0.0.1:3000/api/lesson-plan/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"topic":"Newton Laws","board":"CBSE","grade":"Grade 9","subject":"Physics"}' \
  --max-time 90)
echo "$RESP2" | head -c 800
echo "..."

# Save full responses for inspection
echo "$RESP1" > /tmp/curriculum-resp.json
echo "$RESP2" > /tmp/lesson-resp.json
echo ""
echo "=== Full responses saved to /tmp/curriculum-resp.json and /tmp/lesson-resp.json ==="

# Server alive check
if ps -p $SERVER_PID > /dev/null; then
  echo "Server alive ✅"
else
  echo "Server died ❌"
  echo "--- server.log tail ---"
  tail -20 server.log 2>/dev/null | grep -v "prisma:query" | head -20
fi
