# LearnX Face Recognition Microservice

A Python (Flask) microservice that provides **real face recognition** for the
LearnX School ERP. The Next.js app calls this service via HTTP to enroll
student faces, recognize faces in CCTV snapshots, and run automated
class-wise attendance.

## Why Python?

The main LearnX app is Next.js / TypeScript. Face recognition, however,
requires heavy computer-vision libraries (`dlib`, `face_recognition`) that
only have mature Python implementations. This microservice bridges that gap:
the Next.js API routes call this Python service via HTTP, keeping the main
app in TypeScript while leveraging Python's superior CV ecosystem.

## Prerequisites

```bash
# System dependencies (Ubuntu/Debian)
sudo apt update
sudo apt install -y cmake python3-dev python3-pip libopenblas-dev liblapack-dev

# Python packages
pip install flask flask-cors face_recognition Pillow numpy

# For GPU acceleration (optional, 10x faster):
# 1. Install dlib with CUDA: https://github.com/davisking/dlib
# 2. Set USE_GPU=1 when starting the service
```

## Quick Start

```bash
cd python-face-service
pip install -r requirements.txt
python app.py
# → Running on http://localhost:5001
```

Verify it's working:
```bash
curl http://localhost:5001/health
# {"success":true,"status":"healthy","model":"hog","enrolledFaces":0,...}
```

## API Endpoints

### 1. Enroll a Student Face

```bash
curl -X POST http://localhost:5001/enroll \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "STU-2026-0142",
    "name": "Aarav Singh",
    "image": "/path/to/photo.jpg",
    "metadata": { "grade": "7-A" }
  }'
```

The `image` field accepts:
- A local file path
- A base64-encoded string
- A data URL (`data:image/jpeg;base64,...`)
- An HTTP/HTTPS URL

### 2. Recognize Faces in a Snapshot

```bash
curl -X POST http://localhost:5001/recognize \
  -H "Content-Type: application/json" \
  -d '{
    "image": "/path/to/cctv-snapshot.jpg",
    "roster": [
      { "studentId": "STU-001", "name": "Aarav" },
      { "studentId": "STU-002", "name": "Diya" }
    ]
  }'
```

Returns matched student IDs with confidence scores + bounding boxes,
plus any unknown faces.

### 3. Run Attendance for a Class

```bash
curl -X POST http://localhost:5001/attendance \
  -H "Content-Type: application/json" \
  -d '{
    "image": "/path/to/classroom-snapshot.jpg",
    "roster": [
      { "studentId": "STU-001", "name": "Aarav", "parentName": "Suresh", "parentPhone": "+91..." },
      { "studentId": "STU-002", "name": "Diya", "parentName": "Nilesh", "parentPhone": "+91..." }
    ]
  }'
```

Returns:
```json
{
  "success": true,
  "present": ["STU-001"],
  "absent": ["STU-002"],
  "absentees": [{ "studentId": "STU-002", "name": "Diya", "parentName": "Nilesh", "parentPhone": "+91..." }],
  "totalFacesDetected": 1,
  "rosterSize": 2,
  "attendanceRate": 0.5
}
```

The Next.js app then:
1. Writes `PRESENT` / `ABSENT` records to the `Attendance` table
2. For each absentee, calls `sendCommunication()` to notify the parent
3. Logs the whole run in `SafetyScheduledAttendance.lastResult`

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  LearnX Next.js App (port 3000)                         │
│                                                         │
│  /api/safety/attendance/run/[id]                        │
│    1. Fetches class roster from DB                      │
│    2. Fetches CCTV snapshot (via relay or HTTP)         │
│    3. POST /attendance to Python service                │
│    4. Writes Attendance records (PRESENT/ABSENT)        │
│    5. sendCommunication() to absentees' parents         │
│                                                         │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP (localhost:5001)
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Python Face Service (port 5001)                        │
│                                                         │
│  Flask + face_recognition (dlib)                        │
│                                                         │
│  /enroll      → compute 128-d embedding → store JSON    │
│  /recognize   → detect faces → match against embeddings │
│  /attendance  → full class attendance in one call       │
│                                                         │
│  embeddings/  → SHA256-hashed JSON files per student    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Configuration

Environment variables:

| Variable | Default | Description |
|---|---|---|
| `FACE_SERVICE_PORT` | `5001` | Port to listen on |
| `USE_GPU` | `0` | Set to `1` to use CNN model (requires CUDA dlib) |
| `FACE_TOLERANCE` | `0.6` | Lower = stricter matching. 0.4 = very strict, 0.6 = standard, 0.8 = loose |

## Performance

| Mode | Hardware | Speed per snapshot |
|---|---|---|
| HOG (CPU) | Raspberry Pi 4 | ~3-5 seconds |
| HOG (CPU) | Laptop i5 | ~1-2 seconds |
| CNN (GPU) | NVIDIA T4 | ~0.2-0.5 seconds |

For real-time classroom attendance (one snapshot per period), HOG on CPU
is sufficient. For continuous CCTV monitoring, GPU is recommended.

## Security

- Face embeddings are stored as JSON files, hashed by student ID
- The service binds to `0.0.0.0` by default — restrict to `127.0.0.1` if
  the Python service and Next.js app run on the same machine
- No face images are stored — only the 128-dimensional embeddings
- Embeddings cannot be reverse-engineered back into face images

## Integration with LearnX

The Next.js app calls this service via `src/lib/faceRecognition.ts`:

```typescript
// Example usage from a Next.js API route
import { runAttendance } from '@/lib/faceRecognition'

const result = await runAttendance({
  snapshotUrl: 'http://relay-ip/snapshot/cam-001',
  roster: students.map(s => ({
    studentId: s.id,
    name: s.fullName,
    parentName: s.guardianName,
    parentPhone: s.guardianPhone,
  })),
})

// result.present → write Attendance records with status=PRESENT, method=FACE
// result.absent → write Attendance records with status=ABSENT, method=FACE
// result.absentees → sendCommunication() to each parent
```
