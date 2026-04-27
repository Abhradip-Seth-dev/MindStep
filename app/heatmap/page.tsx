'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/UserContext'
import Sidebar from '@/components/Sidebar'

// ── Live Pulse Node Network ────────────────────────────────────────────────
const NODES = [
  // Hostels (Left)
  { id: 'h1', name: 'Hostel A', type: 'Hostel', cx: 120, cy: 120, r: 28, students: 55, green: 40, amber: 10, red: 5, icon: '🏠', topEmotion: 'Okay' },
  { id: 'h2', name: 'Hostel B', type: 'Hostel', cx: 120, cy: 250, r: 28, students: 48, green: 28, amber: 14, red: 6, icon: '🏠', topEmotion: 'Tired' },
  { id: 'h3', name: 'Hostel C', type: 'Hostel', cx: 120, cy: 380, r: 28, students: 60, green: 52, amber: 6, red: 2, icon: '🏠', topEmotion: 'Good' },
  // Academic (Middle)
  { id: 'a1', name: 'Computer Science', type: 'Academic', cx: 350, cy: 120, r: 36, students: 120, green: 75, amber: 30, red: 15, icon: '💻', topEmotion: 'Anxious' },
  { id: 'f1', name: 'Central Library', type: 'Facility', cx: 350, cy: 250, r: 32, students: 80, green: 65, amber: 12, red: 3, icon: '📚', topEmotion: 'Okay' },
  { id: 'a2', name: 'Mechanical Eng.', type: 'Academic', cx: 350, cy: 380, r: 36, students: 90, green: 70, amber: 15, red: 5, icon: '⚙️', topEmotion: 'Flat' },
  // Facilities (Right)
  { id: 'f2', name: 'Main Canteen', type: 'Facility', cx: 580, cy: 120, r: 34, students: 200, green: 160, amber: 30, red: 10, icon: '🍽️', topEmotion: 'Good' },
  { id: 'f3', name: 'Sports Complex', type: 'Facility', cx: 580, cy: 250, r: 34, students: 70, green: 62, amber: 6, red: 2, icon: '🏃', topEmotion: 'Good' },
  { id: 'f4', name: 'Medical Centre', type: 'Facility', cx: 580, cy: 380, r: 30, students: 40, green: 35, amber: 4, red: 1, icon: '🏥', topEmotion: 'Okay' },
  // Far East
  { id: 'a3', name: 'Psychology', type: 'Academic', cx: 800, cy: 180, r: 30, students: 60, green: 45, amber: 10, red: 5, icon: '🧠', topEmotion: 'Okay' },
  { id: 'h4', name: 'Hostel D', type: 'Hostel', cx: 800, cy: 320, r: 28, students: 50, green: 25, amber: 15, red: 10, icon: '🏠', topEmotion: 'Overwhelmed' },
]

// Glowing data lines connecting the nodes
const EDGES = [
  { p: 'M 148 120 Q 249 120 314 120' }, { p: 'M 148 250 Q 249 250 318 250' }, { p: 'M 148 380 Q 249 380 314 380' },
  { p: 'M 386 120 Q 483 120 546 120' }, { p: 'M 382 250 Q 481 250 546 250' }, { p: 'M 386 380 Q 483 380 550 380' },
  { p: 'M 614 120 Q 707 150 770 180' }, { p: 'M 614 250 Q 707 285 772 320' }, { p: 'M 610 380 Q 705 350 772 320' },
  { p: 'M 350 156 Q 350 203 350 218' }, { p: 'M 350 282 Q 350 330 350 344' }, // Vertical connectors
]

const TRENDING_STRESSORS = [
  { topic: 'Midterm Exams', percent: 42, trend: 'up' },
  { topic: 'Placements', percent: 28, trend: 'up' },
  { topic: 'Sleep Debt', percent: 18, trend: 'down' },
  { topic: 'Isolation', percent: 12, trend: 'stable' },
]

type Node = typeof NODES[0]

function getNodeStatus(b: Node): 'green' | 'amber' | 'red' {
  const redPct = (b.red / b.students) * 100
  const amberPct = (b.amber / b.students) * 100
  if (redPct > 10) return 'red'
  if (amberPct > 20) return 'amber'
  return 'green'
}

const COLORS = {
  green: { core: '#4FC3A1', bg: 'rgba(79,195,161,0.12)', glow: 'rgba(79,195,161,0.4)' },
  amber: { core: '#E8A04A', bg: 'rgba(232,160,74,0.12)', glow: 'rgba(232,160,74,0.4)' },
  red:   { core: '#E05C5C', bg: 'rgba(224,92,92,0.15)', glow: 'rgba(224,92,92,0.4)' },
}

export default function Heatmap() {
  const router = useRouter()
  const { user, userData, loading } = useUser()
  const userName = userData?.name || user?.displayName || user?.email?.split('@')[0] || 'Student'
  
  const [selected, setSelected] = useState<Node | null>(null)
  const [filter, setFilter] = useState<'all' | 'Hostel' | 'Academic' | 'Facility'>('all')
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    if (!loading && !user) router.push('/onboarding')
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [user, loading, router])

  const totalStudents = NODES.reduce((a, b) => a + b.students, 0)
  const totalGreen = NODES.reduce((a, b) => a + b.green, 0)
  const totalAmber = NODES.reduce((a, b) => a + b.amber, 0)
  const totalRed = NODES.reduce((a, b) => a + b.red, 0)

  if (loading) return null

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080C12', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Dynamic Background Glow */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '20%', left: '30%', width: '80vw', height: '80vh', background: 'radial-gradient(circle, rgba(79,195,161,0.03) 0%, transparent 60%)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '60vw', height: '60vh', background: 'radial-gradient(circle, rgba(91,156,246,0.02) 0%, transparent 60%)', filter: 'blur(60px)' }} />
      </div>

      <Sidebar userName={userName} userData={userData} />

      <main style={{ flex: 1, marginLeft: 220, minHeight: '100vh', overflowY: 'auto', position: 'relative', zIndex: 1 }}>

        {/* Top bar */}
        <div style={{ position: 'sticky', top: 0, zIndex: 40, padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(8,12,18,0.85)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div>
            <p style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#5A6A7E', marginBottom: 4 }}>Campus Intelligence</p>
            <h1 style={{ fontSize: 24, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', fontWeight: 600, margin: 0 }}>Live Pulse Network</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <motion.div animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ width: 6, height: 6, borderRadius: '50%', background: '#4FC3A1', boxShadow: '0 0 8px #4FC3A1' }} />
              <span style={{ fontSize: 13, color: '#A0ABC0', fontWeight: 500, fontFamily: 'monospace' }}>
                {time.toLocaleTimeString('en-US', { hour12: false })}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 4, padding: '4px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {(['all', 'Hostel', 'Academic', 'Facility'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: filter === f ? 'rgba(255,255,255,0.08)' : 'transparent', color: filter === f ? '#E8EEF5' : '#5A6A7E', fontSize: 12, fontWeight: filter === f ? 600 : 400, cursor: 'pointer', transition: 'all 0.2s', textTransform: 'capitalize' }}>
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: '32px' }}>
          
          {/* Node Map Area */}
          <div style={{ padding: '24px', borderRadius: 24, background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.2))', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden', marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 20 }}>
                {[{ color: '#4FC3A1', label: 'Stable' }, { color: '#E8A04A', label: 'Drifting' }, { color: '#E05C5C', label: 'Alert' }].map(l => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, boxShadow: `0 0 8px ${l.color}` }} />
                    <span style={{ fontSize: 12, color: '#5A6A7E', fontWeight: 500 }}>{l.label}</span>
                  </div>
                ))}
              </div>
              <span style={{ fontSize: 12, color: '#5A6A7E', letterSpacing: '0.05em' }}>FULLY ANONYMIZED DATA</span>
            </div>

            <div style={{ position: 'relative', width: '100%', overflowX: 'auto', padding: '20px 0' }}>
              <svg viewBox="0 0 920 500" width="100%" style={{ display: 'block' }}>
                
                {/* Data Flow Lines */}
                {EDGES.map((e, i) => (
                  <g key={i}>
                    <path d={e.p} stroke="rgba(255,255,255,0.04)" strokeWidth="3" fill="none" />
                    <path d={e.p} stroke="rgba(79,195,161,0.2)" strokeWidth="1.5" fill="none" strokeDasharray="4 8">
                      <animate attributeName="stroke-dashoffset" values="12;0" dur="2s" repeatCount="indefinite" />
                    </path>
                  </g>
                ))}

                {/* Nodes */}
                {NODES.map(node => {
                  const status = getNodeStatus(node)
                  const c = COLORS[status]
                  const isSelected = selected?.id === node.id
                  const isFiltered = filter !== 'all' && node.type !== filter
                  const opacity = isFiltered ? 0.15 : 1

                  return (
                    <g key={node.id} style={{ cursor: 'pointer', opacity, transition: 'opacity 0.4s ease' }} onClick={() => setSelected(isSelected ? null : node)}>
                      
                      {/* Pulse Ring */}
                      <motion.circle cx={node.cx} cy={node.cy} r={node.r} fill="none" stroke={c.core} strokeWidth="1"
                        initial={{ scale: 1, opacity: 0.6 }} animate={{ scale: 1.5, opacity: 0 }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut', delay: Math.random() * 2 }}
                      />
                      
                      {/* Core Node */}
                      <circle cx={node.cx} cy={node.cy} r={node.r} fill={c.bg} stroke={c.core} strokeWidth={isSelected ? 3 : 1.5} style={{ filter: `drop-shadow(0 0 16px ${c.glow})`, transition: 'all 0.3s' }} />
                      <circle cx={node.cx} cy={node.cy} r={node.r - 6} fill="rgba(8,12,18,0.8)" stroke="none" />
                      
                      <text x={node.cx} y={node.cy + 6} textAnchor="middle" fontSize="16">{node.icon}</text>
                      
                      {/* Label */}
                      <rect x={node.cx - 50} y={node.cy + node.r + 12} width="100" height="24" rx="12" fill="rgba(8,12,18,0.7)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                      <text x={node.cx} y={node.cy + node.r + 28} textAnchor="middle" fill="#E8EEF5" fontSize="11" fontWeight="500">{node.name}</text>
                      
                    </g>
                  )
                })}
              </svg>
            </div>
          </div>

          {/* Bottom Grid: Insights & Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
            
            {/* Left: Global Stats & Trending Stressors */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              
              {/* Macro Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                {[{ label: 'Total Tracked', val: totalStudents, col: '#5B9CF6' }, { label: 'Stable Focus', val: `${Math.round(totalGreen/totalStudents*100)}%`, col: '#4FC3A1' }, { label: 'Mental Drift', val: `${Math.round(totalAmber/totalStudents*100)}%`, col: '#E8A04A' }, { label: 'High Alert', val: `${Math.round(totalRed/totalStudents*100)}%`, col: '#E05C5C' }].map(s => (
                  <div key={s.label} style={{ padding: '20px', borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p style={{ fontSize: 32, fontFamily: 'Playfair Display, serif', color: s.col, margin: '0 0 4px 0', lineHeight: 1 }}>{s.val}</p>
                    <p style={{ fontSize: 11, letterSpacing: '0.05em', color: '#5A6A7E', textTransform: 'uppercase' }}>{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Trending Stressors */}
              <div style={{ padding: '24px', borderRadius: 20, background: 'linear-gradient(135deg, rgba(167,139,250,0.08), rgba(8,12,18,0.5))', border: '1px solid rgba(167,139,250,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <div style={{ padding: '6px', borderRadius: 8, background: 'rgba(167,139,250,0.15)', color: '#A78BFA' }}>🔥</div>
                  <h3 style={{ fontSize: 16, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', margin: 0 }}>Trending Campus Stressors</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                  {TRENDING_STRESSORS.map(t => (
                    <div key={t.topic} style={{ padding: '16px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <p style={{ fontSize: 13, color: '#E8EEF5', fontWeight: 500, marginBottom: 12 }}>{t.topic}</p>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                        <span style={{ fontSize: 24, fontFamily: 'Playfair Display, serif', color: '#A78BFA', lineHeight: 1 }}>{t.percent}%</span>
                        <span style={{ fontSize: 12, color: t.trend === 'up' ? '#E05C5C' : t.trend === 'down' ? '#4FC3A1' : '#5A6A7E' }}>{t.trend === 'up' ? '↗' : t.trend === 'down' ? '↘' : '→'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Selected Node Detail */}
            <div>
              <AnimatePresence mode="wait">
                {selected ? (
                  <motion.div key={selected.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                    style={{ padding: '24px', borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: `1px solid ${COLORS[getNodeStatus(selected)].core}40`, boxShadow: `0 8px 32px ${COLORS[getNodeStatus(selected)].core}10` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                      <div>
                        <p style={{ fontSize: 10, letterSpacing: '0.1em', color: COLORS[getNodeStatus(selected)].core, textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>{selected.type} Node</p>
                        <h2 style={{ fontSize: 20, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', margin: 0 }}>{selected.icon} {selected.name}</h2>
                      </div>
                      <button onClick={() => setSelected(null)} style={{ background: 'transparent', border: 'none', color: '#5A6A7E', fontSize: 18, cursor: 'pointer' }}>×</button>
                    </div>

                    {/* Breakdown Bars */}
                    <div style={{ marginBottom: 24 }}>
                      {[{ l: 'Stable', v: selected.green, c: '#4FC3A1' }, { l: 'Drifting', v: selected.amber, c: '#E8A04A' }, { l: 'Alert', v: selected.red, c: '#E05C5C' }].map(s => (
                        <div key={s.l} style={{ marginBottom: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 12, color: '#A0ABC0' }}>{s.l} ({s.v})</span>
                            <span style={{ fontSize: 12, color: s.c, fontWeight: 600 }}>{Math.round(s.v/selected.students*100)}%</span>
                          </div>
                          <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.05)' }}>
                            <motion.div initial={{ width: 0 }} animate={{ width: `${s.v/selected.students*100}%` }} transition={{ duration: 0.8 }} style={{ height: '100%', borderRadius: 3, background: s.c }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Insights */}
                    <div style={{ padding: '16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <p style={{ fontSize: 10, color: '#5A6A7E', letterSpacing: '0.05em', marginBottom: 4 }}>PRIMARY MOOD STATE</p>
                      <p style={{ fontSize: 16, color: '#E8EEF5', fontWeight: 500, margin: 0 }}>{selected.topEmotion}</p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{ padding: '40px 24px', borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.5 }}>📡</div>
                    <h3 style={{ fontSize: 16, color: '#E8EEF5', marginBottom: 8, fontWeight: 500 }}>Select a Node</h3>
                    <p style={{ fontSize: 13, color: '#5A6A7E', lineHeight: 1.5 }}>Click any glowing node on the network map to view its detailed wellbeing breakdown.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}