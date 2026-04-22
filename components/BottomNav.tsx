'use client'

import { useRouter } from 'next/navigation'

const tabs = [
  {
    id: 'checkin',
    label: 'Log',
    path: '/checkin',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    id: 'dashboard',
    label: 'Home',
    path: '/dashboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zm6.75-6.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v13.125c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V6.75zm6.75 3c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v10.125c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V9.75z" />
      </svg>
    ),
  },
  {
    id: 'history',
    label: 'History',
    path: '/history',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'profile',
    label: 'Profile',
    path: '/profile',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
]

export default function BottomNav({ active }: { active: string }) {
  const router = useRouter()

  return (
    <div
      className="fixed bottom-0 left-0 right-0 flex justify-around items-center px-4 py-3 z-50"
      style={{
        background: 'rgba(8,12,18,0.95)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => router.push(tab.path)}
            className="flex flex-col items-center gap-1 px-4 py-1 rounded-xl transition-all"
            style={{ color: isActive ? '#4FC3A1' : '#5A6A7E' }}
          >
            {tab.icon}
            <span className="text-xs">{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}