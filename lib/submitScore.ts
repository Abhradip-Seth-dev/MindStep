/**
 * Submits a game score to the leaderboard API.
 */
export async function submitGameScore(params: {
  userId: string
  userName: string
  gameId: string
  gameName: string
  score: number
  metadata?: Record<string, any>
}): Promise<boolean> {
  try {
    const res = await fetch('/api/games/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    return res.ok
  } catch (e) {
    console.error('Failed to submit game score:', e)
    return false
  }
}
