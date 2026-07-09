"""
LearnX Face Recognition Microservice
=====================================

A Python (Flask) microservice that provides real face recognition for
the LearnX School ERP. The Next.js app calls this service via HTTP to:

  1. Enroll a student's face (upload photo → compute 128-d embedding → store)
  2. Recognize faces in a CCTV snapshot (send image → return matched student IDs)
  3. Run attendance for a class (send snapshot + roster → return present/absent)

Architecture
------------
- Uses the `face_recognition` library (dlib-backed, HOG + CNN models)
- Stores face embeddings as JSON files under ./embeddings/
- Runs on port 5001 by default
- Called by the Next.js API routes at /api/safety/attendance/run/[id]

Prerequisites
-------------
  pip install flask flask-cors face_recognition Pillow numpy
  # For GPU acceleration (optional, 10x faster):
  # Install dlib with CUDA support before face_recognition

Usage
-----
  python app.py
  # or with GPU:
  CUDA_VISIBLE_DEVICES=0 python app.py

Endpoints
---------
  GET  /health              — health check
  POST /enroll              — enroll a student face
  POST /recognize           — recognize faces in an image
  POST /attendance          — run attendance for a class
  GET  /embeddings/:id      — fetch a student's embedding
  DELETE /embeddings/:id    — delete a student's embedding
"""

import os
import json
import base64
import io
import time
import hashlib
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np
from PIL import Image
from flask import Flask, request, jsonify
from flask_cors import CORS

# face_recognition is the standard Python face-recognition library
# (dlib-backed, 99.38% accuracy on LFW). Install with:
#   pip install face_recognition
import face_recognition

app = Flask(__name__)
CORS(app)

# ============ Configuration ============
EMBEDDINGS_DIR = Path(__file__).parent / 'embeddings'
EMBEDDINGS_DIR.mkdir(exist_ok=True)
PORT = int(os.environ.get('FACE_SERVICE_PORT', '5001'))
# Use CNN model if GPU is available, otherwise HOG (CPU, slower but works)
USE_GPU = os.environ.get('USE_GPU', '0') == '1'
MODEL = 'cnn' if USE_GPU else 'hog'
# Tolerance: lower = stricter matching. 0.6 is the library default (good balance)
TOLERANCE = float(os.environ.get('FACE_TOLERANCE', '0.6'))


# ============ Persistence ============
def embedding_path(student_id: str) -> Path:
    """Safe file path for a student's embedding JSON."""
    # Hash the ID to prevent path traversal
    safe = hashlib.sha256(student_id.encode()).hexdigest()[:16]
    return EMBEDDINGS_DIR / f'{safe}.json'


def save_embedding(student_id: str, name: str, encoding: np.ndarray, metadata: dict = None):
    """Persist a face embedding to disk."""
    data = {
        'studentId': student_id,
        'name': name,
        'encoding': encoding.tolist(),
        'enrolledAt': time.time(),
        'metadata': metadata or {},
    }
    with open(embedding_path(student_id), 'w') as f:
        json.dump(data, f)


def load_embedding(student_id: str) -> Optional[dict]:
    """Load a face embedding from disk."""
    p = embedding_path(student_id)
    if not p.exists():
        return None
    with open(p, 'r') as f:
        return json.load(f)


def load_all_embeddings() -> List[Tuple[str, str, np.ndarray]]:
    """Load all enrolled face embeddings. Returns [(studentId, name, encoding), ...]"""
    result = []
    for p in EMBEDDINGS_DIR.glob('*.json'):
        try:
            with open(p, 'r') as f:
                data = json.load(f)
            result.append((data['studentId'], data['name'], np.array(data['encoding'])))
        except Exception as e:
            print(f'Warning: failed to load {p}: {e}')
    return result


# ============ Image helpers ============
def decode_image(image_data: str) -> np.ndarray:
    """Decode a base64-encoded image or a file path into an RGB numpy array."""
    if image_data.startswith('data:'):
        # Strip data URL prefix
        image_data = image_data.split(',', 1)[1]
    if image_data.startswith('http://') or image_data.startswith('https://'):
        # URL — fetch it
        import urllib.request
        with urllib.request.urlopen(image_data) as resp:
            image_bytes = resp.read()
    elif os.path.exists(image_data):
        # Local file path
        with open(image_data, 'rb') as f:
            image_bytes = f.read()
    else:
        # Assume base64
        image_bytes = base64.b64decode(image_data)

    img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    return np.array(img)


# ============ API Endpoints ============

@app.route('/health', methods=['GET'])
def health():
    """Health check — also reports model + enrollment count."""
    enrolled = len(list(EMBEDDINGS_DIR.glob('*.json')))
    return jsonify({
        'success': True,
        'status': 'healthy',
        'model': MODEL,
        'gpu': USE_GPU,
        'tolerance': TOLERANCE,
        'enrolledFaces': enrolled,
        'library': 'face_recognition (dlib)',
    })


@app.route('/enroll', methods=['POST'])
def enroll_face():
    """
    Enroll a student's face.

    Body JSON:
      {
        "studentId": "STU-2026-0142",
        "name": "Aarav Singh",
        "image": "<base64 or URL or file path>",
        "metadata": { "grade": "7-A", "photo": "👨‍🎓" }
      }

    Returns:
      { "success": true, "encodingSize": 128, "facesDetected": 1 }
    """
    try:
        data = request.json
        student_id = data.get('studentId')
        name = data.get('name')
        image_data = data.get('image')
        metadata = data.get('metadata', {})

        if not student_id or not name or not image_data:
            return jsonify({'success': False, 'error': 'studentId, name, and image are required'}), 400

        # Decode image
        img = decode_image(image_data)

        # Detect faces and compute embeddings
        face_locations = face_recognition.face_locations(img, model=MODEL)
        if len(face_locations) == 0:
            return jsonify({'success': False, 'error': 'No face detected in the image'}), 400
        if len(face_locations) > 1:
            return jsonify({
                'success': False,
                'error': f'Multiple faces ({len(face_locations)}) detected. Please upload a photo with only the student.',
            }), 400

        encodings = face_recognition.face_encodings(img, face_locations)
        if len(encodings) == 0:
            return jsonify({'success': False, 'error': 'Face detected but could not compute encoding'}), 400

        # Save the embedding
        save_embedding(student_id, name, encodings[0], metadata)

        return jsonify({
            'success': True,
            'studentId': student_id,
            'name': name,
            'encodingSize': len(encodings[0]),
            'facesDetected': 1,
            'faceLocation': face_locations[0],
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/recognize', methods=['POST'])
def recognize_faces():
    """
    Recognize all faces in a snapshot.

    Body JSON:
      {
        "image": "<base64 or URL>",
        "roster": [
          { "studentId": "STU-001", "name": "Aarav" },
          { "studentId": "STU-002", "name": "Diya" }
        ]
      }

    Returns:
      {
        "success": true,
        "facesDetected": 5,
        "matches": [
          { "studentId": "STU-001", "name": "Aarav", "confidence": 0.92, "box": [t, r, b, l] },
          ...
        ],
        "unknown": [ { "box": [...], "confidence": null } ]
      }
    """
    try:
        data = request.json
        image_data = data.get('image')
        roster = data.get('roster', [])

        if not image_data:
            return jsonify({'success': False, 'error': 'image is required'}), 400

        # Decode image
        img = decode_image(image_data)

        # Detect all faces in the image
        face_locations = face_recognition.face_locations(img, model=MODEL)
        if len(face_locations) == 0:
            return jsonify({
                'success': True,
                'facesDetected': 0,
                'matches': [],
                'unknown': [],
                'message': 'No faces detected in the snapshot.',
            })

        # Compute encodings for all detected faces
        face_encodings = face_recognition.face_encodings(img, face_locations)

        # Load enrolled embeddings (filtered by roster if provided)
        all_enrolled = load_all_embeddings()
        if roster:
            roster_ids = {r['studentId'] for r in roster}
            enrolled = [(sid, name, enc) for sid, name, enc in all_enrolled if sid in roster_ids]
        else:
            enrolled = all_enrolled

        if not enrolled:
            return jsonify({
                'success': True,
                'facesDetected': len(face_locations),
                'matches': [],
                'unknown': [{'box': list(loc), 'confidence': None} for loc in face_locations],
                'message': 'No enrolled faces to match against.',
            })

        # Build numpy arrays for batch comparison
        known_encodings = np.array([enc for _, _, enc in enrolled])
        known_ids = [sid for sid, _, _ in enrolled]
        known_names = [name for _, name, _ in enrolled]

        matches = []
        unknown = []

        for i, (loc, enc) in enumerate(zip(face_locations, face_encodings)):
            # Compare this face against all known faces
            distances = face_recognition.face_distance(known_encodings, enc)
            best_idx = np.argmin(distances)
            best_distance = distances[best_idx]

            if best_distance <= TOLERANCE:
                # Confidence = 1 - normalized distance
                confidence = 1.0 - (best_distance / TOLERANCE)
                matches.append({
                    'studentId': known_ids[best_idx],
                    'name': known_names[best_idx],
                    'confidence': round(float(confidence), 3),
                    'distance': round(float(best_distance), 3),
                    'box': list(loc),  # [top, right, bottom, left]
                })
            else:
                unknown.append({
                    'box': list(loc),
                    'confidence': None,
                    'bestMatch': known_names[best_idx],
                    'bestDistance': round(float(best_distance), 3),
                })

        return jsonify({
            'success': True,
            'facesDetected': len(face_locations),
            'matches': matches,
            'unknown': unknown,
            'processingTimeMs': None,  # Could add timing if needed
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/attendance', methods=['POST'])
def run_attendance():
    """
    Run attendance for a class.

    Body JSON:
      {
        "image": "<base64 or URL>",
        "roster": [
          { "studentId": "STU-001", "name": "Aarav", "parentName": "...", "parentPhone": "..." },
          ...
        ]
      }

    Returns:
      {
        "success": true,
        "present": ["STU-001", ...],
        "absent": ["STU-002", ...],
        "unknown": [ { "box": [...] } ],
        "totalFaces": 5,
        "attendanceRate": 0.75
      }
    """
    try:
        data = request.json
        image_data = data.get('image')
        roster = data.get('roster', [])

        if not image_data or not roster:
            return jsonify({'success': False, 'error': 'image and roster are required'}), 400

        # Run recognition
        img = decode_image(image_data)
        face_locations = face_recognition.face_locations(img, model=MODEL)
        face_encodings = face_recognition.face_encodings(img, face_locations) if face_locations else []

        # Load embeddings for roster students only
        all_enrolled = load_all_embeddings()
        roster_ids = {r['studentId'] for r in roster}
        enrolled = [(sid, name, enc) for sid, name, enc in all_enrolled if sid in roster_ids]

        if not enrolled:
            return jsonify({
                'success': False,
                'error': 'No enrolled faces found for the roster students. Please enroll student photos first.',
            }), 400

        known_encodings = np.array([enc for _, _, enc in enrolled])
        known_ids = [sid for sid, _, _ in enrolled]

        present = set()
        for enc in face_encodings:
            distances = face_recognition.face_distance(known_encodings, enc)
            best_idx = np.argmin(distances)
            if distances[best_idx] <= TOLERANCE:
                present.add(known_ids[best_idx])

        absent = [r['studentId'] for r in roster if r['studentId'] not in present]
        present_list = list(present)

        return jsonify({
            'success': True,
            'present': present_list,
            'absent': absent,
            'absentees': [r for r in roster if r['studentId'] in absent],
            'unknownFaces': len(face_locations) - len(present_list),
            'totalFacesDetected': len(face_locations),
            'rosterSize': len(roster),
            'attendanceRate': round(len(present_list) / len(roster), 3) if roster else 0,
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/embeddings/<student_id>', methods=['GET'])
def get_embedding(student_id: str):
    """Fetch a student's face embedding metadata."""
    data = load_embedding(student_id)
    if not data:
        return jsonify({'success': False, 'error': 'No embedding found'}), 404
    return jsonify({'success': True, 'embedding': data})


@app.route('/embeddings/<student_id>', methods=['DELETE'])
def delete_embedding(student_id: str):
    """Delete a student's face embedding."""
    p = embedding_path(student_id)
    if p.exists():
        p.unlink()
        return jsonify({'success': True, 'deleted': student_id})
    return jsonify({'success': False, 'error': 'Not found'}), 404


@app.route('/stats', methods=['GET'])
def stats():
    """Service statistics."""
    enrolled = load_all_embeddings()
    return jsonify({
        'success': True,
        'totalEnrolled': len(enrolled),
        'model': MODEL,
        'gpu': USE_GPU,
        'tolerance': TOLERANCE,
        'enrolledStudents': [{'studentId': sid, 'name': name} for sid, name, _ in enrolled],
    })


# ============ Main ============
if __name__ == '__main__':
    print(f'LearnX Face Recognition Service')
    print(f'  Model: {MODEL} (GPU: {USE_GPU})')
    print(f'  Tolerance: {TOLERANCE}')
    print(f'  Enrolled faces: {len(list(EMBEDDINGS_DIR.glob("*.json")))}')
    print(f'  Starting on port {PORT}...')
    app.run(host='0.0.0.0', port=PORT, debug=False)
