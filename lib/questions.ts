// ── Question Types ────────────────────────────────────────────────────────────
export type QuestionType = 'frequency_scale' | 'quality_scale' | 'yes_no' | 'multiple_choice'

export type QuestionCategory =
  | 'mood'
  | 'anxiety_stress'
  | 'sleep_energy'
  | 'cognitive'
  | 'social'
  | 'productivity'
  | 'quality_of_life'
  | 'emotional_regulation'
  | 'burnout'
  | 'resilience'
  | 'purpose'

export type MWPQQuestion = {
  id: string
  text: string
  category: QuestionCategory
  type: QuestionType
  // For frequency_scale: 1=Never → 5=Almost Always
  // For quality_scale: 1=Very Poor → 5=Excellent
  // For yes_no: options provided
  // For multiple_choice: options provided
  options?: string[]
  reverse?: boolean // true = high score is bad (e.g. "I felt sad")
  hint?: string
}

// ── MWPQ-70: 7-Day Baseline Pool ─────────────────────────────────────────────
// Daily sampling strategy: 2 Mood + 2 Anxiety/Stress + 1 Sleep + 1 Cognitive + 2 Social + 1 Productivity + 1 QoL = 10/day
export const BASELINE_QUESTIONS: MWPQQuestion[] = [
  // ── Mood & Emotions (Q1-10) ───────────────────────────────────────────────
  {
    id: 'b1', text: 'How often did you feel genuinely happy today?',
    category: 'mood', type: 'frequency_scale', reverse: false,
    hint: 'Think about genuine moments of joy, not just the absence of sadness.',
  },
  {
    id: 'b2', text: 'How often did you feel sad without a clear reason?',
    category: 'mood', type: 'frequency_scale', reverse: true,
    hint: 'Unexplained low moods are important signals.',
  },
  {
    id: 'b3', text: 'How often did you feel hopeful about your future?',
    category: 'mood', type: 'frequency_scale', reverse: false,
    hint: 'Even small hopes count — a deadline passing, a weekend ahead.',
  },
  {
    id: 'b4', text: 'How often did negative thoughts stay in your mind?',
    category: 'mood', type: 'frequency_scale', reverse: true,
    hint: 'Rumination — when a thought loops and you can\'t shake it.',
  },
  {
    id: 'b5', text: 'How often did you enjoy ordinary activities today?',
    category: 'mood', type: 'frequency_scale', reverse: false,
    hint: 'Small pleasures like a meal, a conversation, or a walk.',
  },
  {
    id: 'b6', text: 'How often did you feel emotionally exhausted?',
    category: 'mood', type: 'frequency_scale', reverse: true,
    hint: 'Drained in a way that sleep alone doesn\'t fix.',
  },
  {
    id: 'b7', text: 'How often did you feel calm and peaceful?',
    category: 'mood', type: 'frequency_scale', reverse: false,
    hint: 'A sense of quiet, not anxious or restless.',
  },
  {
    id: 'b8', text: 'How often did you feel overwhelmed?',
    category: 'mood', type: 'frequency_scale', reverse: true,
    hint: 'When everything feels like too much at once.',
  },
  {
    id: 'b9', text: 'How often did you feel satisfied with yourself today?',
    category: 'mood', type: 'frequency_scale', reverse: false,
    hint: 'Not pride — just a quiet okay-ness about who you are.',
  },
  {
    id: 'b10', text: 'How often did you feel like nothing was going right?',
    category: 'mood', type: 'frequency_scale', reverse: true,
    hint: 'A general sense that things are against you.',
  },

  // ── Anxiety & Stress (Q11-20) ─────────────────────────────────────────────
  {
    id: 'b11', text: 'How often did you worry excessively today?',
    category: 'anxiety_stress', type: 'frequency_scale', reverse: true,
    hint: 'Worrying more than the situation warrants.',
  },
  {
    id: 'b12', text: 'How often did you feel under pressure?',
    category: 'anxiety_stress', type: 'frequency_scale', reverse: true,
    hint: 'Pressure from deadlines, expectations, or responsibilities.',
  },
  {
    id: 'b13', text: 'How often did your mind race continuously?',
    category: 'anxiety_stress', type: 'frequency_scale', reverse: true,
    hint: 'Thoughts jumping from one to another, hard to slow down.',
  },
  {
    id: 'b14', text: 'How often did you struggle to relax?',
    category: 'anxiety_stress', type: 'frequency_scale', reverse: true,
    hint: 'Even during free time, feeling unable to switch off.',
  },
  {
    id: 'b15', text: 'How often did small problems feel much bigger than they actually were?',
    category: 'anxiety_stress', type: 'frequency_scale', reverse: true,
    hint: 'Catastrophizing — making mountains out of molehills.',
  },
  {
    id: 'b16', text: 'How often did you feel confident handling challenges?',
    category: 'anxiety_stress', type: 'frequency_scale', reverse: false,
    hint: 'A belief in your own ability to cope.',
  },
  {
    id: 'b17', text: 'How often did stress interfere with your work or studies?',
    category: 'anxiety_stress', type: 'frequency_scale', reverse: true,
    hint: 'When stress actively got in the way of getting things done.',
  },
  {
    id: 'b18', text: 'How often did you feel nervous around others?',
    category: 'anxiety_stress', type: 'frequency_scale', reverse: true,
    hint: 'Social anxiety — discomfort or self-consciousness with people.',
  },
  {
    id: 'b19', text: 'How often did you feel physically tense because of stress?',
    category: 'anxiety_stress', type: 'frequency_scale', reverse: true,
    hint: 'Tightness in shoulders, jaw, chest — the body storing stress.',
  },
  {
    id: 'b20', text: 'How often did you feel emotionally balanced?',
    category: 'anxiety_stress', type: 'frequency_scale', reverse: false,
    hint: 'Not too high, not too low — a steady middle ground.',
  },

  // ── Sleep & Energy (Q21-28) ───────────────────────────────────────────────
  {
    id: 'b21', text: 'How often did you sleep well last night?',
    category: 'sleep_energy', type: 'frequency_scale', reverse: false,
    hint: 'Good sleep = adequate hours + feeling rested.',
  },
  {
    id: 'b22', text: 'How often did you wake up feeling refreshed?',
    category: 'sleep_energy', type: 'frequency_scale', reverse: false,
    hint: 'The difference between waking up ready vs. dragging yourself up.',
  },
  {
    id: 'b23', text: 'How often did you have difficulty falling asleep?',
    category: 'sleep_energy', type: 'frequency_scale', reverse: true,
    hint: 'Lying awake, mind active, unable to drift off.',
  },
  {
    id: 'b24', text: 'How often did you wake up during the night?',
    category: 'sleep_energy', type: 'frequency_scale', reverse: true,
    hint: 'Interrupted or fragmented sleep.',
  },
  {
    id: 'b25', text: 'How often did you feel energetic throughout the day?',
    category: 'sleep_energy', type: 'frequency_scale', reverse: false,
    hint: 'A sustained sense of physical vitality.',
  },
  {
    id: 'b26', text: 'How often did fatigue affect your daily activities?',
    category: 'sleep_energy', type: 'frequency_scale', reverse: true,
    hint: 'When tiredness made things harder to do.',
  },
  {
    id: 'b27', text: 'How often did you feel physically rested?',
    category: 'sleep_energy', type: 'frequency_scale', reverse: false,
    hint: 'A body that feels recovered, not depleted.',
  },
  {
    id: 'b28', text: 'How often did lack of sleep affect your mood?',
    category: 'sleep_energy', type: 'frequency_scale', reverse: true,
    hint: 'Irritability, sadness, or low patience linked to poor sleep.',
  },

  // ── Cognitive Function (Q29-36) ───────────────────────────────────────────
  {
    id: 'b29', text: 'How often could you concentrate easily today?',
    category: 'cognitive', type: 'frequency_scale', reverse: false,
    hint: 'Focusing without fighting your own attention.',
  },
  {
    id: 'b30', text: 'How often did you forget important things?',
    category: 'cognitive', type: 'frequency_scale', reverse: true,
    hint: 'Memory lapses that felt unusual for you.',
  },
  {
    id: 'b31', text: 'How often could you make decisions confidently?',
    category: 'cognitive', type: 'frequency_scale', reverse: false,
    hint: 'Not second-guessing everything.',
  },
  {
    id: 'b32', text: 'How often did you feel mentally clear?',
    category: 'cognitive', type: 'frequency_scale', reverse: false,
    hint: 'The opposite of mental fog — sharp, present, lucid.',
  },
  {
    id: 'b33', text: 'How often did you procrastinate because your mind felt overloaded?',
    category: 'cognitive', type: 'frequency_scale', reverse: true,
    hint: 'Avoiding tasks not out of laziness, but overwhelm.',
  },
  {
    id: 'b34', text: 'How often could you finish tasks without distraction?',
    category: 'cognitive', type: 'frequency_scale', reverse: false,
    hint: 'Sustained focus from start to finish.',
  },
  {
    id: 'b35', text: 'How often did you feel mentally exhausted?',
    category: 'cognitive', type: 'frequency_scale', reverse: true,
    hint: 'When thinking itself feels like a drain.',
  },
  {
    id: 'b36', text: 'How often did learning or understanding new things feel easy?',
    category: 'cognitive', type: 'frequency_scale', reverse: false,
    hint: 'Absorbing information without it bouncing off.',
  },

  // ── Social Wellbeing (Q37-46) ─────────────────────────────────────────────
  {
    id: 'b37', text: 'How often did you enjoy spending time with others?',
    category: 'social', type: 'frequency_scale', reverse: false,
    hint: 'Genuinely enjoying company, not just tolerating it.',
  },
  {
    id: 'b38', text: 'How often did you feel lonely?',
    category: 'social', type: 'frequency_scale', reverse: true,
    hint: 'A sense of being disconnected, even if people were around.',
  },
  {
    id: 'b39', text: 'How often did you feel supported by friends or family?',
    category: 'social', type: 'frequency_scale', reverse: false,
    hint: 'Knowing someone has your back.',
  },
  {
    id: 'b40', text: 'How often did you avoid social interactions?',
    category: 'social', type: 'frequency_scale', reverse: true,
    hint: 'Withdrawing from people more than usual.',
  },
  {
    id: 'b41', text: 'How often did you feel understood by people close to you?',
    category: 'social', type: 'frequency_scale', reverse: false,
    hint: 'The feeling of being truly heard.',
  },
  {
    id: 'b42', text: 'How often did you have meaningful conversations?',
    category: 'social', type: 'frequency_scale', reverse: false,
    hint: 'Exchanges that went beyond surface-level small talk.',
  },
  {
    id: 'b43', text: 'How often did you feel connected to others?',
    category: 'social', type: 'frequency_scale', reverse: false,
    hint: 'A sense of belonging and not being alone.',
  },
  {
    id: 'b44', text: 'How often did conflicts affect your mood?',
    category: 'social', type: 'frequency_scale', reverse: true,
    hint: 'Arguments or tension spilling into how you felt.',
  },
  {
    id: 'b45', text: 'How often did you express your feelings openly?',
    category: 'social', type: 'frequency_scale', reverse: false,
    hint: 'Being able to say what you feel without holding back.',
  },
  {
    id: 'b46', text: 'How often did you feel isolated?',
    category: 'social', type: 'frequency_scale', reverse: true,
    hint: 'A deeper sense of being cut off — beyond just being alone.',
  },

  // ── Daily Functioning & Productivity (Q47-55) ─────────────────────────────
  {
    id: 'b47', text: 'How often did you complete your planned tasks today?',
    category: 'productivity', type: 'frequency_scale', reverse: false,
    hint: 'Getting through your to-do list, even partially.',
  },
  {
    id: 'b48', text: 'How often did you struggle to start simple activities?',
    category: 'productivity', type: 'frequency_scale', reverse: true,
    hint: 'When even easy tasks felt like moving through mud.',
  },
  {
    id: 'b49', text: 'How often did you feel capable of handling your responsibilities?',
    category: 'productivity', type: 'frequency_scale', reverse: false,
    hint: 'A sense of being adequate for what\'s demanded of you.',
  },
  {
    id: 'b50', text: 'How often did you enjoy your work or studies?',
    category: 'productivity', type: 'frequency_scale', reverse: false,
    hint: 'Moments of genuine engagement, not just enduring.',
  },
  {
    id: 'b51', text: 'How often did you feel productive?',
    category: 'productivity', type: 'frequency_scale', reverse: false,
    hint: 'A sense that your effort was translating into results.',
  },
  {
    id: 'b52', text: 'How often did you feel everything was becoming too much?',
    category: 'productivity', type: 'frequency_scale', reverse: true,
    hint: 'A sense of being at your limit.',
  },
  {
    id: 'b53', text: 'How often did you feel useful?',
    category: 'productivity', type: 'frequency_scale', reverse: false,
    hint: 'Contributing to something — even something small.',
  },
  {
    id: 'b54', text: 'How often did you feel motivated today?',
    category: 'productivity', type: 'frequency_scale', reverse: false,
    hint: 'A drive to start, continue, or finish something.',
  },
  {
    id: 'b55', text: 'How often did you feel in control of your daily life?',
    category: 'productivity', type: 'frequency_scale', reverse: false,
    hint: 'A sense of agency — your choices, your direction.',
  },

  // ── Overall Quality of Life (Q56-70, quality_scale 1=Very Poor → 5=Excellent)
  {
    id: 'b56', text: 'Rate your overall quality of life today.',
    category: 'quality_of_life', type: 'quality_scale', reverse: false,
    hint: 'A holistic sense of how your life feels right now.',
  },
  {
    id: 'b57', text: 'Rate your physical health today.',
    category: 'quality_of_life', type: 'quality_scale', reverse: false,
    hint: 'Energy, body comfort, physical wellbeing.',
  },
  {
    id: 'b58', text: 'Rate your mental wellbeing today.',
    category: 'quality_of_life', type: 'quality_scale', reverse: false,
    hint: 'Emotional and psychological state.',
  },
  {
    id: 'b59', text: 'Rate your ability to handle stress today.',
    category: 'quality_of_life', type: 'quality_scale', reverse: false,
    hint: 'How well you coped with pressure.',
  },
  {
    id: 'b60', text: 'Rate your sleep quality from last night.',
    category: 'quality_of_life', type: 'quality_scale', reverse: false,
    hint: 'How restorative your sleep actually was.',
  },
  {
    id: 'b61', text: 'Rate your relationships with family and friends today.',
    category: 'quality_of_life', type: 'quality_scale', reverse: false,
    hint: 'The health and warmth of your closest connections.',
  },
  {
    id: 'b62', text: 'Rate your work or study satisfaction today.',
    category: 'quality_of_life', type: 'quality_scale', reverse: false,
    hint: 'How fulfilling your academic or work life felt.',
  },
  {
    id: 'b63', text: 'Rate your confidence in yourself today.',
    category: 'quality_of_life', type: 'quality_scale', reverse: false,
    hint: 'Belief in your own abilities and worth.',
  },
  {
    id: 'b64', text: 'Rate your ability to enjoy life today.',
    category: 'quality_of_life', type: 'quality_scale', reverse: false,
    hint: 'Capacity for pleasure, fun, or simple contentment.',
  },
  {
    id: 'b65', text: 'Rate your sense of purpose today.',
    category: 'quality_of_life', type: 'quality_scale', reverse: false,
    hint: 'A feeling that what you do matters.',
  },
  {
    id: 'b66', text: 'Rate your feeling of safety and security today.',
    category: 'quality_of_life', type: 'quality_scale', reverse: false,
    hint: 'Physical and emotional safety in your environment.',
  },
  {
    id: 'b67', text: 'Rate your financial comfort today.',
    category: 'quality_of_life', type: 'quality_scale', reverse: false,
    hint: 'Freedom from financial stress.',
  },
  {
    id: 'b68', text: 'Rate your living environment today.',
    category: 'quality_of_life', type: 'quality_scale', reverse: false,
    hint: 'Your room, hostel, or home — does it feel okay?',
  },
  {
    id: 'b69', text: 'Rate your ability to balance responsibilities and relaxation today.',
    category: 'quality_of_life', type: 'quality_scale', reverse: false,
    hint: 'Work hard, rest well — how well did you balance them?',
  },
  {
    id: 'b70', text: 'Rate your overall satisfaction with your life today.',
    category: 'quality_of_life', type: 'quality_scale', reverse: false,
    hint: 'Your deepest gut-feeling about how things are.',
  },
]

// ── Daily Monitoring Pool: 70 Questions (Day 8+, 7-10 per day randomly) ──────
export const DAILY_QUESTIONS: MWPQQuestion[] = [
  // ── Mood & Positive Affect (1-5) ─────────────────────────────────────────
  {
    id: 'd1', text: 'Today I felt genuinely happy.',
    category: 'mood', type: 'frequency_scale', reverse: false,
    hint: 'Real happiness, not just putting on a face.',
  },
  {
    id: 'd2', text: 'I enjoyed activities that usually make me feel good.',
    category: 'mood', type: 'frequency_scale', reverse: false,
    hint: 'Your favourite things — did they still feel good?',
  },
  {
    id: 'd3', text: 'I felt hopeful about my future.',
    category: 'mood', type: 'frequency_scale', reverse: false,
    hint: 'Even small hopes — a weekend, a finished assignment.',
  },
  {
    id: 'd4', text: 'I smiled or laughed naturally today.',
    category: 'mood', type: 'frequency_scale', reverse: false,
    hint: 'Unforced, genuine laughter or smiling.',
  },
  {
    id: 'd5', text: 'I felt emotionally balanced today.',
    category: 'mood', type: 'frequency_scale', reverse: false,
    hint: 'Not too high or low — a steady, neutral state.',
  },
  // ── Depressive Thoughts (6-10) ────────────────────────────────────────────
  {
    id: 'd6', text: 'I felt sad for most of the day.',
    category: 'mood', type: 'frequency_scale', reverse: true,
    hint: 'A persistent heaviness that didn\'t lift.',
  },
  {
    id: 'd7', text: 'I felt that nothing was enjoyable.',
    category: 'mood', type: 'frequency_scale', reverse: true,
    hint: 'Anhedonia — when things you usually like feel flat.',
  },
  {
    id: 'd8', text: 'I blamed myself for things unnecessarily.',
    category: 'mood', type: 'frequency_scale', reverse: true,
    hint: 'Taking on guilt for things that weren\'t really your fault.',
  },
  {
    id: 'd9', text: 'I felt like a failure.',
    category: 'mood', type: 'frequency_scale', reverse: true,
    hint: 'A global sense of not being good enough.',
  },
  {
    id: 'd10', text: 'I felt life had very little meaning.',
    category: 'mood', type: 'frequency_scale', reverse: true,
    hint: 'A sense of emptiness or pointlessness.',
  },
  // ── Anxiety & Worry (11-15) ───────────────────────────────────────────────
  {
    id: 'd11', text: 'I worried about many different things today.',
    category: 'anxiety_stress', type: 'frequency_scale', reverse: true,
    hint: 'Jumping from one worry to another.',
  },
  {
    id: 'd12', text: 'I found it difficult to stop worrying.',
    category: 'anxiety_stress', type: 'frequency_scale', reverse: true,
    hint: 'Worry that stuck even when you tried to let go.',
  },
  {
    id: 'd13', text: 'I felt nervous without a clear reason.',
    category: 'anxiety_stress', type: 'frequency_scale', reverse: true,
    hint: 'Free-floating anxiety with no obvious trigger.',
  },
  {
    id: 'd14', text: 'I expected something bad to happen.',
    category: 'anxiety_stress', type: 'frequency_scale', reverse: true,
    hint: 'A persistent sense of dread or anticipation of bad news.',
  },
  {
    id: 'd15', text: 'I felt on edge most of the day.',
    category: 'anxiety_stress', type: 'frequency_scale', reverse: true,
    hint: 'Hyper-alert, easily startled, unable to settle.',
  },
  // ── Stress & Coping (16-20) ───────────────────────────────────────────────
  {
    id: 'd16', text: 'I felt overwhelmed by responsibilities.',
    category: 'anxiety_stress', type: 'frequency_scale', reverse: true,
    hint: 'More on your plate than you felt you could manage.',
  },
  {
    id: 'd17', text: 'I handled stressful situations confidently.',
    category: 'anxiety_stress', type: 'frequency_scale', reverse: false,
    hint: 'Facing pressure without falling apart.',
  },
  {
    id: 'd18', text: 'Small problems felt impossible to solve today.',
    category: 'anxiety_stress', type: 'frequency_scale', reverse: true,
    hint: 'When tiny obstacles feel like walls.',
  },
  {
    id: 'd19', text: 'I felt mentally exhausted today.',
    category: 'cognitive', type: 'frequency_scale', reverse: true,
    hint: 'Drained from thinking, not just from physical activity.',
  },
  {
    id: 'd20', text: 'I recovered quickly after stress today.',
    category: 'resilience', type: 'frequency_scale', reverse: false,
    hint: 'Bouncing back, not staying stuck in stress mode.',
  },
  // ── Sleep & Rest (21-25) ──────────────────────────────────────────────────
  {
    id: 'd21', text: 'Did you sleep well last night?',
    category: 'sleep_energy', type: 'yes_no',
    options: ['Yes, slept great', 'Somewhat okay', 'No, slept poorly'],
    hint: 'Both duration and quality matter.',
  },
  {
    id: 'd22', text: 'I had trouble falling asleep last night.',
    category: 'sleep_energy', type: 'frequency_scale', reverse: true,
    hint: 'Lying awake, unable to drift off.',
  },
  {
    id: 'd23', text: 'I woke up feeling refreshed this morning.',
    category: 'sleep_energy', type: 'frequency_scale', reverse: false,
    hint: 'Ready to start the day, not dragging yourself up.',
  },
  {
    id: 'd24', text: 'I woke up multiple times during the night.',
    category: 'sleep_energy', type: 'frequency_scale', reverse: true,
    hint: 'Fragmented sleep that interrupted your rest.',
  },
  {
    id: 'd25', text: 'I felt sleepy during the day.',
    category: 'sleep_energy', type: 'frequency_scale', reverse: true,
    hint: 'Daytime drowsiness, fighting to stay awake.',
  },
  // ── Energy & Motivation (26-30) ───────────────────────────────────────────
  {
    id: 'd26', text: 'I had enough energy for my daily tasks.',
    category: 'sleep_energy', type: 'frequency_scale', reverse: false,
    hint: 'Physical and mental fuel to get through the day.',
  },
  {
    id: 'd27', text: 'I struggled to get started on simple tasks today.',
    category: 'productivity', type: 'frequency_scale', reverse: true,
    hint: 'Even easy tasks felt like a hurdle.',
  },
  {
    id: 'd28', text: 'I stayed motivated throughout the day.',
    category: 'productivity', type: 'frequency_scale', reverse: false,
    hint: 'Drive that lasted, not just a morning burst.',
  },
  {
    id: 'd29', text: 'I felt physically drained today.',
    category: 'sleep_energy', type: 'frequency_scale', reverse: true,
    hint: 'Body fatigue, not just mental tiredness.',
  },
  {
    id: 'd30', text: 'I completed what I planned for today.',
    category: 'productivity', type: 'frequency_scale', reverse: false,
    hint: 'Following through on what you set out to do.',
  },
  // ── Concentration & Decisions (31-35) ────────────────────────────────────
  {
    id: 'd31', text: 'I concentrated easily today.',
    category: 'cognitive', type: 'frequency_scale', reverse: false,
    hint: 'Focus that came naturally, without constant effort.',
  },
  {
    id: 'd32', text: 'My thoughts felt scattered today.',
    category: 'cognitive', type: 'frequency_scale', reverse: true,
    hint: 'Unable to hold one thought before another jumped in.',
  },
  {
    id: 'd33', text: 'I made decisions confidently today.',
    category: 'cognitive', type: 'frequency_scale', reverse: false,
    hint: 'Choosing without excessive second-guessing.',
  },
  {
    id: 'd34', text: 'I forgot important things today.',
    category: 'cognitive', type: 'frequency_scale', reverse: true,
    hint: 'Memory lapses that felt unusual.',
  },
  {
    id: 'd35', text: 'I stayed focused without distraction today.',
    category: 'cognitive', type: 'frequency_scale', reverse: false,
    hint: 'Deep work — not constantly interrupted by your own mind.',
  },
  // ── Social Connection (36-40) ─────────────────────────────────────────────
  {
    id: 'd36', text: 'I felt connected to people around me today.',
    category: 'social', type: 'frequency_scale', reverse: false,
    hint: 'A sense of warmth and belonging with others.',
  },
  {
    id: 'd37', text: 'I avoided social interaction today.',
    category: 'social', type: 'frequency_scale', reverse: true,
    hint: 'Withdrawing more than usual.',
  },
  {
    id: 'd38', text: 'I felt supported by friends or family today.',
    category: 'social', type: 'frequency_scale', reverse: false,
    hint: 'Someone had your back.',
  },
  {
    id: 'd39', text: 'I felt lonely even when others were around.',
    category: 'social', type: 'frequency_scale', reverse: true,
    hint: 'Present but disconnected — invisible in a crowd.',
  },
  {
    id: 'd40', text: 'I had a meaningful conversation today.',
    category: 'social', type: 'yes_no',
    options: ['Yes', 'Not really', 'No'],
    hint: 'Beyond small talk — something that actually mattered.',
  },
  // ── Self-worth & Confidence (41-45) ──────────────────────────────────────
  {
    id: 'd41', text: 'I felt proud of myself today.',
    category: 'mood', type: 'frequency_scale', reverse: false,
    hint: 'Even a small win counts.',
  },
  {
    id: 'd42', text: 'I doubted my abilities today.',
    category: 'mood', type: 'frequency_scale', reverse: true,
    hint: 'Questioning whether you are good enough.',
  },
  {
    id: 'd43', text: 'I accepted myself as I am today.',
    category: 'mood', type: 'frequency_scale', reverse: false,
    hint: 'Not fighting who you are.',
  },
  {
    id: 'd44', text: 'I compared myself negatively to others today.',
    category: 'mood', type: 'frequency_scale', reverse: true,
    hint: 'Looking at others and feeling lesser.',
  },
  {
    id: 'd45', text: 'I believed I could handle my challenges today.',
    category: 'resilience', type: 'frequency_scale', reverse: false,
    hint: 'A sense of inner strength and coping capacity.',
  },
  // ── Physical Symptoms (46-50) ─────────────────────────────────────────────
  {
    id: 'd46', text: 'Stress caused physical tension in my body today.',
    category: 'anxiety_stress', type: 'frequency_scale', reverse: true,
    hint: 'Tight shoulders, clenched jaw, chest tightness.',
  },
  {
    id: 'd47', text: 'I noticed headaches or body discomfort from stress today.',
    category: 'anxiety_stress', type: 'frequency_scale', reverse: true,
    hint: 'Physical symptoms linked to emotional pressure.',
  },
  {
    id: 'd48', text: 'My appetite felt normal today.',
    category: 'sleep_energy', type: 'yes_no',
    options: ['Yes, ate normally', 'Ate more than usual', 'Ate less than usual', 'Skipped meals'],
    hint: 'Appetite changes are often early signs of stress.',
  },
  {
    id: 'd49', text: 'I felt restless or unable to relax today.',
    category: 'anxiety_stress', type: 'frequency_scale', reverse: true,
    hint: 'A physical or mental inability to settle down.',
  },
  {
    id: 'd50', text: 'My physical health supported my daily life today.',
    category: 'quality_of_life', type: 'frequency_scale', reverse: false,
    hint: 'Body cooperating, not getting in the way.',
  },
  // ── Emotional Regulation (51-55) ──────────────────────────────────────────
  {
    id: 'd51', text: 'I was able to calm myself down after becoming upset.',
    category: 'emotional_regulation', type: 'frequency_scale', reverse: false,
    hint: 'Self-soothing — bringing yourself back from a spike.',
  },
  {
    id: 'd52', text: 'My emotions changed very quickly throughout the day.',
    category: 'emotional_regulation', type: 'frequency_scale', reverse: true,
    hint: 'Emotional volatility — rapid swings without clear cause.',
  },
  {
    id: 'd53', text: 'I reacted more strongly than the situation required.',
    category: 'emotional_regulation', type: 'frequency_scale', reverse: true,
    hint: 'Overreacting — more intensity than the moment warranted.',
  },
  {
    id: 'd54', text: 'I felt in control of my emotions today.',
    category: 'emotional_regulation', type: 'frequency_scale', reverse: false,
    hint: 'Emotions guiding you, not running away from you.',
  },
  {
    id: 'd55', text: 'I found it difficult to let go of negative experiences.',
    category: 'emotional_regulation', type: 'frequency_scale', reverse: true,
    hint: 'Replaying bad moments, unable to move on.',
  },
  // ── Burnout & Overload (56-60) ────────────────────────────────────────────
  {
    id: 'd56', text: 'Even simple tasks felt mentally exhausting today.',
    category: 'burnout', type: 'frequency_scale', reverse: true,
    hint: 'When effort doesn\'t match outcome — everything drains you.',
  },
  {
    id: 'd57', text: 'I felt like I was running on autopilot today.',
    category: 'burnout', type: 'frequency_scale', reverse: true,
    hint: 'Going through motions without real presence or engagement.',
  },
  {
    id: 'd58', text: 'I had enough mental energy to finish my responsibilities.',
    category: 'burnout', type: 'frequency_scale', reverse: false,
    hint: 'Cognitive reserves to see things through.',
  },
  {
    id: 'd59', text: 'I felt emotionally drained by my daily routine.',
    category: 'burnout', type: 'frequency_scale', reverse: true,
    hint: 'Exhausted not by anything dramatic, just by normal life.',
  },
  {
    id: 'd60', text: 'I wanted to avoid work or studies because I felt overwhelmed.',
    category: 'burnout', type: 'frequency_scale', reverse: true,
    hint: 'Avoidance driven by overload, not laziness.',
  },
  // ── Resilience & Recovery (61-65) ─────────────────────────────────────────
  {
    id: 'd61', text: 'I bounced back quickly after facing difficulties today.',
    category: 'resilience', type: 'frequency_scale', reverse: false,
    hint: 'Recovery speed — how quickly you regained equilibrium.',
  },
  {
    id: 'd62', text: 'I believed I could overcome my current problems.',
    category: 'resilience', type: 'frequency_scale', reverse: false,
    hint: 'A belief in your own ability to get through it.',
  },
  {
    id: 'd63', text: 'One bad moment ruined my entire day.',
    category: 'resilience', type: 'frequency_scale', reverse: true,
    hint: 'A single event casting a shadow over everything else.',
  },
  {
    id: 'd64', text: 'I felt stronger after dealing with challenges today.',
    category: 'resilience', type: 'frequency_scale', reverse: false,
    hint: 'Post-adversity growth — difficulties making you tougher.',
  },
  {
    id: 'd65', text: 'I trusted myself to handle unexpected situations today.',
    category: 'resilience', type: 'frequency_scale', reverse: false,
    hint: 'Confidence in your improvisation ability.',
  },
  // ── Purpose & Future Orientation (66-70) ─────────────────────────────────
  {
    id: 'd66', text: 'I felt that my daily activities had meaning.',
    category: 'purpose', type: 'frequency_scale', reverse: false,
    hint: 'A sense that what you did today mattered.',
  },
  {
    id: 'd67', text: 'I felt excited about something in the future.',
    category: 'purpose', type: 'frequency_scale', reverse: false,
    hint: 'Anticipation for something ahead, big or small.',
  },
  {
    id: 'd68', text: 'I felt like I was simply existing instead of living.',
    category: 'purpose', type: 'frequency_scale', reverse: true,
    hint: 'Just going through the motions without real engagement.',
  },
  {
    id: 'd69', text: 'I believed my efforts today would improve my future.',
    category: 'purpose', type: 'frequency_scale', reverse: false,
    hint: 'A connection between today\'s work and tomorrow\'s outcomes.',
  },
  {
    id: 'd70', text: 'I felt optimistic about the direction of my life.',
    category: 'purpose', type: 'frequency_scale', reverse: false,
    hint: 'Overall orientation toward the future — hopeful or bleak?',
  },
]

// ── Sampling Strategy ─────────────────────────────────────────────────────────
// For 7-day baseline: 2 mood + 2 anxiety_stress + 1 sleep_energy + 1 cognitive + 2 social + 1 productivity + 1 quality_of_life
export const BASELINE_DAILY_DISTRIBUTION: Record<QuestionCategory, number> = {
  mood: 2,
  anxiety_stress: 2,
  sleep_energy: 1,
  cognitive: 1,
  social: 2,
  productivity: 1,
  quality_of_life: 1,
  emotional_regulation: 0,
  burnout: 0,
  resilience: 0,
  purpose: 0,
}

// For daily monitoring (day 8+): 1 mood + 1 anxiety + 1 sleep + 1 cognitive + 1 social + 1 productivity + 1 emotional_regulation + 1 burnout + 1 resilience + 1 purpose = 10
export const DAILY_DISTRIBUTION: Record<QuestionCategory, number> = {
  mood: 1,
  anxiety_stress: 1,
  sleep_energy: 1,
  cognitive: 1,
  social: 1,
  productivity: 1,
  quality_of_life: 0,
  emotional_regulation: 1,
  burnout: 1,
  resilience: 1,
  purpose: 1,
}

// ── Score interpretation thresholds (MWPQ derived from user spec) ─────────────
// Scores are normalized to 1-5 scale.
// Stable: avg ≥ 4.0 and no domain below 3.2
// Drifting: avg 3.2–3.9 with gradual decline in key domains
// Needs Attention: avg 2.5–3.1 or two domains consistently low
// Alert: persistent low scores < 2.5 or rapid deterioration
export const SCORE_THRESHOLDS = {
  STABLE: 4.0,
  DRIFTING_UPPER: 3.9,
  DRIFTING_LOWER: 3.2,
  NEEDS_ATTENTION_UPPER: 3.1,
  NEEDS_ATTENTION_LOWER: 2.5,
  ALERT: 2.5,
  DOMAIN_LOW_THRESHOLD: 3.2,
}
