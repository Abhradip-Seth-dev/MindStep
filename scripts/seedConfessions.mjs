/**
 * Seed script — writes dummy Campus Confessions to Firestore
 * Run: node scripts/seedConfessions.mjs
 */
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Load env ────────────────────────────────────────────────────────────────
const envPath = resolve(__dirname, '../.env.local')
const envContent = readFileSync(envPath, 'utf8')
const envVars = {}
for (const line of envContent.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const idx = trimmed.indexOf('=')
  if (idx === -1) continue
  const key = trimmed.slice(0, idx).trim()
  const value = trimmed.slice(idx + 1).trim()
  envVars[key] = value
}

const b64Key = envVars['FIREBASE_SERVICE_ACCOUNT_KEY']
if (!b64Key) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY not found in .env.local')

const serviceAccount = JSON.parse(Buffer.from(b64Key, 'base64').toString('utf8'))

initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

// ── Dummy data ───────────────────────────────────────────────────────────────
const DUMMY_UIDS = [
  'seed_user_001', 'seed_user_002', 'seed_user_003',
  'seed_user_004', 'seed_user_005', 'seed_user_006',
]

const CONFESSIONS = [
  {
    text: "I failed 2 classes my first semester and thought my life was over. I was too ashamed to tell my parents. Three years later, I'm graduating with a great job offer. It genuinely gets better — I promise.",
    author: 'Anonymous Senior',
    color: '#E05C5C',
    likes: 438,
    comments: 0,
    reposts: 19,
    likedBy: DUMMY_UIDS.slice(0, 4),
    repostedBy: DUMMY_UIDS.slice(0, 2),
    dummyComments: [
      { text: "This literally made me cry. Thank you for sharing 💙", author: 'Anonymous Sophomore' },
      { text: "I needed to read this today. Currently failing one class and spiraling.", author: 'Anonymous Freshman' },
      { text: "You give me hope. Genuinely.", author: 'Anonymous Junior' },
    ],
  },
  {
    text: "Everyone on campus seems to have solid friend groups except me. I eat lunch in the library so no one sees me sitting alone. If you also feel this way — you're not the only one.",
    author: 'Anonymous Freshman',
    color: '#5B9CF6',
    likes: 892,
    comments: 0,
    reposts: 41,
    likedBy: DUMMY_UIDS,
    repostedBy: DUMMY_UIDS.slice(0, 3),
    dummyComments: [
      { text: "I do the exact same thing. Third year and still eating alone most days.", author: 'Anonymous Student' },
      { text: "Come sit with me anytime seriously. Library block B, most afternoons.", author: 'Anonymous Friend' },
      { text: "The friend group illusion on campus is so real. Most people are just faking it.", author: 'Anonymous Senior' },
      { text: "I felt this in my soul. You're so not alone.", author: 'Anonymous Sophomore' },
    ],
  },
  {
    text: "I haven't slept properly in 3 weeks. Exams, a part-time job, and a family crisis all at once. I smile in class but I'm running on empty. I just needed to say that somewhere.",
    author: 'Anonymous Student',
    color: '#E8A04A',
    likes: 561,
    comments: 0,
    reposts: 27,
    likedBy: DUMMY_UIDS.slice(1, 5),
    repostedBy: DUMMY_UIDS.slice(1, 3),
    dummyComments: [
      { text: "Please rest when you can. You matter more than your grades.", author: 'Anonymous Senior' },
      { text: "I'm so sorry. That's genuinely too much for one person to carry.", author: 'Anonymous Counselor' },
      { text: "Sending you so much strength 🧡", author: 'Anonymous Friend' },
    ],
  },
  {
    text: "I came to college thinking I'd figure out my life. Two years in, I'm more lost than ever. But weirdly, I'm okay with that now. The uncertainty is the point, I think.",
    author: 'Anonymous Junior',
    color: '#4FC3A1',
    likes: 317,
    comments: 0,
    reposts: 14,
    likedBy: DUMMY_UIDS.slice(2, 5),
    repostedBy: [DUMMY_UIDS[0]],
    dummyComments: [
      { text: "This is the most mature thing I've read all week.", author: 'Anonymous Senior' },
      { text: "I wish someone had told me this in my first year.", author: 'Anonymous Student' },
    ],
  },
  {
    text: "I called my mom crying at 2am last week because I felt so overwhelmed. She stayed on the phone for 2 hours. I forget how lucky I am to have her. Just wanted to share something warm for once.",
    author: 'Anonymous Student',
    color: '#A78BFA',
    likes: 724,
    comments: 0,
    reposts: 33,
    likedBy: DUMMY_UIDS.slice(0, 5),
    repostedBy: DUMMY_UIDS.slice(0, 2),
    dummyComments: [
      { text: "I just called my mom after reading this. Thank you.", author: 'Anonymous Freshman' },
      { text: "This is the sweetest thing. Give your mom a hug 🥺", author: 'Anonymous Sophomore' },
      { text: "Sometimes we just need to hear a familiar voice. Glad you have that.", author: 'Anonymous Student' },
    ],
  },
  {
    text: "I've been pretending to understand lectures for 4 months because I'm scared to raise my hand and look stupid. Today I finally asked a question. The professor said it was a great question. I almost cried.",
    author: 'Anonymous Sophomore',
    color: '#5B9CF6',
    likes: 648,
    comments: 0,
    reposts: 29,
    likedBy: DUMMY_UIDS,
    repostedBy: DUMMY_UIDS.slice(1, 4),
    dummyComments: [
      { text: "This is a bigger win than you think. Genuinely proud of you.", author: 'Anonymous Senior' },
      { text: "Raise your hand again tomorrow. It gets easier each time.", author: 'Anonymous Junior' },
      { text: "Fear of looking dumb is the number one silent killer of potential.", author: 'Anonymous Professor (lol)' },
    ],
  },
  {
    text: "Mental health days should be as acceptable as sick days. I took one last week — stayed in bed, watched movies, ordered food — and I came back the next day actually able to focus. Zero shame.",
    author: 'Anonymous Final Year',
    color: '#4FC3A1',
    likes: 902,
    comments: 0,
    reposts: 55,
    likedBy: DUMMY_UIDS,
    repostedBy: DUMMY_UIDS,
    dummyComments: [
      { text: "Normalize this. Please.", author: 'Anonymous Student' },
      { text: "My productivity after a rest day is always 3x better. Science agrees.", author: 'Anonymous Nerd' },
      { text: "Taking one tomorrow. This was the sign I needed.", author: 'Anonymous Sophomore' },
      { text: "Love this energy. Rest is not laziness.", author: 'Anonymous Senior' },
    ],
  },
  {
    text: "I've been going to the gym not for aesthetics but because it's the only hour of the day my brain goes quiet. It's become my therapy. Didn't expect that.",
    author: 'Anonymous Junior',
    color: '#E8A04A',
    likes: 421,
    comments: 0,
    reposts: 18,
    likedBy: DUMMY_UIDS.slice(0, 4),
    repostedBy: DUMMY_UIDS.slice(0, 2),
    dummyComments: [
      { text: "Exactly this. Exercise as meditation. Underrated.", author: 'Anonymous Student' },
      { text: "This is why I started too. Glad I'm not alone.", author: 'Anonymous Freshman' },
    ],
  },
]

// ── Seed ─────────────────────────────────────────────────────────────────────
async function seed() {
  console.log('🌱 Seeding Firestore with dummy confessions...\n')

  for (const confession of CONFESSIONS) {
    const { dummyComments, ...confessionData } = confession

    // Write the confession document
    const docRef = await db.collection('confessions').add({
      ...confessionData,
      createdAt: FieldValue.serverTimestamp(),
      userId: 'seed_system',
    })

    console.log(`✅ Created confession: "${confessionData.text.slice(0, 50)}..."`)

    // Write sub-collection comments
    for (const comment of dummyComments) {
      await docRef.collection('comments').add({
        ...comment,
        userId: 'seed_system',
        createdAt: FieldValue.serverTimestamp(),
      })
    }

    // Update comments count
    await docRef.update({ comments: dummyComments.length })
    console.log(`   💬 Added ${dummyComments.length} comments`)
  }

  console.log('\n🎉 Seeding complete! All confessions are now live in Firestore.')
  process.exit(0)
}

seed().catch(err => {
  console.error('❌ Seeding failed:', err)
  process.exit(1)
})
