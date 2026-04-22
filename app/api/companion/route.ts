export async function POST(req: Request) {
    try {
      const body = await req.json()
      const { messages, userData, checkins, baseline } = body
  
      const systemPrompt = `You are Aura, a warm and empathetic AI wellbeing companion for university students at The Neotia University.
  
  You are talking to ${userData?.name || 'a student'} who studies ${userData?.course || 'at TNU'}, currently in Semester ${userData?.semester || '—'}.
  
  Their recent check-in data:
  ${checkins?.slice(0, 7).map((c: any, i: number) => `- Day ${i + 1}: Sleep ${c.sleep}/10, Social Energy ${c.socialEnergy}/10, Pressure ${c.pressure}/10, Ate: ${c.ate}, Emotion: ${c.emotion}, Status: ${c.status}`).join('\n') || 'No recent check-ins yet.'}
  
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
  
      // Convert messages to Gemini format
      const geminiMessages = messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))
  
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: systemPrompt }],
            },
            contents: geminiMessages,
            generationConfig: {
              maxOutputTokens: 300,
              temperature: 0.8,
            },
          }),
        }
      )
  
      const data = await response.json()
  
      console.log('Gemini response:', JSON.stringify(data, null, 2))
  
      if (data.error) {
        console.error('Gemini error:', data.error)
        return Response.json({ message: "I'm here with you. How are you feeling right now?" })
      }
  
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      return Response.json({ message: text || "I'm here. Take your time." })
  
    } catch (error: any) {
      console.error('Companion error:', error)
      return Response.json({ message: "I'm here with you. How are you feeling right now?" })
    }
  }