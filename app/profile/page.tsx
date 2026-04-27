'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/UserContext'
import Sidebar from '@/components/Sidebar'

// ── XP helpers (mirrored from rewards) ────────────────────────────────────
const XP_PER_LEVEL = 500
function calcXP(checkins: any[], streak: number) { return checkins.length * 50 + streak * 30 }
function calcLevel(xp: number) { return Math.floor(xp / XP_PER_LEVEL) + 1 }
function xpProgress(xp: number) { return ((xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100 }
function xpToNext(xp: number) { return XP_PER_LEVEL - (xp % XP_PER_LEVEL) }

const LEVEL_TITLES = ['Seedling','Explorer','Thinker','Balanced','Focused','Resilient','Mindful','Enlightened','Champion','Legend']
const LEVEL_COLORS = ['#4FC3A1','#4FC3A1','#5B9CF6','#5B9CF6','#A78BFA','#A78BFA','#E8A04A','#E8A04A','#E05C5C','#ffd700']
function getLevelTitle(l: number) { return LEVEL_TITLES[Math.min(l-1, LEVEL_TITLES.length-1)] }
function getLevelColor(l: number) { return LEVEL_COLORS[Math.min(l-1, LEVEL_COLORS.length-1)] }

// ── Badge data (subset for profile strip) ────────────────────────────────
type Rarity = 'common'|'rare'|'epic'|'legendary'
const RARITY_GLOW: Record<Rarity,string> = { common:'#4A5A6E', rare:'#5B9CF6', epic:'#A78BFA', legendary:'#E8A04A' }

const ALL_BADGES = [
  { id:'c1', emoji:'🌱', title:'First Step',   rarity:'common'    as Rarity, unlocked:(s:number,t:number)=>t>=1 },
  { id:'c2', emoji:'🔥', title:'Ignition',     rarity:'common'    as Rarity, unlocked:(s:number)=>s>=7 },
  { id:'c3', emoji:'⚡', title:'Momentum',     rarity:'rare'      as Rarity, unlocked:(s:number)=>s>=14 },
  { id:'c4', emoji:'🌙', title:'Night Owl',    rarity:'rare'      as Rarity, unlocked:(s:number)=>s>=21 },
  { id:'c5', emoji:'💎', title:'Diamond Mind', rarity:'epic'      as Rarity, unlocked:(s:number)=>s>=30 },
  { id:'c6', emoji:'🏆', title:'Legend',       rarity:'legendary' as Rarity, unlocked:(s:number)=>s>=60 },
  { id:'w1', emoji:'😊', title:'Good Vibes',   rarity:'common'    as Rarity, unlocked:(_:number,t:number)=>t>=5 },
  { id:'w2', emoji:'🌿', title:'In Balance',   rarity:'rare'      as Rarity, unlocked:(_:number,t:number)=>t>=10 },
  { id:'w3', emoji:'🧘', title:'Zen State',    rarity:'epic'      as Rarity, unlocked:(_:number,t:number)=>t>=20 },
]

export default function Profile() {
  const router = useRouter()
  const { user, userData, checkins, loading } = useUser()
  const [name, setName] = useState(userData?.name || '')
  const [notificationTime, setNotificationTime] = useState(userData?.notificationTime || '21:00')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const streak = userData?.streak ?? 0
  const totalCheckins = checkins.length
  const greenDays = checkins.filter((c:any) => c.status === 'green').length
  const bloomingDays = checkins.filter((c:any) => {
    const avg = ((c.sleep??5)+(c.socialEnergy??5)+(10-(c.pressure??5)))/3
    return avg>=7
  }).length

  const totalXP = calcXP(checkins, streak)
  const level = calcLevel(totalXP)
  const levelColor = getLevelColor(level)
  const levelTitle = getLevelTitle(level)
  const progress = xpProgress(totalXP)
  const toNext = xpToNext(totalXP)

  const badgesWithStatus = ALL_BADGES.map(b => ({ ...b, isUnlocked: b.unlocked(streak, totalCheckins) }))

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebaseUid: user.uid, name, notificationTime }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch(e) { console.error(e) }
    finally { setSaving(false) }
  }

  const displayName = name || userData?.name || user?.displayName || 'Student'
  const inputStyle = {
    width: '100%', padding: '11px 14px', borderRadius: 10,
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    color: '#E8EEF5', fontSize: 13, outline: 'none', fontFamily: 'Inter, sans-serif',
    boxSizing: 'border-box' as const,
  }

  if (loading) return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#080C12', alignItems:'center', justifyContent:'center' }}>
      <motion.div animate={{ rotate:360 }} transition={{ duration:1.5, repeat:Infinity, ease:'linear' }}
        style={{ width:36, height:36, borderRadius:'50%', border:'2px solid rgba(79,195,161,0.1)', borderTop:'2px solid #4FC3A1' }} />
    </div>
  )

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#080C12', fontFamily:'Inter, sans-serif' }}>
      <Sidebar userName={displayName} userData={userData} />
      <main style={{ marginLeft:220, flex:1, padding:'32px', overflowY:'auto' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28 }}>
          <div>
            <p style={{ fontSize:11, letterSpacing:'0.2em', textTransform:'uppercase', color:'#4A5A6E', marginBottom:6 }}>Your Account</p>
            <h1 style={{ fontSize:32, fontFamily:'Playfair Display, serif', color:'#E8EEF5', margin:0 }}>Profile</h1>
          </div>
          <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }} onClick={handleSave} disabled={saving}
            style={{ padding:'10px 24px', borderRadius:12, border:'none', cursor:'pointer', fontSize:13, fontWeight:600,
              background: saved ? 'rgba(79,195,161,0.15)' : 'linear-gradient(135deg,#4FC3A1,#3DA88B)',
              color: saved ? '#4FC3A1' : '#080C12',
              boxShadow: saved ? 'none' : '0 4px 20px rgba(79,195,161,0.3)', transition:'all 0.3s' }}>
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save changes'}
          </motion.button>
        </div>

        {/* ── HERO BANNER ─────────────────────────────────────────── */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
          style={{ padding:'32px', borderRadius:24, marginBottom:16, position:'relative', overflow:'hidden',
            background:`linear-gradient(135deg, ${levelColor}12, rgba(8,12,18,0.95))`,
            border:`1px solid ${levelColor}30` }}>
          <motion.div animate={{ rotate:360 }} transition={{ duration:40, repeat:Infinity, ease:'linear' }}
            style={{ position:'absolute', top:-120, right:-120, width:360, height:360, borderRadius:'50%',
              border:`1px solid ${levelColor}15`, pointerEvents:'none' }} />
          <div style={{ display:'flex', alignItems:'center', gap:28 }}>
            {/* Avatar */}
            <div style={{ position:'relative', flexShrink:0 }}>
              <motion.div animate={{ rotate:360 }} transition={{ duration:12, repeat:Infinity, ease:'linear' }}
                style={{ position:'absolute', inset:-4, borderRadius:'50%', border:'2px solid transparent',
                  borderTopColor:levelColor, borderRightColor:`${levelColor}50` }} />
              <motion.div animate={{ scale:[1,1.04,1] }} transition={{ duration:4, repeat:Infinity }}
                style={{ width:88, height:88, borderRadius:'50%',
                  background:`linear-gradient(135deg, ${levelColor}30, rgba(8,12,18,0.8))`,
                  border:`1px solid ${levelColor}50`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:36, fontWeight:700, color:levelColor, fontFamily:'Playfair Display, serif',
                  boxShadow:`0 0 32px ${levelColor}30` }}>
                {displayName[0]?.toUpperCase()}
              </motion.div>
            </div>
            {/* Name & info */}
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                <h2 style={{ fontSize:26, fontFamily:'Playfair Display, serif', color:'#E8EEF5', margin:0 }}>{displayName}</h2>
                <div style={{ display:'flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:20,
                  background:'rgba(79,195,161,0.1)', border:'1px solid rgba(79,195,161,0.2)' }}>
                  <motion.div animate={{ scale:[1,1.5,1] }} transition={{ duration:2, repeat:Infinity }}
                    style={{ width:5, height:5, borderRadius:'50%', background:'#4FC3A1', boxShadow:'0 0 6px #4FC3A1' }} />
                  <span style={{ fontSize:10, color:'#4FC3A1', fontWeight:600 }}>Active</span>
                </div>
              </div>
              <p style={{ fontSize:13, color:'#4A5A6E', marginBottom:12 }}>{user?.email}</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                <span style={{ fontSize:13, fontWeight:600, color:levelColor, padding:'4px 12px', borderRadius:20,
                  background:`${levelColor}15`, border:`1px solid ${levelColor}30` }}>
                  Level {level} · {levelTitle}
                </span>
                {userData?.course && <span style={{ fontSize:11, color:'#4FC3A1', padding:'4px 10px', borderRadius:20, background:'rgba(79,195,161,0.08)', border:'1px solid rgba(79,195,161,0.15)' }}>{userData.course}</span>}
                {userData?.semester && <span style={{ fontSize:11, color:'#5B9CF6', padding:'4px 10px', borderRadius:20, background:'rgba(91,156,246,0.08)', border:'1px solid rgba(91,156,246,0.15)' }}>Sem {userData.semester}</span>}
                {userData?.studentType === 'hosteller' && <span style={{ fontSize:11, color:'#A78BFA', padding:'4px 10px', borderRadius:20, background:'rgba(167,139,250,0.08)', border:'1px solid rgba(167,139,250,0.15)' }}>🏨 {userData.hostel || 'Hosteller'}</span>}
                {userData?.studentType === 'dayscholar' && <span style={{ fontSize:11, color:'#E8A04A', padding:'4px 10px', borderRadius:20, background:'rgba(232,160,74,0.08)', border:'1px solid rgba(232,160,74,0.15)' }}>🏠 Day Scholar</span>}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── XP BAR ──────────────────────────────────────────────── */}
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.08 }}
          style={{ padding:'22px 28px', borderRadius:18, marginBottom:16,
            background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:14 }}>⚡</span>
              <span style={{ fontSize:13, fontWeight:600, color:levelColor }}>Level {level} — {totalXP} XP</span>
            </div>
            <span style={{ fontSize:12, color:'#3A4A5E' }}>{toNext} XP to Level {level+1}</span>
          </div>
          <div style={{ height:6, borderRadius:3, background:'rgba(255,255,255,0.06)', overflow:'hidden' }}>
            <motion.div initial={{ width:0 }} animate={{ width:`${progress}%` }} transition={{ duration:1.2, ease:'easeOut', delay:0.3 }}
              style={{ height:'100%', borderRadius:3, background:`linear-gradient(90deg, ${levelColor}, ${levelColor}80)`,
                boxShadow:`0 0 8px ${levelColor}60` }} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginTop:16 }}>
            {[['🔥','Streak',`${streak} days`,'#E8A04A'],['📋','Check-ins',totalCheckins,'#4FC3A1'],['😊','Green Days',greenDays,'#86efac'],['🌸','Blooming',bloomingDays,'#f9a8d4']].map(([icon,label,val,col])=>(
              <div key={label as string} style={{ padding:'12px', borderRadius:12, background:`${col as string}08`, border:`1px solid ${col as string}18`, textAlign:'center' }}>
                <div style={{ fontSize:18, marginBottom:4 }}>{icon}</div>
                <p style={{ fontSize:18, fontWeight:600, color:col as string, fontFamily:'Playfair Display, serif', margin:0 }}>{val}</p>
                <p style={{ fontSize:10, color:'#3A4A5E', marginTop:2 }}>{label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── BADGES STRIP ────────────────────────────────────────── */}
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.14 }}
          style={{ padding:'22px 28px', borderRadius:18, marginBottom:16,
            background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div>
              <p style={{ fontSize:10, letterSpacing:'0.18em', textTransform:'uppercase', color:'#3A4A5E', fontWeight:600, marginBottom:2 }}>Earned Badges</p>
              <p style={{ fontSize:14, fontFamily:'Playfair Display, serif', color:'#E8EEF5' }}>{badgesWithStatus.filter(b=>b.isUnlocked).length} of {ALL_BADGES.length} unlocked</p>
            </div>
            <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }} onClick={() => router.push('/rewards')}
              style={{ padding:'7px 16px', borderRadius:10, border:'1px solid rgba(79,195,161,0.25)',
                background:'rgba(79,195,161,0.06)', color:'#4FC3A1', fontSize:12, cursor:'pointer', fontFamily:'Inter, sans-serif' }}>
              View All →
            </motion.button>
          </div>
          <div style={{ display:'flex', gap:12, overflowX:'auto', paddingBottom:4 }}>
            {badgesWithStatus.map((b,i) => {
              const glow = RARITY_GLOW[b.rarity]
              return (
                <motion.div key={b.id} initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }} transition={{ delay:0.18+i*0.04 }}
                  style={{ flexShrink:0, width:80, padding:'12px 8px', borderRadius:14, textAlign:'center', cursor:'default',
                    background: b.isUnlocked ? `${glow}12` : 'rgba(255,255,255,0.02)',
                    border:`1px solid ${b.isUnlocked ? glow+'50' : 'rgba(255,255,255,0.05)'}`,
                    filter: b.isUnlocked ? 'none' : 'grayscale(0.9)',
                    boxShadow: b.isUnlocked ? `0 4px 16px ${glow}25` : 'none' }}>
                  <motion.div animate={b.isUnlocked ? { scale:[1,1.1,1] } : {}} transition={{ duration:3, repeat:Infinity }}>
                    <span style={{ fontSize:24 }}>{b.isUnlocked ? b.emoji : '🔒'}</span>
                  </motion.div>
                  <p style={{ fontSize:9, color: b.isUnlocked ? glow : '#2A3547', fontWeight:600, marginTop:6, lineHeight:1.3 }}>{b.title}</p>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* ── EDIT + PRIVACY ──────────────────────────────────────── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>

          {/* Edit info */}
          <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
            style={{ padding:'24px', borderRadius:18, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
              <div style={{ width:30, height:30, borderRadius:9, background:'rgba(91,156,246,0.1)', border:'1px solid rgba(91,156,246,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>👤</div>
              <h3 style={{ fontSize:14, fontFamily:'Playfair Display, serif', color:'#E8EEF5' }}>Personal Info</h3>
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', color:'#3A4A5E', fontWeight:600, display:'block', marginBottom:6 }}>Display Name</label>
              <input style={inputStyle} value={name} onChange={e=>setName(e.target.value)} placeholder="Your full name"
                onFocus={e=>(e.target.style.borderColor='rgba(79,195,161,0.4)')}
                onBlur={e=>(e.target.style.borderColor='rgba(255,255,255,0.08)')} />
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', color:'#3A4A5E', fontWeight:600, display:'block', marginBottom:6 }}>Email</label>
              <input style={{ ...inputStyle, opacity:0.4, cursor:'not-allowed' }} value={user?.email||''} disabled />
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', color:'#3A4A5E', fontWeight:600, display:'block', marginBottom:6 }}>Daily Reminder</label>
              <input type="time" style={inputStyle} value={notificationTime} onChange={e=>setNotificationTime(e.target.value)}
                onFocus={e=>(e.target.style.borderColor='rgba(79,195,161,0.4)')}
                onBlur={e=>(e.target.style.borderColor='rgba(255,255,255,0.08)')} />
            </div>
            {userData?.uid && (
              <div style={{ padding:'12px', borderRadius:10, background:'rgba(91,156,246,0.05)', border:'1px solid rgba(91,156,246,0.1)' }}>
                <p style={{ fontSize:9, color:'#3A4A5E', marginBottom:3 }}>UNIVERSITY ID</p>
                <p style={{ fontSize:11, color:'#5B9CF6', fontWeight:600, fontFamily:'monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{userData.uid}</p>
              </div>
            )}
          </motion.div>

          {/* Privacy + UCC */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.24 }}
              style={{ padding:'24px', borderRadius:18, background:'linear-gradient(135deg,rgba(79,195,161,0.05),rgba(8,12,18,0.95))', border:'1px solid rgba(79,195,161,0.2)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                <div style={{ width:30, height:30, borderRadius:9, background:'rgba(79,195,161,0.1)', border:'1px solid rgba(79,195,161,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>🏥</div>
                <h3 style={{ fontSize:14, fontFamily:'Playfair Display, serif', color:'#E8EEF5' }}>Emergency Alert</h3>
              </div>
              <p style={{ fontSize:12, color:'#5A6A7E', lineHeight:1.7, marginBottom:12 }}>If MindStep detects serious distress in your check-in patterns, an alert is sent to the University Counselling Centre.</p>
              {[['Notified','University Counselling Centre','#4FC3A1'],['Contact','ucc@tnu.in','#5B9CF6'],['Trigger','RED drift detected','#E05C5C']].map(([label,val,col])=>(
                <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize:10, color:'#3A4A5E', textTransform:'uppercase', letterSpacing:'0.08em' }}>{label}</span>
                  <span style={{ fontSize:11, color:col, fontWeight:500 }}>{val}</span>
                </div>
              ))}
            </motion.div>

            <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.28 }}
              style={{ padding:'24px', borderRadius:18, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                <div style={{ width:30, height:30, borderRadius:9, background:'rgba(79,195,161,0.1)', border:'1px solid rgba(79,195,161,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>🔒</div>
                <h3 style={{ fontSize:14, fontFamily:'Playfair Display, serif', color:'#E8EEF5' }}>Privacy</h3>
              </div>
              {[['🔐','End-to-end encrypted'],['🚫','Data never sold'],['👁','You control sharing'],['🗑','Delete anytime']].map(([icon,title],i)=>(
                <div key={i} style={{ display:'flex', gap:10, padding:'8px 0', borderBottom:i<3?'1px solid rgba(255,255,255,0.04)':'none', alignItems:'center' }}>
                  <span style={{ fontSize:16 }}>{icon}</span>
                  <span style={{ fontSize:12, color:'#94a3b8' }}>{title}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

      </main>
    </div>
  )
}