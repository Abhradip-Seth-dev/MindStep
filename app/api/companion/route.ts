import { db } from '@/lib/firebaseAdmin'
import { verifyAuth } from '@/lib/firebaseAdmin'
import admin from 'firebase-admin'

const MAX_HISTORY_MESSAGES = 40 // messages to store and retrieve
const MAX_CONTEXT_MESSAGES = 20 // messages sent to Gemini as context

// ── GET — fetch stored conversation history ──────────────────────────────────
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) return Response.json({ error: 'userId required' }, { status: 400 })

    const authResult = await verifyAuth(req, userId)
    if ('error' in authResult) return Response.json({ error: authResult.error }, { status: 403 })

    const messagesSnap = await db
      .collection('conversations')
      .doc(userId)
      .collection('messages')
      .orderBy('createdAt', 'asc')
      .limitToLast(MAX_HISTORY_MESSAGES)
      .get()

    const messages = messagesSnap.docs.map((d) => {
      const data = d.data()
      return {
        id: d.id,
        role: data.role,
        content: data.content,
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
      }
    })

    return Response.json({ messages })
  } catch (error: any) {
    console.error('Companion GET error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

// ── DELETE — clear conversation history ──────────────────────────────────────
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) return Response.json({ error: 'userId required' }, { status: 400 })

    const authResult = await verifyAuth(req, userId)
    if ('error' in authResult) return Response.json({ error: authResult.error }, { status: 403 })

    const messagesRef = db.collection('conversations').doc(userId).collection('messages')
    const snap = await messagesRef.get()

    // Firestore batch delete (max 500 per batch)
    const chunks: admin.firestore.QueryDocumentSnapshot[][] = []
    for (let i = 0; i < snap.docs.length; i += 400) {
      chunks.push(snap.docs.slice(i, i + 400))
    }
    for (const chunk of chunks) {
      const batch = db.batch()
      chunk.forEach((doc) => batch.delete(doc.ref))
      await batch.commit()
    }

    return Response.json({ success: true })
  } catch (error: any) {
    console.error('Companion DELETE error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

// ── POST — generate Aura reply and persist both messages ─────────────────────
export async function POST(req: Request) {
  try {
    const authResult = await verifyAuth(req)
    if ('error' in authResult) return Response.json({ error: authResult.error }, { status: 403 })

    const body = await req.json()
    const { messages, userData, checkins, baseline } = body
    const userId = authResult.uid

    const systemPrompt = `You are Aura, a warm and empathetic AI wellbeing companion for university students at The Neotia University.

You are talking to ${userData?.name || 'a student'} who studies ${userData?.course || 'at TNU'}, currently in Semester ${userData?.semester || '—'}.

Their recent check-in data (most recent first):
${checkins?.slice(0, 7).map((c: any, i: number) =>
  `- Day ${i + 1}: Sleep ${c.sleep}/10, Social Energy ${c.socialEnergy}/10, Pressure ${c.pressure}/10, Ate: ${c.ate}, Emotion: ${c.emotion}, Status: ${c.status}${c.notes ? `, Note: "${c.notes}"` : ''}`
).join('\n') || 'No recent check-ins yet.'}

Baseline averages:
- Average sleep: ${baseline?.avgSleep?.toFixed(1) || '—'}/10
- Average social energy: ${baseline?.avgSocialEnergy?.toFixed(1) || '—'}/10
- Average pressure: ${baseline?.avgPressure?.toFixed(1) || '—'}/10

RULES:
- You are NOT a therapist. Never diagnose.
- Be warm, gentle, conversational — like a caring friend.
- Reference their actual data naturally when relevant.
- Ask ONE question at a time.
- Keep responses to 2-4 sentences max.
- If they seem in crisis, gently encourage them to speak to a counselor.
- Never compare them to other students.
- Focus on listening and gentle reflection.
- Always respond in English.`

    // Use only the most recent messages as context to keep token usage manageable
    const contextMessages = messages.slice(-MAX_CONTEXT_MESSAGES)

    const groqMessages = [
      { role: 'system', content: systemPrompt },
      ...contextMessages.map((m: any) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }))
    ]

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: groqMessages,
        max_tokens: 300,
        temperature: 0.8,
      }),
    })

    const data = await response.json()

    if (data.error) {
      console.error('Groq error:', data.error)
      return Response.json({ message: "I'm here with you. How are you feeling right now?" })
    }

    const replyText = data.choices?.[0]?.message?.content || "I'm here. Take your time."

    // ── Persist the latest user message + Aura's reply to Firestore ──────────
    // The last message in the array is always the newest user message
    const lastUserMsg = messages[messages.length - 1]
    const messagesRef = db.collection('conversations').doc(userId).collection('messages')
    const now = admin.firestore.FieldValue.serverTimestamp()

    const batch = db.batch()
    const userMsgRef = messagesRef.doc()
    batch.set(userMsgRef, {
      role: 'user',
      content: lastUserMsg.content,
      createdAt: now,
    })
    const auraReplyRef = messagesRef.doc()
    batch.set(auraReplyRef, {
      role: 'assistant',
      content: replyText,
      createdAt: now,
    })
    await batch.commit()

    return Response.json({ message: replyText })
  } catch (error: any) {
    console.error('Companion error:', error)
    return Response.json({ message: "I'm here with you. How are you feeling right now?" })
  }
}