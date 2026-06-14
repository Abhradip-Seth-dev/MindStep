'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { useUser } from '@/lib/UserContext'
import BottomNav from '@/components/BottomNav'
import { useIsMobile } from '@/lib/hooks'

// ── WISDOM BITES DATA ────────────────────────────────────────────────────────
const WISDOM_BITES = [
  {
    id: 'w1',
    type: 'Neuroscience',
    icon: '🧠',
    title: 'The 90-Second Rule',
    content: 'When you react to something, there is a 90-second chemical process that happens in your body. After that, any remaining emotional response is just your brain choosing to stay in that loop. You can choose to step out.',
    source: 'Dr. Jill Bolte Taylor',
    color: '#A78BFA',
    articleId: null,
  },
  {
    id: 'w2',
    type: 'CBT Principle',
    icon: '💡',
    title: 'Action Precedes Motivation',
    content: 'We often wait to feel motivated before we start. In reality, action creates momentum, which then creates motivation. Do just 2 minutes of a task, and the motivation will often follow naturally.',
    source: 'Cognitive Behavioral Therapy',
    color: '#E05C5C',
    articleId: '6',
  },
  {
    id: 'w3',
    type: 'Sleep Science',
    icon: '🌙',
    title: 'The Emotional Buffer',
    content: 'One bad night of sleep makes the amygdala 60% more reactive to negative stimuli. If everything feels overwhelming today, you might not be failing — you might just be tired.',
    source: 'Matthew Walker, PhD',
    color: '#5B9CF6',
    articleId: '2',
  },
  {
    id: 'w4',
    type: 'Social Psychology',
    icon: '🤝',
    title: 'Connection is Biological',
    content: 'Loneliness activates the same neural pathways as physical pain. Your brain treats social disconnection as a threat to survival — which, for most of our evolutionary history, it was.',
    source: 'John Cacioppo, U of Chicago',
    color: '#4FC3A1',
    articleId: '3',
  },
  {
    id: 'w5',
    type: 'Stress Science',
    icon: '📚',
    title: 'Stress Shrinks the Brain',
    content: 'Sustained high cortisol physically shrinks the hippocampus — the brain region responsible for memory and learning. The more academically stressed you become, the less capable your brain is of performing the tasks causing the stress.',
    source: 'Harvard Medical School',
    color: '#E8A04A',
    articleId: '4',
  },
  {
    id: 'w6',
    type: 'Psychology',
    icon: '📊',
    title: 'Baseline vs. Bad Week',
    content: 'A score of 5/10 on sleep might be normal for one person and a significant deviation for another. Generic wellness apps compare you to population averages. MindStep compares you to yourself.',
    source: 'Personalised Wellness Research',
    color: '#4FC3A1',
    articleId: '5',
  },
]

const FALLBACK_CONFESSIONS = [
  { id: 'f1', text: "I failed 2 classes my first semester and thought my life was over. I was too ashamed to tell my parents. Three years later, I'm graduating with a great job offer. It gets better, I promise.", author: 'Anonymous Senior', likes: 432, comments: 45, color: '#E05C5C', hasLiked: false, hasReposted: false, reposts: 12, reports: 0 },
  { id: 'f2', text: "Everyone on campus seems to have solid friend groups except me. I usually eat lunch in the library so no one sees me sitting alone. Just wanted to put this out there so if anyone else feels lonely, you aren't the only one.", author: 'Anonymous Freshman', likes: 892, comments: 120, color: '#5B9CF6', hasLiked: false, hasReposted: false, reposts: 34, reports: 0 },
  { id: 'f3', text: "I've been pretending to understand lectures for two whole months. The embarrassment of asking a question felt worse than not knowing. Finally asked last week and the professor said it was a great question. Just ask.", author: 'Anonymous Student', likes: 287, comments: 33, color: '#A78BFA', hasLiked: false, hasReposted: false, reposts: 18, reports: 0 },
]

const COLORS = ['#E05C5C', '#5B9CF6', '#E8A04A', '#4FC3A1', '#A78BFA']

type Tab = 'wisdom' | 'confessions'

export default function CommunityPage() {
  const router = useRouter()
  const { user, userData, loading } = useUser()
  const userName = userData?.name || user?.displayName || user?.email?.split('@')[0] || 'Student'

  const [activeTab, setActiveTab] = useState<Tab>('wisdom')

  // Confessions state
  const [confessions, setConfessions] = useState<any[]>([])
  const [isFetching, setIsFetching] = useState(true)
  const [isComposeOpen, setIsComposeOpen] = useState(false)
  const [newText, setNewText] = useState('')
  const [newAuthor, setNewAuthor] = useState('Anonymous')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set())

  // Comment modal state
  const [activeComment, setActiveComment] = useState<string | null>(null)
  const [commentsList, setCommentsList] = useState<any[]>([])
  const [commentInput, setCommentInput] = useState('')
  const [isSendingComment, setIsSendingComment] = useState(false)
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const commentsEndRef = useRef<HTMLDivElement>(null)

  // Expanded wisdom bite
  const [expandedBite, setExpandedBite] = useState<string | null>(null)
  const isMobile = useIsMobile()

  useEffect(() => {
    if (!loading && !user) router.push('/onboarding')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    const fetchConfessions = async () => {
      try {
        const res = await fetch('/api/confessions')
        if (res.ok) {
          const data = await res.json()
          setConfessions(data.length > 0 ? data : FALLBACK_CONFESSIONS)
        } else {
          setConfessions(FALLBACK_CONFESSIONS)
        }
      } catch {
        setConfessions(FALLBACK_CONFESSIONS)
      } finally {
        setIsFetching(false)
      }
    }
    fetchConfessions()
  }, [user])

  const handlePostConfession = async () => {
    if (!newText.trim() || !user) return
    setIsSubmitting(true)
    const color = COLORS[Math.floor(Math.random() * COLORS.length)]
    try {
      const res = await fetch('/api/confessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newText, author: newAuthor || 'Anonymous', color }),
      })
      if (res.ok) {
        const newConfession = await res.json()
        setConfessions(prev => [newConfession, ...prev])
        setNewText('')
        setNewAuthor('Anonymous')
        setIsComposeOpen(false)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleLike = async (id: string) => {
    setConfessions(prev => prev.map(s =>
      s.id === id ? { ...s, likes: s.hasLiked ? s.likes - 1 : s.likes + 1, hasLiked: !s.hasLiked } : s
    ))
    try {
      await fetch('/api/confessions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'like' }),
      })
    } catch (e) { console.error(e) }
  }

  const handleReport = async (id: string) => {
    if (reportedIds.has(id)) return
    setReportedIds(prev => new Set([...prev, id]))
    try {
      await fetch('/api/confessions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'report' }),
      })
    } catch (e) { console.error(e) }
  }

  const openComments = async (id: string) => {
    setActiveComment(id)
    setCommentInput('')
    setIsLoadingComments(true)
    try {
      const res = await fetch('/api/confessions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'getComments' }),
      })
      const data = await res.json()
      setCommentsList(data.comments || [])
    } catch (e) { console.error(e) }
    finally { setIsLoadingComments(false) }
  }

  const handleSendComment = async () => {
    if (!commentInput.trim() || !activeComment || isSendingComment) return
    setIsSendingComment(true)
    const text = commentInput.trim()
    setCommentInput('')
    const optimistic = { id: `tmp-${Date.now()}`, text, author: userData?.name || 'Anonymous', createdAt: null }
    setCommentsList(prev => [...prev, optimistic])
    setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    try {
      const res = await fetch('/api/confessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confessionId: activeComment, commentText: text, author: userData?.name || 'Anonymous' }),
      })
      if (res.ok) {
        setConfessions(prev => prev.map(s => s.id === activeComment ? { ...s, comments: s.comments + 1 } : s))
      }
    } catch (e) { console.error(e) }
    finally { setIsSendingComment(false) }
  }

  if (loading || !user) return null

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080C12', fontFamily: 'Inter, sans-serif' }}>
      <Sidebar userName={userName} userData={userData} />
      
      {/* Ambient background */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '5%', right: '10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.04) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '15%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,195,161,0.03) 0%, transparent 70%)' }} />
      </div>
      {isMobile && <BottomNav userName={userName} />}

      <main style={{ flex: 1, marginLeft: isMobile ? 0 : '220px', minHeight: '100vh', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', paddingBottom: isMobile ? 80 : 0 }}>

        {/* Header */}
        <div style={{ position: 'sticky', top: 0, zIndex: 40, padding: isMobile ? '14px 16px' : '20px 40px', background: 'rgba(8,12,18,0.92)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', gap: isMobile ? 16 : 0 }}>
            <div>
              <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#3A4A5E', marginBottom: 4 }}>TNU · Mindstep</p>
              <h1 style={{ fontSize: 26, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', fontWeight: 600, margin: 0 }}>Community</h1>
            </div>

            {/* Tab Switcher */}
            <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.03)', padding: 5, borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', width: isMobile ? '100%' : 'auto', overflowX: 'auto' }}>
              {([
                { key: 'wisdom', label: '✨ Wisdom', color: '#A78BFA' },
                { key: 'confessions', label: '💬 Confessions', color: '#4FC3A1' },
              ] as const).map(tab => (
                <motion.button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    padding: '8px 22px', borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: activeTab === tab.key ? 'rgba(255,255,255,0.09)' : 'transparent',
                    color: activeTab === tab.key ? '#E8EEF5' : '#4A5A6E',
                    fontSize: 13, fontWeight: 600, transition: 'all 0.25s',
                    fontFamily: 'Inter, sans-serif',
                    boxShadow: activeTab === tab.key ? `0 0 20px ${tab.color}15` : 'none',
                    flex: isMobile ? 1 : 'none', whiteSpace: 'nowrap',
                  }}
                >
                  {tab.label}
                </motion.button>
              ))}
            </div>

            {activeTab === 'confessions' && (
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setIsComposeOpen(true)}
                style={{ padding: '10px 22px', borderRadius: 14, background: 'linear-gradient(135deg, #4FC3A1, #3DA88B)', color: '#080C12', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(79,195,161,0.25)', letterSpacing: '0.02em', width: isMobile ? '100%' : 'auto' }}
              >
                + Share
              </motion.button>
            )}

            {activeTab === 'wisdom' && !isMobile && <div style={{ width: 100 }} />}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: isMobile ? '20px 16px 60px' : '32px 40px 60px' }}>
          <AnimatePresence mode="wait">

            {/* ── WISDOM BITES TAB ── */}
            {activeTab === 'wisdom' && (
              <motion.div
                key="wisdom"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
              >
                <div style={{ marginBottom: 28 }}>
                  <p style={{ fontSize: 14, color: '#5A6A7E', lineHeight: 1.6, maxWidth: 560 }}>
                    Short, science-backed insights curated to shift your perspective. Tap any card to explore the full reading.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))', gap: isMobile ? 16 : 20 }}>
                  {WISDOM_BITES.map((bite, i) => (
                    <motion.div
                      key={bite.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                      whileHover={{ y: -4, boxShadow: `0 24px 48px -12px ${bite.color}20` }}
                      onClick={() => bite.articleId ? router.push(`/learn/${bite.articleId}`) : setExpandedBite(expandedBite === bite.id ? null : bite.id)}
                      style={{
                        padding: '28px', borderRadius: 20, cursor: 'pointer',
                        background: `linear-gradient(145deg, rgba(255,255,255,0.03), rgba(0,0,0,0.3))`,
                        border: `1px solid rgba(255,255,255,0.07)`,
                        backdropFilter: 'blur(12px)',
                        transition: 'box-shadow 0.3s',
                        position: 'relative', overflow: 'hidden',
                      }}
                    >
                      {/* Glow */}
                      <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: `radial-gradient(circle, ${bite.color}12 0%, transparent 70%)`, pointerEvents: 'none' }} />

                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 18 }}>
                        <div style={{ width: 52, height: 52, borderRadius: 16, background: `${bite.color}18`, border: `1px solid ${bite.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0, boxShadow: `0 0 20px ${bite.color}15` }}>
                          {bite.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: bite.color, fontWeight: 700, marginBottom: 5 }}>{bite.type}</p>
                          <h3 style={{ fontSize: 16, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', lineHeight: 1.3, margin: 0 }}>{bite.title}</h3>
                        </div>
                      </div>

                      <p style={{ fontSize: 13.5, color: '#7A8A9E', lineHeight: 1.75, marginBottom: 18 }}>
                        "{bite.content}"
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>🔬</div>
                          <span style={{ fontSize: 11, color: '#4A5A6E' }}>{bite.source}</span>
                        </div>
                        {bite.articleId && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 20, background: `${bite.color}12`, border: `1px solid ${bite.color}25` }}>
                            <span style={{ fontSize: 10, color: bite.color, fontWeight: 600 }}>Read more →</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Footer CTA */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  style={{ marginTop: 40, padding: isMobile ? '20px' : '24px 32px', borderRadius: 20, background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.12)', display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', gap: isMobile ? 16 : 0 }}
                >
                  <div>
                    <p style={{ fontSize: 13, color: '#A78BFA', fontWeight: 600, marginBottom: 4 }}>📚 Full Research Articles</p>
                    <p style={{ fontSize: 12, color: '#3A4A5E', lineHeight: 1.5 }}>Grounded in peer-reviewed science · Team Ignite</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['🧠', '🌙', '🤝', '📚', '📊', '💡'].map((icon, i) => (
                      <div key={i} style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{icon}</div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* ── CONFESSIONS TAB ── */}
            {activeTab === 'confessions' && (
              <motion.div
                key="confessions"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
              >
                <div style={{ marginBottom: 28, display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'flex-end', justifyContent: 'space-between', gap: isMobile ? 16 : 0 }}>
                  <p style={{ fontSize: 14, color: '#5A6A7E', lineHeight: 1.6, maxWidth: 500, margin: 0 }}>
                    Fully anonymous. Real stories from real TNU students. You're not alone in this.
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, background: 'rgba(79,195,161,0.06)', border: '1px solid rgba(79,195,161,0.12)', flexShrink: 0 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#4FC3A1', boxShadow: '0 0 6px #4FC3A1' }} />
                    <span style={{ fontSize: 11, color: '#4FC3A1', fontWeight: 600 }}>
                      {isFetching ? '...' : `${confessions.length} stories`}
                    </span>
                  </div>
                </div>

                {isFetching ? (
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
                    {[1, 2, 3].map(i => (
                      <div key={i} style={{ height: 200, borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', animation: 'pulse 1.5s infinite' }} />
                    ))}
                  </div>
                ) : (
                  <div style={{ columns: isMobile ? 1 : '340px', columnGap: 20 }}>
                    {confessions.map((confession, i) => (
                      <motion.div
                        key={confession.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        style={{ breakInside: 'avoid', marginBottom: 20 }}
                      >
                        <div
                          style={{
                            padding: '24px', borderRadius: 20,
                            background: `linear-gradient(145deg, rgba(255,255,255,0.03), rgba(0,0,0,0.35))`,
                            border: `1px solid rgba(255,255,255,0.07)`,
                            backdropFilter: 'blur(12px)',
                            position: 'relative', overflow: 'hidden',
                          }}
                        >
                          {/* Accent line */}
                          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderRadius: '3px 0 0 3px', background: `linear-gradient(to bottom, ${confession.color}, ${confession.color}40)` }} />

                          {/* Header */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${confession.color}18`, border: `1px solid ${confession.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>👤</div>
                              <div>
                                <p style={{ fontSize: 12, fontWeight: 600, color: '#C8D4E0', lineHeight: 1.2 }}>{confession.author}</p>
                                <p style={{ fontSize: 10, color: '#3A4A5E' }}>Campus Confessions</p>
                              </div>
                            </div>

                            {/* Report button */}
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleReport(confession.id)}
                              title={reportedIds.has(confession.id) ? 'Reported — thank you' : 'Flag this post'}
                              style={{
                                background: 'none', border: 'none', cursor: reportedIds.has(confession.id) ? 'default' : 'pointer',
                                padding: '4px', borderRadius: 8, color: reportedIds.has(confession.id) ? '#E8A04A' : '#2A3547',
                                fontSize: 13, transition: 'color 0.2s',
                              }}
                            >
                              {reportedIds.has(confession.id) ? '🚩' : '⚑'}
                            </motion.button>
                          </div>

                          {/* Text */}
                          <p style={{ fontSize: 14.5, fontFamily: 'Playfair Display, serif', color: '#D0DAE8', lineHeight: 1.75, marginBottom: 18, fontStyle: 'italic' }}>
                            "{confession.text}"
                          </p>

                          {/* Footer actions */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 14 }}>
                            {/* Like */}
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => toggleLike(confession.id)}
                              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 10, background: confession.hasLiked ? 'rgba(224,92,92,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${confession.hasLiked ? 'rgba(224,92,92,0.25)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', transition: 'all 0.2s' }}
                            >
                              <motion.span animate={{ scale: confession.hasLiked ? [1, 1.4, 1] : 1 }} style={{ fontSize: 15 }}>
                                {confession.hasLiked ? '❤️' : '🤍'}
                              </motion.span>
                              <span style={{ fontSize: 12, fontWeight: 600, color: confession.hasLiked ? '#E05C5C' : '#5A6A7E' }}>{confession.likes}</span>
                            </motion.button>

                            {/* Comment */}
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => openComments(confession.id)}
                              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', transition: 'all 0.2s' }}
                            >
                              <span style={{ fontSize: 15 }}>💬</span>
                              <span style={{ fontSize: 12, fontWeight: 600, color: '#5A6A7E' }}>{confession.comments}</span>
                            </motion.button>

                            {/* Repost */}
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={async () => {
                                const willRepost = !confession.hasReposted
                                setConfessions(prev => prev.map(s => s.id === confession.id ? { ...s, reposts: willRepost ? s.reposts + 1 : s.reposts - 1, hasReposted: willRepost } : s))
                                try {
                                  await fetch('/api/confessions', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: confession.id, action: 'repost' }) })
                                } catch (e) { console.error(e) }
                              }}
                              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 10, background: confession.hasReposted ? 'rgba(79,195,161,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${confession.hasReposted ? 'rgba(79,195,161,0.25)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', transition: 'all 0.2s' }}
                            >
                              <motion.span animate={{ rotate: confession.hasReposted ? 180 : 0 }} style={{ fontSize: 15, display: 'inline-block' }}>🔁</motion.span>
                              <span style={{ fontSize: 12, fontWeight: 600, color: confession.hasReposted ? '#4FC3A1' : '#5A6A7E' }}>{confession.reposts}</span>
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* ── COMPOSE MODAL ── */}
      <AnimatePresence>
        {isComposeOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsComposeOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(8,12,18,0.8)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          >
            <motion.div
              initial={{ scale: 0.94, y: 24 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 24 }}
              onClick={e => e.stopPropagation()}
              style={{ width: '100%', maxWidth: 560, background: '#0E1520', borderRadius: 24, padding: isMobile ? '24px 20px' : 32, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 40px 80px rgba(0,0,0,0.6)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                  <h2 style={{ fontSize: 22, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', margin: 0, marginBottom: 4 }}>Share a Confession</h2>
                  <p style={{ fontSize: 12, color: '#3A4A5E', margin: 0 }}>Anonymous by default. Seen by TNU students only.</p>
                </div>
                <button onClick={() => setIsComposeOpen(false)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#A0ABC0', width: 32, height: 32, borderRadius: 10, cursor: 'pointer', fontSize: 16 }}>✕</button>
              </div>

              <div style={{ padding: '12px 16px', background: 'rgba(79,195,161,0.08)', borderRadius: 12, marginBottom: 20, border: '1px solid rgba(79,195,161,0.18)' }}>
                <p style={{ fontSize: 12, color: '#4FC3A1', margin: 0, lineHeight: 1.6 }}>🔒 <strong>Your identity is never attached.</strong> Display name is optional and can be anything.</p>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, color: '#4A5A6E', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Display Name</label>
                <input
                  type="text"
                  value={newAuthor}
                  onChange={e => setNewAuthor(e.target.value)}
                  placeholder="Anonymous Student"
                  style={{ width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#E8EEF5', fontSize: 16, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 11, color: '#4A5A6E', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Your Confession</label>
                <textarea
                  value={newText}
                  onChange={e => setNewText(e.target.value)}
                  placeholder="What's on your mind?…"
                  maxLength={500}
                  style={{ width: '100%', height: 130, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 14px', color: '#E8EEF5', fontSize: 16, fontFamily: 'Inter, sans-serif', resize: 'none', outline: 'none', boxSizing: 'border-box', lineHeight: 1.7 }}
                />
                <p style={{ fontSize: 11, color: '#2A3547', textAlign: 'right', marginTop: 6 }}>{newText.length}/500</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button onClick={() => setIsComposeOpen(false)} style={{ padding: '10px 22px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#5A6A7E', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handlePostConfession}
                  disabled={!newText.trim() || isSubmitting}
                  style={{ padding: '10px 28px', borderRadius: 12, border: 'none', background: newText.trim() ? 'linear-gradient(135deg, #4FC3A1, #3DA88B)' : 'rgba(255,255,255,0.05)', color: newText.trim() ? '#080C12' : '#2A3547', fontSize: 13, fontWeight: 700, cursor: newText.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.25s' }}
                >
                  {isSubmitting ? 'Posting…' : 'Post Story'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── COMMENT DRAWER ── */}
      <AnimatePresence>
        {activeComment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveComment(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(8,12,18,0.65)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              onClick={e => e.stopPropagation()}
              style={{ width: '100%', maxWidth: 640, background: '#0E1520', borderRadius: '24px 24px 0 0', padding: '24px 24px 36px', border: '1px solid rgba(255,255,255,0.08)', maxHeight: '72vh', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: 18, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', margin: 0 }}>Comments</h3>
                <button onClick={() => setActiveComment(null)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#A0ABC0', width: 30, height: 30, borderRadius: 10, cursor: 'pointer', fontSize: 14 }}>✕</button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                {isLoadingComments ? (
                  <div style={{ textAlign: 'center', color: '#3A4A5E', fontSize: 13, padding: 32 }}>Loading comments…</div>
                ) : commentsList.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#3A4A5E', fontSize: 13, padding: 32 }}>No comments yet. Be the first to respond. 💬</div>
                ) : (
                  commentsList.map((c, idx) => (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <p style={{ fontSize: 11, color: '#5B9CF6', fontWeight: 600, marginBottom: 4 }}>{c.author}</p>
                      <p style={{ fontSize: 13.5, color: '#C8D4E0', lineHeight: 1.6, margin: 0 }}>{c.text}</p>
                    </motion.div>
                  ))
                )}
                <div ref={commentsEndRef} />
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '12px 14px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <input
                  value={commentInput}
                  onChange={e => setCommentInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendComment()}
                  placeholder="Write a supportive comment…"
                  style={{ flex: 1, background: 'none', border: 'none', color: '#E8EEF5', fontSize: 16, outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }}
                />
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={handleSendComment}
                  disabled={!commentInput.trim() || isSendingComment}
                  style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: commentInput.trim() ? 'linear-gradient(135deg, #4FC3A1, #3DA88B)' : 'rgba(255,255,255,0.05)', color: '#080C12', cursor: commentInput.trim() ? 'pointer' : 'not-allowed', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                >
                  →
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
