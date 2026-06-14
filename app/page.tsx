'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useIsMobile } from '@/lib/hooks'

const FLOATING_WORDS = ['Awareness', 'Patterns', 'Baseline', 'Clarity', 'Drift', 'Recovery', 'Wellbeing', 'Signal']

const FEATURES = [
  { icon: '📊', title: 'Personal baseline', desc: 'MindStep learns what normal looks like for you — not population averages. After 7 days, it knows your pattern.', color: '#4FC3A1', bg: 'rgba(79,195,161,0.06)' },
  { icon: '🗺️', title: 'Campus heatmap', desc: 'See how your university feels today. An anonymized live map of student wellbeing across every building.', color: '#5B9CF6', bg: 'rgba(91,156,246,0.06)' },
  { icon: '✦', title: 'Aura AI companion', desc: 'An AI that knows your actual data and talks to you about it. Not generic advice — personal reflection.', color: '#A78BFA', bg: 'rgba(167,139,250,0.06)' },
  { icon: '🤝', title: 'Peer support', desc: 'Connect anonymously with a fellow student who has been where you are and come through it.', color: '#E8A04A', bg: 'rgba(232,160,74,0.06)' },
]

const TESTIMONIALS = [
  { text: "I didn't know I was drifting until MindStep showed me the pattern. Three weeks of low sleep I'd just normalized.", name: 'CSE Student, Sem 4', color: '#4FC3A1' },
  { text: "The campus heatmap during exam season was eye-opening. You could literally see the stress spreading across departments.", name: 'Psychology Student, Sem 6', color: '#A78BFA' },
  { text: "Aura asked me one question that made me realize I needed to talk to someone. That conversation changed things.", name: 'Mechanical Eng. Student, Sem 3', color: '#5B9CF6' },
]

function CustomCursor() {
  const cursorX = useMotionValue(-100)
  const cursorY = useMotionValue(-100)
  const springConfig = { damping: 25, stiffness: 700 }
  const cursorXSpring = useSpring(cursorX, springConfig)
  const cursorYSpring = useSpring(cursorY, springConfig)
  const trailX = useSpring(cursorX, { damping: 50, stiffness: 200 })
  const trailY = useSpring(cursorY, { damping: 50, stiffness: 200 })

  useEffect(() => {
    const move = (e: MouseEvent) => {
      cursorX.set(e.clientX - 8)
      cursorY.set(e.clientY - 8)
    }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [])

  return (
    <>
      <motion.div style={{
        position: 'fixed', zIndex: 9999, pointerEvents: 'none',
        x: trailX, y: trailY,
        width: 32, height: 32, borderRadius: '50%',
        border: '1px solid rgba(79,195,161,0.3)',
        transform: 'translate(-50%, -50%)',
        mixBlendMode: 'difference',
      }} />
      <motion.div style={{
        position: 'fixed', zIndex: 9999, pointerEvents: 'none',
        x: cursorXSpring, y: cursorYSpring,
        width: 6, height: 6, borderRadius: '50%',
        background: '#4FC3A1', boxShadow: '0 0 8px #4FC3A1',
      }} />
    </>
  )
}

function ParticleField() {
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 0.5,
    duration: Math.random() * 20 + 15,
    delay: Math.random() * 10,
    opacity: Math.random() * 0.4 + 0.1,
  }))

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {particles.map((p) => (
        <motion.div key={p.id}
          style={{
            position: 'absolute', left: `${p.x}%`, top: `${p.y}%`,
            width: p.size, height: p.size, borderRadius: '50%',
            background: p.id % 3 === 0 ? '#4FC3A1' : p.id % 3 === 1 ? '#5B9CF6' : '#A78BFA',
            opacity: p.opacity,
          }}
          animate={{ y: [0, -80, 0], opacity: [p.opacity, p.opacity * 2, p.opacity], scale: [1, 1.5, 1] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

function GlitchText({ text, color }: { text: string; color: string }) {
  const [glitch, setGlitch] = useState(false)
  useEffect(() => {
    const interval = setInterval(() => {
      setGlitch(true)
      setTimeout(() => setGlitch(false), 200)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <span style={{ color, position: 'relative', zIndex: 1 }}>{text}</span>
      {glitch && (
        <>
          <span style={{ position: 'absolute', left: 2, top: 0, color: '#E05C5C', clipPath: 'polygon(0 20%, 100% 20%, 100% 40%, 0 40%)', opacity: 0.8 }}>{text}</span>
          <span style={{ position: 'absolute', left: -2, top: 0, color: '#5B9CF6', clipPath: 'polygon(0 60%, 100% 60%, 100% 80%, 0 80%)', opacity: 0.8 }}>{text}</span>
        </>
      )}
    </span>
  )
}

function NoiseOverlay() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none', opacity: 0.03,
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
    }} />
  )
}

export default function Home() {
  const router = useRouter()
  const isMobile = useIsMobile()
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: containerRef })
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -100])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [currentWord, setCurrentWord] = useState(0)
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [navScrolled, setNavScrolled] = useState(false)
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const wordInterval = setInterval(() => setCurrentWord(prev => (prev + 1) % FLOATING_WORDS.length), 2000)
    const testimonialInterval = setInterval(() => setActiveTestimonial(prev => (prev + 1) % TESTIMONIALS.length), 4000)
    return () => { clearInterval(wordInterval); clearInterval(testimonialInterval) }
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: (e.clientX / window.innerWidth - 0.5) * 40, y: (e.clientY / window.innerHeight - 0.5) * 40 })
    }
    const handleScroll = () => setNavScrolled(window.scrollY > 50)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('scroll', handleScroll)
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('scroll', handleScroll) }
  }, [])

  return (
    <div ref={containerRef} style={{
      minHeight: '100vh', background: '#080C12',
      color: '#E8EEF5', fontFamily: 'Inter, sans-serif',
      overflowX: 'hidden', cursor: isMobile ? 'auto' : 'none',
    }}>
      {!isMobile && <CustomCursor />}
      <ParticleField />
      <NoiseOverlay />

      {/* Grid */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(rgba(79,195,161,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(79,195,161,0.025) 1px, transparent 1px)`,
        backgroundSize: '80px 80px',
      }} />

      {/* Ambient orbs */}
      <motion.div animate={{ x: mousePos.x * 0.6, y: mousePos.y * 0.6 }} transition={{ type: 'spring', damping: 20 }}
        style={{ position: 'fixed', top: '-30%', right: '-15%', width: 900, height: 900, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,195,161,0.08) 0%, transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />
      <motion.div animate={{ x: mousePos.x * -0.4, y: mousePos.y * -0.4 }} transition={{ type: 'spring', damping: 25 }}
        style={{ position: 'fixed', bottom: '-20%', left: '-15%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />
      <motion.div animate={{ x: mousePos.x * 0.2, y: mousePos.y * 0.3 }} transition={{ type: 'spring', damping: 35 }}
        style={{ position: 'fixed', top: '35%', left: '25%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(91,156,246,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* NAVBAR */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          padding: isMobile
            ? (navScrolled ? '12px 20px' : '16px 20px')
            : (navScrolled ? '14px 60px' : '22px 60px'),
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: navScrolled ? 'rgba(8,12,18,0.95)' : 'transparent',
          backdropFilter: navScrolled ? 'blur(24px)' : 'none',
          borderBottom: navScrolled ? '1px solid rgba(255,255,255,0.05)' : 'none',
          transition: 'all 0.4s ease',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
            style={{ width: 38, height: 38, borderRadius: '50%', border: '1.5px solid transparent', borderTopColor: '#4FC3A1', borderRightColor: '#5B9CF6', position: 'relative' }}
          >
            <div style={{ position: 'absolute', inset: 7, borderRadius: '50%', background: 'rgba(79,195,161,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }}
                style={{ width: 8, height: 8, borderRadius: '50%', background: '#4FC3A1', boxShadow: '0 0 12px #4FC3A1' }} />
            </div>
          </motion.div>
          <div>
            <p style={{ fontSize: 19, fontWeight: 700, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', lineHeight: 1 }}>
              Mind<span style={{ color: '#4FC3A1' }}>Step</span>
            </p>
            <p style={{ fontSize: 9, letterSpacing: '0.22em', color: '#3A4A5E', textTransform: 'uppercase' }}>Team Ignite</p>
          </div>
        </div>

        {/* Desktop Nav buttons */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 4px 20px rgba(91,156,246,0.25)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/admin/login')}
              style={{
                padding: '9px 18px', borderRadius: 10,
                background: 'rgba(91,156,246,0.08)',
                border: '1px solid rgba(91,156,246,0.2)',
                color: '#5B9CF6', fontSize: 12, cursor: 'none',
                fontFamily: 'Inter, sans-serif', fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'all 0.2s',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              Admin Portal
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/login')}
              style={{
                padding: '9px 22px', borderRadius: 10,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#C8D4E0', fontSize: 13, cursor: 'none',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Sign in
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: '0 8px 32px rgba(79,195,161,0.5)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push('/onboarding')}
              style={{
                padding: '9px 22px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg, #4FC3A1, #3DA88B)',
                color: '#080C12', fontSize: 13, fontWeight: 700,
                cursor: 'none', fontFamily: 'Inter, sans-serif',
                boxShadow: '0 4px 20px rgba(79,195,161,0.3)',
              }}
            >
              Get started →
            </motion.button>
          </div>
        )}

        {/* Mobile — compact CTA + hamburger */}
        {isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/onboarding')}
              style={{
                padding: '8px 16px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg, #4FC3A1, #3DA88B)',
                color: '#080C12', fontSize: 12, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              }}
            >
              Get started
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setMobileMenuOpen(v => !v)}
              style={{
                width: 38, height: 38, borderRadius: 10,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C8D4E0" strokeWidth="2">
                {mobileMenuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </motion.button>
          </div>
        )}
      </motion.nav>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobile && mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            style={{
              position: 'fixed', top: 70, left: 16, right: 16, zIndex: 99,
              background: 'rgba(8,12,18,0.97)', backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16,
              padding: '16px', display: 'flex', flexDirection: 'column', gap: 8,
            }}
          >
            <button
              onClick={() => { router.push('/login'); setMobileMenuOpen(false) }}
              style={{
                padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)', color: '#C8D4E0', fontSize: 14,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif', textAlign: 'left',
              }}
            >
              Sign in
            </button>
            <button
              onClick={() => { router.push('/admin/login'); setMobileMenuOpen(false) }}
              style={{
                padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(91,156,246,0.2)',
                background: 'rgba(91,156,246,0.08)', color: '#5B9CF6', fontSize: 14,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              Admin Portal
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO */}
      <motion.section style={{ y: heroY, opacity: heroOpacity }}>
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          textAlign: 'center',
          padding: isMobile ? '120px 24px 60px' : '140px 40px 80px',
          position: 'relative', zIndex: 1,
        }}>

          {/* Badge */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 20, marginBottom: isMobile ? 32 : 48, background: 'rgba(79,195,161,0.06)', border: '1px solid rgba(79,195,161,0.18)' }}
          >
            <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 2, repeat: Infinity }}
              style={{ width: 6, height: 6, borderRadius: '50%', background: '#4FC3A1', boxShadow: '0 0 8px #4FC3A1', flexShrink: 0 }} />
            <span style={{ fontSize: isMobile ? 10 : 12, color: '#4FC3A1', fontWeight: 500, letterSpacing: '0.05em' }}>
              {isMobile ? 'Campus Mental Health · TNU' : 'Campus Mental Health Intelligence · The Neotia University'}
            </span>
          </motion.div>

          {/* Headline */}
          <div style={{ position: 'relative', marginBottom: 24 }}>
            <motion.h1
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              style={{ fontSize: 'clamp(48px, 9vw, 108px)', fontFamily: 'Playfair Display, serif', fontWeight: 700, lineHeight: 0.95, letterSpacing: '-0.03em', margin: 0 }}
            >
              <span style={{ color: '#E8EEF5', display: 'block' }}>Your pattern</span>
              <span style={{ color: '#E8EEF5', display: 'block' }}>is already </span>
              <GlitchText text="there." color="#4FC3A1" />
            </motion.h1>
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.8, 0.4], x: mousePos.x * 0.1, y: mousePos.y * 0.1 }}
              transition={{ duration: 5, repeat: Infinity }}
              style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: isMobile ? 240 : 400, height: isMobile ? 120 : 200, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(79,195,161,0.15) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none', zIndex: -1 }}
            />
          </div>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            style={{ fontSize: isMobile ? 18 : 22, color: '#4A5A6E', lineHeight: 1.6, maxWidth: 520, marginBottom: 8 }}>
            You just can't see it yet.
          </motion.p>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            style={{ fontSize: isMobile ? 14 : 15, color: '#3A4A5E', lineHeight: 1.9, maxWidth: 460, marginBottom: isMobile ? 36 : 52, padding: isMobile ? '0 8px' : 0 }}>
            MindStep detects mental health drift through daily check-ins, builds a personal baseline, and quietly notifies the right people when things shift.
          </motion.p>

          {/* CTA row */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
            style={{
              display: 'flex', gap: isMobile ? 10 : 14, alignItems: 'center',
              marginBottom: isMobile ? 40 : 64,
              flexWrap: 'wrap', justifyContent: 'center',
              flexDirection: isMobile ? 'column' : 'row',
              width: isMobile ? '100%' : 'auto',
            }}
          >
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: '0 16px 48px rgba(79,195,161,0.45)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push('/onboarding')}
              style={{
                padding: isMobile ? '16px 32px' : '18px 44px',
                borderRadius: 16, border: 'none',
                background: 'linear-gradient(135deg, #4FC3A1, #3DA88B)',
                color: '#080C12', fontSize: isMobile ? 15 : 16, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                boxShadow: '0 8px 32px rgba(79,195,161,0.3)', letterSpacing: '-0.01em',
                width: isMobile ? '100%' : 'auto',
              }}
            >
              Start your journey →
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/login')}
              style={{
                padding: isMobile ? '14px 32px' : '18px 36px',
                borderRadius: 16,
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#5A6A7E', fontSize: isMobile ? 14 : 15,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                width: isMobile ? '100%' : 'auto',
              }}
            >
              Sign in
            </motion.button>
            {!isMobile && (
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: '0 4px 20px rgba(91,156,246,0.3)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/admin/login')}
                style={{
                  padding: '18px 28px', borderRadius: 16,
                  background: 'rgba(91,156,246,0.08)',
                  border: '1px solid rgba(91,156,246,0.2)',
                  color: '#5B9CF6', fontSize: 14, cursor: 'none',
                  fontFamily: 'Inter, sans-serif', fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                Admin Portal
              </motion.button>
            )}
          </motion.div>

          {/* Cycling word */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
            style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: isMobile ? 48 : 80 }}
          >
            <div style={{ height: 1, width: 30, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1))' }} />
            <span style={{ fontSize: 11, color: '#2A3547', letterSpacing: '0.2em', textTransform: 'uppercase' }}>detecting</span>
            <AnimatePresence mode="wait">
              <motion.span key={currentWord}
                initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                transition={{ duration: 0.4 }}
                style={{ fontSize: 14, color: '#4FC3A1', fontFamily: 'Playfair Display, serif', fontStyle: 'italic', minWidth: 90, textAlign: 'center' }}
              >
                {FLOATING_WORDS[currentWord]}
              </motion.span>
            </AnimatePresence>
            <span style={{ fontSize: 11, color: '#2A3547', letterSpacing: '0.2em', textTransform: 'uppercase' }}>daily</span>
            <div style={{ height: 1, width: 30, background: 'linear-gradient(90deg, rgba(255,255,255,0.1), transparent)' }} />
          </motion.div>

          {/* 3D Dashboard — hide floating pills on mobile to avoid overflow */}
          <motion.div
            initial={{ opacity: 0, y: 80, rotateX: 25 }}
            animate={{ opacity: 1, y: 0, rotateX: 6 }}
            transition={{ delay: 0.8, duration: 1.2, type: 'spring', damping: 20 }}
            style={{ perspective: 1200, transformStyle: 'preserve-3d', width: '100%', maxWidth: 920, position: 'relative' }}
          >
            <motion.div
              animate={{ rotateX: mousePos.y * 0.015, rotateY: mousePos.x * 0.015 }}
              transition={{ type: 'spring', damping: 30 }}
              style={{ background: 'rgba(10,15,22,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, overflow: 'hidden', boxShadow: '0 60px 160px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)' }}
            >
              {/* Browser chrome */}
              <div style={{ padding: '14px 20px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
                {['#E05C5C', '#E8A04A', '#4FC3A1'].map((c, i) => (
                  <motion.div key={i} whileHover={{ scale: 1.2 }}
                    style={{ width: 11, height: 11, borderRadius: '50%', background: c, opacity: 0.8 }} />
                ))}
                {!isMobile && (
                  <div style={{ flex: 1, height: 24, borderRadius: 6, marginLeft: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }}
                      style={{ width: 5, height: 5, borderRadius: '50%', background: '#4FC3A1', boxShadow: '0 0 4px #4FC3A1' }} />
                    <span style={{ fontSize: 10, color: '#3A4A5E' }}>localhost:3000/dashboard</span>
                  </div>
                )}
              </div>

              {/* Dashboard content */}
              <div style={{ padding: isMobile ? '16px 14px 8px' : '20px 20px 8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <p style={{ fontSize: 11, color: '#3A4A5E', marginBottom: 2 }}>GOOD EVENING</p>
                    <p style={{ fontSize: isMobile ? 14 : 18, fontFamily: 'Playfair Display, serif', color: '#E8EEF5' }}>
                      Abhradip, <span style={{ color: '#4FC3A1' }}>you're stable</span>
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, background: 'rgba(79,195,161,0.1)', border: '1px solid rgba(79,195,161,0.2)' }}>
                    <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 2, repeat: Infinity }}
                      style={{ width: 6, height: 6, borderRadius: '50%', background: '#4FC3A1', boxShadow: '0 0 6px #4FC3A1' }} />
                    <span style={{ fontSize: 11, color: '#4FC3A1', fontWeight: 500 }}>Stable</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? 8 : 12, marginBottom: 14 }}>
                  {[
                    { label: 'Sleep', value: '7.2', color: '#5B9CF6', icon: '🌙', trend: '+0.4' },
                    { label: 'Social', value: '6.8', color: '#4FC3A1', icon: '🤝', trend: '-0.2' },
                    { label: 'Pressure', value: '5.4', color: '#E8A04A', icon: '📚', trend: '+1.1' },
                    { label: 'Streak', value: '14', color: '#A78BFA', icon: '🔥', trend: 'days' },
                  ].map((card, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.1 + i * 0.08 }}
                      style={{ padding: isMobile ? '10px' : '14px', borderRadius: 14, background: `${card.color}08`, border: `1px solid ${card.color}18` }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 14 }}>{card.icon}</span>
                        <span style={{ fontSize: 9, color: card.color, background: `${card.color}15`, padding: '1px 6px', borderRadius: 10 }}>{card.trend}</span>
                      </div>
                      <p style={{ fontSize: isMobile ? 20 : 26, fontWeight: 300, fontFamily: 'Playfair Display, serif', color: card.color, lineHeight: 1, marginBottom: 4 }}>{card.value}</p>
                      <p style={{ fontSize: 10, color: '#3A4A5E' }}>{card.label}</p>
                    </motion.div>
                  ))}
                </div>

                <div style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <p style={{ fontSize: 10, color: '#3A4A5E', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Baseline tracker</p>
                    {!isMobile && (
                      <div style={{ display: 'flex', gap: 12 }}>
                        {[{ c: '#5B9CF6', l: 'Sleep' }, { c: '#4FC3A1', l: 'Social' }, { c: '#E8A04A', l: 'Pressure' }].map(x => (
                          <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: x.c }} />
                            <span style={{ fontSize: 9, color: '#3A4A5E' }}>{x.l}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: isMobile ? 44 : 60 }}>
                    {[[65,70,60],[75,65,70],[60,80,55],[80,75,75],[70,60,65],[85,70,80],[72,75,70],[88,80,85],[76,65,72],[92,85,88],[80,70,78],[95,90,92]].map((group, gi) => (
                      <div key={gi} style={{ flex: 1, display: 'flex', gap: 1, alignItems: 'flex-end', height: '100%' }}>
                        {group.map((h, ci) => (
                          <motion.div key={ci}
                            initial={{ height: 0 }} animate={{ height: `${h}%` }}
                            transition={{ delay: 1.3 + gi * 0.03 + ci * 0.01, duration: 0.5 }}
                            style={{ flex: 1, borderRadius: '2px 2px 0 0', background: ci === 0 ? '#5B9CF6' : ci === 1 ? '#4FC3A1' : '#E8A04A', opacity: 0.7 }}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Reflection */}
            <div style={{ height: 80, marginTop: 1, background: 'linear-gradient(to bottom, rgba(10,15,22,0.4), transparent)', transform: 'scaleY(-1)', opacity: 0.25, filter: 'blur(6px)', borderRadius: '0 0 24px 24px' }} />

            {/* Floating pills — desktop only to avoid overflow on mobile */}
            {!isMobile && [
              { x: -60, y: 80, content: '🌙 Sleep: 7.2', color: '#5B9CF6' },
              { x: '100%', y: 40, content: '✦ Aura online', color: '#A78BFA' },
              { x: -40, y: '60%', content: '📊 Baseline active', color: '#4FC3A1' },
              { x: '95%', y: '70%', content: '🤝 2 peers online', color: '#E8A04A' },
            ].map((el, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
                transition={{ delay: 1.5 + i * 0.2, y: { duration: 3 + i, repeat: Infinity, delay: i * 0.5 } }}
                style={{
                  position: 'absolute',
                  left: typeof el.x === 'number' ? el.x : undefined,
                  right: el.x === '100%' || el.x === '95%' ? -160 : undefined,
                  top: typeof el.y === 'number' ? el.y : undefined,
                  bottom: el.y === '60%' || el.y === '70%' ? (el.y === '70%' ? 40 : 100) : undefined,
                  padding: '8px 14px', borderRadius: 20,
                  background: `${el.color}10`, border: `1px solid ${el.color}25`,
                  backdropFilter: 'blur(12px)', whiteSpace: 'nowrap',
                }}
              >
                <span style={{ fontSize: 11, color: el.color, fontWeight: 500 }}>{el.content}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* STATS */}
      <section style={{ padding: isMobile ? '40px 24px' : '50px 60px', position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.015)' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: isMobile ? 0 : 0,
          maxWidth: 800, margin: '0 auto',
        }}>
          {[
            { value: '7', unit: 'days', desc: 'to build your baseline' },
            { value: '5', unit: 'questions', desc: 'every evening' },
            { value: '3', unit: 'alert tiers', desc: 'green · amber · red' },
            { value: '30', unit: 'seconds', desc: 'average check-in time' },
          ].map((stat, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              style={{
                textAlign: 'center', padding: isMobile ? '20px 12px' : '20px',
                borderRight: isMobile
                  ? (i % 2 === 0 ? '1px solid rgba(255,255,255,0.06)' : 'none')
                  : (i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none'),
                borderBottom: isMobile && i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, justifyContent: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: isMobile ? 36 : 48, fontWeight: 300, fontFamily: 'Playfair Display, serif', color: '#4FC3A1', lineHeight: 1 }}>{stat.value}</span>
                <span style={{ fontSize: isMobile ? 12 : 14, color: '#3A4A5E' }}>{stat.unit}</span>
              </div>
              <p style={{ fontSize: 12, color: '#2A3547' }}>{stat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: isMobile ? '80px 24px' : '120px 60px', position: 'relative', zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: isMobile ? 48 : 80 }}
        >
          <p style={{ fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#A78BFA', marginBottom: 16, fontWeight: 600 }}>What's inside</p>
          <h2 style={{ fontSize: isMobile ? 36 : 56, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', fontWeight: 600, lineHeight: 1.05, marginBottom: 16 }}>Groundbreaking features</h2>
          <p style={{ fontSize: 15, color: '#3A4A5E', maxWidth: 460, margin: '0 auto' }}>Built from scratch by Team Ignite. Nothing like this exists at any Indian university.</p>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: 2, maxWidth: 1000, margin: '0 auto',
        }}>
          {FEATURES.map((feature, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.02 }}
              onHoverStart={() => setHoveredFeature(i)}
              onHoverEnd={() => setHoveredFeature(null)}
              style={{
                padding: isMobile ? '28px 24px' : '44px',
                background: hoveredFeature === i ? `linear-gradient(135deg, ${feature.color}10, rgba(8,12,18,0.9))` : 'rgba(255,255,255,0.02)',
                border: `1px solid ${hoveredFeature === i ? feature.color + '25' : 'rgba(255,255,255,0.05)'}`,
                borderRadius: isMobile
                  ? (i === 0 ? '20px 20px 0 0' : i === FEATURES.length - 1 ? '0 0 20px 20px' : '0')
                  : (i === 0 ? '20px 0 0 0' : i === 1 ? '0 20px 0 0' : i === 2 ? '0 0 0 20px' : '0 0 20px 0'),
                cursor: 'pointer', transition: 'all 0.4s', position: 'relative', overflow: 'hidden',
              }}
            >
              {hoveredFeature === i && (
                <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  style={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: '50%', background: `radial-gradient(circle, ${feature.color}12 0%, transparent 70%)`, pointerEvents: 'none' }}
                />
              )}
              <div style={{ width: 56, height: 56, borderRadius: 18, background: `${feature.color}12`, border: `1px solid ${feature.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 24, boxShadow: hoveredFeature === i ? `0 0 20px ${feature.color}20` : 'none', transition: 'all 0.3s' }}>
                {feature.icon}
              </div>
              <h3 style={{ fontSize: 22, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', marginBottom: 12, fontWeight: 600 }}>{feature.title}</h3>
              <p style={{ fontSize: 14, color: '#4A5A6E', lineHeight: 1.8 }}>{feature.desc}</p>
              {hoveredFeature === i && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 20 }}>
                  <span style={{ fontSize: 12, color: feature.color, padding: '4px 12px', borderRadius: 20, background: `${feature.color}12`, border: `1px solid ${feature.color}25` }}>
                    Explore →
                  </span>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ padding: isMobile ? '60px 24px 80px' : '80px 60px 120px', position: 'relative', zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: 60 }}
        >
          <p style={{ fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#5B9CF6', marginBottom: 16, fontWeight: 600 }}>Student voices</p>
          <h2 style={{ fontSize: isMobile ? 36 : 52, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', fontWeight: 600 }}>What they noticed</h2>
        </motion.div>

        <div style={{ maxWidth: 700, margin: '0 auto', position: 'relative', minHeight: 180 }}>
          <AnimatePresence mode="wait">
            <motion.div key={activeTestimonial}
              initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -30, filter: 'blur(8px)' }}
              transition={{ duration: 0.5 }}
              style={{ padding: isMobile ? '32px 24px' : '48px', borderRadius: 24, background: `linear-gradient(135deg, ${TESTIMONIALS[activeTestimonial].color}08, rgba(255,255,255,0.02))`, border: `1px solid ${TESTIMONIALS[activeTestimonial].color}18`, textAlign: 'center', position: 'relative', overflow: 'hidden' }}
            >
              <div style={{ position: 'absolute', top: 20, left: 24, fontSize: 60, color: `${TESTIMONIALS[activeTestimonial].color}10`, fontFamily: 'Playfair Display, serif', lineHeight: 1, userSelect: 'none' }}>"</div>
              <p style={{ fontSize: isMobile ? 16 : 20, fontFamily: 'Playfair Display, serif', color: '#C8D4E0', lineHeight: 1.7, fontStyle: 'italic', marginBottom: 24, position: 'relative', zIndex: 1 }}>
                "{TESTIMONIALS[activeTestimonial].text}"
              </p>
              <p style={{ fontSize: 12, color: '#3A4A5E' }}>— {TESTIMONIALS[activeTestimonial].name}</p>
            </motion.div>
          </AnimatePresence>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
            {TESTIMONIALS.map((_, i) => (
              <motion.button key={i} onClick={() => setActiveTestimonial(i)}
                animate={{ width: i === activeTestimonial ? 24 : 6, opacity: i === activeTestimonial ? 1 : 0.3 }}
                style={{ height: 6, borderRadius: 3, border: 'none', cursor: 'pointer', background: '#4FC3A1' }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding: isMobile ? '40px 24px 80px' : '80px 60px 120px', position: 'relative', zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{
            maxWidth: 860, margin: '0 auto', textAlign: 'center',
            padding: isMobile ? '60px 24px' : '100px 80px',
            borderRadius: 32,
            background: 'linear-gradient(135deg, rgba(79,195,161,0.07), rgba(91,156,246,0.04), rgba(167,139,250,0.06))',
            border: '1px solid rgba(79,195,161,0.12)',
            position: 'relative', overflow: 'hidden',
          }}
        >
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            style={{ position: 'absolute', inset: -200, borderRadius: '50%', background: 'conic-gradient(from 0deg, transparent 0%, rgba(79,195,161,0.03) 25%, transparent 50%, rgba(167,139,250,0.03) 75%, transparent 100%)', pointerEvents: 'none' }}
          />
          <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }} transition={{ duration: 4, repeat: Infinity }}
            style={{ fontSize: 64, marginBottom: 28, display: 'block' }}>✦</motion.div>
          <h2 style={{ fontSize: isMobile ? 40 : 60, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', fontWeight: 600, lineHeight: 1.05, marginBottom: 20 }}>
            Start seeing<br />your pattern
          </h2>
          <p style={{ fontSize: isMobile ? 14 : 16, color: '#4A5A6E', lineHeight: 1.9, marginBottom: 48, maxWidth: 420, margin: '0 auto 48px' }}>
            30 seconds a day. After a week, you'll understand yourself in a way you never have before.
          </p>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 20px 60px rgba(79,195,161,0.5)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/onboarding')}
            style={{
              padding: isMobile ? '16px 40px' : '20px 56px',
              borderRadius: 18, border: 'none',
              background: 'linear-gradient(135deg, #4FC3A1, #3DA88B)',
              color: '#080C12', fontSize: isMobile ? 16 : 18, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              boxShadow: '0 8px 40px rgba(79,195,161,0.35)',
              display: 'block', margin: '0 auto 20px',
            }}
          >
            Join MindStep — it's free →
          </motion.button>
          <p style={{ fontSize: 12, color: '#2A3547' }}>No credit card · Built for TNU students · Private by design</p>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer style={{
        padding: isMobile ? '24px 20px' : '32px 60px',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'flex-start' : 'center',
        justifyContent: 'space-between',
        gap: isMobile ? 16 : 0,
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(79,195,161,0.15)', border: '1px solid rgba(79,195,161,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#4FC3A1' }} />
          </div>
          <p style={{ fontSize: 13, fontFamily: 'Playfair Display, serif', color: '#E8EEF5' }}>Mind<span style={{ color: '#4FC3A1' }}>Step</span></p>
          <span style={{ fontSize: 11, color: '#2A3547' }}>by Team Ignite · TNU</span>
        </div>
        {!isMobile && <p style={{ fontSize: 11, color: '#2A3547' }}>Campus Mental Health Intelligence System</p>}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {['Privacy', 'About'].map((item) => (
            <button key={item} style={{ background: 'none', border: 'none', color: '#2A3547', fontSize: 11, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'color 0.2s' }}
              onMouseEnter={(e) => (e.target as HTMLElement).style.color = '#5A6A7E'}
              onMouseLeave={(e) => (e.target as HTMLElement).style.color = '#2A3547'}
            >
              {item}
            </button>
          ))}
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/admin/login')}
            style={{
              padding: '6px 14px', borderRadius: 8,
              background: 'rgba(91,156,246,0.08)',
              border: '1px solid rgba(91,156,246,0.2)',
              color: '#5B9CF6', fontSize: 11,
              cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            Admin Portal
          </motion.button>
        </div>
      </footer>
    </div>
  )
}