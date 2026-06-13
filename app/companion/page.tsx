'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/UserContext'
import Sidebar from '@/components/Sidebar'
import BottomNav from '@/components/BottomNav'
import { useIsMobile } from '@/lib/hooks'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

export default function Companion() {
  const router = useRouter()
  const { user, userData, baseline, checkins, loading } = useUser()
  const userName = user ? (user.displayName || user.email?.split('@')[0] || 'Student') : 'Student'

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [started, setStarted] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [clearing, setClearing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/onboarding')
    }
  }, [user, loading, router])

  // ── Load conversation history on mount ──────────────────────────────────────
  useEffect(() => {
    if (!user) return
    const loadHistory = async () => {
      try {
        const res = await fetch(`/api/companion?userId=${user.uid}`)
        const data = await res.json()
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages)
          setStarted(true)
        }
      } catch (e) {
        console.error('Failed to load conversation history:', e)
      } finally {
        setHistoryLoading(false)
      }
    }
    loadHistory()
  }, [user])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const callAura = async (msgs: Message[]): Promise<string> => {
    const res = await fetch('/api/companion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: msgs,
        userData,
        checkins,
        baseline,
      }),
    })
    const data = await res.json()
    return data.message || "I'm here. Take your time."
  }

  const startConversation = async () => {
    setStarted(true)
    setThinking(true)
    try {
      const initialMsg: Message = { role: 'user', content: 'Hi Aura, I wanted to check in.' }
      const reply = await callAura([initialMsg])
      setMessages([initialMsg, { role: 'assistant', content: reply }])
    } catch (e) {
      console.error(e)
    } finally {
      setThinking(false)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || thinking) return
    const userMessage = input.trim()
    setInput('')
    const updatedMessages: Message[] = [...messages, { role: 'user', content: userMessage }]
    setMessages(updatedMessages)
    setThinking(true)
    try {
      const reply = await callAura(updatedMessages)
      setMessages([...updatedMessages, { role: 'assistant', content: reply }])
    } catch (e) {
      console.error(e)
    } finally {
      setThinking(false)
    }
  }

  const handleClearConversation = async () => {
    if (!user) return
    setClearing(true)
    try {
      await fetch(`/api/companion?userId=${user.uid}`, { method: 'DELETE' })
      setMessages([])
      setStarted(false)
      setShowClearConfirm(false)
    } catch (e) {
      console.error('Failed to clear conversation:', e)
    } finally {
      setClearing(false)
    }
  }

  const driftStatus = checkins.length > 0
    ? checkins[checkins.length - 1]?.status || 'green'
    : 'green'
  const statusColor = driftStatus === 'red' ? '#E05C5C' : driftStatus === 'amber' ? '#E8A04A' : '#4FC3A1'

  if (loading || historyLoading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#080C12' }}>
      <Sidebar userName={userName} userData={userData} />
        <main style={{ flex: 1, marginLeft: isMobile ? 0 : '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(167,139,250,0.1)', borderTop: '2px solid #A78BFA' }} />
        </main>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080C12' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '10%', right: '10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.06) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '15%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,195,161,0.04) 0%, transparent 70%)' }} />
      </div>

      <Sidebar userName={userName} userData={userData} />
      {isMobile && <BottomNav userName={userName} />}

      <main style={{ flex: 1, marginLeft: isMobile ? 0 : '220px', minHeight: '100vh', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', paddingBottom: isMobile ? 80 : 0 }}>

        {/* Top bar */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 40, padding: '16px 32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(8,12,18,0.92)', backdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <motion.div
              animate={{ scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 3, repeat: Infinity }}
              style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(167,139,250,0.3) 0%, rgba(167,139,250,0.05) 70%)',
                border: '1px solid rgba(167,139,250,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 20px rgba(167,139,250,0.2)', fontSize: 18,
              }}
            >
              ✦
            </motion.div>
            <div>
              <p style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#A78BFA', marginBottom: 2, fontWeight: 600 }}>
                AI Companion
              </p>
              <h1 style={{ fontSize: 22, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', fontWeight: 600 }}>
                Aura
              </h1>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Memory indicator */}
            {messages.length > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 20,
                background: 'rgba(167,139,250,0.06)',
                border: '1px solid rgba(167,139,250,0.15)',
              }}>
                <span style={{ fontSize: 11 }}>💭</span>
                <span style={{ fontSize: 11, color: '#A78BFA' }}>
                  {messages.length} messages remembered
                </span>
              </div>
            )}

            {/* Drift status badge */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 16px', borderRadius: 20,
              background: `${statusColor}10`, border: `1px solid ${statusColor}25`,
            }}>
              <motion.div
                animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }}
                style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor, boxShadow: `0 0 6px ${statusColor}` }}
              />
              <span style={{ fontSize: 12, color: statusColor, fontWeight: 500 }}>
                {driftStatus === 'red' ? 'Needs attention' : driftStatus === 'amber' ? 'Drifting' : 'Stable'}
              </span>
            </div>

            {/* Clear conversation button */}
            {messages.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => setShowClearConfirm(true)}
                style={{
                  padding: '8px 14px', borderRadius: 12, cursor: 'pointer',
                  background: 'rgba(224,92,92,0.06)', border: '1px solid rgba(224,92,92,0.2)',
                  color: '#E05C5C', fontSize: 12, fontWeight: 500,
                }}
              >
                Clear chat
              </motion.button>
            )}
          </div>
        </div>

        {/* Clear Confirm Dialog */}
        <AnimatePresence>
          {showClearConfirm && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{
                position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)',
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                style={{
                  padding: '32px', borderRadius: 24, maxWidth: 400, width: '90%',
                  background: '#0F1520', border: '1px solid rgba(224,92,92,0.3)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 16 }}>🗑️</div>
                <h3 style={{ fontSize: 20, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', marginBottom: 8 }}>
                  Clear conversation?
                </h3>
                <p style={{ fontSize: 13, color: '#5A6A7E', lineHeight: 1.6, marginBottom: 24 }}>
                  Aura will forget all your previous messages. Your check-in data will be unaffected.
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                  <motion.button
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => setShowClearConfirm(false)}
                    style={{
                      padding: '10px 24px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)',
                      background: 'transparent', color: '#5A6A7E', fontSize: 14, cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={handleClearConversation}
                    disabled={clearing}
                    style={{
                      padding: '10px 24px', borderRadius: 12, border: 'none',
                      background: 'linear-gradient(135deg, #E05C5C, #c04444)',
                      color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    {clearing ? 'Clearing...' : 'Yes, clear it'}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ flex: 1, padding: '32px', display: 'flex', flexDirection: 'column', maxWidth: 720, margin: '0 auto', width: '100%' }}>
          <AnimatePresence mode="wait">

            {/* LANDING — shown only when no history exists */}
            {!started ? (
              <motion.div key="landing"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', paddingBottom: 60 }}
              >
                <div style={{ position: 'relative', marginBottom: 40 }}>
                  <motion.div
                    animate={{ scale: [1, 1.12, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    style={{ position: 'absolute', inset: -20, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.15) 0%, transparent 70%)' }}
                  />
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    style={{
                      width: 120, height: 120, borderRadius: '50%',
                      border: '1px solid transparent',
                      borderTopColor: '#A78BFA', borderRightColor: '#5B9CF6',
                      position: 'absolute', inset: 0,
                    }}
                  />
                  <div style={{
                    width: 120, height: 120, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(167,139,250,0.2) 0%, rgba(167,139,250,0.05) 70%)',
                    border: '1px solid rgba(167,139,250,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 48, boxShadow: '0 0 60px rgba(167,139,250,0.15)',
                  }}>
                    ✦
                  </div>
                </div>

                <h2 style={{ fontSize: 36, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', marginBottom: 12, fontWeight: 600 }}>
                  Hi, I'm Aura
                </h2>
                <p style={{ fontSize: 15, color: '#5A6A7E', lineHeight: 1.8, marginBottom: 12, maxWidth: 440 }}>
                  Your personal wellbeing companion. I know your patterns, your baseline, and how you've been feeling lately.
                </p>
                <p style={{ fontSize: 13, color: '#3A4A5E', lineHeight: 1.7, marginBottom: 40, maxWidth: 400 }}>
                  I'm not a therapist — I'm here to listen, reflect, and gently check in.
                </p>

                {checkins.length > 0 && (
                  <div style={{ display: 'flex', gap: 12, marginBottom: 40, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {[
                      { label: 'Last sleep', value: `${checkins[checkins.length - 1]?.sleep}/10`, color: '#5B9CF6' },
                      { label: 'Last social', value: `${checkins[checkins.length - 1]?.socialEnergy}/10`, color: '#4FC3A1' },
                      { label: 'Last mood', value: checkins[checkins.length - 1]?.emotion || '—', color: '#A78BFA' },
                    ].map((item) => (
                      <div key={item.label} style={{ padding: '10px 18px', borderRadius: 20, background: `${item.color}08`, border: `1px solid ${item.color}20` }}>
                        <span style={{ fontSize: 11, color: '#3A4A5E' }}>{item.label}: </span>
                        <span style={{ fontSize: 12, color: item.color, fontWeight: 600 }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={startConversation}
                  style={{
                    padding: '16px 40px', borderRadius: 20, border: 'none',
                    background: 'linear-gradient(135deg, #A78BFA, #8B5CF6)',
                    color: '#fff', fontSize: 15, fontWeight: 600,
                    cursor: 'pointer', boxShadow: '0 8px 32px rgba(167,139,250,0.3)',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  Start talking with Aura →
                </motion.button>
                <p style={{ fontSize: 11, color: '#2A3547', marginTop: 16 }}>
                  Aura remembers your conversations · Check-in history is always included
                </p>
              </motion.div>
            ) : (

              /* CHAT */
              <motion.div key="chat"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
              >
                <div style={{
                  flex: 1, overflowY: 'auto', padding: '8px 0',
                  display: 'flex', flexDirection: 'column', gap: 16,
                  minHeight: 400, maxHeight: 520,
                }}>
                  {messages.map((msg, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 12, alignItems: 'flex-end' }}
                    >
                      {msg.role === 'assistant' && (
                        <motion.div
                          animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }}
                          style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(167,139,250,0.3) 0%, rgba(167,139,250,0.1) 70%)',
                            border: '1px solid rgba(167,139,250,0.4)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 14, flexShrink: 0, boxShadow: '0 0 12px rgba(167,139,250,0.2)',
                          }}
                        >
                          ✦
                        </motion.div>
                      )}
                      <div style={{
                        maxWidth: '72%', padding: '14px 18px',
                        borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                        background: msg.role === 'user'
                          ? 'linear-gradient(135deg, rgba(91,156,246,0.2), rgba(91,156,246,0.1))'
                          : 'rgba(167,139,250,0.08)',
                        border: msg.role === 'user'
                          ? '1px solid rgba(91,156,246,0.25)'
                          : '1px solid rgba(167,139,250,0.2)',
                      }}>
                        <p style={{
                          fontSize: 14, lineHeight: 1.7, margin: 0,
                          color: msg.role === 'user' ? '#C8D4E0' : '#E8EEF5',
                          fontFamily: msg.role === 'assistant' ? 'Playfair Display, serif' : 'Inter, sans-serif',
                        }}>
                          {msg.content}
                        </p>
                      </div>
                      {msg.role === 'user' && (
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: 'linear-gradient(135deg, rgba(91,156,246,0.2), rgba(79,195,161,0.2))',
                          border: '1px solid rgba(91,156,246,0.3)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 600, color: '#5B9CF6', flexShrink: 0,
                        }}>
                          {userName[0]?.toUpperCase()}
                        </div>
                      )}
                    </motion.div>
                  ))}

                  {thinking && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}
                    >
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(167,139,250,0.3) 0%, rgba(167,139,250,0.1) 70%)',
                        border: '1px solid rgba(167,139,250,0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, flexShrink: 0,
                      }}>
                        ✦
                      </div>
                      <div style={{
                        padding: '14px 20px', borderRadius: '20px 20px 20px 4px',
                        background: 'rgba(167,139,250,0.08)',
                        border: '1px solid rgba(167,139,250,0.2)',
                        display: 'flex', gap: 6, alignItems: 'center',
                      }}>
                        {[0, 1, 2].map((i) => (
                          <motion.div key={i}
                            animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                            style={{ width: 6, height: 6, borderRadius: '50%', background: '#A78BFA' }}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div style={{ paddingTop: 20 }}>
                  <div style={{
                    display: 'flex', gap: 12, alignItems: 'center',
                    padding: '12px 16px', borderRadius: 20,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(167,139,250,0.15)',
                  }}>
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                      placeholder="Talk to Aura..."
                      disabled={thinking}
                      style={{
                        flex: 1, background: 'none', border: 'none',
                        color: '#E8EEF5', fontSize: 14, outline: 'none',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    />
                    <motion.button
                      whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                      onClick={handleSend}
                      disabled={!input.trim() || thinking}
                      style={{
                        width: 36, height: 36, borderRadius: '50%', border: 'none',
                        background: input.trim() && !thinking
                          ? 'linear-gradient(135deg, #A78BFA, #8B5CF6)'
                          : 'rgba(255,255,255,0.05)',
                        cursor: input.trim() && !thinking ? 'pointer' : 'not-allowed',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, color: '#fff', flexShrink: 0,
                        boxShadow: input.trim() && !thinking ? '0 4px 16px rgba(167,139,250,0.3)' : 'none',
                      }}
                    >
                      →
                    </motion.button>
                  </div>
                  <p style={{ fontSize: 11, color: '#2A3547', textAlign: 'center', marginTop: 12, lineHeight: 1.6 }}>
                    Aura is an AI companion — not a therapist. If you're in crisis, please reach out to a counselor.
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