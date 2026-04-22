'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter, useParams } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import Sidebar from '@/components/Sidebar'

const ARTICLES: Record<string, any> = {
  '1': {
    id: 1,
    category: 'Foundations',
    categoryColor: '#4FC3A1',
    icon: '🧠',
    title: 'Why logging your mood daily actually works',
    subtitle: 'The science of affect labeling and why observation changes experience',
    tag: 'Psychology',
    readTime: '3 min read',
    heroEmoji: '🧠',
    heroGradient: 'linear-gradient(135deg, rgba(79,195,161,0.15), rgba(91,156,246,0.08))',
    heroBorder: 'rgba(79,195,161,0.2)',
    sections: [
      {
        type: 'intro',
        text: 'When you log how you feel every day, something subtle but powerful happens — you become an observer of your own experience rather than just a passenger in it.',
      },
      {
        type: 'heading',
        text: 'The science behind it',
      },
      {
        type: 'text',
        text: 'This is called "affect labeling" in psychology. Research from UCLA shows that putting feelings into words reduces the intensity of emotional reactions by activating the prefrontal cortex — the rational part of your brain — which helps regulate the amygdala, your brain\'s alarm system.',
      },
      {
        type: 'highlight',
        color: '#4FC3A1',
        text: 'In simple terms: naming what you feel helps you feel it less intensely.',
      },
      {
        type: 'text',
        text: 'Daily logging also creates a feedback loop. Over time, you start to notice patterns — certain days, situations, or combinations of poor sleep and high pressure that reliably lead to worse emotional states. That awareness alone is protective. You can\'t change what you can\'t see.',
      },
      {
        type: 'heading',
        text: 'How your brain changes',
      },
      {
        type: 'stats',
        items: [
          { value: '60%', label: 'Reduction in emotional reactivity', color: '#4FC3A1' },
          { value: '7+', label: 'Days to start seeing patterns', color: '#5B9CF6' },
          { value: '21', label: 'Days to build a logging habit', color: '#A78BFA' },
        ],
      },
      {
        type: 'text',
        text: 'MindStep is built entirely on this principle. Your data is not just tracking — it\'s a mirror. And mirrors don\'t lie.',
      },
      {
        type: 'callout',
        icon: '💡',
        title: 'Try this tonight',
        text: 'Before you open MindStep to log, pause for 10 seconds and silently name how you feel. Then log it. Notice if the act of naming changes anything about how intense the feeling is.',
      },
    ],
  },
  '2': {
    id: 2,
    category: 'Sleep',
    categoryColor: '#5B9CF6',
    icon: '🌙',
    title: 'What sleep actually does to your emotional regulation',
    subtitle: 'One bad night makes you 60% more emotionally reactive — here\'s why',
    tag: 'Neuroscience',
    readTime: '4 min read',
    heroEmoji: '🌙',
    heroGradient: 'linear-gradient(135deg, rgba(91,156,246,0.15), rgba(167,139,250,0.08))',
    heroBorder: 'rgba(91,156,246,0.2)',
    sections: [
      {
        type: 'intro',
        text: 'Sleep is not a passive rest state. It is when your brain actively processes emotional memories, consolidates learning, and resets the emotional reactivity systems that govern how you respond to stress.',
      },
      {
        type: 'heading',
        text: 'What the research says',
      },
      {
        type: 'text',
        text: 'A landmark study by Matthew Walker at UC Berkeley found that sleep-deprived individuals showed 60% more emotional reactivity to negative stimuli than those who were well-rested. The amygdala — your brain\'s threat detector — essentially goes into overdrive when you haven\'t slept enough.',
      },
      {
        type: 'stats',
        items: [
          { value: '60%', label: 'More emotional reactivity without sleep', color: '#E05C5C' },
          { value: '40%', label: 'Memory consolidation during deep sleep', color: '#5B9CF6' },
          { value: '90min', label: 'Ideal REM sleep cycle length', color: '#A78BFA' },
        ],
      },
      {
        type: 'heading',
        text: 'What happens during sleep',
      },
      {
        type: 'bullets',
        color: '#5B9CF6',
        items: [
          'REM sleep strips the emotional charge from memories, allowing you to process difficult experiences',
          'Deep sleep consolidates what you learned during the day',
          'Without sufficient sleep, your prefrontal cortex becomes significantly less effective',
          'The amygdala goes into overdrive — making threats feel bigger than they are',
        ],
      },
      {
        type: 'highlight',
        color: '#5B9CF6',
        text: 'For students: late nights + early classes + academic stress = perfect storm for emotional dysregulation.',
      },
      {
        type: 'callout',
        icon: '🌙',
        title: 'Tonight\'s experiment',
        text: 'Set a consistent sleep time for 3 nights in a row. Log your social energy and emotional state each morning. Most people see a measurable difference within 72 hours.',
      },
    ],
  },
  '3': {
    id: 3,
    category: 'Connection',
    categoryColor: '#A78BFA',
    icon: '🤝',
    title: 'Why social connection is a biological need, not a preference',
    subtitle: 'Loneliness activates the same neural pathways as physical pain',
    tag: 'Social Psychology',
    readTime: '4 min read',
    heroEmoji: '🤝',
    heroGradient: 'linear-gradient(135deg, rgba(167,139,250,0.15), rgba(79,195,161,0.08))',
    heroBorder: 'rgba(167,139,250,0.2)',
    sections: [
      {
        type: 'intro',
        text: 'Social connection is not a luxury or a personality preference. It is a biological necessity, as fundamental as food and water.',
      },
      {
        type: 'heading',
        text: 'The neuroscience of loneliness',
      },
      {
        type: 'text',
        text: 'Research by John Cacioppo at the University of Chicago demonstrated that loneliness activates the same neural pathways as physical pain. The brain treats social disconnection as a threat to survival — which, for most of our evolutionary history, it was.',
      },
      {
        type: 'highlight',
        color: '#A78BFA',
        text: 'Being excluded from the group meant death. Your brain still treats it that way.',
      },
      {
        type: 'heading',
        text: 'What isolation does to students',
      },
      {
        type: 'bullets',
        color: '#A78BFA',
        items: [
          'Difficulty concentrating when feeling socially isolated',
          'Increased cortisol (stress hormone) on days with low social contact',
          'Sleep disruption triggered by social anxiety or loneliness',
          'Weakened immune response during prolonged social isolation',
        ],
      },
      {
        type: 'stats',
        items: [
          { value: '1', label: 'Genuine conversation beats 10 superficial ones', color: '#A78BFA' },
          { value: '↓26%', label: 'Cortisol reduction after social connection', color: '#4FC3A1' },
          { value: '7x', label: 'Stronger wellbeing with close relationships', color: '#5B9CF6' },
        ],
      },
      {
        type: 'callout',
        icon: '🤝',
        title: 'The minimum dose',
        text: 'One genuine conversation per day — where you feel heard and understood — is the research-backed minimum for maintaining social wellbeing. It doesn\'t have to be long. It has to feel real.',
      },
    ],
  },
  '4': {
    id: 4,
    category: 'Stress',
    categoryColor: '#E8A04A',
    icon: '📚',
    title: 'What happens in the brain during prolonged academic stress',
    subtitle: 'Chronic stress physically reshapes your brain — but the effects are reversible',
    tag: 'Neuroscience',
    readTime: '5 min read',
    heroEmoji: '📚',
    heroGradient: 'linear-gradient(135deg, rgba(232,160,74,0.15), rgba(224,92,92,0.08))',
    heroBorder: 'rgba(232,160,74,0.2)',
    sections: [
      {
        type: 'intro',
        text: 'Short-term stress is adaptive. It sharpens focus, boosts energy, and prepares you to perform. The problem is when it becomes chronic — when the stress response never fully switches off.',
      },
      {
        type: 'heading',
        text: 'The cruel paradox of exam stress',
      },
      {
        type: 'text',
        text: 'Sustained high cortisol physically shrinks the hippocampus — the brain region responsible for memory and learning. The more academically stressed you become, the less capable your brain is of performing the tasks causing the stress.',
      },
      {
        type: 'highlight',
        color: '#E8A04A',
        text: 'Chronic stress impairs the exact cognitive functions students need most: memory, focus, and decision-making.',
      },
      {
        type: 'heading',
        text: 'What prolonged stress does',
      },
      {
        type: 'bullets',
        color: '#E8A04A',
        items: [
          'Physically shrinks the hippocampus — memory and learning center',
          'Strengthens the amygdala — making you more reactive to threats',
          'Suppresses the prefrontal cortex — impairing decision-making',
          'Disrupts sleep architecture — reducing recovery capacity',
          'Weakens immune function — increasing illness vulnerability',
        ],
      },
      {
        type: 'stats',
        items: [
          { value: '↓20%', label: 'Hippocampus volume reduction under chronic stress', color: '#E05C5C' },
          { value: '3 wks', label: 'Time to begin neurological recovery with intervention', color: '#4FC3A1' },
          { value: '100%', label: 'These changes are reversible', color: '#4FC3A1' },
        ],
      },
      {
        type: 'callout',
        icon: '💚',
        title: 'The good news',
        text: 'These changes are largely reversible. Sleep, exercise, social connection, and awareness of your stress patterns all contribute to neurological recovery. MindStep\'s pressure tracking exists to surface escalation before it reaches the point of cognitive impairment.',
      },
    ],
  },
  '5': {
    id: 5,
    category: 'Patterns',
    categoryColor: '#4FC3A1',
    icon: '📊',
    title: 'The difference between a bad week and a pattern worth noticing',
    subtitle: 'Everyone has bad weeks. A drift from your baseline is something different.',
    tag: 'Psychology',
    readTime: '4 min read',
    heroEmoji: '📊',
    heroGradient: 'linear-gradient(135deg, rgba(79,195,161,0.15), rgba(91,156,246,0.08))',
    heroBorder: 'rgba(79,195,161,0.2)',
    sections: [
      {
        type: 'intro',
        text: 'Having a hard few days is normal. Life is not linear. The question MindStep answers is not "are you having a bad day?" but "is this meaningfully different from what\'s normal for you?"',
      },
      {
        type: 'heading',
        text: 'Why this distinction matters',
      },
      {
        type: 'text',
        text: 'A score of 5/10 on sleep might be completely normal for one person and a significant deviation for another. Generic wellness apps compare you to population averages. MindStep compares you to yourself.',
      },
      {
        type: 'heading',
        text: 'Three signs of a pattern worth noticing',
      },
      {
        type: 'bullets',
        color: '#4FC3A1',
        items: [
          'It deviates meaningfully from your personal baseline — not just one bad day',
          'It affects multiple dimensions simultaneously — sleep AND social energy AND pressure',
          'It persists across consecutive days — not a one-off event',
        ],
      },
      {
        type: 'highlight',
        color: '#4FC3A1',
        text: '"Your pattern looks different this week" is categorically different from "you are struggling." One is an observation. The other is a judgment.',
      },
      {
        type: 'callout',
        icon: '📊',
        title: 'What MindStep watches for',
        text: 'When all three conditions are met — meaningful deviation, multiple dimensions, consecutive days — the probability of continued deterioration without intervention increases significantly. This is the threshold for a quiet nudge, not an alarm.',
      },
    ],
  },
  '6': {
    id: 6,
    category: 'Action',
    categoryColor: '#E05C5C',
    icon: '💡',
    title: 'One evidence-based thing to try when everything feels heavy',
    subtitle: 'When motivation is gone, action comes first — not the other way around',
    tag: 'CBT',
    readTime: '4 min read',
    heroEmoji: '💡',
    heroGradient: 'linear-gradient(135deg, rgba(224,92,92,0.15), rgba(232,160,74,0.08))',
    heroBorder: 'rgba(224,92,92,0.2)',
    sections: [
      {
        type: 'intro',
        text: 'There is a common misconception about motivation: that you need to feel ready before you act. The research says the opposite is true.',
      },
      {
        type: 'heading',
        text: 'Action before motivation',
      },
      {
        type: 'text',
        text: 'Behavioral activation — a core component of CBT — demonstrates that action precedes motivation, not the other way around. You do not wait to feel like going for a walk. You go for the walk, and then you feel better.',
      },
      {
        type: 'highlight',
        color: '#E05C5C',
        text: 'When everything feels heavy, the brain\'s reward circuitry is suppressed. This is not a character flaw — it is a neurological state, and it responds to behavioral intervention.',
      },
      {
        type: 'heading',
        text: 'The evidence-based sequence',
      },
      {
        type: 'bullets',
        color: '#E05C5C',
        items: [
          'Do one small, concrete, completable task — not "study more" but "read one paragraph"',
          'Move your body for 10 minutes — even a short walk elevates mood neurotransmitters',
          'Make one point of human contact — a text, a brief conversation, anything',
          'Name what you\'re feeling out loud or in writing — affect labeling reduces intensity',
        ],
      },
      {
        type: 'stats',
        items: [
          { value: '10min', label: 'Minimum exercise for mood elevation', color: '#4FC3A1' },
          { value: '1', label: 'Task completion to start momentum', color: '#E05C5C' },
          { value: '~5min', label: 'For affect labeling to reduce intensity', color: '#5B9CF6' },
        ],
      },
      {
        type: 'callout',
        icon: '💡',
        title: 'Remember',
        text: 'None of these will fix everything. But each one creates a small neurological shift that makes the next step slightly more possible. That is enough.',
      },
    ],
  },
  '7': {
    id: 7,
    category: 'About MindStep',
    categoryColor: '#5B9CF6',
    icon: '🔍',
    title: 'Understanding your baseline — what it means and how it works',
    subtitle: 'Your baseline is your personal normal. Not the population average. Yours.',
    tag: 'How MindStep works',
    readTime: '3 min read',
    heroEmoji: '🔍',
    heroGradient: 'linear-gradient(135deg, rgba(91,156,246,0.15), rgba(167,139,250,0.08))',
    heroBorder: 'rgba(91,156,246,0.2)',
    sections: [
      {
        type: 'intro',
        text: 'Most health apps compare you to population averages. MindStep works differently — your baseline is built exclusively from your own data.',
      },
      {
        type: 'heading',
        text: 'What your baseline captures',
      },
      {
        type: 'bullets',
        color: '#5B9CF6',
        items: [
          'Your average sleep quality score across your first 7 days',
          'Your average social energy score',
          'Your average academic pressure score',
          'The natural day-to-day variance in all three metrics',
        ],
      },
      {
        type: 'heading',
        text: 'How drift detection works',
      },
      {
        type: 'text',
        text: 'The algorithm looks for deviations that are both statistically meaningful and sustained. A single bad day does not trigger anything. Two or more metrics falling significantly below your personal baseline, sustained over 3-4 consecutive days, is what constitutes a meaningful drift signal.',
      },
      {
        type: 'stats',
        items: [
          { value: '7', label: 'Days to establish your baseline', color: '#5B9CF6' },
          { value: '2+', label: 'Metrics needed to trigger drift signal', color: '#E8A04A' },
          { value: '3-4', label: 'Consecutive days before alert', color: '#E05C5C' },
        ],
      },
      {
        type: 'highlight',
        color: '#5B9CF6',
        text: 'Your baseline is not a ceiling you should always stay at. It is simply a mirror of what is normal for you, so that genuine change becomes visible.',
      },
      {
        type: 'callout',
        icon: '📈',
        title: 'What your baseline is NOT',
        text: 'It is not a fixed ceiling. It is not a judgment. It is not compared to any other user. It is simply your personal reference point for what "normal" looks like — so that meaningful drift becomes visible early.',
      },
    ],
  },
}

export default function ArticlePage() {
  const router = useRouter()
  const params = useParams()
  const [userName, setUserName] = useState('')
  const [scrollProgress, setScrollProgress] = useState(0)

  const article = ARTICLES[params.id as string]

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

  useEffect(() => {
    const handleScroll = () => {
      const el = document.documentElement
      const progress = (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100
      setScrollProgress(progress)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!article) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#080C12' }}>
        <Sidebar userName={userName} />
        <main style={{
          flex: 1, marginLeft: '220px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 40, marginBottom: 16 }}>📭</p>
            <p style={{ fontSize: 16, color: '#5A6A7E', marginBottom: 20 }}>
              Article not found
            </p>
            <button
              onClick={() => router.push('/learn')}
              style={{
                padding: '10px 20px', borderRadius: 10,
                background: '#4FC3A1', color: '#080C12',
                border: 'none', cursor: 'pointer', fontSize: 13,
              }}
            >
              Back to Learn
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080C12' }}>

      {/* Reading progress bar */}
      <motion.div
        style={{
          position: 'fixed', top: 0, left: 0,
          height: 2, zIndex: 100,
          background: `linear-gradient(90deg, ${article.categoryColor}, ${article.categoryColor}80)`,
          width: `${scrollProgress}%`,
          boxShadow: `0 0 8px ${article.categoryColor}`,
        }}
      />

      {/* Ambient background */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
      }}>
        <div style={{
          position: 'absolute', top: '-10%', right: '-5%',
          width: 600, height: 600, borderRadius: '50%',
          background: `radial-gradient(circle, ${article.categoryColor}06 0%, transparent 70%)`,
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', left: '-5%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(91,156,246,0.04) 0%, transparent 70%)',
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
          padding: '16px 32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(8,12,18,0.92)',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
          <motion.button
            whileHover={{ x: -3 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/learn')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 16px', borderRadius: 10,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#8B9BB0', fontSize: 13,
              cursor: 'pointer',
            }}
          >
            ← Back to Learn
          </motion.button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              padding: '4px 12px', borderRadius: 20,
              background: `${article.categoryColor}12`,
              border: `1px solid ${article.categoryColor}25`,
            }}>
              <span style={{
                fontSize: 11, color: article.categoryColor,
                fontWeight: 600,
              }}>
                {article.tag}
              </span>
            </div>
            <span style={{ fontSize: 12, color: '#3A4A5E' }}>
              {article.readTime}
            </span>
          </div>
        </div>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            margin: '32px 80px 0',
            padding: '48px',
            borderRadius: 24,
            background: article.heroGradient,
            border: `1px solid ${article.heroBorder}`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Background decoration */}
          <div style={{
            position: 'absolute', right: -60, top: -60,
            width: 300, height: 300, borderRadius: '50%',
            background: `radial-gradient(circle, ${article.categoryColor}15 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', right: 48, top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 120, opacity: 0.08,
            pointerEvents: 'none',
            userSelect: 'none',
          }}>
            {article.heroEmoji}
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            style={{
              width: 64, height: 64, borderRadius: 20,
              background: `${article.categoryColor}20`,
              border: `1px solid ${article.categoryColor}40`,
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 32,
              marginBottom: 24,
            }}
          >
            {article.icon}
          </motion.div>

          <p style={{
            fontSize: 11, letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: article.categoryColor,
            marginBottom: 12, fontWeight: 600,
          }}>
            {article.category}
          </p>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            style={{
              fontSize: 36,
              fontFamily: 'Playfair Display, serif',
              color: '#E8EEF5',
              lineHeight: 1.25,
              marginBottom: 16,
              maxWidth: 600,
              fontWeight: 600,
            }}
          >
            {article.title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              fontSize: 16, color: '#6A7A8E',
              lineHeight: 1.6, maxWidth: 500,
            }}
          >
            {article.subtitle}
          </motion.p>
        </motion.div>

        {/* Article content */}
        <div style={{
          margin: '32px 80px 80px',
          maxWidth: 680,
        }}>
          {article.sections.map((section: any, i: number) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
            >

              {section.type === 'intro' && (
                <p style={{
                  fontSize: 18,
                  color: '#C8D4E0',
                  lineHeight: 1.8,
                  marginBottom: 28,
                  fontFamily: 'Playfair Display, serif',
                  fontStyle: 'italic',
                }}>
                  {section.text}
                </p>
              )}

              {section.type === 'heading' && (
                <h2 style={{
                  fontSize: 22,
                  fontFamily: 'Playfair Display, serif',
                  color: '#E8EEF5',
                  marginBottom: 14,
                  marginTop: 36,
                  fontWeight: 600,
                }}>
                  {section.text}
                </h2>
              )}

              {section.type === 'text' && (
                <p style={{
                  fontSize: 15,
                  color: '#6A7A8E',
                  lineHeight: 1.85,
                  marginBottom: 20,
                }}>
                  {section.text}
                </p>
              )}

              {section.type === 'highlight' && (
                <div style={{
                  padding: '20px 24px',
                  borderRadius: 14,
                  background: `${section.color}08`,
                  border: `1px solid ${section.color}25`,
                  borderLeft: `3px solid ${section.color}`,
                  marginBottom: 20,
                }}>
                  <p style={{
                    fontSize: 15,
                    color: '#C8D4E0',
                    lineHeight: 1.7,
                    fontStyle: 'italic',
                  }}>
                    {section.text}
                  </p>
                </div>
              )}

              {section.type === 'bullets' && (
                <div style={{ marginBottom: 24 }}>
                  {section.items.map((item: string, j: number) => (
                    <motion.div
                      key={j}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + j * 0.05 }}
                      style={{
                        display: 'flex', gap: 12,
                        padding: '12px 0',
                        borderBottom: j < section.items.length - 1
                          ? '1px solid rgba(255,255,255,0.04)'
                          : 'none',
                      }}
                    >
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%',
                        background: `${section.color}15`,
                        border: `1px solid ${section.color}30`,
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0, marginTop: 1,
                      }}>
                        <div style={{
                          width: 5, height: 5, borderRadius: '50%',
                          background: section.color,
                        }} />
                      </div>
                      <p style={{
                        fontSize: 14, color: '#8B9BB0',
                        lineHeight: 1.7,
                      }}>
                        {item}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}

              {section.type === 'stats' && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 12, marginBottom: 24,
                }}>
                  {section.items.map((stat: any, j: number) => (
                    <motion.div
                      key={j}
                      whileHover={{ y: -3 }}
                      style={{
                        padding: '20px',
                        borderRadius: 16,
                        background: `${stat.color}06`,
                        border: `1px solid ${stat.color}20`,
                        textAlign: 'center',
                      }}
                    >
                      <p style={{
                        fontSize: 32,
                        fontWeight: 300,
                        fontFamily: 'Playfair Display, serif',
                        color: stat.color,
                        lineHeight: 1,
                        marginBottom: 8,
                      }}>
                        {stat.value}
                      </p>
                      <p style={{
                        fontSize: 11, color: '#5A6A7E',
                        lineHeight: 1.5,
                      }}>
                        {stat.label}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}

              {section.type === 'callout' && (
                <div style={{
                  padding: '24px',
                  borderRadius: 16,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  marginBottom: 24, marginTop: 12,
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    gap: 10, marginBottom: 10,
                  }}>
                    <span style={{ fontSize: 20 }}>{section.icon}</span>
                    <h4 style={{
                      fontSize: 14,
                      fontFamily: 'Playfair Display, serif',
                      color: '#E8EEF5',
                    }}>
                      {section.title}
                    </h4>
                  </div>
                  <p style={{
                    fontSize: 13, color: '#5A6A7E',
                    lineHeight: 1.7,
                  }}>
                    {section.text}
                  </p>
                </div>
              )}
            </motion.div>
          ))}

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            style={{
              marginTop: 48, padding: '24px',
              borderRadius: 16,
              background: `${article.categoryColor}06`,
              border: `1px solid ${article.categoryColor}20`,
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <p style={{
                fontSize: 12, color: article.categoryColor,
                fontWeight: 600, marginBottom: 3,
              }}>
                Content by your psychology partner
              </p>
              <p style={{ fontSize: 12, color: '#3A4A5E' }}>
                Grounded in peer-reviewed research · Team Ignite
              </p>
            </div>
            <motion.button
              whileHover={{ x: -3 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push('/learn')}
              style={{
                padding: '10px 20px', borderRadius: 10,
                background: `${article.categoryColor}15`,
                border: `1px solid ${article.categoryColor}30`,
                color: article.categoryColor,
                fontSize: 13, fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              ← More articles
            </motion.button>
          </motion.div>
        </div>
      </main>
    </div>
  )
}