'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { useUser } from '@/lib/UserContext'

// ── DATA ────────────────────────────────────────────────────────────────
const BITES = [
  { id: 'b1', type: 'Neuroscience', icon: '🧠', title: 'The 90-Second Rule', content: 'When you react to something, there is a 90-second chemical process that happens in your body. After that, any remaining emotional response is just your brain choosing to stay in that emotional loop. You can choose to step out.', source: 'Dr. Jill Bolte Taylor', color: '#A78BFA' },
  { id: 'b2', type: 'CBT Principle', icon: '💡', title: 'Action Precedes Motivation', content: 'We often wait to feel motivated before we start studying. In reality, action creates momentum, which then creates motivation. Do just 2 minutes of a task, and the motivation will often follow naturally.', source: 'Cognitive Behavioral Therapy', color: '#E05C5C' },
  { id: 'b3', type: 'Sleep Science', icon: '🌙', title: 'The Emotional Buffer', content: 'One bad night of sleep makes the amygdala 60% more reactive to negative stimuli. If everything feels overwhelming today, you might not be failing — you might just be tired.', source: 'Matthew Walker, PhD', color: '#5B9CF6' },
]

// Default stories shown while loading or if empty
const FALLBACK_STORIES = [
  { id: 'f1', text: "I failed 2 classes my first semester and thought my life was over. I was too ashamed to tell my parents. Three years later, I'm graduating with a great job offer. It gets better, I promise.", author: "Anonymous Senior", likes: 432, comments: 45, reposts: 12, color: '#E05C5C', hasLiked: false },
  { id: 'f2', text: "Everyone on campus seems to have solid friend groups except me. I usually eat lunch in the library so no one sees me sitting alone. Just wanted to put this out there so if anyone else feels lonely, you aren't the only one.", author: "Anonymous Freshman", likes: 892, comments: 120, reposts: 34, color: '#5B9CF6', hasLiked: false },
]

const COLORS = ['#E05C5C', '#5B9CF6', '#E8A04A', '#4FC3A1', '#A78BFA']

const variants = {
  enter: (d: number) => ({ opacity: 0, y: d > 0 ? 100 : -100, scale: 0.9, rotateX: d > 0 ? 10 : -10 }),
  center: { opacity: 1, y: 0, scale: 1, rotateX: 0 },
  exit: (d: number) => ({ opacity: 0, y: d < 0 ? 100 : -100, scale: 0.9, rotateX: d < 0 ? 10 : -10 })
}

const swipeConfidenceThreshold = 10000
const swipePower = (offset: number, velocity: number) => Math.abs(offset) * velocity

export default function LearnAndStories() {
  const router = useRouter()
  const { user, userData, loading } = useUser()
  const userName = userData?.name || user?.displayName || user?.email?.split('@')[0] || 'Student'

  const [activeTab, setActiveTab] = useState<'learning' | 'stories'>('learning')
  
  // Swipe State
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(0)

  // Stories State
  const [stories, setStories] = useState<any[]>([])
  const [isFetching, setIsFetching] = useState(true)
  const [isComposeOpen, setIsComposeOpen] = useState(false)
  const [newStoryText, setNewStoryText] = useState('')
  const [newStoryAuthor, setNewStoryAuthor] = useState('Anonymous')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Comment modal
  const [activeComment, setActiveComment] = useState<string | null>(null)
  const [commentsList, setCommentsList] = useState<any[]>([])
  const [commentInput, setCommentInput] = useState('')
  const [isSendingComment, setIsSendingComment] = useState(false)
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const commentsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!loading && !user) router.push('/onboarding')
  }, [user, loading, router])

  // Fetch stories on mount
  useEffect(() => {
    if (!user) return
    const fetchStories = async () => {
      try {
        const res = await fetch('/api/confessions')
        if (res.ok) {
          const data = await res.json()
          setStories(data.length > 0 ? data : FALLBACK_STORIES)
        } else {
          setStories(FALLBACK_STORIES)
        }
      } catch (e) {
        console.error('Failed to fetch stories', e)
        setStories(FALLBACK_STORIES)
      } finally {
        setIsFetching(false)
      }
    }
    fetchStories()
  }, [user])

  // Reset index when switching tabs
  useEffect(() => {
    setIndex(0)
    setDirection(0)
  }, [activeTab])

  // Keyboard navigation
  useEffect(() => {
    if (isComposeOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); paginate(1) }
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); paginate(-1) }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [index, activeTab, isComposeOpen, stories.length])

  const currentList = activeTab === 'learning' ? BITES : stories
  const currentCard = currentList[index]

  const paginate = (newDirection: number) => {
    if (index + newDirection < 0 || index + newDirection >= currentList.length) return
    setDirection(newDirection)
    setIndex(index + newDirection)
  }

  const handlePostStory = async () => {
    if (!newStoryText.trim() || !user) return
    setIsSubmitting(true)
    
    const color = COLORS[Math.floor(Math.random() * COLORS.length)]
    
    try {
      const res = await fetch('/api/confessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: newStoryText,
          author: newStoryAuthor || 'Anonymous',
          color
        })
      })
      
      if (res.ok) {
        const newStory = await res.json()
        setStories([newStory, ...stories])
        setNewStoryText('')
        setNewStoryAuthor('Anonymous')
        setIsComposeOpen(false)
        setIndex(0)
        setActiveTab('stories')
      }
    } catch (e) {
      console.error('Error posting story', e)
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleLike = async (id: string) => {
    // Optimistic update
    setStories(stories.map(s => {
      if (s.id === id) {
        return { ...s, likes: s.hasLiked ? s.likes - 1 : s.likes + 1, hasLiked: !s.hasLiked }
      }
      return s
    }))

    try {
      await fetch('/api/confessions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'like' })
      })
    } catch (e) {
      console.error('Error toggling like', e)
      // Revert on failure could be implemented here
    }
  }

  const handleRepost = async (id: string) => {
    const story = stories.find(s => s.id === id)
    if (!story) return
    const willRepost = !story.hasReposted
    // Optimistic update
    setStories(stories.map(s =>
      s.id === id
        ? { ...s, reposts: willRepost ? s.reposts + 1 : s.reposts - 1, hasReposted: willRepost }
        : s
    ))
    try {
      await fetch('/api/confessions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'repost' })
      })
    } catch (e) {
      console.error('Error reposting', e)
      // Revert on failure
      setStories(stories.map(s =>
        s.id === id
          ? { ...s, reposts: story.reposts, hasReposted: story.hasReposted }
          : s
      ))
    }
  }

  const openComments = async (id: string) => {
    setActiveComment(id)
    setCommentInput('')
    setIsLoadingComments(true)
    try {
      const res = await fetch('/api/confessions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'getComments' })
      })
      const data = await res.json()
      setCommentsList(data.comments || [])
    } catch (e) {
      console.error('Error loading comments', e)
    } finally {
      setIsLoadingComments(false)
    }
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
        body: JSON.stringify({
          confessionId: activeComment,
          commentText: text,
          author: userData?.name || 'Anonymous'
        })
      })
      if (res.ok) {
        // Update comment count on the story
        setStories(prev => prev.map(s =>
          s.id === activeComment ? { ...s, comments: s.comments + 1 } : s
        ))
      }
    } catch (e) {
      console.error('Error posting comment', e)
    } finally {
      setIsSendingComment(false)
    }
  }

  if (loading || isFetching || !currentCard) return null

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#080C12', overflow: 'hidden', fontFamily: 'Inter, sans-serif' }}>
      <Sidebar userName={userName} userData={userData} />

      <main style={{ flex: 1, marginLeft: 220, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        
        {/* Dynamic Background Glow */}
        <AnimatePresence mode="popLayout">
          <motion.div key={`bg-${currentCard.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }}
            style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', top: '10%', left: '20%', width: '60vw', height: '80vh', background: `radial-gradient(ellipse, ${currentCard.color}08 0%, transparent 70%)`, filter: 'blur(80px)' }} />
          </motion.div>
        </AnimatePresence>

        {/* Top Header & Tabs - Moved to top to prevent overlap */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '32px 40px', zIndex: 50, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'linear-gradient(to bottom, rgba(8,12,18,0.9) 0%, transparent 100%)' }}>
          <div>
            <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#5A6A7E', marginBottom: 8, fontWeight: 600 }}>Mindful Scrolling</p>
            <div style={{ display: 'flex', gap: 12, background: 'rgba(255,255,255,0.03)', padding: 6, borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
              <button onClick={() => setActiveTab('learning')} style={{ padding: '8px 24px', borderRadius: 12, border: 'none', background: activeTab === 'learning' ? 'rgba(255,255,255,0.1)' : 'transparent', color: activeTab === 'learning' ? '#E8EEF5' : '#5A6A7E', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s' }}>
                Wisdom Bites
              </button>
              <button onClick={() => setActiveTab('stories')} style={{ padding: '8px 24px', borderRadius: 12, border: 'none', background: activeTab === 'stories' ? 'rgba(255,255,255,0.1)' : 'transparent', color: activeTab === 'stories' ? '#E8EEF5' : '#5A6A7E', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s' }}>
                Campus Confessions
              </button>
            </div>
          </div>

          {activeTab === 'stories' && (
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsComposeOpen(true)}
              style={{ marginTop: 24, padding: '12px 24px', borderRadius: 16, background: 'linear-gradient(135deg, #4FC3A1, #3DA88B)', color: '#080C12', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 4px 24px rgba(79,195,161,0.3)' }}>
              + Share Confession
            </motion.button>
          )}
        </div>

        {/* Progress Dots */}
        <div style={{ position: 'absolute', right: 40, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 12, zIndex: 10 }}>
          {currentList.map((_, i) => (
            <motion.div key={i} animate={{ height: i === index ? 24 : 8, backgroundColor: i === index ? currentCard.color : 'rgba(255,255,255,0.1)' }} transition={{ duration: 0.3 }}
              style={{ width: 4, borderRadius: 2, cursor: 'pointer' }}
              onClick={() => { setDirection(i > index ? 1 : -1); setIndex(i) }}
            />
          ))}
        </div>

        {/* Card Stack Area - Moved down slightly to avoid tabs */}
        <div style={{ position: 'relative', width: '100%', maxWidth: 520, height: 560, marginTop: 40, perspective: 1000, zIndex: 1 }}>
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={index} custom={direction}
              variants={variants}
              initial="enter" animate="center" exit="exit"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={0.2}
              onDragEnd={(e, { offset, velocity }) => {
                const swipe = swipePower(offset.y, velocity.y)
                if (swipe < -swipeConfidenceThreshold) paginate(1)
                else if (swipe > swipeConfidenceThreshold) paginate(-1)
              }}
              style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: 32, background: `linear-gradient(145deg, rgba(255,255,255,0.03), rgba(0,0,0,0.4))`, border: `1px solid rgba(255,255,255,0.08)`, backdropFilter: 'blur(20px)', boxShadow: `0 32px 64px -16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)`, display: 'flex', flexDirection: 'column', padding: '40px', cursor: 'grab' }}
              whileTap={{ cursor: 'grabbing' }}
            >
              
              {/* LEARNING CARD CONTENT */}
              {activeTab === 'learning' && (
                <>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}
                      style={{ width: 64, height: 64, borderRadius: 20, background: `${currentCard.color}15`, border: `1px solid ${currentCard.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, marginBottom: 24, boxShadow: `0 0 32px ${currentCard.color}20` }}>
                      {currentCard.icon}
                    </motion.div>
                    
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
                      <p style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: currentCard.color, fontWeight: 700, marginBottom: 12 }}>{currentCard.type}</p>
                      <h2 style={{ fontSize: 36, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', lineHeight: 1.1, marginBottom: 20 }}>{currentCard.title}</h2>
                      <p style={{ fontSize: 16, color: '#A0ABC0', lineHeight: 1.6, fontWeight: 400 }}>"{currentCard.content}"</p>
                    </motion.div>
                  </div>

                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🔬</div>
                      <div>
                        <p style={{ fontSize: 10, color: '#5A6A7E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Source / Insight via</p>
                        <p style={{ fontSize: 13, color: '#E8EEF5', fontWeight: 600 }}>{currentCard.source}</p>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}

              {/* STORIES CARD CONTENT */}
              {activeTab === 'stories' && (
                <>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 24, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>👤</div>
                        <div>
                          <p style={{ fontSize: 14, color: '#E8EEF5', fontWeight: 600 }}>{currentCard.author}</p>
                          <p style={{ fontSize: 11, color: '#5A6A7E' }}>Campus Confessions</p>
                        </div>
                      </div>
                      <p style={{ fontSize: 22, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', lineHeight: 1.5, fontWeight: 400 }}>
                        "{currentCard.text}"
                      </p>
                    </motion.div>
                  </div>

                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 24 }}>
                      <button onClick={(e) => { e.stopPropagation(); toggleLike(currentCard.id) }} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: currentCard.hasLiked ? '#E05C5C' : '#A0ABC0', transition: 'color 0.2s' }}>
                        <motion.span animate={{ scale: currentCard.hasLiked ? [1, 1.3, 1] : 1 }} style={{ fontSize: 20 }}>{currentCard.hasLiked ? '❤️' : '🤍'}</motion.span>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{currentCard.likes}</span>
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); openComments(currentCard.id) }} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#A0ABC0' }}>
                        <span style={{ fontSize: 20 }}>💬</span>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{currentCard.comments}</span>
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleRepost(currentCard.id) }} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: currentCard.hasReposted ? '#4FC3A1' : '#A0ABC0', transition: 'color 0.2s' }}>
                        <motion.span animate={{ rotate: currentCard.hasReposted ? 180 : 0 }} style={{ fontSize: 20, display: 'inline-block' }}>🔁</motion.span>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{currentCard.reposts}</span>
                      </button>
                    </div>
                  </motion.div>
                </>
              )}

            </motion.div>
          </AnimatePresence>

          {/* Swipe Instructions overlay */}
          <div style={{ position: 'absolute', bottom: -50, left: 0, right: 0, textAlign: 'center', opacity: 0.5, pointerEvents: 'none' }}>
            <p style={{ fontSize: 12, color: '#5A6A7E', letterSpacing: '0.1em' }}>↓ SWIPE OR USE ARROWS ↑</p>
          </div>
        </div>

      </main>

      {/* Compose Story Modal */}
      <AnimatePresence>
        {isComposeOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(8,12,18,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              style={{ width: '100%', maxWidth: 600, background: '#111824', borderRadius: 24, padding: 32, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 32px 64px rgba(0,0,0,0.5)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 24, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', margin: 0 }}>Share a Confession</h2>
                <button onClick={() => setIsComposeOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#A0ABC0', width: 32, height: 32, borderRadius: 16, cursor: 'pointer' }}>✕</button>
              </div>

              <div style={{ padding: '16px', background: 'rgba(79,195,161,0.1)', borderRadius: 12, marginBottom: 20, border: '1px solid rgba(79,195,161,0.2)' }}>
                <p style={{ fontSize: 13, color: '#4FC3A1', margin: 0, lineHeight: 1.5 }}>🔒 <strong>Fully Anonymous by Default.</strong> Your real identity is never attached. You can optionally set a custom display name below.</p>
              </div>

              {/* Author Input */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#5A6A7E', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Display Name</label>
                <input 
                  type="text" 
                  value={newStoryAuthor} 
                  onChange={e => setNewStoryAuthor(e.target.value)}
                  placeholder="Anonymous Student"
                  style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#E8EEF5', fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none' }}
                />
              </div>

              {/* Confession Text Area */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#5A6A7E', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Confession</label>
                <textarea 
                  value={newStoryText} onChange={e => setNewStoryText(e.target.value)}
                  placeholder="What's on your mind?..."
                  style={{ width: '100%', height: 140, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, color: '#E8EEF5', fontSize: 15, fontFamily: 'Inter, sans-serif', resize: 'none', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button onClick={() => setIsComposeOpen(false)} style={{ padding: '12px 24px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#A0ABC0', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handlePostStory} disabled={!newStoryText.trim() || isSubmitting} style={{ padding: '12px 32px', borderRadius: 12, border: 'none', background: newStoryText.trim() ? '#4FC3A1' : 'rgba(255,255,255,0.05)', color: newStoryText.trim() ? '#080C12' : '#5A6A7E', fontSize: 14, fontWeight: 600, cursor: newStoryText.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.3s' }}>
                  {isSubmitting ? 'Posting...' : 'Post Story'}
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comment Modal */}
      <AnimatePresence>
        {activeComment && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setActiveComment(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(8,12,18,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              style={{ width: '100%', maxWidth: 600, background: '#111824', borderRadius: '24px 24px 0 0', padding: '24px 24px 32px', border: '1px solid rgba(255,255,255,0.08)', maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: 18, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', margin: 0 }}>Comments</h3>
                <button onClick={() => setActiveComment(null)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#A0ABC0', width: 30, height: 30, borderRadius: 15, cursor: 'pointer', fontSize: 14 }}>✕</button>
              </div>

              {/* Comment list */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                {isLoadingComments ? (
                  <div style={{ textAlign: 'center', color: '#5A6A7E', fontSize: 13, padding: 24 }}>Loading comments…</div>
                ) : commentsList.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#5A6A7E', fontSize: 13, padding: 24 }}>No comments yet. Be the first! 💬</div>
                ) : (
                  commentsList.map((c, i) => (
                    <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <p style={{ fontSize: 12, color: '#5B9CF6', fontWeight: 600, marginBottom: 4 }}>{c.author}</p>
                      <p style={{ fontSize: 14, color: '#C8D4E0', lineHeight: 1.5, margin: 0 }}>{c.text}</p>
                    </motion.div>
                  ))
                )}
                <div ref={commentsEndRef} />
              </div>

              {/* Comment input */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '12px 14px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <input
                  value={commentInput}
                  onChange={e => setCommentInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendComment()}
                  placeholder="Write a comment…"
                  style={{ flex: 1, background: 'none', border: 'none', color: '#E8EEF5', fontSize: 14, outline: 'none', fontFamily: 'Inter, sans-serif' }}
                />
                <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                  onClick={handleSendComment}
                  disabled={!commentInput.trim() || isSendingComment}
                  style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: commentInput.trim() ? 'linear-gradient(135deg, #4FC3A1, #3DA88B)' : 'rgba(255,255,255,0.05)', color: '#080C12', cursor: commentInput.trim() ? 'pointer' : 'not-allowed', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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