/**
 * faceRecognition.ts — TypeScript adapter for the Python face-recognition
 * microservice.
 *
 * The Python service (python-face-service/app.py) runs on port 5001 and
 * provides real face detection + recognition via the `face_recognition`
 * library (dlib-backed, 99.38% accuracy on LFW).
 *
 * This module is the single integration point between the Next.js app
 * and the Python service. All calls go through here so we can swap the
 * backend (e.g. to AWS Rekognition or a different microservice) without
 * touching the API routes.
 *
 * If the Python service is not running, all functions fail gracefully
 * with a clear error — never silently faking recognition results.
 */

const FACE_SERVICE_URL = process.env.FACE_SERVICE_URL || 'http://localhost:5001'

export interface FaceMatch {
  studentId: string
  name: string
  confidence: number
  distance: number
  box: [number, number, number, number] // [top, right, bottom, left]
}

export interface UnknownFace {
  box: [number, number, number, number]
  confidence: null
  bestMatch?: string
  bestDistance?: number
}

export interface RecognizeResult {
  success: boolean
  facesDetected: number
  matches: FaceMatch[]
  unknown: UnknownFace[]
  error?: string
}

export interface AttendanceResult {
  success: boolean
  present: string[]
  absent: string[]
  absentees: { studentId: string; name: string; parentName?: string; parentPhone?: string }[]
  unknownFaces: number
  totalFacesDetected: number
  rosterSize: number
  attendanceRate: number
  error?: string
}

export interface EnrollResult {
  success: boolean
  studentId: string
  encodingSize: number
  facesDetected: number
  error?: string
}

/**
 * Check if the Python face service is running.
 */
export async function checkFaceServiceHealth(): Promise<{ online: boolean; enrolledFaces: number; model: string }> {
  try {
    const res = await fetch(`${FACE_SERVICE_URL}/health`, {
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) return { online: false, enrolledFaces: 0, model: 'unknown' }
    const data = await res.json()
    return {
      online: data.status === 'healthy',
      enrolledFaces: data.enrolledFaces || 0,
      model: data.model || 'unknown',
    }
  } catch {
    return { online: false, enrolledFaces: 0, model: 'unknown' }
  }
}

/**
 * Enroll a student's face into the recognition database.
 */
export async function enrollFace(params: {
  studentId: string
  name: string
  image: string // base64, data URL, file path, or HTTP URL
  metadata?: Record<string, any>
}): Promise<EnrollResult> {
  try {
    const res = await fetch(`${FACE_SERVICE_URL}/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(30000),
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      return { success: false, studentId: params.studentId, encodingSize: 0, facesDetected: 0, error: data.error || `HTTP ${res.status}` }
    }
    return {
      success: true,
      studentId: data.studentId,
      encodingSize: data.encodingSize,
      facesDetected: data.facesDetected,
    }
  } catch (e: any) {
    return {
      success: false,
      studentId: params.studentId,
      encodingSize: 0,
      facesDetected: 0,
      error: e?.message || 'Face service unreachable. Is the Python service running on port 5001?',
    }
  }
}

/**
 * Recognize all faces in a snapshot against an optional roster.
 */
export async function recognizeFaces(params: {
  image: string
  roster?: { studentId: string; name: string }[]
}): Promise<RecognizeResult> {
  try {
    const res = await fetch(`${FACE_SERVICE_URL}/recognize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(30000),
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      return { success: false, facesDetected: 0, matches: [], unknown: [], error: data.error || `HTTP ${res.status}` }
    }
    return {
      success: true,
      facesDetected: data.facesDetected,
      matches: data.matches,
      unknown: data.unknown,
    }
  } catch (e: any) {
    return {
      success: false,
      facesDetected: 0,
      matches: [],
      unknown: [],
      error: e?.message || 'Face service unreachable.',
    }
  }
}

/**
 * Run full class attendance: send a snapshot + roster, get back present/absent.
 */
export async function runAttendance(params: {
  image: string
  roster: {
    studentId: string
    name: string
    parentName?: string
    parentPhone?: string
  }[]
}): Promise<AttendanceResult> {
  try {
    const res = await fetch(`${FACE_SERVICE_URL}/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(60000), // 60s — face recognition can be slow on CPU
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      return {
        success: false,
        present: [],
        absent: [],
        absentees: [],
        unknownFaces: 0,
        totalFacesDetected: 0,
        rosterSize: params.roster.length,
        attendanceRate: 0,
        error: data.error || `HTTP ${res.status}`,
      }
    }
    return {
      success: true,
      present: data.present,
      absent: data.absent,
      absentees: data.absentees,
      unknownFaces: data.unknownFaces,
      totalFacesDetected: data.totalFacesDetected,
      rosterSize: data.rosterSize,
      attendanceRate: data.attendanceRate,
    }
  } catch (e: any) {
    return {
      success: false,
      present: [],
      absent: [],
      absentees: [],
      unknownFaces: 0,
      totalFacesDetected: 0,
      rosterSize: params.roster.length,
      attendanceRate: 0,
      error: e?.message || 'Face service unreachable.',
    }
  }
}
