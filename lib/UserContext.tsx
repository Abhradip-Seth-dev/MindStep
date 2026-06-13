'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { auth } from '@/lib/firebase'
import { onIdTokenChanged, User as FirebaseUser } from 'firebase/auth'

type UserContextType = {
  user: FirebaseUser | null
  userData: any | null
  baseline: any | null
  checkins: any[]
  loading: boolean
  refreshData: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [userData, setUserData] = useState<any | null>(null)
  const [baseline, setBaseline] = useState<any | null>(null)
  const [checkins, setCheckins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async (firebaseUser: FirebaseUser) => {
    try {
      const [userRes, baselineRes] = await Promise.all([
        fetch(`/api/user?firebaseUid=${firebaseUser.uid}`),
        fetch(`/api/baseline?userId=${firebaseUser.uid}`)
      ])

      const ud = await userRes.json()
      if (!ud.error) setUserData(ud)

      const bd = await baselineRes.json()
      if (bd.baseline) setBaseline(bd.baseline)
      setCheckins(bd.recentCheckins || [])
    } catch (e) {
      console.error('Error fetching global user data:', e)
    }
  }

  const refreshData = async () => {
    if (user) {
      await fetchData(user)
    }
  }

  useEffect(() => {
    const unsub = onIdTokenChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const token = await firebaseUser.getIdToken()
          try {
            await fetch('/api/auth/token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token })
            })
          } catch (err) {
            console.error('Failed to set auth token cookie:', err)
          }
          setUser(firebaseUser)
          await fetchData(firebaseUser)
        } else {
          try {
            await fetch('/api/auth/token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: null })
            })
          } catch (err) {
            console.error('Failed to clear auth token cookie:', err)
          }
          setUser(null)
          setUserData(null)
          setBaseline(null)
          setCheckins([])
        }
      } catch (err) {
        console.error('onIdTokenChanged error:', err)
      } finally {
        setLoading(false)
      }
    })

    return () => unsub()
  }, [])

  return (
    <UserContext.Provider value={{ user, userData, baseline, checkins, loading, refreshData }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
