'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'

const CARDS = [
  {
    id: 1,
    category: 'Foundations',
    categoryColor: '#4FC3A1',
    icon: '🧠',
    title: 'Why logging your mood daily actually works',
    preview: 'The act of observing your emotional state changes how you process it.',
    readTime: '3 min read',
    tag: 'Psychology',
  },
  {
    id: 2,
    category: 'Sleep',
    categoryColor: '#5B9CF6',
    icon: '🌙',
    title: 'What sleep actually does to your emotional regulation',
    preview: 'One bad night of sleep makes you 60% more emotionally reactive.',
    readTime: '4 min read',
    tag: 'Neuroscience',
  },
  {
    id: 3,
    category: 'Connection',
    categoryColor: '#A78BFA',
    icon: '🤝',
    title: 'Why social connection is a biological need, not a preference',
    preview: 'Loneliness activates the same neural pathways as physical pain.',
    readTime: '4 min read',
    tag: 'Social Psychology',
  },
  {
    id: 4,
    category: 'Stress',
    categoryColor: '#E8A04A',
    icon: '📚',
    title: 'What happens in the brain during prolonged academic stress',
    preview: 'Chronic stress physically reshapes your brain — but the effects are reversible.',
    readTime: '5 min read',
    tag: 'Neuroscience',
  },
  {
    id: 5,
    category: 'Patterns',
    categoryColor: '#4FC3A1',
    icon: '📊',
    title: 'The difference between a bad week and a pattern worth noticing',
    preview: 'Everyone has bad weeks. A drift from your baseline is something different.',
    readTime: '4 min read',
    tag: 'Psychology',
  },
  {
    id: 6,
    category: 'Action',
    categoryColor: '#E05C5C',
    icon: '💡',
    title: 'One evidence-based thing to try when everything feels heavy',
    preview: 'When motivation is gone, action comes first — not the other way around.',
    readTime: '4 min read',
    tag: 'CBT',
  },
  {
    id: 7,
    category: 'About MindStep',
    categoryColor: '#5B9CF6',
    icon: '🔍',
    title: 'Understanding your baseline — what it means and how it works',
    preview: 'Your baseline is your personal normal. Not the population average. Yours.',
    readTime: '3 min read',
    tag: 'How MindStep works',
  },
]

const TAGS = ['All', 'Psychology', 'Neuroscience', 'Social Psychology', 'CBT', 'How MindStep works']

export default function Learn() {
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [selectedTag, setSelectedTag] = useState('All')
  const [search, setSearch] = useState('')
  const [hoveredId, setHoveredId] = useState<number | null>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) { router.push('/onboarding'); return }
      setUserName(
        firebaseUser.displayName ||
        firebaseUser.email?.split('@')[0] ||
        'Student'
      )
    })
    return () => unsub()
  }, [])

  const filtered = CARDS.filter((c) => {
    const matchTag = selectedTag === 'All' || c.tag === selectedTag
    const matchSearch = search === '' ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.preview.toLowerCase().includes(search.toLowerCase())
    return matchTag && matchSearch
  })

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080C12' }}>

      {/* Ambient */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
      }}>
        <div style={{
          position: 'absolute', top: '5%', right: '10%',
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(167,139,250,0.04) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', left: '20%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(79,195,161,0.04) 0%, transparent 70%)',
        }} />
      </div>

      <Sidebar userName={userName} />

      <main style={{
        flex: 1, marginLeft: '220px',
        minHeight: '100vh', overflowY: 'auto',
        position: 'relative', zIndex: 1,
      }}>

        {/* Top bar */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 40,
          padding: '20px 32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(8,12,18,0.92)',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div>
            <p style={{
              fontSize: 10, letterSpacing: '0.18em',
              textTransform: 'uppercase', color: '#3A4A5E', marginBottom: 3,
            }}>
              Psychoeducation
            </p>
            <h1 style={{
              fontSize: 24,
              fontFamily: 'Playfair Display, serif',
              color: '#E8EEF5', fontWeight: 600,
            }}>
              Learn & understand
            </h1>
          </div>

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search topics..."
              style={{
                padding: '10px 16px 10px 40px',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#E8EEF5',
                fontSize: 13,
                outline: 'none',
                width: 240,
                fontFamily: 'Inter, sans-serif',
              }}
              onFocus={(e) => e.target.style.borderColor = 'rgba(79,195,161,0.4)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
            <span style={{
              position: 'absolute', left: 14, top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 14, color: '#3A4A5E',
            }}>
              🔍
            </span>
          </div>
        </div>

        <div style={{ padding: '28px 32px' }}>

          {/* Hero banner */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '32px',
              borderRadius: 20,
              background: 'linear-gradient(135deg, rgba(167,139,250,0.08), rgba(79,195,161,0.05))',
              border: '1px solid rgba(167,139,250,0.15)',
              marginBottom: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div style={{
              position: 'absolute', right: -40, top: -40,
              width: 200, height: 200, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            <div>
              <p style={{
                fontSize: 10, letterSpacing: '0.18em',
                textTransform: 'uppercase', color: '#A78BFA',
                marginBottom: 8, fontWeight: 600,
              }}>
                Evidence-based content
              </p>
              <h2 style={{
                fontSize: 22,
                fontFamily: 'Playfair Display, serif',
                color: '#E8EEF5', marginBottom: 8,
              }}>
                Understanding your mind
              </h2>
              <p style={{
                fontSize: 13, color: '#5A6A7E',
                maxWidth: 500, lineHeight: 1.7,
              }}>
                Every article here is grounded in peer-reviewed psychology research.
                Written to be accessible, not clinical. Click any card to read the full article.
              </p>
            </div>

            <div style={{
              display: 'flex', flexDirection: 'column',
              gap: 8, alignItems: 'flex-end', flexShrink: 0,
            }}>
              {[
                { n: '7', label: 'Articles' },
                { n: '4', label: 'Topics' },
              ].map((s) => (
                <div key={s.label} style={{
                  display: 'flex', alignItems: 'baseline', gap: 6,
                }}>
                  <span style={{
                    fontSize: 28, fontWeight: 300,
                    fontFamily: 'Playfair Display, serif',
                    color: '#A78BFA',
                  }}>
                    {s.n}
                  </span>
                  <span style={{ fontSize: 12, color: '#5A6A7E' }}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Tag filters */}
          <div style={{
            display: 'flex', gap: 8, marginBottom: 24,
            flexWrap: 'wrap',
          }}>
            {TAGS.map((tag) => (
              <motion.button
                key={tag}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedTag(tag)}
                style={{
                  padding: '6px 16px',
                  borderRadius: 20,
                  border: selectedTag === tag
                    ? '1px solid rgba(79,195,161,0.4)'
                    : '1px solid rgba(255,255,255,0.07)',
                  background: selectedTag === tag
                    ? 'rgba(79,195,161,0.1)'
                    : 'rgba(255,255,255,0.02)',
                  color: selectedTag === tag ? '#4FC3A1' : '#5A6A7E',
                  fontSize: 12,
                  fontWeight: selectedTag === tag ? 500 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {tag}
              </motion.button>
            ))}
          </div>

          {/* Cards grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
          }}>
            {filtered.map((card, i) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -6 }}
                onHoverStart={() => setHoveredId(card.id)}
                onHoverEnd={() => setHoveredId(null)}
                onClick={() => router.push(`/learn/${card.id}`)}
                style={{
                  padding: '24px',
                  borderRadius: 18,
                  background: hoveredId === card.id
                    ? `linear-gradient(135deg, ${card.categoryColor}10, rgba(255,255,255,0.04))`
                    : `linear-gradient(135deg, ${card.categoryColor}06, rgba(255,255,255,0.02))`,
                  border: `1px solid ${hoveredId === card.id
                    ? card.categoryColor + '35'
                    : 'rgba(255,255,255,0.07)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.25s',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: hoveredId === card.id
                    ? `0 8px 32px ${card.categoryColor}15`
                    : 'none',
                }}
              >
                {/* Glow */}
                <div style={{
                  position: 'absolute', top: -30, right: -30,
                  width: 120, height: 120, borderRadius: '50%',
                  background: `radial-gradient(circle, ${card.categoryColor}${hoveredId === card.id ? '20' : '10'} 0%, transparent 70%)`,
                  pointerEvents: 'none',
                  transition: 'all 0.3s',
                }} />

                {/* Header */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'flex-start', marginBottom: 18,
                }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: `${card.categoryColor}15`,
                    border: `1px solid ${card.categoryColor}25`,
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 24,
                    transition: 'transform 0.2s',
                    transform: hoveredId === card.id ? 'scale(1.05)' : 'scale(1)',
                  }}>
                    {card.icon}
                  </div>
                  <div style={{
                    padding: '3px 10px', borderRadius: 20,
                    background: `${card.categoryColor}12`,
                    border: `1px solid ${card.categoryColor}25`,
                  }}>
                    <span style={{
                      fontSize: 10, color: card.categoryColor,
                      fontWeight: 600,
                    }}>
                      {card.tag}
                    </span>
                  </div>
                </div>

                {/* Category */}
                <p style={{
                  fontSize: 10, letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: card.categoryColor,
                  marginBottom: 8, fontWeight: 600,
                }}>
                  {card.category}
                </p>

                {/* Title */}
                <h3 style={{
                  fontSize: 15,
                  fontFamily: 'Playfair Display, serif',
                  color: '#E8EEF5',
                  lineHeight: 1.45,
                  marginBottom: 10,
                  fontWeight: 600,
                }}>
                  {card.title}
                </h3>

                {/* Preview */}
                <p style={{
                  fontSize: 12, color: '#5A6A7E',
                  lineHeight: 1.65, marginBottom: 18,
                }}>
                  {card.preview}
                </p>

                {/* Footer */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: 14,
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                }}>
                  <span style={{ fontSize: 11, color: '#3A4A5E' }}>
                    {card.readTime}
                  </span>
                  <motion.div
                    animate={{ x: hoveredId === card.id ? 4 : 0 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      fontSize: 12, color: card.categoryColor,
                      fontWeight: 500,
                    }}
                  >
                    Read article →
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '60px 32px',
              borderRadius: 20,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <p style={{ fontSize: 16, color: '#5A6A7E' }}>
                No articles match your search.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}