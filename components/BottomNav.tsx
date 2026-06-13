'use client'

import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { auth } from '@/lib/firebase'
import { signOut } from 'firebase/auth'

const primaryNav = [
  {
    id: 'dashboard',
    label: 'Home',
    path: '/dashboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
  },
  {
    id: 'checkin',
    label: 'Log',
    path: '/checkin',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
      </svg>
    ),
  },
  {
    id: 'community',
    label: 'Community',
    path: '/community',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
  },
  {
    id: 'profile',
    label: 'Profile',
    path: '/profile',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="8" r="4"/>
        <path strokeLinecap="round" d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
    ),
  },
  {
    id: 'more',
    label: 'More',
    path: '__more__',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="5" cy="12" r="1.5" fill="currentColor"/>
        <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
        <circle cx="19" cy="12" r="1.5" fill="currentColor"/>
      </svg>
    ),
  },
]

const moreNav = [
  { id: 'heatmap', label: 'Campus Map', path: '/heatmap' },
  { id: 'history', label: 'History', path: '/history' },
  { id: 'garden', label: 'Mind Garden', path: '/garden' },
  { id: 'rewards', label: 'Rewards', path: '/rewards' },
  { id: 'peer', label: 'Peer Support', path: '/peer' },
  { id: 'companion', label: 'AI Companion', path: '/companion' },
  { id: 'games', label: 'Mind Games', path: '/games' },
]

export default function BottomNav({ userName }: { userName?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const [showMore, setShowMore] = useState(false)

  const handleSignOut = async () => {
    await signOut(auth)
    setShowMore(false)
    router.push('/onboarding')
  }

  const handleNav = (path: string) => {
    if (path === '__more__') {
      setShowMore(prev => !prev)
      return
    }
    setShowMore(false)
    router.push(path)
  }

  return (
    <>
      {/* More Drawer Backdrop */}
      <AnimatePresence>
        {showMore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMore(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 998,
              background: 'rgba(8,12,18,0.7)',
              backdropFilter: 'blur(4px)',
            }}
          />
        )}
      </AnimatePresence>

      {/* More Drawer */}
      <AnimatePresence>
        {showMore && (
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            style={{
              position: 'fixed', bottom: 72, left: 0, right: 0, zIndex: 999,
              background: 'linear-gradient(180deg, #0D1117 0%, #080C12 100%)',
              borderTop: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '20px 20px 0 0',
              padding: '20px 16px 8px',
            }}
          >
            {/* Drag handle */}
            <div style={{
              width: 36, height: 4, borderRadius: 2,
              background: 'rgba(255,255,255,0.12)',
              margin: '-8px auto 16px',
            }} />

            {/* User info strip */}
            {userName && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px', borderRadius: 12, marginBottom: 12,
                background: 'rgba(79,195,161,0.06)',
                border: '1px solid rgba(79,195,161,0.1)',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(79,195,161,0.3), rgba(91,156,246,0.3))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 600, color: '#4FC3A1', flexShrink: 0,
                }}>
                  {userName[0]?.toUpperCase()}
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#C8D4E0' }}>{userName}</p>
                  <p style={{ fontSize: 10, color: '#3A4A5E' }}>MindStep Student</p>
                </div>
              </div>
            )}

            {/* More nav items - 2 column grid */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              gap: 8, marginBottom: 12,
            }}>
              {moreNav.map(item => {
                const isActive = pathname === item.path || pathname.startsWith(item.path + '/')
                return (
                  <motion.button
                    key={item.id}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleNav(item.path)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '12px 14px', borderRadius: 12, border: 'none',
                      background: isActive
                        ? 'linear-gradient(135deg, rgba(79,195,161,0.12), rgba(91,156,246,0.06))'
                        : 'rgba(255,255,255,0.03)',
                      color: isActive ? '#4FC3A1' : '#8B9BB0',
                      cursor: 'pointer', textAlign: 'left', fontSize: 13, fontWeight: 500,
                    }}
                  >
                    {item.label}
                  </motion.button>
                )
              })}
            </div>

            {/* Sign out */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSignOut}
              style={{
                width: '100%', padding: '12px', borderRadius: 12, border: 'none',
                background: 'rgba(224,92,92,0.06)',
                color: '#E05C5C', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"/>
              </svg>
              Sign out
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Tab Bar */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
        background: 'rgba(8,12,18,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        padding: '8px 8px 12px',
        paddingBottom: 'calc(8px + env(safe-area-inset-bottom))',
      }}>
        {primaryNav.map(item => {
          const isMore = item.path === '__more__'
          const isActive = !isMore && (pathname === item.path || (item.id === 'community' && pathname.startsWith('/learn')))
          const isMoreActive = isMore && showMore

          return (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.88 }}
              onClick={() => handleNav(item.path)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 4, padding: '6px 12px', borderRadius: 12, border: 'none',
                background: 'transparent', cursor: 'pointer',
                color: (isActive || isMoreActive) ? '#4FC3A1' : '#4A5A6E',
                position: 'relative', minWidth: 56,
              }}
            >
              {(isActive || isMoreActive) && (
                <motion.div
                  layoutId="bottom-active-pill"
                  style={{
                    position: 'absolute', top: -1, left: '50%',
                    transform: 'translateX(-50%)',
                    width: 28, height: 2, borderRadius: 1,
                    background: '#4FC3A1', boxShadow: '0 0 8px #4FC3A1',
                  }}
                />
              )}
              {item.icon}
              <span style={{ fontSize: 10, fontWeight: (isActive || isMoreActive) ? 600 : 400, letterSpacing: '0.02em' }}>
                {item.label}
              </span>
            </motion.button>
          )
        })}
      </nav>
    </>
  )
}