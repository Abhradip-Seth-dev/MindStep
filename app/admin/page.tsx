'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'

const DEMO_STUDENTS = [
  { name: 'Arjun Sharma', dept: 'Computer Science', daysRed: 4, lastCheckin: '2 hours ago', status: 'red', streak: 12 },
  { name: 'Priya Menon', dept: 'Psychology', daysRed: 3, lastCheckin: '5 hours ago', status: 'red', streak: 8 },
  { name: 'Rohit Das', dept: 'Mechanical Eng.', daysRed: 2, lastCheckin: '1 day ago', status: 'amber', streak: 3 },
  { name: 'Sneha Iyer', dept: 'Business Admin', daysRed: 1, lastCheckin: '3 hours ago', status: 'amber', streak: 21 },
]

const DEMO_DEPTS = [
  { name: 'Computer Science', total: 120, green: 85, amber: 24, red: 11 },
  { name: 'Psychology', total: 60, green: 42, amber: 12, red: 6 },
  { name: 'Mechanical Eng.', total: 90, green: 71, amber: 14, red: 5 },
  { name: 'Business Admin', total: 75, green: 58, amber: 13, red: 4 },
  { name: 'Civil Eng.', total: 55, green: 48, amber: 6, red: 1 },
]

const TREND_DATA = [
  { week: 'Week 1', green: 82, amber: 13, red: 5 },
  { week: 'Week 2', green: 79, amber: 15, red: 6 },
  { week: 'Week 3', green: 75, amber: 17, red: 8 },
  { week: 'Week 4', green: 71, amber: 19, red: 10 },
  { week: 'Week 5', green: 74, amber: 18, red: 8 },
  { week: 'Week 6', green: 78, amber: 16, red: 6 },
]

const HOSTEL_DATA = [
  { name: 'Block A', green: 45, amber: 8, red: 2 },
  { name: 'Block B', green: 38, amber: 11, red: 5 },
  { name: 'Block C', green: 52, amber: 6, red: 1 },
  { name: 'Block D', green: 29, amber: 14, red: 7 },
  { name: 'Block E', green: 41, amber: 9, red: 3 },
]

const FLAGGED_CHECKINS = [
  { name: 'Student A', dept: 'CSE', flags: ['emotion_numeric_mismatch', 'completed_too_fast'], trust: 0.48, emotion: 'Anxious', sleep: 10, social: 9 },
  { name: 'Student B', dept: 'Business', flags: ['consecutive_high_scores', 'suspiciously_low_variance'], trust: 0.55, emotion: 'Good', sleep: 9, social: 9 },
  { name: 'Student C', dept: 'Mechanical', flags: ['emotion_numeric_mismatch'], trust: 0.72, emotion: 'Overwhelmed', sleep: 8, social: 8 },
  { name: 'Student D', dept: 'Psychology', flags: ['completed_too_fast'], trust: 0.68, emotion: 'Okay', sleep: 7, social: 6 },
  { name: 'Student E', dept: 'CSE', flags: ['suspiciously_low_variance', 'consecutive_high_scores'], trust: 0.41, emotion: 'Good', sleep: 10, social: 10 },
]

export default function AdminDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'hostels' | 'integrity'>('overview')
  const [authorized, setAuthorized] = useState(false)
  const [date] = useState(new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  }))

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isAdmin = localStorage.getItem('mindstep_admin')
      if (!isAdmin) {
        router.push('/admin/login')
      } else {
        setAuthorized(true)
      }
    }
  }, [])

  const handleSignOut = () => {
    localStorage.removeItem('mindstep_admin')
    router.push('/admin/login')
  }

  const totalStudents = DEMO_DEPTS.reduce((a, d) => a + d.total, 0)
  const totalGreen = DEMO_DEPTS.reduce((a, d) => a + d.green, 0)
  const totalAmber = DEMO_DEPTS.reduce((a, d) => a + d.amber, 0)
  const totalRed = DEMO_DEPTS.reduce((a, d) => a + d.red, 0)

  const greenPct = Math.round((totalGreen / totalStudents) * 100)
  const amberPct = Math.round((totalAmber / totalStudents) * 100)
  const redPct = Math.round((totalRed / totalStudents) * 100)

  const statusColor = (s: string) =>
    s === 'red' ? '#E05C5C' : s === 'amber' ? '#E8A04A' : '#4FC3A1'

  if (!authorized) {
    return (
      <div style={{ minHeight: '100vh', background: '#080C12', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(91,156,246,0.1)', borderTop: '2px solid #5B9CF6' }} />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080C12', color: '#E8EEF5', fontFamily: 'Inter, sans-serif' }}>

      {/* Ambient */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(91,156,246,0.04) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,195,161,0.04) 0%, transparent 70%)' }} />
      </div>

      {/* Navbar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        padding: '16px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(8,12,18,0.95)', backdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 3, repeat: Infinity }}
              style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(79,195,161,0.15)', border: '1px solid rgba(79,195,161,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4FC3A1', boxShadow: '0 0 8px #4FC3A1' }} />
            </motion.div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', lineHeight: 1 }}>
                Mind<span style={{ color: '#4FC3A1' }}>Step</span>
              </p>
              <p style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#3A4A5E', marginTop: 1 }}>Admin Portal</p>
            </div>
          </div>
          <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.06)', margin: '0 8px' }} />
          <p style={{ fontSize: 12, color: '#5A6A7E' }}>Mental Health Commission — Dashboard</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <p style={{ fontSize: 12, color: '#3A4A5E' }}>{date}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: 'rgba(79,195,161,0.08)', border: '1px solid rgba(79,195,161,0.15)' }}>
            <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }}
              style={{ width: 6, height: 6, borderRadius: '50%', background: '#4FC3A1', boxShadow: '0 0 6px #4FC3A1' }} />
            <span style={{ fontSize: 11, color: '#4FC3A1', fontWeight: 600 }}>Live</span>
          </div>
          <button onClick={() => window.print()} style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#8B9BB0', fontSize: 12, cursor: 'pointer' }}>
            Export report
          </button>
          <button onClick={handleSignOut} style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(224,92,92,0.08)', border: '1px solid rgba(224,92,92,0.15)', color: '#E05C5C', fontSize: 12, cursor: 'pointer' }}>
            Sign out
          </button>
        </div>
      </div>

      <div style={{ padding: '32px 40px', position: 'relative', zIndex: 1 }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Total students', value: totalStudents, sub: 'actively tracking', color: '#5B9CF6', icon: '👥', glow: 'rgba(91,156,246,0.15)' },
            { label: 'Stable', value: `${greenPct}%`, sub: `${totalGreen} students`, color: '#4FC3A1', icon: '✅', glow: 'rgba(79,195,161,0.15)' },
            { label: 'Drifting', value: `${amberPct}%`, sub: `${totalAmber} students`, color: '#E8A04A', icon: '⚠️', glow: 'rgba(232,160,74,0.15)' },
            { label: 'Needs attention', value: `${redPct}%`, sub: `${totalRed} students`, color: '#E05C5C', icon: '🚨', glow: 'rgba(224,92,92,0.15)' },
          ].map((stat, i) => (
            <motion.div key={stat.label}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }} whileHover={{ y: -4 }}
              style={{ padding: '24px', borderRadius: 20, background: `linear-gradient(135deg, ${stat.color}08, rgba(255,255,255,0.02))`, border: `1px solid ${stat.color}20`, position: 'relative', overflow: 'hidden', cursor: 'default' }}
            >
              <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: `radial-gradient(circle, ${stat.glow} 0%, transparent 70%)`, pointerEvents: 'none' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontSize: 22 }}>{stat.icon}</span>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: stat.color, boxShadow: `0 0 8px ${stat.color}` }} />
              </div>
              <p style={{ fontSize: 40, fontWeight: 300, fontFamily: 'Playfair Display, serif', color: stat.color, lineHeight: 1, marginBottom: 8 }}>{stat.value}</p>
              <p style={{ fontSize: 13, color: '#C8D4E0', marginBottom: 3, fontWeight: 500 }}>{stat.label}</p>
              <p style={{ fontSize: 11, color: '#3A4A5E' }}>{stat.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, padding: '4px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', width: 'fit-content', marginBottom: 24 }}>
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'students', label: 'Flagged students' },
            { id: 'hostels', label: 'Hostel breakdown' },
            { id: 'integrity', label: '🛡 Data integrity' },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '8px 20px', borderRadius: 9, border: 'none',
                background: activeTab === tab.id ? 'rgba(79,195,161,0.12)' : 'transparent',
                color: activeTab === tab.id ? '#4FC3A1' : '#5A6A7E',
                fontSize: 13, fontWeight: activeTab === tab.id ? 500 : 400,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>

              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                style={{ padding: '28px', borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <p style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#3A4A5E', marginBottom: 4 }}>Campus trend</p>
                <h3 style={{ fontSize: 18, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', marginBottom: 24 }}>Wellbeing over the semester</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={TREND_DATA} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                    <defs>
                      <linearGradient id="gGreen" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4FC3A1" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#4FC3A1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gAmber" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E8A04A" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#E8A04A" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gRed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E05C5C" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#E05C5C" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="week" tick={{ fill: '#5A6A7E', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#5A6A7E', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#E8EEF5', fontSize: 12 }} />
                    <Area type="monotone" dataKey="green" stroke="#4FC3A1" strokeWidth={2} fill="url(#gGreen)" dot={false} />
                    <Area type="monotone" dataKey="amber" stroke="#E8A04A" strokeWidth={2} fill="url(#gAmber)" dot={false} />
                    <Area type="monotone" dataKey="red" stroke="#E05C5C" strokeWidth={2} fill="url(#gRed)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
                  {[{ color: '#4FC3A1', label: 'Stable' }, { color: '#E8A04A', label: 'Drifting' }, { color: '#E05C5C', label: 'Attention needed' }].map((l) => (
                    <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
                      <span style={{ fontSize: 11, color: '#5A6A7E' }}>{l.label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                style={{ padding: '28px', borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <p style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#3A4A5E', marginBottom: 4 }}>This week</p>
                <h3 style={{ fontSize: 18, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', marginBottom: 24 }}>Status breakdown</h3>
                {[
                  { label: 'Stable', pct: greenPct, count: totalGreen, color: '#4FC3A1' },
                  { label: 'Drifting', pct: amberPct, count: totalAmber, color: '#E8A04A' },
                  { label: 'Attention', pct: redPct, count: totalRed, color: '#E05C5C' },
                ].map((s, i) => (
                  <div key={s.label} style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, boxShadow: `0 0 5px ${s.color}` }} />
                        <span style={{ fontSize: 13, color: '#C8D4E0' }}>{s.label}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: s.color, fontWeight: 600 }}>{s.pct}%</span>
                        <span style={{ fontSize: 11, color: '#3A4A5E' }}>{s.count} students</span>
                      </div>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.04)' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${s.pct}%` }}
                        transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
                        style={{ height: '100%', borderRadius: 3, background: s.color, boxShadow: `0 0 8px ${s.color}40` }}
                      />
                    </div>
                  </div>
                ))}
                {totalRed > 0 && (
                  <motion.div animate={{ opacity: [1, 0.7, 1] }} transition={{ duration: 3, repeat: Infinity }}
                    style={{ marginTop: 20, padding: '12px 16px', borderRadius: 12, background: 'rgba(224,92,92,0.08)', border: '1px solid rgba(224,92,92,0.2)' }}
                  >
                    <p style={{ fontSize: 12, color: '#E05C5C', fontWeight: 600, marginBottom: 3 }}>{totalRed} students need attention</p>
                    <p style={{ fontSize: 11, color: '#5A6A7E' }}>Switch to "Flagged students" tab to review</p>
                  </motion.div>
                )}
              </motion.div>
            </div>

            {/* Dept table */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              style={{ borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}
            >
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#3A4A5E', marginBottom: 3 }}>Department breakdown</p>
                <h3 style={{ fontSize: 16, fontFamily: 'Playfair Display, serif', color: '#E8EEF5' }}>Wellbeing by department</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '200px 80px 1fr 80px 80px 80px', gap: 12, padding: '12px 24px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                {['Department', 'Students', 'Breakdown', 'Stable', 'Drifting', 'Alert'].map((h) => (
                  <p key={h} style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#3A4A5E', fontWeight: 600 }}>{h}</p>
                ))}
              </div>
              {DEMO_DEPTS.map((dept, i) => (
                <motion.div key={dept.name}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  style={{ display: 'grid', gridTemplateColumns: '200px 80px 1fr 80px 80px 80px', gap: 12, padding: '16px 24px', borderBottom: i < DEMO_DEPTS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', alignItems: 'center', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <p style={{ fontSize: 13, color: '#C8D4E0', fontWeight: 500 }}>{dept.name}</p>
                  <p style={{ fontSize: 13, color: '#5A6A7E' }}>{dept.total}</p>
                  <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.04)', display: 'flex', overflow: 'hidden', gap: 1 }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(dept.green / dept.total) * 100}%` }} transition={{ duration: 0.8, delay: 0.4 + i * 0.05 }} style={{ height: '100%', background: '#4FC3A1', borderRadius: '3px 0 0 3px' }} />
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(dept.amber / dept.total) * 100}%` }} transition={{ duration: 0.8, delay: 0.5 + i * 0.05 }} style={{ height: '100%', background: '#E8A04A' }} />
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(dept.red / dept.total) * 100}%` }} transition={{ duration: 0.8, delay: 0.6 + i * 0.05 }} style={{ height: '100%', background: '#E05C5C', borderRadius: '0 3px 3px 0' }} />
                  </div>
                  <p style={{ fontSize: 13, color: '#4FC3A1', fontWeight: 500 }}>{dept.green}</p>
                  <p style={{ fontSize: 13, color: '#E8A04A', fontWeight: 500 }}>{dept.amber}</p>
                  <p style={{ fontSize: 13, color: '#E05C5C', fontWeight: 500 }}>{dept.red}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}

        {/* FLAGGED STUDENTS */}
        {activeTab === 'students' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ padding: '16px 20px', borderRadius: 14, background: 'rgba(224,92,92,0.06)', border: '1px solid rgba(224,92,92,0.15)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}
                style={{ width: 8, height: 8, borderRadius: '50%', background: '#E05C5C', flexShrink: 0, boxShadow: '0 0 8px #E05C5C' }} />
              <p style={{ fontSize: 13, color: '#8B9BB0' }}>
                These students have shown consistent signs of distress. Only authorized counselors can see individual names. All data is anonymized in reports.
              </p>
            </div>
            <div style={{ borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 100px 120px 80px 120px', gap: 12, padding: '14px 24px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {['Student', 'Department', 'Days flagged', 'Last check-in', 'Status', 'Action'].map((h) => (
                  <p key={h} style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#3A4A5E', fontWeight: 600 }}>{h}</p>
                ))}
              </div>
              {DEMO_STUDENTS.map((student, i) => {
                const sc = statusColor(student.status)
                return (
                  <motion.div key={i}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    style={{ display: 'grid', gridTemplateColumns: '1fr 160px 100px 120px 80px 120px', gap: 12, padding: '18px 24px', borderBottom: i < DEMO_STUDENTS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', alignItems: 'center', transition: 'background 0.2s' }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = `${sc}05`}
                    onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${sc}15`, border: `1px solid ${sc}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: sc, flexShrink: 0 }}>
                        {student.name[0]}
                      </div>
                      <div>
                        <p style={{ fontSize: 13, color: '#C8D4E0', fontWeight: 500 }}>{student.name}</p>
                        <p style={{ fontSize: 11, color: '#3A4A5E' }}>{student.streak} day streak</p>
                      </div>
                    </div>
                    <p style={{ fontSize: 12, color: '#5A6A7E' }}>{student.dept}</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: sc }}>{student.daysRed} days</p>
                    <p style={{ fontSize: 12, color: '#5A6A7E' }}>{student.lastCheckin}</p>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: `${sc}12`, border: `1px solid ${sc}25`, width: 'fit-content' }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: sc, boxShadow: `0 0 4px ${sc}` }} />
                      <span style={{ fontSize: 10, color: sc, fontWeight: 600, textTransform: 'capitalize' }}>{student.status}</span>
                    </div>
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      style={{ padding: '6px 14px', borderRadius: 8, background: `${sc}12`, border: `1px solid ${sc}25`, color: sc, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                      Contact →
                    </motion.button>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* HOSTELS */}
        {activeTab === 'hostels' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                style={{ padding: '28px', borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <p style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#3A4A5E', marginBottom: 4 }}>Hostel blocks</p>
                <h3 style={{ fontSize: 18, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', marginBottom: 24 }}>Wellbeing by block</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={HOSTEL_DATA} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="name" tick={{ fill: '#5A6A7E', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#5A6A7E', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#E8EEF5', fontSize: 12 }} />
                    <Bar dataKey="green" fill="#4FC3A1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="amber" fill="#E8A04A" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="red" fill="#E05C5C" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {HOSTEL_DATA.map((hostel, i) => {
                  const total = hostel.green + hostel.amber + hostel.red
                  const riskScore = ((hostel.amber * 0.5 + hostel.red) / total * 100).toFixed(0)
                  const riskColor = parseInt(riskScore) > 20 ? '#E05C5C' : parseInt(riskScore) > 10 ? '#E8A04A' : '#4FC3A1'
                  return (
                    <motion.div key={hostel.name}
                      initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }} whileHover={{ x: 4 }}
                      style={{ padding: '16px 20px', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 16, cursor: 'default' }}
                    >
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: `${riskColor}12`, border: `1px solid ${riskColor}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🏠</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <p style={{ fontSize: 13, color: '#C8D4E0', fontWeight: 500 }}>{hostel.name}</p>
                          <p style={{ fontSize: 12, color: '#3A4A5E' }}>{total} students</p>
                        </div>
                        <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.04)', display: 'flex', overflow: 'hidden', gap: 1, marginBottom: 6 }}>
                          <div style={{ width: `${(hostel.green / total) * 100}%`, background: '#4FC3A1', height: '100%', borderRadius: '2px 0 0 2px' }} />
                          <div style={{ width: `${(hostel.amber / total) * 100}%`, background: '#E8A04A', height: '100%' }} />
                          <div style={{ width: `${(hostel.red / total) * 100}%`, background: '#E05C5C', height: '100%', borderRadius: '0 2px 2px 0' }} />
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <span style={{ fontSize: 11, color: '#4FC3A1' }}>{hostel.green} stable</span>
                          <span style={{ fontSize: 11, color: '#E8A04A' }}>{hostel.amber} drifting</span>
                          <span style={{ fontSize: 11, color: '#E05C5C' }}>{hostel.red} alert</span>
                        </div>
                      </div>
                      <div style={{ padding: '4px 10px', borderRadius: 20, background: `${riskColor}12`, border: `1px solid ${riskColor}25`, flexShrink: 0 }}>
                        <span style={{ fontSize: 11, color: riskColor, fontWeight: 600 }}>{riskScore}% risk</span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* DATA INTEGRITY */}
        {activeTab === 'integrity' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

            {/* Header */}
            <div style={{ padding: '16px 20px', borderRadius: 14, marginBottom: 24, background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                🛡
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#A78BFA', marginBottom: 3 }}>Honesty Intelligence System</p>
                <p style={{ fontSize: 12, color: '#5A6A7E', lineHeight: 1.6 }}>
                  MindStep silently scores every check-in for authenticity using emotion-numeric alignment, variance analysis, and response speed. No student is accused — the system simply weights suspicious data less when building baselines.
                </p>
              </div>
            </div>

            {/* Trust distribution stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
              {[
                { label: 'High trust', value: '68%', sub: '204 check-ins', color: '#4FC3A1', icon: '✅', desc: 'Emotion matches numeric scores' },
                { label: 'Medium trust', value: '19%', sub: '57 check-ins', color: '#5B9CF6', icon: '🔵', desc: 'Minor inconsistencies detected' },
                { label: 'Low trust', value: '9%', sub: '27 check-ins', color: '#E8A04A', icon: '⚠️', desc: 'Multiple flags raised' },
                { label: 'Suspicious', value: '4%', sub: '12 check-ins', color: '#E05C5C', icon: '🚩', desc: 'Likely gaming detected' },
              ].map((stat, i) => (
                <motion.div key={stat.label}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  style={{ padding: '20px', borderRadius: 16, background: `${stat.color}08`, border: `1px solid ${stat.color}20`, position: 'relative', overflow: 'hidden' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 20 }}>{stat.icon}</span>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: stat.color, boxShadow: `0 0 6px ${stat.color}` }} />
                  </div>
                  <p style={{ fontSize: 36, fontWeight: 300, fontFamily: 'Playfair Display, serif', color: stat.color, lineHeight: 1, marginBottom: 6 }}>{stat.value}</p>
                  <p style={{ fontSize: 12, color: '#C8D4E0', marginBottom: 2, fontWeight: 500 }}>{stat.label}</p>
                  <p style={{ fontSize: 11, color: '#3A4A5E' }}>{stat.sub}</p>
                  <p style={{ fontSize: 10, color: '#2A3547', marginTop: 6, lineHeight: 1.5, fontStyle: 'italic' }}>{stat.desc}</p>
                </motion.div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

              {/* Detection methods */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                style={{ padding: '24px', borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <p style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#3A4A5E', marginBottom: 16, fontWeight: 600 }}>Detection methods</p>
                {[
                  { icon: '🎭', title: 'Emotion-numeric alignment', desc: 'If a student picks "Anxious" but rates everything 9-10, the system flags the contradiction. Real anxiety correlates with lower numeric scores.', weight: '35%', color: '#A78BFA' },
                  { icon: '📉', title: 'Variance analysis', desc: 'Real humans vary day to day. Standard deviation < 0.6 across 7+ days is statistically impossible for genuine data.', weight: '30%', color: '#5B9CF6' },
                  { icon: '🔄', title: 'Consecutive high scores', desc: 'Rating sleep 8+, social 8+, pressure 2 or less for 5+ consecutive days triggers a consistency flag.', weight: '20%', color: '#E8A04A' },
                  { icon: '⚡', title: 'Response speed', desc: 'Completing all 5 questions in under 6 seconds indicates rushing. Thoughtful answers take time.', weight: '15%', color: '#4FC3A1' },
                ].map((method, i) => (
                  <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: `${method.color}10`, border: `1px solid ${method.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                      {method.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: '#C8D4E0' }}>{method.title}</p>
                        <span style={{ fontSize: 10, color: method.color, padding: '1px 8px', borderRadius: 20, background: `${method.color}12`, border: `1px solid ${method.color}20` }}>
                          {method.weight} weight
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: '#3A4A5E', lineHeight: 1.6 }}>{method.desc}</p>
                    </div>
                  </div>
                ))}
              </motion.div>

              {/* Flagged check-ins */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                style={{ padding: '24px', borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <p style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#3A4A5E', marginBottom: 16, fontWeight: 600 }}>Recent flagged check-ins</p>
                {FLAGGED_CHECKINS.map((item, i) => {
                  const trustColor = item.trust < 0.5 ? '#E05C5C' : item.trust < 0.7 ? '#E8A04A' : '#5B9CF6'
                  const trustLabel = item.trust < 0.5 ? 'Suspicious' : item.trust < 0.7 ? 'Low trust' : 'Medium'
                  return (
                    <motion.div key={i}
                      initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.06 }}
                      style={{ padding: '12px 14px', borderRadius: 12, marginBottom: 8, background: `${trustColor}06`, border: `1px solid ${trustColor}15` }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 500, color: '#C8D4E0', marginBottom: 2 }}>{item.name}</p>
                          <p style={{ fontSize: 11, color: '#3A4A5E' }}>{item.dept} · {item.emotion} · Sleep: {item.sleep}/10 · Social: {item.social}/10</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                          <span style={{ fontSize: 10, color: trustColor, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: `${trustColor}12`, border: `1px solid ${trustColor}25` }}>
                            {Math.round(item.trust * 100)}% trust
                          </span>
                          <span style={{ fontSize: 9, color: trustColor }}>{trustLabel}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {item.flags.map((flag, fi) => (
                          <span key={fi} style={{ fontSize: 9, color: '#5A6A7E', padding: '2px 8px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'JetBrains Mono, monospace' }}>
                            {flag.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  )
                })}
              </motion.div>
            </div>

            {/* How suspicious data is handled */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              style={{ padding: '28px', borderRadius: 20, background: 'linear-gradient(135deg, rgba(79,195,161,0.06), rgba(167,139,250,0.04))', border: '1px solid rgba(79,195,161,0.15)' }}
            >
              <p style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#4FC3A1', marginBottom: 24, fontWeight: 600 }}>How suspicious data is handled</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                {[
                  { step: '01', title: 'Data is still saved', desc: 'Every check-in is stored regardless of trust score. Nothing is deleted or rejected. The student sees no difference.', color: '#4FC3A1' },
                  { step: '02', title: 'Baseline is weighted', desc: 'Suspicious check-ins contribute less to the personal baseline. A 40% trust score means the data is weighted at 0.3x instead of 1.0x.', color: '#5B9CF6' },
                  { step: '03', title: 'Status is adjusted', desc: 'For low-trust check-ins, the system applies a conservative correction — inflating pressure and deflating sleep/social scores before calculating drift status.', color: '#A78BFA' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 16 }}>
                    <p style={{ fontSize: 40, fontWeight: 300, fontFamily: 'Playfair Display, serif', color: `${item.color}30`, lineHeight: 1, flexShrink: 0 }}>{item.step}</p>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#E8EEF5', marginBottom: 8, fontFamily: 'Playfair Display, serif' }}>{item.title}</p>
                      <p style={{ fontSize: 12, color: '#3A4A5E', lineHeight: 1.7 }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

          </motion.div>
        )}

      </div>
    </div>
  )
}