
import { AppSettings, UserStats, Achievement, Routine, ColorTheme, LevelReward } from './types';

// Theme Definitions
export const THEMES: Record<ColorTheme, { name: string; primary: string; secondary: string; unlockLevel: number }> = {
  violet: { name: 'Violet', primary: '#8b5cf6', secondary: '#10b981', unlockLevel: 1 }, 
  emerald: { name: 'Emerald', primary: '#10b981', secondary: '#3b82f6', unlockLevel: 1 },
  rose: { name: 'Rose', primary: '#f43f5e', secondary: '#8b5cf6', unlockLevel: 5 },
  amber: { name: 'Amber', primary: '#f59e0b', secondary: '#ef4444', unlockLevel: 10 },
  blue: { name: 'Blue', primary: '#3b82f6', secondary: '#8b5cf6', unlockLevel: 15 },
  midnight: { name: 'Midnight', primary: '#6366f1', secondary: '#a855f7', unlockLevel: 25 },
  neon: { name: 'Neon', primary: '#d946ef', secondary: '#06b6d4', unlockLevel: 35 },
  custom: { name: 'Grand Master', primary: '#ffffff', secondary: '#ffffff', unlockLevel: 50 }, // Dynamic
};

export const LEVEL_REWARDS: LevelReward[] = [
  { level: 5, type: 'theme', label: 'Rose Theme', value: 'rose', description: 'Unlock the passionate Rose color theme.' },
  { level: 10, type: 'theme', label: 'Amber Theme', value: 'amber', description: 'Unlock the energetic Amber color theme.' },
  { level: 15, type: 'theme', label: 'Blue Theme', value: 'blue', description: 'Unlock the calm Blue color theme.' },
  { level: 25, type: 'theme', label: 'Midnight Theme', value: 'midnight', description: 'Unlock the deep Midnight color theme.' },
  { level: 35, type: 'theme', label: 'Neon Theme', value: 'neon', description: 'Unlock the vibrant Neon color theme.' },
  { level: 50, type: 'badge', label: 'Grand Master', description: 'Earn the Grand Master status badge and a special reward.' },
];

export const DEFAULT_ROUTINE: Routine = {
  id: 'default',
  name: 'Daily Vocal Tutorial',
  blocks: [
    { 
      id: '1', 
      title: 'Diaphragmatic Breathing', 
      duration: 180, 
      description: '3x breaths: In nose (4s), Hold (4s), Out mouth (6s). Focus on belly expansion.' 
    },
    { 
      id: '2', 
      title: 'Lip Trills (SOVTE)', 
      duration: 180, 
      description: 'Relax cheeks/lips. Make a gentle "brrr" motorboat sound. Keep airflow steady, no straining.' 
    },
    { 
      id: '3', 
      title: 'Pitch Matching', 
      duration: 300, 
      description: 'Use the pitch tracker. Aim for your target (e.g., C4). Match the pitch shown on screen.' 
    },
    { 
      id: '4', 
      title: 'Scales on SOVTEs', 
      duration: 300, 
      description: 'Perform lip trills or use a straw while sliding through a comfortable scale. Focus on smooth transitions.' 
    },
    { 
      id: '5', 
      title: 'Big Dog / Small Dog', 
      duration: 300, 
      description: 'Resonance: Pant like a big dog (dark/low larynx), then a small dog (bright/high larynx). Aim for the small dog sensation.' 
    },
    { 
      id: '6', 
      title: 'Cool Down', 
      duration: 180, 
      description: 'Gentle humming or soft lip trills at a comfortable, low pitch to relax the vocal cords.' 
    }
  ]
};

// Starting points for new routines. Blocks are copied with fresh ids when used.
export const ROUTINE_TEMPLATES: { key: string; name: string; summary: string; blocks: Omit<Routine['blocks'][number], 'id'>[] }[] = [
  {
    key: 'feminization',
    name: 'Feminization basics',
    summary: 'Breathing, SOVT warm-up, pitch matching, small-dog resonance, cool-down.',
    blocks: DEFAULT_ROUTINE.blocks.map(({ id, ...b }) => b),
  },
  {
    key: 'masculinization',
    name: 'Masculinization basics',
    summary: 'Breathing, SOVT warm-up, chest resonance, open throat, pitch matching, speaking practice. Check your target range on Today.',
    blocks: [
      { title: 'Diaphragmatic Breathing', duration: 180, description: 'Breathe low into the belly with relaxed shoulders: in through the nose (4s), out slowly (6s).' },
      { title: 'Lip Trills or Straw (SOVT)', duration: 180, description: 'Gentle "brrr" or straw phonation with easy glides. Keep it light and comfortable; this warms up without strain.' },
      { title: 'Chest Resonance Hum', duration: 240, description: 'Hum "mmm" on a comfortable low note with a hand on your chest. Aim to feel the vibration there. Don’t push your pitch down to get it.' },
      { title: 'Open Throat Yawn-Sigh', duration: 240, description: 'Start a yawn to open the back of the throat, then sigh "ahh" downward from a comfortable pitch. Let the larynx settle lower on its own, without pressing.' },
      { title: 'Pitch Matching', duration: 300, description: 'Check that your target range fits your goal (Edit next to Your voice on Today); masculinizing voices often aim around 85–155 Hz. Count or say short words and keep them inside it. Never force your pitch down.' },
      { title: 'Speaking Practice', duration: 0, description: 'Read the phrases aloud with the chest resonance you found. Move on when you’re ready.', prompts: ['Good morning, how are you?', 'I’ll have a coffee, please.', 'The train leaves at half past nine.', 'Can you pass me that book?'] },
      { title: 'Cool Down', duration: 120, description: 'Soft humming or lip trills at a comfortable pitch. Stop if anything feels strained.' },
    ],
  },
  {
    key: 'androgynous',
    name: 'Androgynous basics',
    summary: 'Breathing, SOVT warm-up, flexible resonance, pitch held mid-range, speaking practice.',
    blocks: [
      { title: 'Diaphragmatic Breathing', duration: 180, description: 'Breathe low into the belly with relaxed shoulders: in through the nose (4s), out slowly (6s).' },
      { title: 'Lip Trills or Straw (SOVT)', duration: 180, description: 'Gentle "brrr" or straw phonation with easy glides up and down. Light and comfortable, never pushed.' },
      { title: 'Resonance Slides', duration: 240, description: 'Hum "ng" and slide slowly between a darker placement (big dog) and a brighter one (small dog). Notice the space in your mouth and throat, then find a middle you like.' },
      { title: 'Pitch Matching', duration: 300, description: 'Check that your target range fits your goal (Edit next to Your voice on Today); an in-between voice often sits around 145–185 Hz. Say short words and keep them inside it without straining.' },
      { title: 'Speaking Practice', duration: 0, description: 'Read the phrases with the middle resonance you found. Move on when you’re ready.', prompts: ['Good morning, how are you?', 'I’ll have a coffee, please.', 'The train leaves at half past nine.', 'Can you pass me that book?'] },
      { title: 'Cool Down', duration: 120, description: 'Soft humming or lip trills at a comfortable pitch. Stop if anything feels strained.' },
    ],
  },
];

// First-launch setup: what you're training toward sets a starting range and routine (both editable later)
export const VOICE_DIRECTIONS = [
  { key: 'feminization', label: 'Feminization', detail: 'A higher, brighter voice', range: { low: 165, high: 255 }, template: 'feminization' },
  { key: 'masculinization', label: 'Masculinization', detail: 'A lower, fuller voice', range: { low: 85, high: 155 }, template: 'masculinization' },
  { key: 'androgynous', label: 'Androgynous', detail: 'Somewhere in between', range: { low: 145, high: 185 }, template: 'androgynous' },
  { key: 'custom', label: 'My own range', detail: 'Set the numbers yourself', range: null, template: null },
] as const;

export const DEFAULT_PLAN_TEXT =`Daily Plan (30-45 minutes)

1. Warm-up (5-10 minutes)
   - Diaphragmatic Breathing: 3x diaphragmatic breaths (in through the nose and out through the mouth). Breathe in to full capacity for 4 seconds, hold for 4 seconds, and breathe out for 6 seconds.
   - Light SOVTEs (Lip Trill or Straw Blowing): 3 minutes. Focus on a relaxed sound, not straining.
   - Lip Trill Explanation: To do a lip trill, gently close your lips together without pressing them tightly. Relax your cheeks. Purse your lips slightly, as if you were about to give a kiss. Then, push air through your lips, causing them to vibrate and create a "brrr" sound. The key is to keep your lips relaxed, so the air can move them freely. It's almost like making a motorboat sound.

2. Pitch Training (15-20 minutes)
   - Pitch Matching Exercise: Use the pitch tracker.
   - Goal: Aim for C4 as a starting point for pitch (look at pitch ranges in the document).
   - Method:
     - Use your pitch tracker to check the pitch of your voice.
     - Match the pitch that is shown in the program
   - Scales on SOVTEs: Use a lip trill (brrr) or a straw (see SOVTE's) while singing scales.
   - Focus: Smooth transitions between notes. Use a scale that is comfortable for you.
   - Duration: 5-10 minutes.

3. Resonance Training (10-15 minutes)
   - Big Dog/Small Dog Exercise: This is a key exercise for resonance.
   - Big Dog: Imagine panting like a large dog. This lowers the larynx and often results in a darker sound.
   - Small Dog: Imagine panting like a small dog. This raises the larynx and encourages a brighter sound. Aim for the raised larynx, more forward-placed sound of the small dog panting.
   - Focus: Feel the difference in the space inside your mouth and throat. Aim for the raised larynx, more forward-placed sound of the small dog panting.
   - Duration: 5-10 minutes.

4. Cool-down (2-3 minutes)
   - Gentle humming or lip trills at a comfortable pitch to relax your vocal cords.

Important Considerations:
- Hydration: Drink water before and after your practice. Staying hydrated is essential.
- Listen to Your Body: If you experience any pain or discomfort, STOP.
- Consistency is Key: Even 15-20 minutes of daily practice is better than a long session once a week.
- Record Yourself: Record yourself when doing these exercises.

Progression (What comes next after a few weeks):
- Vocal Weight:
  - Introduce the "Fawning" exercise. This helps thin the vocal weight. Focus on achieving a lighter, softer sound.
  - Fawning Exercise Explanation: The Fawning Exercise is about imitating the voice you have when fawning (imagining seeing a cute kitty and saying "Awww!"). It is essentially trying to make your voice sound "cuter."
  - Start by saying "aaaaaah" in a fawning voice, trying to keep your vocal cords lighter.
  - Then try saying "ah uh oh", focusing on maintaining the light vocal weight as you change the vowel sounds.
  - Finally, try saying "Pass the salt" with a fawning quality. The goal is to change the sentence to "pass it please".
- Reading Practice:
  - Once you feel more comfortable with pitch and resonance, incorporate reading practice using simple sentences like "Today I went to the park to see a balloon." (mentioned in the documents). Focus on maintaining your target pitch and resonance throughout the sentence.

Important Notes:
- "No voice is 'too deep' for voice feminization": This is crucial to remember. Progress is possible regardless of your starting point.
- Safety: Prioritize safety by avoiding overdoing it and paying attention to your body.
- Consistency is KEY: Keep doing the exercise everyday and record the progress.`;

export const DEFAULT_SESSION_FOCUS = "Remember to maintain good posture. Keep your shoulders relaxed and breathe from your diaphragm.\nHydrate frequently!";

export const DEFAULT_SETTINGS: AppSettings = {
  userName: 'Vocalist',
  trainingDays: [], // Default to 0 days so user sets it themselves
  enableRecording: true,
  inputDeviceId: 'default',
  outputDeviceId: 'default',
  micGain: 1.0,
  
  routines: [DEFAULT_ROUTINE],
  activeRoutineId: DEFAULT_ROUTINE.id,
  
  sessionFocus: DEFAULT_SESSION_FOCUS,
  theme: 'system',
  colorTheme: 'violet',
  targetPitch: 261, // Middle C
  targetRange: { low: 239, high: 285 }, // ±1.5 semitones around middle C
  deleteSessionWithRecording: false,
  checkUpdatesOnStartup: true,
  retainAnalytics: true,
  
  beepVolume: 0.5,
  skipPreflight: false,
  disableLeveling: false,
  
  // Feature Defaults
  enableHistory: true,
  enableGoals: true,
  enableVisualizer: true,
  enableAchievements: true,
  enableStats: true,
};

export const INITIAL_STATS: UserStats = {
  totalSessions: 0,
  totalTrainingTime: 0,
  currentStreak: 0,
  lastTrainingDate: null,
  history: {},
  sessionCounts: {},
  healthTrends: [],
  sickDays: {},
  unlockedAchievements: [],
  goalHistory: [],
  xp: 0,
  level: 1
};

export const STORAGE_KEYS = {
  SETTINGS: 'resona_settings_v3',
  STATS: 'resona_stats_v3', 
  RECORDINGS: 'resona_recordings_meta',
  SESSIONS: 'resona_sessions_v2',
  GOALS: 'resona_goals',
  SETUP: 'resona_setup',
  WELCOME_SHOWN: 'resona_welcome_shown'
};

export const ACHIEVEMENTS_LIST: Achievement[] = [
  {
    id: 'first_step',
    title: 'First Step',
    description: 'Complete your first training session.',
    icon: 'Footprints',
    condition: (stats) => stats.totalSessions >= 1
  },
  {
    id: 'consistency_week',
    title: 'Consistent',
    description: 'Reach a 7-day streak.',
    icon: 'Flame',
    condition: (stats) => stats.currentStreak >= 7
  },
  {
    id: 'marathoner',
    title: 'Marathoner',
    description: 'Complete a session longer than 20 minutes.',
    icon: 'Timer',
    condition: (stats, sessions) => sessions.some(s => s.duration >= 1200)
  },
  {
    id: 'centurion',
    title: 'Centurion',
    description: 'Reach 10 total hours of training.',
    icon: 'Shield',
    condition: (stats) => stats.totalTrainingTime >= 36000
  },
  {
    id: 'dedicated',
    title: 'Dedicated',
    description: 'Complete 50 sessions.',
    icon: 'Trophy',
    condition: (stats) => stats.totalSessions >= 50
  }
];

export const XP_PER_MINUTE = 10;
export const XP_PER_SESSION = 100; // Increased base
export const XP_LEVEL_BASE = 1000;
