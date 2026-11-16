
import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import type { UpdateInfo } from 'velopack';

import { Button } from './components/Button';
import { Modal } from './components/Modal';
import { Segmented } from './components/Segmented';
import { Sidebar, Route, PROGRESS_PAGES, SETTINGS_PAGES } from './components/shell/Sidebar';
import { TitleBar } from './components/shell/TitleBar';
import { LevelProgressModal } from './components/LevelProgressModal';

import { 
  AppSettings, AppState, Recording, UserStats, TrainingSession, Goal, 
  PitchDataPoint, PitchRange, ColorTheme 
} from './types';
import { 
  DEFAULT_SETTINGS, INITIAL_STATS, STORAGE_KEYS, ACHIEVEMENTS_LIST, 
  XP_PER_MINUTE, XP_PER_SESSION, XP_LEVEL_BASE, THEMES, DEFAULT_ROUTINE, DEFAULT_PLAN_TEXT, ROUTINE_TEMPLATES, VOICE_DIRECTIONS
} from './constants';
import { 
  loadFromStorage, saveToStorage, saveAudioBlob, deleteAudioBlob, clearAllAudioBlobs
} from './services/storage';
import { audioService, AudioService } from './services/audio';
import { calculateStreaks } from './services/stats';
import { migrateRoutines, routineLength, copyRoutine } from './services/routines';
import { RoutinePage, RoutinePicker, NewRoutineMenu, RoutineList } from './components/routines/RoutinesView';
import { RoutineNameTitle } from './components/routines/RoutineEditor';
import { ThisWeek } from './components/today/ThisWeek';
import { PageHint } from './components/PageHint';
import { Setup, SetupResult } from './components/onboarding/Setup';
import { SettingsView } from './components/settings/SettingsView';
import { CommandMenu, Command, matches } from './components/CommandMenu';
import { computePitchStats, rangeAround, rangeCenter, strainFromEffort } from './services/pitchStats';
import { RangeBand } from './components/session/RangeBand';
import { RangeEditor } from './components/session/RangeEditor';
import { FocusSession } from './components/session/FocusSession';
import { MicCheck } from './components/session/MicCheck';
import { SessionSummary } from './components/session/SessionSummary';
import { PitchTrend, TrendPoint } from './components/progress/PitchTrend';
import { CompareRecordings } from './components/progress/CompareRecordings';
import { ActivityCalendar } from './components/progress/ActivityCalendar';
import { SessionList, sessionStrain } from './components/progress/SessionList';
import { OtherRecordings } from './components/progress/OtherRecordings';
import { Goals, Achievements } from './components/progress/GoalsAndAchievements';
import { version } from './package.json';

// --- APPEARANCE ---
// Sets the colour mode and the two accent source colours; index.css derives every token from them in OKLCH.
const useAppearance = (settings: AppSettings) => {
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const mode = settings.theme === 'system' ? (systemDark ? 'dark' : 'light') : settings.theme;
  const palette = THEMES[settings.colorTheme] || THEMES.violet;
  const useCustom = settings.colorTheme === 'custom' && settings.customColors;
  const accent = useCustom ? settings.customColors!.primary : palette.primary;
  const accent2 = useCustom ? settings.customColors!.secondary : palette.secondary;

  // Layout effect: tokens are in place before the first paint (index.html pre-sets the mode even earlier)
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.mode = mode;
    root.style.setProperty('--accent-src', accent);
    root.style.setProperty('--accent2-src', accent2);
    root.classList.toggle('mica', !!window.resonaWindow);
  }, [mode, accent, accent2]);

  // Mica tint and the native caption buttons follow the chosen source
  useEffect(() => { window.resonaWindow?.setTheme(settings.theme); }, [settings.theme]);
};

// Helper for consistent date keys (YYYY-MM-DD Local)
const getLocalISODate = (d: Date = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// --- MAIN APP ---
const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  
  const [settings, setSettings] = useState<AppSettings>(() => {
    const loaded = loadFromStorage(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    return { 
        ...DEFAULT_SETTINGS, 
        ...loaded, 
        // ≤1.0.5 had one routine plus a free-text plan; both carry over into the routines list
        ...migrateRoutines(loaded, { routine: DEFAULT_ROUTINE, planText: DEFAULT_PLAN_TEXT }, () => crypto.randomUUID()),
        // Older versions stored one target pitch; turn it into a range around it
        targetRange: loaded.targetRange ?? rangeAround(loaded.targetPitch ?? DEFAULT_SETTINGS.targetPitch),
    };
  });
  
  const [stats, setStats] = useState<UserStats>(() => loadFromStorage(STORAGE_KEYS.STATS, INITIAL_STATS));
  const [recordings, setRecordings] = useState<Recording[]>(() => loadFromStorage(STORAGE_KEYS.RECORDINGS, []));
  const [sessions, setSessions] = useState<TrainingSession[]>(() => loadFromStorage(STORAGE_KEYS.SESSIONS, []));
  const [goals, setGoals] = useState<Goal[]>(() => loadFromStorage(STORAGE_KEYS.GOALS, []));
  const [appVersion, setAppVersion] = useState(version);

  // Update State
  const [updateAvailable, setUpdateAvailable] = useState<UpdateInfo | null>(null);

  // Modals & UI State
  const [route, setRoute] = useState<Route>({ section: 'today', sub: '' });
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [showCommands, setShowCommands] = useState(false);
  
  // Navigation State
  // `at` makes a repeat jump to the same session a new request
  const [highlight, setHighlight] = useState<{ id: string; at: number } | null>(null);

  // Session State
  const [sessionKind, setSessionKind] = useState<'routine' | 'free'>('routine');
  const [lastResult, setLastResult] = useState<{ sessionId: string; xpGained: number; levelUpTo: number | null } | null>(null);
  const startTimeRef = useRef<number>(0);
  const endTimeRef = useRef<number>(0);
  // Refs (not state) so the 50ms pitch interval sees the live value
  const pausedRef = useRef(false);
  const pauseStartRef = useRef(0);
  const pausedTotalRef = useRef(0);
  const pitchDataRef = useRef<PitchDataPoint[]>([]);
  const pitchIntervalRef = useRef<number | null>(null);
  const finishingRef = useRef(false);
  const savedRef = useRef(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [tempRecordingBlob, setTempRecordingBlob] = useState<Blob | null>(null);

  // Status: transient title-bar note that clears itself
  const [statusMessage, setStatusMessage] = useState("Ready");
  useEffect(() => {
      if (statusMessage === 'Ready') return;
      const id = window.setTimeout(() => setStatusMessage('Ready'), 5000);
      return () => clearTimeout(id);
  }, [statusMessage]);

  //XP Event Logic
  const dailyXpBonus = useMemo(() => {
      const d = new Date();
      const dateStr = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      let hash = 0;
      for (let i = 0; i < dateStr.length; i++) {
          hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
          hash |= 0;
      }
      const rand = Math.abs(hash % 100);
      
      // 1% Chance for 5x
      if (rand < 1) return 5;
      // 5% Chance for 3x (1 to 6)
      if (rand < 6) return 3;
      // 15% Chance for 2x (6 to 21)
      if (rand < 21) return 2;
      
      return 1;
  }, []);

  useEffect(() => {
    if (window.velopackApi) {
        window.velopackApi.getVersion().then(setAppVersion);
        if (settings.checkUpdatesOnStartup) {
            window.velopackApi.checkForUpdates().then(update => {
                if (update) setUpdateAvailable(update);
            }).catch(console.error);
        }
    }
  }, []);

  // Persistence
  useEffect(() => { saveToStorage(STORAGE_KEYS.SETTINGS, settings); }, [settings]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.STATS, stats); }, [stats]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.RECORDINGS, recordings); }, [recordings]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.SESSIONS, sessions); }, [sessions]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.GOALS, goals); }, [goals]);

  // Recalc streak on load, when the schedule changes, and when rest days change
  useEffect(() => {
    const { currentStreak } = calculateStreaks(
        Object.fromEntries(Object.keys(stats.history).map(k => [k, true])), 
        stats.sickDays,
        settings.trainingDays
    );
    if (currentStreak !== stats.currentStreak) {
      setStats(prev => ({ ...prev, currentStreak }));
    }
  }, [settings.trainingDays, stats.sickDays]);

  // --- XP & Level System ---
  const levelProgress = useMemo(() => {
    const xpForNextLevel = stats.level * XP_LEVEL_BASE;
    if (xpForNextLevel <= 0) return 0;
    return Math.min(100, (stats.xp / xpForNextLevel) * 100);
  }, [stats.xp, stats.level]);

  // --- Navigation Helpers ---
  const jumpToSession = (sessionId: string) => {
      if (!sessions.some(s => s.id === sessionId)) return; // e.g. a kept strain mark whose session was deleted
      setHighlight({ id: sessionId, at: Date.now() });
      setRoute({ section: 'progress', sub: 'sessions' });
  };

  // --- Session Flow ---

  const initiateSession = (kind: 'routine' | 'free') => {
    setSessionKind(kind);
    if (settings.skipPreflight) {
        startWorkout();
    } else {
        setAppState(AppState.PRE_FLIGHT);
    }
  };

  const startWorkout = async () => {
    try {
        await audioService.initialize(settings.inputDeviceId);
        audioService.setGain(settings.micGain);
        await audioService.resume(); 
        
        startTimeRef.current = Date.now();
        pausedRef.current = false;
        pausedTotalRef.current = 0;
        pitchDataRef.current = [];
        finishingRef.current = false;
        savedRef.current = false;
        setSaveError(null);
        setTempRecordingBlob(null);
        setLastResult(null);

        if (settings.enableRecording) {
            audioService.startRecording();
        }

        if (pitchIntervalRef.current) clearInterval(pitchIntervalRef.current);
        pitchIntervalRef.current = window.setInterval(() => {
            if (pausedRef.current) return;
            const p = audioService.getPitch();
            // Active time (pauses excluded) so pitch data lines up with the paused recording
            const time = Date.now() - startTimeRef.current - pausedTotalRef.current;
            // The live view reads this ref directly; no React state per sample
            pitchDataRef.current.push({ time, pitch: p });
        }, 50);

        setAppState(AppState.TRAINING);
    } catch (e) {
        console.error("Failed to start session:", e);
        setStatusMessage("Microphone unavailable. Check it's connected and allowed in Windows privacy settings");
        setAppState(AppState.IDLE);
    }
  };

  const setPaused = (paused: boolean) => {
    if (paused === pausedRef.current) return;
    pausedRef.current = paused;
    if (paused) {
        pauseStartRef.current = Date.now();
        audioService.pauseRecording();
    } else {
        pausedTotalRef.current += Date.now() - pauseStartRef.current;
        audioService.resumeRecording();
    }
  };

  const finishWorkout = async () => {
    // A double click or the last block timing out mid-save must not save twice
    if (finishingRef.current) return;
    finishingRef.current = true;
    if (pitchIntervalRef.current) clearInterval(pitchIntervalRef.current);
    if (pausedRef.current) setPaused(false); // close the open pause so it's subtracted
    endTimeRef.current = Date.now();

    let blob: Blob | null = null;
    try {
        if (settings.enableRecording) {
            blob = await audioService.stopRecording();
            setTempRecordingBlob(blob);
        }
        audioService.close();
        // Autosave, except accidental starts: very short sessions wait for "Save anyway"
        if (activeSeconds() >= MIN_SAVED_SECONDS) await saveSession(blob);
    } catch (e) {
        // Never trap the user in focus mode: land on the not-saved screen with a retry
        console.error('Failed to finish session', e);
        audioService.close();
        setSaveError('Resona couldn’t save this session. Your disk may be full, or the recording failed. Try again, or discard it.');
    }
    setAppState(AppState.POST_SESSION);
    // finishingRef stays set until the next startWorkout: the exiting session view is still clickable
  };

  const retrySave = async () => {
      setSaveError(null);
      try { await saveSession(tempRecordingBlob); }
      catch (e) { console.error('Retry save failed', e); setSaveError('Saving failed again. Check free disk space, then try again.'); }
  };

  const activeSeconds = () => Math.round((endTimeRef.current - startTimeRef.current - pausedTotalRef.current) / 1000);

  // Milestone confetti in the accent palette, after the summary has entered
  const celebrate = (opts: confetti.Options) => {
      const probe = document.createElement('span');
      document.body.appendChild(probe);
      const hex = (token: string) => {
          probe.style.color = `var(${token})`;
          const c = document.createElement('canvas').getContext('2d')!;
          c.fillStyle = getComputedStyle(probe).color;
          c.fillRect(0, 0, 1, 1);
          const [r, g, b] = c.getImageData(0, 0, 1, 1).data;
          return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
      };
      const colors = [hex('--col-primary'), hex('--col-secondary'), hex('--text-main')];
      probe.remove();
      window.setTimeout(() => confetti({ ...opts, colors, disableForReducedMotion: true }), 350);
  };

  const saveSession = async (recordingBlob: Blob | null) => {
    // One save per session, whichever path asks (autosave, "Save anyway", double clicks)
    if (savedRef.current) return;
    savedRef.current = true;
    // Measured at Stop, not at Save, and without paused time
    const endTime = endTimeRef.current;
    const duration = Math.round((endTime - startTimeRef.current - pausedTotalRef.current) / 1000);
    const todayStr = getLocalISODate();

    let recordingId: string | undefined;

    if (recordingBlob && recordingBlob.size > 0) {
        recordingId = crypto.randomUUID();
        const filename = `Session_${todayStr}_${stats.totalSessions + 1}`;
        const newRec: Recording = {
            id: recordingId,
            filename,
            date: endTime,
            duration,
            size: recordingBlob.size,
            pitchData: pitchDataRef.current,
            targetPitch: rangeCenter(settings.targetRange)
        };
        try {
            await saveAudioBlob(recordingId, recordingBlob);
        } catch (e) {
            savedRef.current = false; // nothing was committed, so a retry may save
            throw e;
        }
        setRecordings(prev => [newRec, ...prev]);
    }

    // --- XP Calculation ---
    // Formula: (Base + (Level * Scaling)) + (Mins * PerMin)
    // Scaling: 10 XP per level
    let xpGained = 0;
    
    if (!settings.disableLeveling) {
        const levelBonus = stats.level * 10;
        const sessionBase = XP_PER_SESSION + levelBonus;
        const durationBonus = Math.round((duration / 60) * XP_PER_MINUTE);
        
        xpGained = sessionBase + durationBonus;
        
        // Apply Daily Multiplier
        xpGained *= dailyXpBonus;
    }

    let newXp = stats.xp + xpGained;
    let newLevel = stats.level;

    // Loop: one big session (e.g. on a 5x day) can cross several levels
    while (!settings.disableLeveling && newXp >= newLevel * XP_LEVEL_BASE) {
        newXp -= newLevel * XP_LEVEL_BASE;
        newLevel++;
    }

    if (newLevel > stats.level) celebrate({ particleCount: 140, spread: 90, origin: { y: 0.6 } });

    const isRoutine = sessionKind === 'routine';
    const newSession: TrainingSession = {
        id: crypto.randomUUID(),
        startTime: startTimeRef.current,
        endTime,
        duration,
        recordingId,
        pitchData: pitchDataRef.current,
        targetPitch: rangeCenter(settings.targetRange),
        targetRange: settings.targetRange,
        routineUsed: isRoutine ? activeRoutineOf(settings).id : undefined,
        routineName: isRoutine ? activeRoutineOf(settings).name : undefined,
        mode: isRoutine ? 'structured' : 'simple'
    };

    const updatedSessions = [newSession, ...sessions];
    
    // Update Stats & Persistent History
    const tempHistory = { ...stats.history };
    tempHistory[todayStr] = (tempHistory[todayStr] || 0) + duration;
    
    // Update Session Counts (New Persistent Store)
    const tempSessionCounts = { ...stats.sessionCounts };
    tempSessionCounts[todayStr] = (tempSessionCounts[todayStr] || 0) + 1;

    const streakMap: {[key:string]: boolean} = {};
    Object.keys(tempHistory).forEach(k => streakMap[k] = true);
    const { currentStreak } = calculateStreaks(streakMap, stats.sickDays, settings.trainingDays);

    // Health trends get their entry when the user rates strain on the summary
    const tempStats: UserStats = {
        ...stats,
        totalSessions: stats.totalSessions + 1,
        totalTrainingTime: stats.totalTrainingTime + duration,
        currentStreak,
        lastTrainingDate: endTime,
        history: tempHistory,
        sessionCounts: tempSessionCounts,
        xp: newXp,
        level: newLevel
    };

    // Update Goals - Relative Tracking Logic
    const updatedGoals = goals.map(g => {
        let currentTotal = 0;
        switch(g.type) {
            case 'sessions': currentTotal = tempStats.totalSessions; break;
            case 'duration': currentTotal = Math.floor(tempStats.totalTrainingTime / 60); break;
            case 'streak': currentTotal = tempStats.currentStreak; break;
        }
        
        const startVal = g.startValue || 0; 
        const relativeProgress = currentTotal - startVal;
        
        return {
            ...g,
            current: currentTotal,
            isCompleted: relativeProgress >= g.target
        };
    });
    setGoals(updatedGoals);

    // Achievement Check
    const newUnlocks: string[] = [];
    ACHIEVEMENTS_LIST.forEach(ach => {
        if (!stats.unlockedAchievements.includes(ach.id)) {
            if (ach.condition(tempStats, updatedSessions)) {
                newUnlocks.push(ach.id);
                celebrate({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
            }
        }
    });

    tempStats.unlockedAchievements = [...stats.unlockedAchievements, ...newUnlocks];

    setSessions(updatedSessions);
    setStats(tempStats);
    setLastResult({ sessionId: newSession.id, xpGained, levelUpTo: newLevel > stats.level ? newLevel : null });
    setStatusMessage('Session saved');
  };

  // Summary edits patch the already-saved session (optimistic, no separate save step)
  const updateLastSession = (patch: (s: TrainingSession) => TrainingSession) => {
      if (!lastResult) return;
      setSessions(prev => prev.map(s => s.id === lastResult.sessionId ? patch(s) : s));
  };

  const handleStrain = (strain: number) => {
      const session = sessions.find(s => s.id === lastResult?.sessionId);
      if (!session) return;
      updateLastSession(s => ({ ...s, healthLog: { ...s.healthLog, strain, effort: strain * 2 } }));
      // One health-trend entry per session, keyed by its end time
      const entry = { date: session.endTime, effort: strain * 2, duration: session.duration };
      setStats(prev => ({
          ...prev,
          healthTrends: [...(prev.healthTrends || []).filter(t => t.date !== session.endTime), entry].sort((a, b) => a.date - b.date),
      }));
  };

  const handleSessionNote = (note: string) => updateLastSession(s => ({ ...s, notes: note.trim() || undefined }));

  const closeSummary = () => {
      setAppState(AppState.IDLE);
      setTempRecordingBlob(null);
      setLastResult(null);
  };

  const handleClaimGoal = (goalId: string) => {
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;

      // Confetti Effect
      celebrate({ particleCount: 120, spread: 80, origin: { y: 0.7 } });

      // Move to history
      const completedGoal = { ...goal, completedAt: Date.now() };
      const newHistory = [completedGoal, ...(stats.goalHistory || [])];
      
      setStats(prev => ({ ...prev, goalHistory: newHistory }));
      setGoals(prev => prev.filter(g => g.id !== goalId));
  };

  // Confirmation happens in the UI (ConfirmButton)
  const handleDeleteHistoryEntry = (goalId: string) => {
      setStats(prev => ({ ...prev, goalHistory: (prev.goalHistory || []).filter(g => g.id !== goalId) }));
  };

  const toggleRestDay = (day: string) => {
      setStats(prev => {
          const sickDays = { ...prev.sickDays };
          if (sickDays[day]) delete sickDays[day]; else sickDays[day] = true;
          return { ...prev, sickDays };
      });
  };

  // Delete Session
  const handleDeleteSession = async (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (!session) return;

    if (settings.deleteSessionWithRecording && session.recordingId) {
        try {
            await deleteAudioBlob(session.recordingId);
            setRecordings(prev => prev.filter(r => r.id !== session.recordingId));
        } catch(e) {
            console.error("Failed to delete sync recording", e);
        }
    }
    
    if (!settings.retainAnalytics) {
        const newTrends = (stats.healthTrends || []).filter(t => t.date !== session.endTime);
        setStats(prev => ({ ...prev, healthTrends: newTrends }));
    }

    setSessions(prev => prev.filter(s => s.id !== id));
  };

  // Delete Recording
  const handleDeleteRecording = async (id: string) => {
      try {
          await deleteAudioBlob(id);
          setRecordings(prev => prev.filter(r => r.id !== id));
          
          if (settings.deleteSessionWithRecording) {
              const session = sessions.find(s => s.recordingId === id);
              if (session && !settings.retainAnalytics) {
                  const newTrends = (stats.healthTrends || []).filter(t => t.date !== session.endTime);
                  setStats(prev => ({ ...prev, healthTrends: newTrends }));
              }
              setSessions(prev => prev.filter(s => s.recordingId !== id));
          } else {
              // Keep the session, but stop pointing at audio that no longer exists
              setSessions(prev => prev.map(s => s.recordingId === id ? { ...s, recordingId: undefined } : s));
          }
      } catch(e) {
          console.error("Failed to delete recording", e);
      }
  };

  const handleBulkDeleteSessions = async (ids: string[]) => {
    const sessionsToDelete = sessions.filter(s => ids.includes(s.id));
    
    if (settings.deleteSessionWithRecording) {
        for (const s of sessionsToDelete) {
            if (s.recordingId) {
                try { await deleteAudioBlob(s.recordingId); } catch(e) {}
            }
        }
        const recordingIds = sessionsToDelete.map(s => s.recordingId).filter(Boolean) as string[];
        setRecordings(prev => prev.filter(r => !recordingIds.includes(r.id)));
    }

    if (!settings.retainAnalytics) {
        const timestamps = sessionsToDelete.map(s => s.endTime);
        const newTrends = (stats.healthTrends || []).filter(t => !timestamps.includes(t.date));
        setStats(prev => ({ ...prev, healthTrends: newTrends }));
    }

    setSessions(prev => prev.filter(s => !ids.includes(s.id)));
  };

  // The button already says "Install and restart", so no second confirmation
  const installUpdate = async (update: UpdateInfo | null = updateAvailable) => {
      if (!update || !window.velopackApi) return;
      setStatusMessage('Downloading update…');
      try {
          await window.velopackApi.downloadUpdates(update);
          await window.velopackApi.applyUpdates(update);
      } catch (e) {
          console.error('Update failed', e);
          setStatusMessage('Update failed. Try again from Settings');
      }
  };

  const handleResetApp = async () => {
      try {
          await clearAllAudioBlobs();
      } catch (e) {
          console.error("Failed to delete recordings", e);
      }
      window.velopackApi?.clearAppData();
      localStorage.clear();
      window.location.reload();
  };

  // --- LAYOUT ---
  useAppearance(settings);
  const inSession = appState !== AppState.IDLE;
  const routineBlocks = activeRoutineOf(settings).blocks;
  const routineIsEmpty = routineBlocks.length === 0;
  const routineMinutes = Math.round(routineBlocks.reduce((a, b) => a + b.duration, 0) / 60);
  const dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const sessionTitle = sessionKind === 'routine' ? activeRoutineOf(settings).name : 'Free session';
  const titleStatus = inSession ? sessionTitle : (statusMessage === 'Ready' ? undefined : statusMessage);
  const setRange = (targetRange: PitchRange) => setSettings(s => ({ ...s, targetRange, targetPitch: rangeCenter(targetRange) }));

  // Median pitch of the last sessions, newest first, for the range band on Today
  const recentMedians = useMemo(() => sessions.slice(0, 10)
      .map(s => ({ id: s.id, stats: computePitchStats(s.pitchData, s.targetRange ?? settings.targetRange) }))
      .filter(x => x.stats.median !== null), [sessions, settings.targetRange]);
  const latest = recentMedians[0];

  const finishSetup = (r: SetupResult) => {
      audioService.close();
      const isUpdate = sessions.length > 0 || stats.totalSessions > 0;
      setSettings(s => {
          const tpl = ROUTINE_TEMPLATES.find(t => t.key === VOICE_DIRECTIONS.find(d => d.key === r.direction)?.template);
          let routines = s.routines, activeRoutineId = s.activeRoutineId;
          if (tpl) {
              const copy = copyRoutine({ name: tpl.name, blocks: tpl.blocks.map(b => ({ ...b, id: '' })) }, tpl.name, () => crypto.randomUUID());
              // New install: replace the untouched default. Update: keep everything and add the template.
              routines = isUpdate ? [...s.routines, copy] : [copy];
              activeRoutineId = copy.id;
          }
          const targetRange = r.range ?? s.targetRange;
          return { ...s, routines, activeRoutineId, targetRange, targetPitch: rangeCenter(targetRange), trainingDays: r.trainingDays, setupDone: true };
      });
      navigate({ section: 'today', sub: '' });
  };

  const navigate = (r: Route) => {
      setRoute(r);
      setHighlight(null);
  };
  const goRoutine = (id = activeRoutineOf(settings).id) => navigate({ section: 'routines', sub: id });
  // Settings is one page; the command menu's Settings entries scroll to their heading
  useEffect(() => {
      if (route.section === 'settings' && route.sub) document.getElementById(`settings-${route.sub}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [route]);

  // One-line explanations, shown until dismissed (Settings › Appearance can bring them back)
  const showHint = (k: string) => !(settings.dismissedHints || []).includes(k);
  const dismissHint = (k: string) => setSettings(s => ({ ...s, dismissedHints: [...(s.dismissedHints || []), k] }));
  const hint = (k: string, text: string) => ({ show: showHint(k), onDismiss: () => dismissHint(k), text });

  const todayStart = (
    <div className="flex items-center justify-between gap-6 py-5 border-y border-border">
      <div className="min-w-0 flex-1">
        <RoutinePicker routines={settings.routines} activeId={activeRoutineOf(settings).id}
          onPick={(id) => setSettings(s => ({ ...s, activeRoutineId: id }))} onEdit={() => navigate({ section: 'routines', sub: '' })} />
        <div className="text-[13px] text-text-muted mt-0.5">
          {routineIsEmpty
            ? <>No exercises yet. <button onClick={() => goRoutine()} className="underline decoration-border-strong underline-offset-[3px] hover:text-text transition-colors">Add exercises</button></>
            : <><span className="font-mono tabular-nums">{routineBlocks.length}</span> {routineBlocks.length === 1 ? 'exercise' : 'exercises'} · {routineLength(activeRoutineOf(settings))}</>}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button variant="ghost" onClick={() => initiateSession('free')}>Free session</Button>
        <Button size="lg" onClick={() => initiateSession('routine')} disabled={routineIsEmpty} className="min-w-[132px]">Start session</Button>
      </div>
    </div>
  );

  const todayVoice = (
    <section>
      <div className="flex items-baseline justify-between mb-5">
        <h2 className="text-[15px] font-semibold">Your voice</h2>
        <RangeEditor range={settings.targetRange} onChange={setRange} />
      </div>
      <RangeBand
        range={settings.targetRange}
        markers={recentMedians.map((m, i) => ({ hz: m.stats.median!, current: i === 0, label: i === 0 ? String(m.stats.median) : undefined })).reverse()}
      />
      <p className="mt-3 text-[13px] text-text-muted">
        {latest
          ? <>Last session: median <span className="font-mono tabular-nums text-text">{latest.stats.median}</span>{' '}Hz, <span className="font-mono tabular-nums text-text">{latest.stats.inRangePct}%</span> in range.{recentMedians.length > 1 && ' Grey marks are the sessions before.'}</>
          : 'After your first session, your median pitch shows on this scale.'}
      </p>
    </section>
  );

  // One job: start today's session; the week underneath shows how it's going. Centered, calm on wide screens.
  const todayPage = (
    <PageFrame title="Today" center aside={<span className="text-[13px] text-text-muted">{dateLabel}</span>}
      hint={hint('today', 'Start runs the routine shown here; click its name to switch routines. Free session is a stopwatch with live pitch and recording.')}>
      <div className="space-y-12">
        {todayStart}
        <ThisWeek secondsByDay={stats.history} restDays={stats.sickDays} trainingDays={settings.trainingDays}
          streak={stats.currentStreak} onToggleRest={toggleRestDay} />
      </div>
    </PageFrame>
  );

  const lastSession = lastResult ? sessions.find(s => s.id === lastResult.sessionId) : undefined;

  // Full-window focus layer: mic check → training → summary
  const focusLayer = (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={appState}
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.2, ease: EASE_OUT } }}
        exit={{ opacity: 0, transition: { duration: 0.16, ease: EASE_OUT } }}
      >
        {appState === AppState.PRE_FLIGHT && (
          <MicCheck
            deviceId={settings.inputDeviceId}
            gain={settings.micGain}
            setGain={(g) => setSettings(s => ({...s, micGain: g}))}
            skipNextTime={settings.skipPreflight}
            setSkipNextTime={(v) => setSettings(s => ({...s, skipPreflight: v}))}
            onReady={startWorkout}
            onCancel={() => { audioService.close(); setAppState(AppState.IDLE); }}
          />
        )}
        {appState === AppState.TRAINING && (
          <FocusSession
            kind={sessionKind}
            routine={activeRoutineOf(settings)}
            beepVolume={settings.beepVolume}
            dataRef={pitchDataRef}
            range={settings.targetRange}
            onRangeChange={setRange}
            onPauseChange={setPaused}
            onEnd={finishWorkout}
            focus={settings.sessionFocus}
            onFocusChange={(sessionFocus) => setSettings(s => ({ ...s, sessionFocus }))}
          />
        )}
        {appState === AppState.POST_SESSION && lastSession && lastResult && (
          <SessionSummary
            session={lastSession}
            range={lastSession.targetRange ?? settings.targetRange}
            recording={tempRecordingBlob}
            xpGained={lastResult.xpGained}
            levelUpTo={lastResult.levelUpTo}
            onStrain={handleStrain}
            onNote={handleSessionNote}
            onDone={closeSummary}
          />
        )}
        {appState === AppState.POST_SESSION && !lastResult && (
          <div className="max-w-[560px] mx-auto px-12 pt-[10vh]">
            <h1 className="text-[26px] font-semibold tracking-[-0.02em]">Session not saved</h1>
            <p className={`mt-2 text-[14px] leading-relaxed max-w-[52ch] ${saveError ? 'text-danger' : 'text-text-muted'}`}>
              {saveError ?? <>It lasted <span className="font-mono tabular-nums text-text">{activeSeconds()}</span> s, under {MIN_SAVED_SECONDS} seconds, so Resona treated it as an accidental start. It doesn’t count toward your streak or XP.</>}
            </p>
            <div className="mt-8 flex gap-2">
              <Button variant="ghost" onClick={closeSummary}>Discard</Button>
              <Button onClick={retrySave}>{saveError ? 'Try again' : 'Save anyway'}</Button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );

  // --- PROGRESS ---
  const titleOf = (s: TrainingSession) =>
      s.mode === 'simple' ? 'Free session' : s.routineName ?? settings.routines.find(r => r.id === s.routineUsed)?.name ?? 'Routine';

  const trendPoints: TrendPoint[] = useMemo(() => {
      const live: TrendPoint[] = sessions.map(s => {
          const st = computePitchStats(s.pitchData, s.targetRange ?? settings.targetRange);
          return { id: s.id, date: s.startTime, median: st.median, inRangePct: st.inRangePct, strain: sessionStrain(s) };
      });
      // "Persist Analytics": strain from deleted sessions lives on in stats.healthTrends (keyed by end time)
      const ends = new Set(sessions.map(s => s.endTime));
      const kept: TrendPoint[] = (stats.healthTrends || []).filter(t => !ends.has(t.date))
          .map(t => ({ id: `kept-${t.date}`, date: t.date, median: null, inRangePct: 0, strain: strainFromEffort(t.effort), kept: true }));
      return [...live, ...kept].sort((a, b) => a.date - b.date);
  }, [sessions, stats.healthTrends, settings.targetRange]);

  const longestStreak = useMemo(() => calculateStreaks(
      Object.fromEntries(Object.keys(stats.history).map(k => [k, true])), stats.sickDays, settings.trainingDays
  ).longestStreak, [stats.history, stats.sickDays, settings.trainingDays]);

  const linkedRecordingIds = new Set(sessions.map(s => s.recordingId).filter(Boolean));
  const otherRecordings = recordings.filter(r => !linkedRecordingIds.has(r.id));
  const recordingMB = recordings.reduce((sum, r) => sum + (r.size || 0), 0) / 1e6;
  const totalMinutes = Math.round(stats.totalTrainingTime / 60);

  const openDay = (day: string) => {
      const s = sessions.find(x => getLocalISODate(new Date(x.startTime)) === day);
      if (s) jumpToSession(s.id);
  };

  const consistencySentence = (
    <p className="text-[15px] leading-relaxed text-text-muted mb-6 max-w-[68ch]">
      Current streak <Num unit={plural(stats.currentStreak, 'day')}>{stats.currentStreak}</Num>, longest <Num unit={plural(longestStreak, 'day')}>{longestStreak}</Num>.{' '}
      You trained on <Num unit={plural(Object.keys(stats.history).length, 'day')}>{Object.keys(stats.history).length}</Num> for{' '}
      {totalMinutes >= 60 && <><Num unit="h">{Math.floor(totalMinutes / 60)}</Num> </>}<Num unit="min">{totalMinutes % 60}</Num> across{' '}
      <Num unit={plural(stats.totalSessions, 'session')}>{stats.totalSessions}</Num>, with <Num unit="MB">{recordingMB.toFixed(1)}</Num> of recordings.
    </p>
  );

  const progressTab = PROGRESS_PAGES.some(p => p.id === route.sub) ? route.sub : 'overview';
  const progressTabs: Record<string, React.ReactNode> = {
    overview: (
      <div className="space-y-14">
        <PitchTrend points={trendPoints} range={settings.targetRange} onSelect={jumpToSession} />
        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-x-16 gap-y-14 items-start">
          <section>
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="text-[15px] font-semibold">Your target range</h2>
              <RangeEditor range={settings.targetRange} onChange={setRange} />
            </div>
            <RangeBand
              range={settings.targetRange}
              markers={recentMedians.map((m, i) => ({ hz: m.stats.median!, current: i === 0, label: i === 0 ? String(m.stats.median) : undefined })).reverse()}
            />
            <p className="mt-3 text-[13px] text-text-muted">
              {latest
                ? <>Last session: median <span className="font-mono tabular-nums text-text">{latest.stats.median}</span>{' '}Hz, <span className="font-mono tabular-nums text-text">{latest.stats.inRangePct}%</span> in range.{recentMedians.length > 1 && ' Grey marks are the sessions before.'}</>
                : 'After your first session, your median pitch shows on this scale.'}
            </p>
          </section>
          <section>
            <h2 className="text-[15px] font-semibold mb-2">Calendar</h2>
            {consistencySentence}
            <ActivityCalendar minutesByDay={stats.history} restDays={stats.sickDays} trainingDays={settings.trainingDays}
              onToggleRest={toggleRestDay} onOpenDay={openDay} />
          </section>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-10">
          <Goals
            goals={goals}
            stats={stats}
            onAdd={g => setGoals(p => [...p, g])}
            onRemove={id => setGoals(p => p.filter(g => g.id !== id))}
            onClaim={handleClaimGoal}
            onRemoveHistory={handleDeleteHistoryEntry}
          />
          <Achievements unlockedIds={stats.unlockedAchievements} />
        </div>
      </div>
    ),
    compare: <CompareRecordings sessions={sessions} range={settings.targetRange} title={titleOf} />,
    sessions: (
      <>
        <SessionList
          sessions={sessions}
          range={settings.targetRange}
          title={titleOf}
          highlight={highlight}
          syncDelete={settings.deleteSessionWithRecording}
          onUpdateNote={(id, note) => setSessions(prev => prev.map(s => s.id === id ? { ...s, notes: note.trim() || undefined } : s))}
          onDelete={handleDeleteSession}
          onBulkDelete={handleBulkDeleteSessions}
          onRemoveRecording={handleDeleteRecording}
        />
        {otherRecordings.length > 0 && (
          <div className="mt-10 max-w-[1000px]">
            <h3 className="text-[15px] font-semibold mb-1">Recordings without a session</h3>
            <p className="text-[13px] text-text-muted mb-3">Kept when their session was deleted.</p>
            <OtherRecordings recordings={otherRecordings} onDelete={handleDeleteRecording} />
          </div>
        )}
      </>
    ),
  };
  const progressPage = (
    <PageFrame title="Progress" wide hint={hint('progress', 'Overview shows your pitch over time, your calendar and goals. Then and now plays an early recording against a recent one. Sessions lists everything you saved.')}>
      <PageTabs tabs={PROGRESS_PAGES} value={progressTab} onChange={(sub) => navigate({ section: 'progress', sub })} />
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div key={progressTab}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.2, ease: EASE_OUT } }}
          exit={{ opacity: 0, transition: { duration: 0.16, ease: EASE_OUT } }}>
          {progressTabs[progressTab]}
        </motion.div>
      </AnimatePresence>
    </PageFrame>
  );

  // Routines: the list, or one routine's editor with a way back
  const shownRoutine = settings.routines.find(r => r.id === route.sub);
  const routinePage = shownRoutine ? (
    <PageFrame wide back={{ label: 'Routines', onClick: () => goRoutine('') }}
      title={<RoutineNameTitle routine={shownRoutine} onRename={(name) => setSettings(s => ({ ...s, routines: s.routines.map(r => r.id === shownRoutine.id ? { ...r, name } : r) }))} />}>
      <RoutinePage
        routine={shownRoutine}
        routines={settings.routines}
        activeId={activeRoutineOf(settings).id}
        onChange={(routines) => setSettings(s => ({ ...s, routines }))}
        onSetActive={(id) => setSettings(s => ({ ...s, activeRoutineId: id }))}
        onSelect={(id) => goRoutine(id)}
        onStart={(id) => { setSettings(s => ({ ...s, activeRoutineId: id })); initiateSession('routine'); }}
      />
    </PageFrame>
  ) : (
    <PageFrame title="Routines" aside={<NewRoutineMenu onCreate={(r) => { setSettings(s => ({ ...s, routines: [...s.routines, r] })); goRoutine(r.id); }} />}
      hint={hint('routines', 'Click a routine to edit its exercises. The one marked Used on Today is what Start runs.')}>
      <RoutineList routines={settings.routines} activeId={activeRoutineOf(settings).id} onOpen={(id) => goRoutine(id)} />
    </PageFrame>
  );

  const settingsPage = (
    <PageFrame title="Settings" narrow hint={hint('settings', 'Changes apply right away. There is nothing to save.')}>
      <SettingsView settings={settings} update={(patch) => setSettings(s => ({ ...s, ...patch }))} stats={stats}
        appVersion={appVersion} onReset={handleResetApp} onInstallUpdate={installUpdate}
        onShowHintsAgain={() => { setSettings(s => ({ ...s, dismissedHints: [] })); setStatusMessage('Page hints will show again'); }} />
    </PageFrame>
  );

  const currentPage =
    route.section === 'today' ? todayPage
    : route.section === 'progress' ? progressPage
    : route.section === 'routines' ? routinePage
    : settingsPage;

  // --- COMMAND MENU (Ctrl+K) ---
  const todayKey = getLocalISODate();
  const trainedToday = !!stats.history[todayKey];
  const commands: Command[] = [
      { id: 'go-today', group: 'Go to', label: 'Today', run: () => navigate({ section: 'today', sub: '' }) },
      ...PROGRESS_PAGES.map(p => ({ id: `go-progress-${p.id}`, group: 'Go to', label: p.label, detail: 'Progress', run: () => navigate({ section: 'progress', sub: p.id }) })),
      ...settings.routines.map(r => ({ id: `go-routine-${r.id}`, group: 'Go to', label: r.name, detail: 'Routine', keywords: 'edit routine', run: () => goRoutine(r.id) })),
      ...SETTINGS_PAGES.map(p => ({ id: `go-settings-${p.id}`, group: 'Go to', label: p.label, detail: 'Settings', keywords: 'settings options', run: () => navigate({ section: 'settings', sub: p.id }) })),
      ...settings.routines.filter(r => r.blocks.length > 0).map(r => ({
          id: `start-${r.id}`, group: 'Start a session', label: r.name, detail: routineLength(r),
          keywords: 'start train routine', run: () => { setSettings(s => ({ ...s, activeRoutineId: r.id })); initiateSession('routine'); },
      })),
      { id: 'start-free', group: 'Start a session', label: 'Free session', keywords: 'start train stopwatch', run: () => initiateSession('free') },
      ...(trainedToday ? [] : [{
          id: 'rest-today', group: 'Today', label: stats.sickDays[todayKey] ? 'Unmark today as a rest day' : 'Mark today as a rest day',
          keywords: 'sick rest streak', run: () => toggleRestDay(todayKey),
      }]),
      ...(['system', 'light', 'dark'] as const).filter(t => t !== settings.theme).map(t => ({
          id: `theme-${t}`, group: 'Appearance', label: t === 'system' ? 'Follow Windows light or dark' : `Use ${t} mode`,
          keywords: 'theme color mode appearance', run: () => setSettings(s => ({ ...s, theme: t })),
      })),
  ];
  // Sessions only show once you type, e.g. "nov 12" or a routine name
  const searchSessions = (q: string): Command[] => sessions
      .map(s => ({ s, label: new Date(s.startTime).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) }))
      .filter(({ s, label }) => matches({ label, detail: titleOf(s), keywords: new Date(s.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }, q))
      .slice(0, 8)
      .map(({ s, label }) => ({ id: `session-${s.id}`, group: 'Sessions', label, detail: titleOf(s), run: () => jumpToSession(s.id) }));

  useEffect(() => {
      const onKey = (e: KeyboardEvent) => {
          if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
              e.preventDefault();
              if (appState === AppState.IDLE) setShowCommands(o => !o); // not during a session
          }
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
  }, [appState]);

  return (
    <MotionConfig reducedMotion="user">
    {/* Nav layer (tinted Mica in Electron); the content pane below sits raised on it */}
    <div className="h-full flex flex-col text-text bg-sidebar">
      <TitleBar status={titleStatus} />

      <div className="flex-1 flex min-h-0 relative">
        <Sidebar
          route={route}
          onNavigate={navigate}
          disabled={inSession}
          streak={stats.currentStreak}
          level={stats.level}
          levelProgress={levelProgress}
          showLevel={!settings.disableLeveling}
          xpMultiplier={dailyXpBonus}
          onOpenLevel={() => setShowLevelModal(true)}
          updateVersion={updateAvailable?.TargetFullRelease.Version}
          onUpdate={() => installUpdate()}
          onOpenCommands={() => setShowCommands(true)}
        />

        {/* Content pane: one raised surface with a concentric top-left corner, like Windows Settings */}
        <main className="flex-1 min-w-0 relative bg-background rounded-tl-[10px] border-l border-t border-border overflow-clip">
          <AnimatePresence initial={false}>
            <motion.div
              key={route.section === 'routines' ? `routines/${route.sub}` : route.section}
              className="absolute inset-0 overflow-y-auto"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.2, ease: EASE_OUT } }}
              exit={{ opacity: 0, transition: { duration: 0.16, ease: EASE_OUT } }}
            >
              {currentPage}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Focus mode: the session takes the whole window below the title bar; nothing else competes */}
        <AnimatePresence>
          {inSession && (
            <motion.div
              className="absolute inset-0 z-30 bg-background border-t border-border"
              initial={{ opacity: 0, scale: 0.985 }}
              animate={{ opacity: 1, scale: 1, transition: { duration: 0.22, ease: EASE_OUT } }}
              exit={{ opacity: 0, scale: 0.985, transition: { duration: 0.18, ease: EASE_OUT } }}
            >
              {focusLayer}
            </motion.div>
          )}
        </AnimatePresence>

        {/* First launch (and once after updating from 1.0.5): three steps that set things up */}
        <AnimatePresence>
          {!settings.setupDone && !inSession && (
            <motion.div
              className="absolute inset-0 z-40 bg-background border-t border-border"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.22, ease: EASE_OUT } }}
              exit={{ opacity: 0, scale: 0.985, transition: { duration: 0.18, ease: EASE_OUT } }}
            >
              <Setup
                isUpdate={sessions.length > 0 || stats.totalSessions > 0}
                currentRange={settings.targetRange}
                trainingDays={settings.trainingDays}
                deviceId={settings.inputDeviceId}
                gain={settings.micGain}
                setGain={(g) => setSettings(s => ({ ...s, micGain: g }))}
                onFinish={finishSetup}
                onSkip={() => { audioService.close(); setSettings(s => ({ ...s, setupDone: true })); }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <LevelProgressModal isOpen={showLevelModal} onClose={() => setShowLevelModal(false)} stats={stats} />
      <CommandMenu open={showCommands} onClose={() => setShowCommands(false)} commands={commands} search={searchSessions} />
    </div>
    </MotionConfig>
  );
};

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
// The routine Start runs; one always exists (the Routines page never deletes the last)
const activeRoutineOf = (s: AppSettings) => s.routines.find(r => r.id === s.activeRoutineId) ?? s.routines[0];
// A measurement: mono number, text unit, never split across lines
const Num: React.FC<{ children: React.ReactNode; unit?: string }> = ({ children, unit }) =>
  <span className="whitespace-nowrap"><span className="font-mono tabular-nums text-text">{children}</span>{unit && ` ${unit}`}</span>;
const plural = (n: number, word: string) => (n === 1 ? word : `${word}s`);
const MIN_SAVED_SECONDS = 30; // shorter sessions are treated as accidental until "Save anyway"

// Left-anchored next to the nav like Windows Settings. `wide` pages grow into columns on big screens
// (up to 2200px); settings stay a readable 760px. The hint is the page's one-line first-visit explanation.
const PageFrame: React.FC<{
  title: React.ReactNode; aside?: React.ReactNode; wide?: boolean; narrow?: boolean; center?: boolean; children: React.ReactNode;
  hint?: { show: boolean; onDismiss: () => void; text: string };
  back?: { label: string; onClick: () => void };
}> = ({ title, aside, wide, narrow, center, children, hint, back }) => (
  <div className={`px-10 2xl:px-14 pt-7 pb-16 ${center ? 'max-w-[980px] mx-auto' : wide ? 'max-w-[2200px]' : narrow ? 'max-w-[760px]' : 'max-w-[1000px]'}`}>
    {back && (
      <button onClick={back.onClick} className="-mt-2 mb-2 -ml-1 px-1 inline-flex items-center gap-1 rounded-md text-[13px] text-text-muted hover:text-text hover:bg-text/[0.05] transition-colors">
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M6.5 2l-3 3 3 3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        {back.label}
      </button>
    )}
    <header className="flex items-end justify-between gap-6 mb-7 min-h-9">
      <h1 className="flex-1 min-w-0 text-[26px] font-semibold tracking-[-0.02em] leading-none">{title}</h1>
      {aside}
    </header>
    {hint && <PageHint show={hint.show} onDismiss={hint.onDismiss}>{hint.text}</PageHint>}
    {children}
  </div>
);

// Tabs inside a page: text labels on a hairline, the underline slides between them
const PageTabs: React.FC<{ tabs: readonly { id: string; label: string }[]; value: string; onChange: (id: string) => void }> = ({ tabs, value, onChange }) => (
  <div role="tablist" className="-mt-2 mb-8 flex gap-6 border-b border-border">
    {tabs.map(t => (
      <button key={t.id} role="tab" aria-selected={t.id === value} onClick={() => onChange(t.id)}
        className={`relative pb-2.5 text-[13.5px] transition-colors ${t.id === value ? 'text-text font-medium' : 'text-text-muted hover:text-text'}`}>
        {t.label}
        {t.id === value && <motion.span layoutId="page-tab" className="absolute left-0 right-0 -bottom-px h-[2px] rounded-full bg-primary"
          transition={{ duration: 0.22, ease: [0.65, 0, 0.35, 1] }} />}
      </button>
    ))}
  </div>
);

export default App;
