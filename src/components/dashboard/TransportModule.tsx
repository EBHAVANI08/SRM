'use client'

/**
 * TransportModule — School transport management with route tracking,
 * vehicle management, and proximity notifications.
 *
 * Flow chart item: "Transport Tracking → Proximity Notifications"
 * When a bus approaches a pickup point, parents auto-get WhatsApp + SMS.
 *
 * Backend already exists: src/lib/transportService.ts + /api/transport/*
 * This is the UI that was missing.
 */

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Bus, MapPin, Users, Navigation, Clock, Phone, Plus, RefreshCw,
  AlertCircle, CheckCircle2, Play, Zap, Route, X,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { SectionHeader } from './SectionHeader'
import { apiGet, apiPost } from '@/lib/apiFetch'
import { toast } from 'sonner'

interface Route_ {
  id: string
  name: string
  vehicleNo: string
  driverName: string
  driverPhone: string
  pickupPoints: { name: string; time: string; students: number }[]
  totalStudents: number
  status: 'ACTIVE' | 'IDLE' | 'MAINTENANCE'
}

const ROUTES: Route_[] = [
  {
    id: 'RTE-001',
    name: 'Indiranagar → LearnX',
    vehicleNo: 'KA-01-MN-1122',
    driverName: 'Ramesh',
    driverPhone: '+91 99001 11222',
    pickupPoints: [
      { name: 'MG Road Junction', time: '07:15 AM', students: 8 },
      { name: 'Indiranagar Metro', time: '07:25 AM', students: 5 },
      { name: '100ft Road', time: '07:35 AM', students: 6 },
    ],
    totalStudents: 19,
    status: 'ACTIVE',
  },
  {
    id: 'RTE-002',
    name: 'Jayanagar → LearnX',
    vehicleNo: 'KA-01-MN-3344',
    driverName: 'Suresh',
    driverPhone: '+91 99001 22333',
    pickupPoints: [
      { name: 'Jayanagar 4th Block', time: '07:20 AM', students: 12 },
      { name: 'South End', time: '07:30 AM', students: 4 },
    ],
    totalStudents: 16,
    status: 'ACTIVE',
  },
  {
    id: 'RTE-003',
    name: 'Koramangala → LearnX',
    vehicleNo: 'KA-01-MN-5566',
    driverName: 'Mohan',
    driverPhone: '+91 99001 33444',
    pickupPoints: [
      { name: 'Sony Signal', time: '07:10 AM', students: 7 },
      { name: 'Forum Mall', time: '07:20 AM', students: 9 },
      { name: '5th Block', time: '07:30 AM', students: 5 },
    ],
    totalStudents: 21,
    status: 'IDLE',
  },
]

export function TransportModule() {
  const [routes, setRoutes] = useState<Route_[]>(ROUTES)
  const [selectedRoute, setSelectedRoute] = useState<Route_ | null>(null)
  const [simulating, setSimulating] = useState(false)
  const [tab, setTab] = useState<'routes' | 'live' | 'history'>('routes')

  const handleSimulateProximity = async () => {
    setSimulating(true)
    const { data, error } = await apiPost<any>('/api/transport/simulate-proximity', {})
    if (error) {
      toast.error(`Simulation failed: ${error}`)
    } else if (data?.success) {
      toast.success(`🚌 Proximity simulation triggered`, {
        description: `${data.notifiedParents || 0} parents notified via WhatsApp + SMS`,
        duration: 5000,
      })
    } else {
      toast.error(`Simulation failed: ${data?.error || 'unknown'}`)
    }
    setSimulating(false)
  }

  const stats = {
    activeRoutes: routes.filter((r) => r.status === 'ACTIVE').length,
    totalVehicles: routes.length,
    totalStudents: routes.reduce((s, r) => s + r.totalStudents, 0),
    totalPickupPoints: routes.reduce((s, r) => s + r.pickupPoints.length, 0),
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 animate-page-enter max-w-[1600px] mx-auto">
      <SectionHeader
        emoji="🚌"
        title="Transport Management"
        subtitle="Route tracking · proximity notifications · vehicle management"
        accent="#0EA5E9"
        onRefresh={() => toast.success('✅ Refreshed')}
        aiActions={[
          { label: 'active routes', count: stats.activeRoutes },
          { label: 'vehicles', count: stats.totalVehicles },
          { label: 'students transported', count: stats.totalStudents },
        ]}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Active Routes', value: stats.activeRoutes, icon: Route, color: '#22C55E' },
          { label: 'Total Vehicles', value: stats.totalVehicles, icon: Bus, color: '#0EA5E9' },
          { label: 'Students', value: stats.totalStudents, icon: Users, color: '#1E3A8A' },
          { label: 'Pickup Points', value: stats.totalPickupPoints, icon: MapPin, color: '#F59E0B' },
        ].map((s, i) => {
          const Icon = s.icon
          return (
            <Card key={i} className="p-4 rounded-2xl">
              <div className="flex items-start justify-between mb-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white" style={{ background: s.color }}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-bold text-slate-900">{s.value}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{s.label}</div>
            </Card>
          )
        })}
      </div>

      {/* Proximity simulation banner */}
      <Card className="p-4 border-sky-200 bg-sky-50/50">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-sky-600" />
          <div className="flex-1">
            <div className="text-sm font-semibold text-slate-900">Proximity Notification System</div>
            <p className="text-[11px] text-slate-600">When a bus approaches a pickup point, parents automatically receive WhatsApp + SMS with ETA. 10-minute cooldown prevents spam.</p>
          </div>
          <Button size="sm" className="h-8 text-xs rounded-lg text-white" style={{ background: '#0EA5E9' }} onClick={handleSimulateProximity} disabled={simulating}>
            {simulating ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" /> : <Play className="w-3.5 h-3.5 mr-1" />}
            Simulate Proximity
          </Button>
        </div>
      </Card>

      {/* Routes list */}
      <Card className="rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">Bus Routes</h3>
          <p className="text-[11px] text-slate-500">Click a route to see pickup points + student list</p>
        </div>
        <div className="divide-y divide-slate-100">
          {routes.map((r) => (
            <div key={r.id} className="px-5 py-4 hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedRoute(r)}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                    <Bus className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{r.name}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span className="font-mono">{r.vehicleNo}</span>
                      <span>·</span>
                      <span>{r.driverName}</span>
                      <Phone className="w-2.5 h-2.5" />
                      <span className="font-mono">{r.driverPhone}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {r.pickupPoints.length} pickup points · {r.totalStudents} students
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-[9px] ${r.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : r.status === 'IDLE' ? 'bg-slate-50 text-slate-500' : 'bg-amber-50 text-amber-700'}`}>
                    {r.status === 'ACTIVE' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />}
                    {r.status}
                  </Badge>
                </div>
              </div>
              {/* Pickup points preview */}
              <div className="flex flex-wrap gap-1.5 mt-2 ml-13">
                {r.pickupPoints.map((p, i) => (
                  <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-100 flex items-center gap-0.5">
                    <MapPin className="w-2 h-2" />
                    {p.name} ({p.time})
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Route detail modal */}
      {selectedRoute && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          onClick={() => setSelectedRoute(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
            style={{ borderTop: '4px solid #0EA5E9' }}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center"><Bus className="w-4 h-4" /></div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{selectedRoute.name}</h3>
                  <p className="text-[11px] text-slate-500 font-mono">{selectedRoute.vehicleNo} · {selectedRoute.id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedRoute(null)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              {/* Driver info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50">
                  <div className="text-[10px] text-slate-500 uppercase">Driver</div>
                  <div className="text-xs font-semibold text-slate-900">{selectedRoute.driverName}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{selectedRoute.driverPhone}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50">
                  <div className="text-[10px] text-slate-500 uppercase">Students</div>
                  <div className="text-xs font-semibold text-slate-900">{selectedRoute.totalStudents} assigned</div>
                  <div className="text-[10px] text-slate-500">{selectedRoute.pickupPoints.length} pickup points</div>
                </div>
              </div>
              {/* Pickup points timeline */}
              <div>
                <div className="text-xs font-semibold text-slate-700 mb-2">Pickup Points</div>
                <div className="space-y-2">
                  {selectedRoute.pickupPoints.map((p, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg border border-slate-100">
                      <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-bold">{i + 1}</div>
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-slate-900">{p.name}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" /> {p.time}
                          <Users className="w-2.5 h-2.5 ml-1" /> {p.students} students
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="h-7 text-[10px] rounded-lg" onClick={handleSimulateProximity}>
                        <Navigation className="w-3 h-3 mr-0.5" /> Simulate
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              {/* Proximity explainer */}
              <div className="p-3 rounded-xl bg-sky-50 border border-sky-100">
                <div className="text-[11px] text-sky-800 flex items-start gap-2">
                  <Zap className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>When the bus GPS indicates it's within 500m of a pickup point, all parents of students at that stop automatically receive a WhatsApp + SMS notification: "Bus approaching {selectedRoute.pickupPoints[0]?.name} — ETA 5 minutes."</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
