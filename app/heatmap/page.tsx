'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import Sidebar from '@/components/Sidebar'

const BUILDINGS = [
  { id: 'hostel-a', name: 'Hostel Block A', type: 'Hostel', students: 55, green: 40, amber: 10, red: 5, x: 80, y: 120, w: 100, h: 70, icon: '🏠', trend: 'stable', topEmotion: 'Okay' },
  { id: 'hostel-b', name: 'Hostel Block B', type: 'Hostel', students: 48, green: 28, amber: 14, red: 6, x: 80, y: 220, w: 100, h: 70, icon: '🏠', trend: 'worsening', topEmotion: 'Tired' },
  { id: 'hostel-c', name: 'Hostel Block C', type: 'Hostel', students: 60, green: 52, amber: 6, red: 2, x: 80, y: 320, w: 100, h: 70, icon: '🏠', trend: 'improving', topEmotion: 'Good' },
  { id: 'cs-dept', name: 'CS Department', type: 'Academic', students: 120, green: 75, amber: 30, red: 15, x: 280, y: 100, w: 130, h: 90, icon: '💻', trend: 'worsening', topEmotion: 'Anxious' },
  { id: 'library', name: 'Central Library', type: 'Facility', students: 80, green: 65, amber: 12, red: 3, x: 280, y: 230, w: 130, h: 70, icon: '📚', trend: 'stable', topEmotion: 'Okay' },
  { id: 'mech-dept', name: 'Mechanical Dept', type: 'Academic', students: 90, green: 70, amber: 15, red: 5, x: 280, y: 340, w: 130, h: 80, icon: '⚙️', trend: 'stable', topEmotion: 'Flat' },
  { id: 'canteen', name: 'Main Canteen', type: 'Facility', students: 200, green: 160, amber: 30, red: 10, x: 500, y: 120, w: 110, h: 60, icon: '🍽️', trend: 'improving', topEmotion: 'Good' },
  { id: 'sports', name: 'Sports Complex', type: 'Facility', students: 70, green: 62, amber: 6, red: 2, x: 500, y: 220, w: 110, h: 80, icon: '🏃', trend: 'improving', topEmotion: 'Good' },
  { id: 'admin', name: 'Admin Block', type: 'Admin', students: 30, green: 24, amber: 5, red: 1, x: 500, y: 340, w: 110, h: 70, icon: '🏛️', trend: 'stable', topEmotion: 'Okay' },
  { id: 'psych-dept', name: 'Psychology Dept', type: 'Academic', students: 60, green: 45, amber: 10, red: 5, x: 700, y: 150, w: 120, h: 80, icon: '🧠', trend: 'stable', topEmotion: 'Okay' },
  { id: 'hostel-d', name: 'Hostel Block D', type: 'Hostel', students: 50, green: 25, amber: 15, red: 10, x: 700, y: 270, w: 120, h: 70, icon: '🏠', trend: 'worsening', topEmotion: 'Overwhelmed' },
  { id: 'medical', name: 'Medical Centre', type: 'Facility', students: 40, green: 35, amber: 4, red: 1, x: 700, y: 370, w: 120, h: 60, icon: '🏥', trend: 'stable', topEmotion: 'Okay' },
]

const PATHS = [
  'M 230 155 L 280 155',
  'M 230 255 L 280 265',
  'M 230 355 L 280 380',
  'M 410 145 L 500 150',
  'M 410 265 L 500 260',
  'M 410 380 L 500 380',
  'M 610 150 L 700 190',
  'M 610 260 L 700 305',
  'M 610 375 L 700 400',
]

type Building = typeof BUILDINGS[0]

function getBuildingStatus(b: Building): 'green' | 'amber' | 'red' {
  const redPct = (b.red / b.students) * 100
  const amberPct = (b.amber / b.students) * 100
  if (redPct > 10) return 'red'
  if (amberPct > 20) return 'amber'
  return 'green'
}

const STATUS_COLORS = {
  green: { fill: 'rgba(79,195,161,0.12)', stroke: '#4FC3A1', glow: '#4FC3A1', text: '#4FC3A1' },
  amber: { fill: 'rgba(232,160,74,0.12)', stroke: '#E8A04A', glow: '#E8A04A', text: '#E8A04A' },
  red:   { fill: 'rgba(224,92,92,0.15)',  stroke: '#E05C5C', glow: '#E05C5C', text: '#E05C5C' },
}

const TREND_ICONS = { improving: '↑', stable: '→', worsening: '↓' }
const TREND_COLORS = { improving: '#4FC3A1', stable: '#5B9CF6', worsening: '#E05C5C' }

export default function Heatmap() {
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [userData, setUserData] = useState<any>(null)
  const [selected, setSelected] = useState<Building | null>(null)
  const [filter, setFilter] = useState<'all' | 'Hostel' | 'Academic' | 'Facility'>('all')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [time, setTime] = useState(new Date())
  const [pulseBuildings, setPulseBuildings] = useState<string[]>([])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) { router.push('/onboarding'); return }
      setUserName(
        firebaseUser.displayName ||
        firebaseUser.email?.split('@')[0] ||
        'Student'
      )
      try {
        const userRes = await fetch(`/api/user?firebaseUid=${firebaseUser.uid}`)
        const ud = await userRes.json()
        if (!ud.error) setUserData(ud)
      } catch (e) {
        console.error(e)
      }
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      const alertBuildings = BUILDINGS
        .filter(b => getBuildingStatus(b) !== 'green')
        .map(b => b.id)
      const random = alertBuildings[Math.floor(Math.random() * alertBuildings.length)]
      if (random) {
        setPulseBuildings([random])
        setTimeout(() => setPulseBuildings([]), 1500)
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const totalStudents = BUILDINGS.reduce((a, b) => a + b.students, 0)
  const totalGreen = BUILDINGS.reduce((a, b) => a + b.green, 0)
  const totalAmber = BUILDINGS.reduce((a, b) => a + b.amber, 0)
  const totalRed = BUILDINGS.reduce((a, b) => a + b.red, 0)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080C12' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '10%', right: '10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,195,161,0.04) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '20%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(91,156,246,0.04) 0%, transparent 70%)' }} />
      </div>

      <Sidebar userName={userName} userData={userData} />

      <main style={{ flex: 1, marginLeft: '220px', minHeight: '100vh', overflowY: 'auto', position: 'relative', zIndex: 1 }}>

        {/* Top bar */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 40,
          padding: '16px 32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(8,12,18,0.92)', backdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div>
            <p style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#3A4A5E', marginBottom: 3 }}>Campus Intelligence</p>
            <h1 style={{ fontSize: 24, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', fontWeight: 600 }}>Emotion Heatmap</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 20, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ width: 6, height: 6, borderRadius: '50%', background: '#4FC3A1', boxShadow: '0 0 6px #4FC3A1' }}
              />
              <span style={{ fontSize: 12, color: '#5A6A7E' }}>
                {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 3, padding: '3px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {(['all', 'Hostel', 'Academic', 'Facility'] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: '5px 14px', borderRadius: 7, border: 'none',
                  background: filter === f ? 'rgba(79,195,161,0.12)' : 'transparent',
                  color: filter === f ? '#4FC3A1' : '#5A6A7E',
                  fontSize: 12, fontWeight: filter === f ? 500 : 400,
                  cursor: 'pointer', transition: 'all 0.2s', textTransform: 'capitalize',
                }}>
                  {f === 'all' ? 'All' : f}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: '24px 32px' }}>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
            {[
              { label: 'Total students', value: totalStudents, sub: 'tracked today', color: '#5B9CF6', icon: '👥' },
              { label: 'Feeling stable', value: `${Math.round(totalGreen / totalStudents * 100)}%`, sub: `${totalGreen} students`, color: '#4FC3A1', icon: '✅' },
              { label: 'Drifting', value: `${Math.round(totalAmber / totalStudents * 100)}%`, sub: `${totalAmber} students`, color: '#E8A04A', icon: '⚠️' },
              { label: 'Need attention', value: `${Math.round(totalRed / totalStudents * 100)}%`, sub: `${totalRed} students`, color: '#E05C5C', icon: '🚨' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }} whileHover={{ y: -3 }}
                style={{ padding: '18px 20px', borderRadius: 16, background: `linear-gradient(135deg, ${stat.color}08, rgba(255,255,255,0.02))`, border: `1px solid ${stat.color}20`, cursor: 'default' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 20 }}>{stat.icon}</span>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: stat.color, boxShadow: `0 0 6px ${stat.color}` }} />
                </div>
                <p style={{ fontSize: 32, fontWeight: 300, fontFamily: 'Playfair Display, serif', color: stat.color, lineHeight: 1, marginBottom: 6 }}>{stat.value}</p>
                <p style={{ fontSize: 12, color: '#C8D4E0', marginBottom: 2, fontWeight: 500 }}>{stat.label}</p>
                <p style={{ fontSize: 11, color: '#3A4A5E' }}>{stat.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Map + Detail */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>

            {/* SVG Map */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{ padding: '24px', borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', position: 'relative', overflow: 'hidden' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <p style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#3A4A5E', marginBottom: 3 }}>Live campus view</p>
                  <h3 style={{ fontSize: 16, fontFamily: 'Playfair Display, serif', color: '#E8EEF5' }}>The Neotia University</h3>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  {[{ color: '#4FC3A1', label: 'Stable' }, { color: '#E8A04A', label: 'Drifting' }, { color: '#E05C5C', label: 'Alert' }].map((l) => (
                    <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />
                      <span style={{ fontSize: 11, color: '#5A6A7E' }}>{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
                <svg viewBox="0 0 900 500" width="100%" style={{ display: 'block' }}>
                  <rect x="0" y="0" width="900" height="500" fill="rgba(8,12,18,0)" />
                  {[100,200,300,400,500,600,700,800].map(x => (
                    <line key={x} x1={x} y1="0" x2={x} y2="500" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                  ))}
                  {[100,200,300,400].map(y => (
                    <line key={y} x1="0" y1={y} x2="900" y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                  ))}
                  {PATHS.map((d, i) => (
                    <path key={i} d={d} stroke="rgba(255,255,255,0.08)" strokeWidth="8" strokeLinecap="round" fill="none" />
                  ))}
                  <rect x="40" y="60" width="820" height="400" rx="16" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="8 6" />
                  <text x="450" y="48" textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize="11" fontFamily="Inter, sans-serif" letterSpacing="3">THE NEOTIA UNIVERSITY CAMPUS</text>
                  <text x="130" y="88" textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="9" fontFamily="Inter, sans-serif" letterSpacing="1">HOSTELS</text>
                  <text x="345" y="88" textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="9" fontFamily="Inter, sans-serif" letterSpacing="1">ACADEMIC</text>
                  <text x="555" y="88" textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="9" fontFamily="Inter, sans-serif" letterSpacing="1">FACILITIES</text>
                  <text x="760" y="88" textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="9" fontFamily="Inter, sans-serif" letterSpacing="1">EAST WING</text>

                  {BUILDINGS.map((building) => {
                    const status = getBuildingStatus(building)
                    const colors = STATUS_COLORS[status]
                    const isHovered = hoveredId === building.id
                    const isSelected = selected?.id === building.id
                    const isPulsing = pulseBuildings.includes(building.id)
                    const isFiltered = filter !== 'all' && building.type !== filter
                    const opacity = isFiltered ? 0.2 : 1
                    return (
                      <g key={building.id} style={{ cursor: 'pointer', opacity, transition: 'opacity 0.3s' }}
                        onClick={() => setSelected(isSelected ? null : building)}
                        onMouseEnter={() => setHoveredId(building.id)}
                        onMouseLeave={() => setHoveredId(null)}
                      >
                        {isPulsing && (
                          <motion.rect
                            x={building.x - 6} y={building.y - 6}
                            width={building.w + 12} height={building.h + 12} rx="10"
                            fill="none" stroke={colors.stroke} strokeWidth="2"
                            initial={{ opacity: 0.8 }} animate={{ opacity: 0 }}
                            transition={{ duration: 1.5 }}
                          />
                        )}
                        {(isHovered || isSelected) && (
                          <rect
                            x={building.x - 4} y={building.y - 4}
                            width={building.w + 8} height={building.h + 8} rx="10"
                            fill="none" stroke={colors.stroke} strokeWidth="1.5" opacity="0.5"
                            style={{ filter: `drop-shadow(0 0 8px ${colors.glow})` }}
                          />
                        )}
                        <rect
                          x={building.x} y={building.y}
                          width={building.w} height={building.h} rx="8"
                          fill={isSelected ? `${colors.stroke}25` : colors.fill}
                          stroke={colors.stroke} strokeWidth={isSelected ? 2 : 1}
                          style={{
                            filter: isSelected ? `drop-shadow(0 0 12px ${colors.glow})` : isHovered ? `drop-shadow(0 0 6px ${colors.glow})` : 'none',
                            transition: 'all 0.2s',
                          }}
                        />
                        <text x={building.x + building.w / 2} y={building.y + 24} textAnchor="middle" fontSize="16" fontFamily="Inter, sans-serif">{building.icon}</text>
                        <text x={building.x + building.w / 2} y={building.y + building.h / 2 + 8} textAnchor="middle" fill={colors.text} fontSize="9" fontFamily="Inter, sans-serif" fontWeight="600">
                          {building.name.length > 14 ? building.name.slice(0, 13) + '…' : building.name}
                        </text>
                        <text x={building.x + building.w / 2} y={building.y + building.h - 8} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="Inter, sans-serif">
                          {building.students} students
                        </text>
                        <circle cx={building.x + building.w - 10} cy={building.y + 10} r="4" fill={colors.stroke} style={{ filter: `drop-shadow(0 0 4px ${colors.glow})` }} />
                      </g>
                    )
                  })}
                </svg>
              </div>

              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: 11, color: '#3A4A5E' }}>Click any building to see details</p>
                <p style={{ fontSize: 11, color: '#3A4A5E' }}>Data updates every 24 hours · Fully anonymized</p>
              </div>
            </motion.div>

            {/* Detail Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <AnimatePresence mode="wait">
                {selected ? (
                  <motion.div
                    key={selected.id}
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                    style={{ padding: '20px', borderRadius: 18, background: `linear-gradient(135deg, ${STATUS_COLORS[getBuildingStatus(selected)].stroke}10, rgba(255,255,255,0.02))`, border: `1px solid ${STATUS_COLORS[getBuildingStatus(selected)].stroke}25` }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <div style={{ fontSize: 32 }}>{selected.icon}</div>
                      <button onClick={() => setSelected(null)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#5A6A7E', borderRadius: 6, width: 24, height: 24, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                    </div>
                    <p style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: STATUS_COLORS[getBuildingStatus(selected)].text, marginBottom: 4, fontWeight: 600 }}>{selected.type}</p>
                    <h3 style={{ fontSize: 16, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', marginBottom: 12 }}>{selected.name}</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                      {[
                        { label: 'Students', value: selected.students, color: '#5B9CF6' },
                        { label: 'Stable', value: selected.green, color: '#4FC3A1' },
                        { label: 'Drifting', value: selected.amber, color: '#E8A04A' },
                        { label: 'Alert', value: selected.red, color: '#E05C5C' },
                      ].map((s) => (
                        <div key={s.label} style={{ padding: '10px 12px', borderRadius: 10, background: `${s.color}08`, border: `1px solid ${s.color}18` }}>
                          <p style={{ fontSize: 18, fontWeight: 300, fontFamily: 'Playfair Display, serif', color: s.color, lineHeight: 1, marginBottom: 3 }}>{s.value}</p>
                          <p style={{ fontSize: 10, color: '#3A4A5E' }}>{s.label}</p>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      {[
                        { label: 'Stable', value: selected.green, color: '#4FC3A1' },
                        { label: 'Drifting', value: selected.amber, color: '#E8A04A' },
                        { label: 'Alert', value: selected.red, color: '#E05C5C' },
                      ].map((s) => (
                        <div key={s.label} style={{ marginBottom: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                            <span style={{ fontSize: 11, color: '#5A6A7E' }}>{s.label}</span>
                            <span style={{ fontSize: 11, color: s.color, fontWeight: 500 }}>{Math.round(s.value / selected.students * 100)}%</span>
                          </div>
                          <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.05)' }}>
                            <motion.div
                              initial={{ width: 0 }} animate={{ width: `${s.value / selected.students * 100}%` }}
                              transition={{ duration: 0.6 }}
                              style={{ height: '100%', borderRadius: 2, background: s.color }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{ flex: 1, padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p style={{ fontSize: 9, color: '#3A4A5E', marginBottom: 3 }}>TREND</p>
                        <p style={{ fontSize: 13, color: TREND_COLORS[selected.trend as keyof typeof TREND_COLORS], fontWeight: 600 }}>
                          {TREND_ICONS[selected.trend as keyof typeof TREND_ICONS]} {selected.trend}
                        </p>
                      </div>
                      <div style={{ flex: 1, padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p style={{ fontSize: 9, color: '#3A4A5E', marginBottom: 3 }}>TOP MOOD</p>
                        <p style={{ fontSize: 13, color: '#C8D4E0', fontWeight: 600 }}>{selected.topEmotion}</p>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{ padding: '28px 20px', borderRadius: 18, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}
                  >
                    <div style={{ fontSize: 32, marginBottom: 12 }}>🗺️</div>
                    <p style={{ fontSize: 13, color: '#5A6A7E', lineHeight: 1.6 }}>Click any building on the map to see its detailed wellbeing breakdown</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Alert buildings */}
              <div style={{ padding: '18px', borderRadius: 18, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#3A4A5E', marginBottom: 12, fontWeight: 600 }}>Needs attention</p>
                {BUILDINGS.filter(b => getBuildingStatus(b) !== 'green').sort((a, b) => b.red - a.red).map((b) => {
                  const status = getBuildingStatus(b)
                  const sc = STATUS_COLORS[status].stroke
                  return (
                    <motion.div key={b.id} whileHover={{ x: 3 }} onClick={() => setSelected(b)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}
                    >
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: `${sc}12`, border: `1px solid ${sc}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                        {b.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 12, color: '#C8D4E0', fontWeight: 500 }}>{b.name}</p>
                        <p style={{ fontSize: 10, color: '#3A4A5E' }}>{b.red} alert · {b.amber} drifting</p>
                      </div>
                      <div style={{ padding: '2px 8px', borderRadius: 20, background: `${sc}12`, border: `1px solid ${sc}25` }}>
                        <span style={{ fontSize: 9, color: sc, fontWeight: 600, textTransform: 'uppercase' }}>{status}</span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Campus mood */}
              <div style={{ padding: '18px', borderRadius: 18, background: 'linear-gradient(135deg, rgba(79,195,161,0.06), rgba(91,156,246,0.04))', border: '1px solid rgba(79,195,161,0.12)' }}>
                <p style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#3A4A5E', marginBottom: 10, fontWeight: 600 }}>Campus mood today</p>
                {['Good', 'Okay', 'Tired', 'Anxious', 'Flat', 'Overwhelmed'].map((emotion, i) => {
                  const counts = [180, 240, 160, 95, 80, 48]
                  const colors = ['#4FC3A1', '#5B9CF6', '#8B9BB0', '#E8A04A', '#A78BFA', '#E05C5C']
                  const total = counts.reduce((a, b) => a + b, 0)
                  return (
                    <div key={emotion} style={{ marginBottom: 7 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: 11, color: '#5A6A7E' }}>{emotion}</span>
                        <span style={{ fontSize: 11, color: colors[i], fontWeight: 500 }}>{Math.round(counts[i] / total * 100)}%</span>
                      </div>
                      <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.05)' }}>
                        <motion.div
                          initial={{ width: 0 }} animate={{ width: `${counts[i] / total * 100}%` }}
                          transition={{ duration: 0.6, delay: i * 0.08 }}
                          style={{ height: '100%', borderRadius: 2, background: colors[i] }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}