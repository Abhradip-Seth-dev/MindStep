'use client'

import { useRouter, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { auth } from '@/lib/firebase'
import { signOut } from 'firebase/auth'
import { useIsMobile } from '@/lib/hooks'

const nav = [
  {
    id: 'dashboard',
    label: 'Overview',
    path: '/dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
  },
  {
    id: 'checkin',
    label: 'Daily Log',
    path: '/checkin',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
      </svg>
    ),
  },
  {
    id: 'heatmap',
    label: 'Campus Map',
    path: '/heatmap',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"/>
      </svg>
    ),
  },
  {
    id: 'history',
    label: 'History',
    path: '/history',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="9"/>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3"/>
      </svg>
    ),
  },
  {
    id: 'garden',
    label: 'Mind Garden',
    path: '/garden',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1M4.22 4.22l.707.707M18.364 18.364l.707.707M1 12h1m20 0h1M4.22 19.78l.707-.707M18.364 5.636l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"/>
      </svg>
    ),
  },
  {
    id: 'community',
    label: 'Community',
    path: '/community',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
  },
  {
    id: 'rewards',
    label: 'Rewards',
    path: '/rewards',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/>
      </svg>
    ),
  },
  {
    id: 'profile',
    label: 'Profile',
    path: '/profile',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="8" r="4"/>
        <path strokeLinecap="round" d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
    ),
  },
  {
    id: 'peer',
    label: 'Peer Support',
    path: '/peer',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
  },
  {
    id: 'games',
    label: 'Mind Games',
    path: '/games',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.959.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z"/>
      </svg>
    ),
  },
]

export default function Sidebar({
  userName,
  userData,
}: {
  userName?: string
  userData?: any
}) {
  const router = useRouter()
  const pathname = usePathname()
  const isMobile = useIsMobile()

  const handleSignOut = async () => {
    await signOut(auth)
    router.push('/onboarding')
  }

  // On mobile, BottomNav replaces the sidebar entirely
  if (isMobile) return null

  return (
    <aside style={{
      position: 'fixed', left: 0, top: 0,
      height: '100vh', width: '220px',
      display: 'flex', flexDirection: 'column', zIndex: 50,
      background: 'linear-gradient(180deg, #0A0F18 0%, #080C12 100%)',
      borderRight: '1px solid rgba(255,255,255,0.05)',
    }}>

      {/* Logo */}
      <div style={{ padding: '28px 20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative', width: 32, height: 32 }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                border: '1px solid transparent',
                borderTopColor: '#4FC3A1',
                borderRightColor: '#5B9CF6',
              }}
            />
            <div style={{
              position: 'absolute', inset: 4, borderRadius: '50%',
              background: 'rgba(79,195,161,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#4FC3A1', boxShadow: '0 0 8px #4FC3A1',
              }} />
            </div>
          </div>
          <div>
            <p style={{
              fontSize: 15, fontWeight: 700,
              fontFamily: 'Playfair Display, serif',
              color: '#E8EEF5', lineHeight: 1,
            }}>
              Mind<span style={{ color: '#4FC3A1' }}>Step</span>
            </p>
            <p style={{
              fontSize: 9, letterSpacing: '0.15em',
              textTransform: 'uppercase', color: '#3A4A5E', marginTop: 2,
            }}>
              Team Ignite
            </p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{
        height: 1, margin: '0 20px 16px',
        background: 'linear-gradient(90deg, rgba(79,195,161,0.15), transparent)',
      }} />

      {/* User section */}
      {userName && (
        <div style={{ padding: '0 12px 16px' }}>
          <div style={{
            padding: '12px', borderRadius: 12,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              marginBottom: userData?.course ? 10 : 0,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(79,195,161,0.3), rgba(91,156,246,0.3))',
                border: '1px solid rgba(79,195,161,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 600, color: '#4FC3A1', flexShrink: 0,
              }}>
                {userName[0]?.toUpperCase()}
              </div>
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <p style={{
                  fontSize: 13, fontWeight: 500, color: '#C8D4E0',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {userName}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: '#4FC3A1', boxShadow: '0 0 4px #4FC3A1',
                  }} />
                  <p style={{ fontSize: 10, color: '#3A4A5E' }}>Active</p>
                </div>
              </div>
            </div>

            {/* University info */}
            {userData?.course && (
              <div style={{
                paddingTop: 10,
                borderTop: '1px solid rgba(255,255,255,0.05)',
              }}>
                <p style={{
                  fontSize: 10, color: '#4FC3A1', fontWeight: 600,
                  marginBottom: 3,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {userData.course}
                </p>
                <p style={{ fontSize: 10, color: '#3A4A5E' }}>
                  {userData.semester ? `Sem ${userData.semester}` : ''}
                  {userData.semester && userData.studentType ? ' · ' : ''}
                  {userData.studentType === 'hosteller'
                    ? `🏨 ${userData.hostel || 'Hosteller'}`
                    : userData.studentType === 'dayscholar'
                    ? '🏠 Day Scholar'
                    : ''}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Nav label */}
      <p style={{
        fontSize: 9, letterSpacing: '0.18em',
        textTransform: 'uppercase', color: '#2A3A4E',
        padding: '0 20px 8px', fontWeight: 600,
      }}>
        Menu
      </p>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '0 10px', overflowY: 'auto' }}>
        {nav.map((item) => {
          const isActive = pathname === item.path || (item.path === '/community' && pathname.startsWith('/learn'))
          return (
            <motion.button
              key={item.id}
              whileHover={{ x: 3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(item.path)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center',
                gap: 10, padding: '9px 12px', borderRadius: 10,
                marginBottom: 2, border: isActive
                  ? '1px solid rgba(79,195,161,0.15)'
                  : '1px solid transparent',
                background: isActive
                  ? 'linear-gradient(135deg, rgba(79,195,161,0.08), rgba(91,156,246,0.04))'
                  : 'transparent',
                color: isActive ? '#4FC3A1' : '#4A5A6E',
                cursor: 'pointer', textAlign: 'left',
                position: 'relative', transition: 'color 0.2s',
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="active-bar"
                  style={{
                    position: 'absolute', left: 0, top: '20%', bottom: '20%',
                    width: 2, borderRadius: 1,
                    background: '#4FC3A1', boxShadow: '0 0 8px #4FC3A1',
                  }}
                />
              )}
              <span style={{ flexShrink: 0 }}>{item.icon}</span>
              <span style={{ fontSize: 13, fontWeight: isActive ? 500 : 400 }}>
                {item.label}
              </span>
              {isActive && (
                <div style={{
                  marginLeft: 'auto', width: 4, height: 4, borderRadius: '50%',
                  background: '#4FC3A1', boxShadow: '0 0 6px #4FC3A1',
                }} />
              )}
            </motion.button>
          )
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '12px 10px 24px' }}>
        <div style={{ height: 1, margin: '0 10px 12px', background: 'rgba(255,255,255,0.04)' }} />

        {/* UID badge */}
        {userData?.uid && (
          <div style={{
            margin: '0 2px 10px', padding: '8px 12px', borderRadius: 10,
            background: 'rgba(91,156,246,0.05)',
            border: '1px solid rgba(91,156,246,0.1)',
          }}>
            <p style={{ fontSize: 9, color: '#3A4A5E', marginBottom: 2 }}>UNIVERSITY ID</p>
            <p style={{
              fontSize: 10, color: '#5B9CF6', fontWeight: 600,
              fontFamily: 'JetBrains Mono, monospace',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {userData.uid}
            </p>
          </div>
        )}

        {/* Privacy badge */}
        <div style={{
          margin: '0 2px 10px', padding: '10px 12px', borderRadius: 10,
          background: 'rgba(79,195,161,0.04)',
          border: '1px solid rgba(79,195,161,0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
              stroke="#4FC3A1" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/>
            </svg>
            <span style={{ fontSize: 10, fontWeight: 500, color: '#4FC3A1' }}>
              End-to-end encrypted
            </span>
          </div>
          <p style={{ fontSize: 9, color: '#3A4A5E', lineHeight: 1.5 }}>
            Your data never leaves without consent
          </p>
        </div>

        {/* Sign out */}
        <motion.button
          whileHover={{ x: 3 }} whileTap={{ scale: 0.98 }}
          onClick={handleSignOut}
          style={{
            width: '100%', display: 'flex', alignItems: 'center',
            gap: 10, padding: '9px 12px', borderRadius: 10,
            border: '1px solid transparent', background: 'transparent',
            color: '#3A4A5E', cursor: 'pointer', fontSize: 13,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"/>
          </svg>
          Sign out
        </motion.button>
      </div>
    </aside>
  )
}