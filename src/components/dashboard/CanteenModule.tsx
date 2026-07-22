'use client'

/**
 * CanteenModule — Smart canteen with pre-ordering, QR-based pickup,
 * cashless payments, AI menu recommendations, and inventory management.
 *
 * Flow chart item: "Inventory Check → Reorder Notifications"
 * When inventory drops below threshold, auto-generates reorder alerts.
 *
 * Features:
 *   - Menu management (items with categories, prices, availability)
 *   - Pre-ordering (students/parents order in advance)
 *   - QR-based pickup (order → QR code → scan at counter → dispense)
 *   - Cashless payments (deduct from student wallet)
 *   - AI menu recommendations (based on order history + nutritional balance)
 *   - Inventory tracking with auto-reorder alerts
 *   - Sales analytics dashboard
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UtensilsCrossed, Plus, Minus, ShoppingCart, QrCode, TrendingUp,
  Package, AlertTriangle, CheckCircle2, Clock, X, RefreshCw,
  Wallet, Sparkles, Download, Filter, Search,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { SectionHeader } from './SectionHeader'
import { useNotificationPreview } from './NotificationPreviewModal'
import { toast } from 'sonner'

// ============ Types ============
interface CanteenItem {
  id: string
  name: string
  category: 'BREAKFAST' | 'LUNCH' | 'SNACKS' | 'BEVERAGES' | 'DESSERT'
  price: number
  available: boolean
  prepTimeMin: number
  calories: number
  veg: boolean
  spiceLevel: 'MILD' | 'MEDIUM' | 'HOT'
  allergens: string[]
  stockQty: number
  minStockThreshold: number
  unit: string  // 'plates', 'pieces', 'cups'
  emoji: string
  aiRecommended?: boolean
}

interface CanteenOrder {
  id: string
  studentName: string
  studentGrade: string
  items: { itemId: string; name: string; qty: number; price: number }[]
  total: number
  status: 'PLACED' | 'PREPARING' | 'READY' | 'PICKED_UP' | 'CANCELLED'
  paymentMethod: 'WALLET' | 'CASH' | 'UPI'
  paymentStatus: 'PENDING' | 'PAID'
  placedAt: string
  pickupTime: string
  qrCode: string
}

// ============ Mock data ============
const MENU_ITEMS: CanteenItem[] = [
  { id: 'CI-001', name: 'Veg Sandwich', category: 'SNACKS', price: 40, available: true, prepTimeMin: 5, calories: 250, veg: true, spiceLevel: 'MILD', allergens: ['gluten'], stockQty: 25, minStockThreshold: 10, unit: 'plates', emoji: '🥪' },
  { id: 'CI-002', name: 'Masala Dosa', category: 'BREAKFAST', price: 60, available: true, prepTimeMin: 10, calories: 400, veg: true, spiceLevel: 'MEDIUM', allergens: ['gluten', 'dairy'], stockQty: 18, minStockThreshold: 8, unit: 'plates', emoji: '🥞', aiRecommended: true },
  { id: 'CI-003', name: 'Veg Biryani', category: 'LUNCH', price: 80, available: true, prepTimeMin: 15, calories: 550, veg: true, spiceLevel: 'HOT', allergens: ['nuts'], stockQty: 12, minStockThreshold: 10, unit: 'plates', emoji: '🍚' },
  { id: 'CI-004', name: 'Chicken Curry', category: 'LUNCH', price: 100, available: true, prepTimeMin: 15, calories: 600, veg: false, spiceLevel: 'HOT', allergens: ['dairy'], stockQty: 8, minStockThreshold: 10, unit: 'plates', emoji: '🍛' },
  { id: 'CI-005', name: 'Tea', category: 'BEVERAGES', price: 15, available: true, prepTimeMin: 2, calories: 80, veg: true, spiceLevel: 'MILD', allergens: ['dairy'], stockQty: 50, minStockThreshold: 20, unit: 'cups', emoji: '🍵' },
  { id: 'CI-006', name: 'Coffee', category: 'BEVERAGES', price: 20, available: true, prepTimeMin: 2, calories: 95, veg: true, spiceLevel: 'MILD', allergens: ['dairy'], stockQty: 45, minStockThreshold: 20, unit: 'cups', emoji: '☕' },
  { id: 'CI-007', name: 'Veg Roll', category: 'SNACKS', price: 35, available: true, prepTimeMin: 5, calories: 300, veg: true, spiceLevel: 'MEDIUM', allergens: ['gluten'], stockQty: 5, minStockThreshold: 10, unit: 'pieces', emoji: '🌯', aiRecommended: true },
  { id: 'CI-008', name: 'Gulab Jamun', category: 'DESSERT', price: 30, available: true, prepTimeMin: 3, calories: 200, veg: true, spiceLevel: 'MILD', allergens: ['dairy', 'gluten'], stockQty: 15, minStockThreshold: 8, unit: 'pieces', emoji: '🍮' },
  { id: 'CI-009', name: 'Idli Sambar', category: 'BREAKFAST', price: 45, available: true, prepTimeMin: 8, calories: 300, veg: true, spiceLevel: 'MEDIUM', allergens: [], stockQty: 3, minStockThreshold: 10, unit: 'plates', emoji: '🍥' },
  { id: 'CI-010', name: 'Fresh Juice', category: 'BEVERAGES', price: 40, available: false, prepTimeMin: 3, calories: 120, veg: true, spiceLevel: 'MILD', allergens: [], stockQty: 0, minStockThreshold: 10, unit: 'cups', emoji: '🥤' },
]

const INITIAL_ORDERS: CanteenOrder[] = [
  { id: 'ORD-001', studentName: 'Aarav Singh', studentGrade: '7-A', items: [{ itemId: 'CI-002', name: 'Masala Dosa', qty: 1, price: 60 }, { itemId: 'CI-005', name: 'Tea', qty: 1, price: 15 }], total: 75, status: 'READY', paymentMethod: 'WALLET', paymentStatus: 'PAID', placedAt: '10:15 AM', pickupTime: '10:25 AM', qrCode: 'QR-ORD-001' },
  { id: 'ORD-002', studentName: 'Diya Patel', studentGrade: '5-B', items: [{ itemId: 'CI-001', name: 'Veg Sandwich', qty: 2, price: 40 }], total: 80, status: 'PREPARING', paymentMethod: 'WALLET', paymentStatus: 'PAID', placedAt: '10:20 AM', pickupTime: '10:30 AM', qrCode: 'QR-ORD-002' },
  { id: 'ORD-003', studentName: 'Vivaan Gupta', studentGrade: '8-A', items: [{ itemId: 'CI-003', name: 'Veg Biryani', qty: 1, price: 80 }, { itemId: 'CI-008', name: 'Gulab Jamun', qty: 2, price: 30 }], total: 140, status: 'PLACED', paymentMethod: 'UPI', paymentStatus: 'PENDING', placedAt: '10:25 AM', pickupTime: '10:40 AM', qrCode: 'QR-ORD-003' },
]

const CATEGORY_LABELS: Record<string, string> = {
  BREAKFAST: 'Breakfast', LUNCH: 'Lunch', SNACKS: 'Snacks', BEVERAGES: 'Beverages', DESSERT: 'Dessert',
}

const CATEGORY_COLORS: Record<string, string> = {
  BREAKFAST: '#F59E0B', LUNCH: '#22C55E', SNACKS: '#1E3A8A', BEVERAGES: '#0EA5E9', DESSERT: '#E11D48',
}

export function CanteenModule() {
  const { preview } = useNotificationPreview()
  const [items, setItems] = useState<CanteenItem[]>(MENU_ITEMS)
  const [orders, setOrders] = useState<CanteenOrder[]>(INITIAL_ORDERS)
  const [tab, setTab] = useState<'menu' | 'orders' | 'inventory' | 'analytics'>('menu')
  const [cart, setCart] = useState<{ itemId: string; qty: number }[]>([])
  const [showCart, setShowCart] = useState(false)
  const [showAddItem, setShowAddItem] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')

  const filteredItems = items.filter((i) => {
    const ms = i.name.toLowerCase().includes(search.toLowerCase())
    const mc = categoryFilter === 'ALL' || i.category === categoryFilter
    return ms && mc
  })

  const lowStockItems = items.filter((i) => i.stockQty <= i.minStockThreshold)

  const stats = {
    todayOrders: orders.length,
    todayRevenue: orders.reduce((s, o) => s + o.total, 0),
    pendingPickup: orders.filter((o) => o.status === 'READY' || o.status === 'PREPARING').length,
    lowStock: lowStockItems.length,
  }

  const addToCart = (itemId: string) => {
    setCart((c) => {
      const existing = c.find((x) => x.itemId === itemId)
      if (existing) return c.map((x) => x.itemId === itemId ? { ...x, qty: x.qty + 1 } : x)
      return [...c, { itemId, qty: 1 }]
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart((c) => c.filter((x) => x.itemId !== itemId))
  }

  const updateQty = (itemId: string, delta: number) => {
    setCart((c) => c.map((x) => x.itemId === itemId ? { ...x, qty: Math.max(1, x.qty + delta) } : x))
  }

  const cartTotal = cart.reduce((sum, c) => {
    const item = items.find((i) => i.id === c.itemId)
    return sum + (item?.price || 0) * c.qty
  }, 0)

  const placeOrder = () => {
    if (cart.length === 0) return
    const orderId = `ORD-${String(orders.length + 1).padStart(3, '0')}`
    const newOrder: CanteenOrder = {
      id: orderId,
      studentName: 'Demo Student',
      studentGrade: '7-A',
      items: cart.map((c) => {
        const item = items.find((i) => i.id === c.itemId)!
        return { itemId: c.itemId, name: item.name, qty: c.qty, price: item.price }
      }),
      total: cartTotal,
      status: 'PLACED',
      paymentMethod: 'WALLET',
      paymentStatus: 'PAID',
      placedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      pickupTime: new Date(Date.now() + 15 * 60 * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      qrCode: `QR-${orderId}`,
    }
    setOrders([newOrder, ...orders])
    // Deduct from inventory
    setItems((its) => its.map((i) => {
      const cartItem = cart.find((c) => c.itemId === i.id)
      if (cartItem) return { ...i, stockQty: Math.max(0, i.stockQty - cartItem.qty) }
      return i
    }))
    setCart([])
    setShowCart(false)
    toast.success(`Order ${orderId} placed · ₹${cartTotal} charged to wallet · Pickup at ${newOrder.pickupTime}`)
  }

  const updateOrderStatus = (orderId: string, status: CanteenOrder['status']) => {
    setOrders((os) => os.map((o) => o.id === orderId ? { ...o, status } : o))
    if (status === 'PICKED_UP') {
      toast.success(`Order ${orderId} picked up · QR verified`)
    } else if (status === 'READY') {
      toast.success(`Order ${orderId} ready for pickup · notification sent to student`)
    }
  }

  const handleReorder = (item: CanteenItem) => {
    preview({
      recipients: [{ id: 'canteen-manager', name: 'Canteen Manager', contact: '+91 99001 55555', channel: 'WHATSAPP', recipientType: 'STAFF' }],
      subject: `Reorder Alert — ${item.name}`,
      body: `REORDER ALERT\n\nItem: ${item.name} (${item.id})\nCurrent Stock: ${item.stockQty} ${item.unit}\nMinimum Threshold: ${item.minStockThreshold} ${item.unit}\nSuggested Order Qty: ${item.minStockThreshold * 3} ${item.unit}\n\nPlease restock immediately.\n— LearnX Canteen System`,
      source: 'canteen-reorder',
    })
    toast.success(`Reorder alert sent for ${item.name}`)
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 animate-page-enter max-w-[1600px] mx-auto">
      <SectionHeader
        emoji="🍽️"
        title="Smart Canteen Management"
        subtitle="Pre-ordering · QR pickup · cashless payments · AI recommendations · inventory auto-reorder"
        accent="#F59E0B"
        onNew={() => setShowAddItem(true)}
        newLabel="Add Menu Item"
        onRefresh={() => toast.success('✅ Refreshed')}
        aiActions={[
          { label: 'items on menu', count: items.length },
          { label: 'orders today', count: stats.todayOrders },
          { label: 'low-stock alerts', count: stats.lowStock },
        ]}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Today's Orders", value: stats.todayOrders, icon: ShoppingCart, color: '#1E3A8A' },
          { label: "Today's Revenue", value: `₹${stats.todayRevenue}`, icon: TrendingUp, color: '#22C55E' },
          { label: 'Pending Pickup', value: stats.pendingPickup, icon: Clock, color: '#F59E0B' },
          { label: 'Low Stock Items', value: stats.lowStock, icon: AlertTriangle, color: stats.lowStock > 0 ? '#DC2626' : '#6B7280' },
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

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-slate-100 w-fit">
        {[
          { id: 'menu', label: 'Menu', icon: UtensilsCrossed },
          { id: 'orders', label: `Orders (${orders.length})`, icon: ShoppingCart },
          { id: 'inventory', label: `Inventory${stats.lowStock > 0 ? ` (${stats.lowStock} low)` : ''}`, icon: Package },
          { id: 'analytics', label: 'Analytics', icon: TrendingUp },
        ].map((t) => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id as any)} className={`px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 ${tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          )
        })}
      </div>

      {/* Menu Tab */}
      {tab === 'menu' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search menu…" className="pl-9 h-9 text-xs rounded-lg" />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-9 text-xs rounded-lg w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            {cart.length > 0 && (
              <Button size="sm" className="h-9 text-xs rounded-lg gap-1.5" style={{ background: '#F59E0B' }} onClick={() => setShowCart(true)}>
                <ShoppingCart className="w-3.5 h-3.5" /> Cart ({cart.length}) · ₹{cartTotal}
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredItems.map((item) => (
              <Card key={item.id} className={`p-4 rounded-2xl ${!item.available ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="text-3xl">{item.emoji}</div>
                  <div className="flex flex-col gap-1 items-end">
                    {item.aiRecommended && (
                      <Badge variant="outline" className="text-[8px] bg-amber-50 text-amber-700 border-amber-200">
                        <Sparkles className="w-2 h-2 mr-0.5" /> AI PICK
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-[8px]" style={{ background: CATEGORY_COLORS[item.category] + '15', color: CATEGORY_COLORS[item.category], borderColor: CATEGORY_COLORS[item.category] + '40' }}>
                      {CATEGORY_LABELS[item.category]}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-sm font-semibold text-slate-900">{item.name}</span>
                  {item.veg && <span className="w-3 h-3 rounded border-2 border-emerald-500 flex items-center justify-center"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /></span>}
                </div>
                <div className="text-[10px] text-slate-500 mb-2">
                  {item.calories} cal · {item.prepTimeMin} min · {item.spiceLevel}
                  {item.allergens.length > 0 && ` · ⚠️ ${item.allergens.join(', ')}`}
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-lg font-bold text-slate-900">₹{item.price}</div>
                  {item.available ? (
                    <Button size="sm" className="h-7 text-[11px] rounded-lg" style={{ background: '#F59E0B' }} onClick={() => addToCart(item.id)}>
                      <Plus className="w-3 h-3 mr-0.5" /> Add
                    </Button>
                  ) : (
                    <Badge variant="outline" className="text-[9px] bg-rose-50 text-rose-600">Out of stock</Badge>
                  )}
                </div>
                {item.stockQty <= item.minStockThreshold && item.available && (
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1 text-[9px] text-rose-600">
                    <AlertTriangle className="w-2.5 h-2.5" /> Low stock: {item.stockQty} {item.unit} left
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {tab === 'orders' && (
        <Card className="rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Today's Orders</h3>
            <p className="text-[11px] text-slate-500">{orders.length} orders · QR-based pickup</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Order ID</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Student</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Items</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Total</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Payment</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Pickup</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-mono font-semibold text-slate-900">{o.id}</div>
                      <div className="text-[9px] text-slate-400">{o.placedAt}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{o.studentName}</div>
                      <div className="text-[10px] text-slate-500">{o.studentGrade}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[10px] text-slate-600">
                        {o.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">₹{o.total}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`text-[9px] ${o.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {o.paymentMethod} · {o.paymentStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{o.pickupTime}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`text-[9px] ${
                        o.status === 'READY' ? 'bg-emerald-50 text-emerald-700' :
                        o.status === 'PREPARING' ? 'bg-amber-50 text-amber-700' :
                        o.status === 'PLACED' ? 'bg-blue-50 text-blue-700' :
                        o.status === 'PICKED_UP' ? 'bg-slate-50 text-slate-500' :
                        'bg-rose-50 text-rose-700'
                      }`}>{o.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {o.status === 'PLACED' && (
                          <Button size="sm" variant="outline" className="h-7 text-[10px] rounded-lg" onClick={() => updateOrderStatus(o.id, 'PREPARING')}>Start</Button>
                        )}
                        {o.status === 'PREPARING' && (
                          <Button size="sm" variant="outline" className="h-7 text-[10px] rounded-lg" onClick={() => updateOrderStatus(o.id, 'READY')}>Ready</Button>
                        )}
                        {o.status === 'READY' && (
                          <Button size="sm" className="h-7 text-[10px] rounded-lg text-white" style={{ background: '#22C55E' }} onClick={() => updateOrderStatus(o.id, 'PICKED_UP')}>
                            <QrCode className="w-3 h-3 mr-0.5" /> Scan QR
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Inventory Tab */}
      {tab === 'inventory' && (
        <div className="space-y-3">
          {stats.lowStock > 0 && (
            <Card className="p-4 rounded-2xl border-rose-200 bg-rose-50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-rose-900">{stats.lowStock} item(s) below minimum threshold</div>
                  <p className="text-[11px] text-rose-700">Auto-reorder alerts will be sent to the canteen manager via WhatsApp.</p>
                </div>
                <Button size="sm" className="h-8 text-xs rounded-lg text-white bg-rose-600 hover:bg-rose-700" onClick={() => {
                  lowStockItems.forEach((item) => handleReorder(item))
                }}>
                  Send All Reorder Alerts
                </Button>
              </div>
            </Card>
          )}
          <Card className="rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Inventory Management</h3>
              <p className="text-[11px] text-slate-500">Stock levels · auto-reorder when below threshold</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Item</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Category</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-600">Stock</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-600">Min Threshold</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-600">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const isLow = item.stockQty <= item.minStockThreshold
                    const isOut = item.stockQty === 0
                    return (
                      <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{item.emoji}</span>
                            <div>
                              <div className="font-medium text-slate-900">{item.name}</div>
                              <div className="text-[10px] text-slate-500 font-mono">{item.id} · ₹{item.price}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-[9px]" style={{ background: CATEGORY_COLORS[item.category] + '15', color: CATEGORY_COLORS[item.category] }}>
                            {CATEGORY_LABELS[item.category]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-bold ${isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-900'}`}>
                            {item.stockQty}
                          </span>
                          <span className="text-[9px] text-slate-400 ml-1">{item.unit}</span>
                        </td>
                        <td className="px-4 py-3 text-center text-slate-500">{item.minStockThreshold} {item.unit}</td>
                        <td className="px-4 py-3 text-center">
                          {isOut ? <Badge variant="outline" className="text-[9px] bg-rose-50 text-rose-600">OUT OF STOCK</Badge> :
                           isLow ? <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-600">LOW</Badge> :
                           <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-600">OK</Badge>}
                        </td>
                        <td className="px-4 py-3">
                          {isLow && (
                            <Button size="sm" variant="outline" className="h-7 text-[10px] rounded-lg text-rose-600 border-rose-200 hover:bg-rose-50" onClick={() => handleReorder(item)}>
                              <Package className="w-3 h-3 mr-0.5" /> Reorder
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Analytics Tab */}
      {tab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Card className="p-4 rounded-2xl">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Top Selling Items (This Week)</h3>
            <div className="space-y-2">
              {[
                { name: 'Masala Dosa', qty: 142, revenue: 8520, emoji: '🥞' },
                { name: 'Veg Sandwich', qty: 98, revenue: 3920, emoji: '🥪' },
                { name: 'Tea', qty: 87, revenue: 1305, emoji: '🍵' },
                { name: 'Veg Biryani', qty: 65, revenue: 5200, emoji: '🍚' },
                { name: 'Coffee', qty: 54, revenue: 1080, emoji: '☕' },
              ].map((item, i) => {
                const max = 142
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-lg">{item.emoji}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-[11px] mb-0.5">
                        <span className="font-medium text-slate-900">{item.name}</span>
                        <span className="text-slate-500">{item.qty} sold · ₹{item.revenue}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(item.qty / max) * 100}%`, background: '#F59E0B' }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
          <Card className="p-4 rounded-2xl">
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" /> AI Menu Insights
            </h3>
            <div className="space-y-2">
              {[
                { insight: 'Masala Dosa is 3× more popular on Mondays — consider pre-making extra', action: 'Increase Monday stock by 50%' },
                { insight: 'Fresh Juice has 0 sales this week — remove from menu or reprice', action: 'Remove or discount 20%' },
                { insight: 'Average order value is ₹85 — bundle Tea+Sandwich for ₹50 to boost volume', action: 'Create combo' },
                { insight: 'Peak hours: 10:15-10:45 AM (recess) — ensure 3 staff on counter', action: 'Adjust staffing' },
              ].map((ins, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-amber-50 border border-amber-100">
                  <div className="text-[11px] text-slate-700">{ins.insight}</div>
                  <div className="text-[10px] text-amber-700 font-semibold mt-0.5">→ {ins.action}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Cart Modal */}
      <AnimatePresence>
        {showCart && (
          <CartModal
            cart={cart}
            items={items}
            total={cartTotal}
            onClose={() => setShowCart(false)}
            onUpdateQty={updateQty}
            onRemove={removeFromCart}
            onPlaceOrder={placeOrder}
          />
        )}
      </AnimatePresence>

      {/* Add Item Modal (simplified) */}
      {showAddItem && (
        <Card className="p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-900">Add Menu Item</h3>
            <button onClick={() => setShowAddItem(false)}><X className="w-4 h-4 text-slate-500" /></button>
          </div>
          <p className="text-[11px] text-slate-500">Menu item management is available in the full version. This demo shows pre-populated items.</p>
        </Card>
      )}
    </div>
  )
}

// ============ Cart Modal ============
function CartModal({ cart, items, total, onClose, onUpdateQty, onRemove, onPlaceOrder }: {
  cart: { itemId: string; qty: number }[]
  items: CanteenItem[]
  total: number
  onClose: () => void
  onUpdateQty: (itemId: string, delta: number) => void
  onRemove: (itemId: string) => void
  onPlaceOrder: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        style={{ borderTop: '4px solid #F59E0B' }}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-amber-500" /> Your Cart
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
          {cart.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">Cart is empty</div>
          ) : (
            cart.map((c) => {
              const item = items.find((i) => i.id === c.itemId)
              if (!item) return null
              return (
                <div key={c.itemId} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
                  <span className="text-2xl">{item.emoji}</span>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-slate-900">{item.name}</div>
                    <div className="text-[10px] text-slate-500">₹{item.price} each</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => onUpdateQty(c.itemId, -1)} className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                    <span className="w-6 text-center text-xs font-bold">{c.qty}</span>
                    <button onClick={() => onUpdateQty(c.itemId, 1)} className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                  </div>
                  <div className="text-xs font-bold text-slate-900 w-12 text-right">₹{item.price * c.qty}</div>
                  <button onClick={() => onRemove(c.itemId)} className="p-1 text-rose-500"><X className="w-3 h-3" /></button>
                </div>
              )
            })
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-500">Total</span>
            <span className="text-lg font-bold text-slate-900">₹{total}</span>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="w-4 h-4 text-emerald-600" />
            <span className="text-[11px] text-slate-600">Payment via Student Wallet (balance: ₹500)</span>
          </div>
          <Button className="w-full h-10 text-xs rounded-lg text-white" style={{ background: '#F59E0B' }} onClick={onPlaceOrder} disabled={cart.length === 0}>
            <QrCode className="w-4 h-4 mr-1.5" /> Place Order · ₹{total}
          </Button>
          <p className="text-[10px] text-slate-400 text-center mt-2">QR code will be generated for pickup · Cashless via wallet</p>
        </div>
      </motion.div>
    </motion.div>
  )
}
