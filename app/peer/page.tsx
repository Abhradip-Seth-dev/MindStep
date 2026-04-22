'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import Sidebar from '@/components/Sidebar'

type Message = {
  id: string
  roomId: string
  userId: string
  text: string
  senderRole: string
  timestamp: string
}

type Screen = 'landing' | 'choosing' | 'waiting' | 'chat'

export default function Peer() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [userName, setUserName] = useState('')
  const [userData, setUserData] = useState<any>(null)
  const [screen, setScreen] = useState<Screen>('landing')
  const [role, setRole] = useState<'student' | 'supporter' | null>(null)
  const [roomId, setRoomId] = useState<string | null>(null)
  const [requestId, setRequestId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [partnerName, setPartnerName] = useState('Anonymous')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) { router.push('/onboarding'); return }
      setUser(firebaseUser)
      setUserName(firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Student')
      try {
        const userRes = await fetch(`/api/user?firebaseUid=${firebaseUser.uid}`)
        const ud = await userRes.json()
        if (!ud.error) setUserData(ud)

        // Check existing status
        const statusRes = await fetch(`/api/peer?action=status&userId=${firebaseUser.uid}`)
        const statusData = await statusRes.json()
        if (statusData.status === 'matched' && statusData.roomId) {
          setRoomId(statusData.roomId)
          setRequestId(statusData.requestId)
          setScreen('chat')
        } else if (statusData.status === 'waiting') {
          setRequestId(statusData.requestId)
          setScreen('waiting')
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    })
    return () => unsub()
  }, [])

  // Real-time messages via Firestore listener
  useEffect(() => {
    if (!roomId) return
    const messagesRef = collection(db, 'peer_messages')
    const q = query(
      messagesRef,
      where('roomId', '==', roomId),
      orderBy('timestamp', 'asc')
    )
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Message))
      setMessages(msgs)
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    })
    return () => unsub()
  }, [roomId])

  // Poll for match while waiting
  useEffect(() => {
    if (screen !== 'waiting' || !user) return
    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/peer?action=status&userId=${user.uid}`)
      const data = await res.json()
      if (data.status === 'matched' && data.roomId) {
        setRoomId(data.roomId)
        setScreen('chat')
        if (pollRef.current) clearInterval(pollRef.current)
      }
    }, 3000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [screen, user])

  // Fetch room info when chat starts
  useEffect(() => {
    if (!roomId) return
    fetch(`/api/peer?action=room&roomId=${roomId}`)
      .then(r => r.json())
      .then(room => {
        if (room.error) return
        if (role === 'student') setPartnerName('Peer Supporter')
        else setPartnerName(room.student?.userName || 'Anonymous')
      })
  }, [roomId, role])

  const handleRequest = async (chosenRole: 'student' | 'supporter') => {
    if (!user) return
    setRole(chosenRole)
    setScreen('waiting')
    try {
      const res = await fetch('/api/peer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: chosenRole === 'student' ? 'request' : 'support',
          userId: user.uid,
          userName: userName,
          course: userData?.course || '',
          semester: userData?.semester || '',
        }),
      })
      const data = await res.json()
      setRequestId(data.requestId)
      if (data.status === 'matched' && data.roomId) {
        setRoomId(data.roomId)
        setScreen('chat')
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || !roomId || !user || sending) return
    setSending(true)
    const text = input.trim()
    setInput('')
    try {
      await fetch('/api/peer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'message',
          roomId,
          userId: user.uid,
          text,
          senderRole: role || 'student',
        }),
      })
    } catch (e) {
      console.error(e)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#080C12' }}>
        <Sidebar userName={userName} userData={userData} />
        <main style={{ flex: 1, marginLeft: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(79,195,161,0.1)', borderTop: '2px solid #4FC3A1' }} />
        </main>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080C12' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '10%', right: '10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.05) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '15%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,195,161,0.04) 0%, transparent 70%)' }} />
      </div>

      <Sidebar userName={userName} userData={userData} />

      <main style={{ flex: 1, marginLeft: '220px', minHeight: '100vh', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Top bar */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 40, padding: '16px 32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(8,12,18,0.92)', backdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div>
            <p style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#3A4A5E', marginBottom: 3 }}>Peer Support</p>
            <h1 style={{ fontSize: 24, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', fontWeight: 600 }}>
              {screen === 'chat' ? `Chatting with ${partnerName}` : 'Connect with a peer'}
            </h1>
          </div>
          {screen === 'chat' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 20, background: 'rgba(79,195,161,0.08)', border: '1px solid rgba(79,195,161,0.15)' }}>
              <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }}
                style={{ width: 6, height: 6, borderRadius: '50%', background: '#4FC3A1', boxShadow: '0 0 6px #4FC3A1' }} />
              <span style={{ fontSize: 12, color: '#4FC3A1', fontWeight: 600 }}>Connected</span>
            </div>
          )}
        </div>

        <div style={{ flex: 1, padding: '32px', display: 'flex', flexDirection: 'column' }}>
          <AnimatePresence mode="wait">

            {/* LANDING */}
            {screen === 'landing' && (
              <motion.div key="landing"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', paddingTop: 60 }}
              >
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  style={{
                    width: 100, height: 100, borderRadius: '50%', margin: '0 auto 32px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'radial-gradient(circle, rgba(167,139,250,0.2) 0%, rgba(167,139,250,0.05) 70%)',
                    border: '1px solid rgba(167,139,250,0.3)',
                    boxShadow: '0 0 60px rgba(167,139,250,0.15)',
                    fontSize: 40,
                  }}
                >
                  🤝
                </motion.div>

                <h2 style={{ fontSize: 36, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', marginBottom: 12, fontWeight: 600 }}>
                  You're not alone in this
                </h2>
                <p style={{ fontSize: 15, color: '#5A6A7E', lineHeight: 1.8, marginBottom: 40 }}>
                  Connect anonymously with a fellow TNU student who has been through something similar and come out the other side.
                  No names. No judgment. Just real support from someone who gets it.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 40 }}>
                  {[
                    { icon: '🔒', title: 'Fully anonymous', desc: 'No names are shared. You choose what to reveal.' },
                    { icon: '🎓', title: 'Same university', desc: 'Matched with someone from TNU who understands your context.' },
                    { icon: '💚', title: 'Peer-verified', desc: 'Supporters have gone through recovery themselves.' },
                    { icon: '🛡', title: 'Safe space', desc: 'Moderated conversations with clear guidelines.' },
                  ].map((item, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.07 }}
                      style={{ padding: '16px', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'left' }}
                    >
                      <span style={{ fontSize: 22, display: 'block', marginBottom: 8 }}>{item.icon}</span>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#C8D4E0', marginBottom: 4 }}>{item.title}</p>
                      <p style={{ fontSize: 12, color: '#3A4A5E', lineHeight: 1.5 }}>{item.desc}</p>
                    </motion.div>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setScreen('choosing')}
                  style={{
                    width: '100%', padding: '16px', borderRadius: 16, border: 'none',
                    background: 'linear-gradient(135deg, #A78BFA, #8B5CF6)',
                    color: '#fff', fontSize: 15, fontWeight: 600,
                    cursor: 'pointer', boxShadow: '0 8px 32px rgba(167,139,250,0.25)',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  I want to connect →
                </motion.button>
              </motion.div>
            )}

            {/* CHOOSING */}
            {screen === 'choosing' && (
              <motion.div key="choosing"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                style={{ maxWidth: 560, margin: '0 auto', paddingTop: 60 }}
              >
                <h2 style={{ fontSize: 28, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', marginBottom: 8, textAlign: 'center' }}>
                  How would you like to help?
                </h2>
                <p style={{ fontSize: 13, color: '#5A6A7E', marginBottom: 32, textAlign: 'center', lineHeight: 1.6 }}>
                  Choose your role for this session. Both are equally valuable.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    {
                      role: 'student' as const,
                      icon: '💙',
                      title: "I'm going through something",
                      desc: "I'd like to talk to someone who has been in a similar place and came through it.",
                      color: '#5B9CF6',
                      gradient: 'linear-gradient(135deg, rgba(91,156,246,0.1), rgba(91,156,246,0.03))',
                      border: 'rgba(91,156,246,0.2)',
                    },
                    {
                      role: 'supporter' as const,
                      icon: '💚',
                      title: "I want to support someone",
                      desc: "I've been through a tough period and I'm in a good place now. I'd like to help someone else.",
                      color: '#4FC3A1',
                      gradient: 'linear-gradient(135deg, rgba(79,195,161,0.1), rgba(79,195,161,0.03))',
                      border: 'rgba(79,195,161,0.2)',
                    },
                  ].map((opt) => (
                    <motion.button
                      key={opt.role}
                      whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }}
                      onClick={() => handleRequest(opt.role)}
                      style={{
                        padding: '24px', borderRadius: 18, border: `1px solid ${opt.border}`,
                        background: opt.gradient, cursor: 'pointer', textAlign: 'left',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                        <span style={{ fontSize: 32, flexShrink: 0 }}>{opt.icon}</span>
                        <div>
                          <p style={{ fontSize: 16, fontWeight: 600, color: '#E8EEF5', marginBottom: 6, fontFamily: 'Playfair Display, serif' }}>
                            {opt.title}
                          </p>
                          <p style={{ fontSize: 13, color: '#5A6A7E', lineHeight: 1.6 }}>{opt.desc}</p>
                        </div>
                        <div style={{ marginLeft: 'auto', flexShrink: 0, color: opt.color, fontSize: 18 }}>→</div>
                      </div>
                    </motion.button>
                  ))}
                </div>

                <button onClick={() => setScreen('landing')} style={{ width: '100%', marginTop: 16, padding: '10px', background: 'none', border: 'none', color: '#3A4A5E', fontSize: 13, cursor: 'pointer' }}>
                  ← Back
                </button>
              </motion.div>
            )}

            {/* WAITING */}
            {screen === 'waiting' && (
              <motion.div key="waiting"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center', paddingTop: 80 }}
              >
                <motion.div
                  animate={{ scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                  style={{
                    width: 120, height: 120, borderRadius: '50%', margin: '0 auto 40px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'radial-gradient(circle, rgba(167,139,250,0.15) 0%, rgba(167,139,250,0.03) 70%)',
                    border: '1px solid rgba(167,139,250,0.3)',
                    boxShadow: '0 0 60px rgba(167,139,250,0.1)',
                    fontSize: 48,
                  }}
                >
                  {role === 'student' ? '🔍' : '⏳'}
                </motion.div>

                <h2 style={{ fontSize: 28, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', marginBottom: 12 }}>
                  {role === 'student' ? 'Finding your peer...' : 'Waiting for someone to connect...'}
                </h2>
                <p style={{ fontSize: 14, color: '#5A6A7E', lineHeight: 1.8, marginBottom: 32 }}>
                  {role === 'student'
                    ? "We're looking for a supporter who has been through something similar. This usually takes under a minute."
                    : "A student will be connected to you shortly. Thank you for being here for someone today."}
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                  {[0, 1, 2].map((i) => (
                    <motion.div key={i}
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                      style={{ width: 8, height: 8, borderRadius: '50%', background: '#A78BFA' }}
                    />
                  ))}
                </div>

                <p style={{ fontSize: 11, color: '#2A3547', marginTop: 32 }}>
                  Checking for matches every 3 seconds...
                </p>
              </motion.div>
            )}

            {/* CHAT */}
            {screen === 'chat' && (
              <motion.div key="chat"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: 700, margin: '0 auto', width: '100%' }}
              >
                {/* Chat header */}
                <div style={{
                  padding: '16px 20px', borderRadius: '16px 16px 0 0',
                  background: 'rgba(167,139,250,0.06)',
                  border: '1px solid rgba(167,139,250,0.15)',
                  borderBottom: 'none',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(167,139,250,0.3), rgba(91,156,246,0.3))',
                    border: '1px solid rgba(167,139,250,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18,
                  }}>
                    {role === 'student' ? '💚' : '💙'}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 500, color: '#E8EEF5' }}>{partnerName}</p>
                    <p style={{ fontSize: 11, color: '#3A4A5E' }}>
                      {role === 'student' ? 'TNU Peer Supporter' : 'Student seeking support'}
                    </p>
                  </div>
                  <div style={{ marginLeft: 'auto', padding: '4px 12px', borderRadius: 20, background: 'rgba(79,195,161,0.08)', border: '1px solid rgba(79,195,161,0.15)' }}>
                    <span style={{ fontSize: 11, color: '#4FC3A1', fontWeight: 500 }}>Anonymous chat</span>
                  </div>
                </div>

                {/* Messages */}
                <div style={{
                  flex: 1, overflowY: 'auto', padding: '20px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderTop: 'none', borderBottom: 'none',
                  minHeight: 400, maxHeight: 500,
                  display: 'flex', flexDirection: 'column', gap: 12,
                }}>
                  {messages.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                      <div style={{ fontSize: 40, marginBottom: 16 }}>👋</div>
                      <p style={{ fontSize: 14, color: '#5A6A7E', lineHeight: 1.7 }}>
                        {role === 'student'
                          ? "You're connected with a peer supporter. Say hi whenever you're ready — there's no rush."
                          : "A student has been connected to you. They may need a moment. Say hi when ready."}
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.userId === user?.uid
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          style={{
                            display: 'flex',
                            justifyContent: isMe ? 'flex-end' : 'flex-start',
                          }}
                        >
                          {!isMe && (
                            <div style={{
                              width: 28, height: 28, borderRadius: '50%',
                              background: 'rgba(167,139,250,0.15)',
                              border: '1px solid rgba(167,139,250,0.3)',
                              display: 'flex', alignItems: 'center',
                              justifyContent: 'center', fontSize: 13,
                              flexShrink: 0, marginRight: 8, alignSelf: 'flex-end',
                            }}>
                              {role === 'student' ? '💚' : '💙'}
                            </div>
                          )}
                          <div style={{
                            maxWidth: '70%', padding: '12px 16px', borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                            background: isMe
                              ? 'linear-gradient(135deg, #A78BFA, #8B5CF6)'
                              : 'rgba(255,255,255,0.05)',
                            border: isMe ? 'none' : '1px solid rgba(255,255,255,0.08)',
                          }}>
                            <p style={{ fontSize: 14, color: isMe ? '#fff' : '#C8D4E0', lineHeight: 1.5, margin: 0 }}>
                              {msg.text}
                            </p>
                            <p style={{ fontSize: 10, color: isMe ? 'rgba(255,255,255,0.5)' : '#3A4A5E', marginTop: 4, textAlign: isMe ? 'right' : 'left' }}>
                              {new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </motion.div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div style={{
                  padding: '16px 20px', borderRadius: '0 0 16px 16px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex', gap: 12, alignItems: 'center',
                }}>
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder="Type a message... (Enter to send)"
                    style={{
                      flex: 1, padding: '12px 16px', borderRadius: 12,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#E8EEF5', fontSize: 14, outline: 'none',
                      fontFamily: 'Inter, sans-serif',
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'rgba(167,139,250,0.4)'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={handleSend}
                    disabled={!input.trim() || sending}
                    style={{
                      width: 44, height: 44, borderRadius: 12, border: 'none',
                      background: input.trim()
                        ? 'linear-gradient(135deg, #A78BFA, #8B5CF6)'
                        : 'rgba(255,255,255,0.05)',
                      cursor: input.trim() ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, flexShrink: 0,
                      boxShadow: input.trim() ? '0 4px 16px rgba(167,139,250,0.3)' : 'none',
                    }}
                  >
                    →
                  </motion.button>
                </div>

                {/* Safety note */}
                <div style={{
                  marginTop: 12, padding: '10px 16px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{ fontSize: 14 }}>🛡</span>
                  <p style={{ fontSize: 11, color: '#3A4A5E', lineHeight: 1.5 }}>
                    This is a peer support space — not professional counseling. If you're in crisis, please contact a counselor or call a helpline immediately.
                  </p>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}