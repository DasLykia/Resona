
import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { Info, Volume2, Trash2, RefreshCw, Lock, Palette, Unlock } from 'lucide-react';
import type { UpdateInfo } from 'velopack';

import { Button } from './components/Button';
import { Modal } from './components/Modal';
import { Segmented } from './components/Segmented';
import { Sidebar, Page } from './components/shell/Sidebar';
import { TitleBar } from './components/shell/TitleBar';
import { StatsPanel } from './components/StatsPanel';
import { RecordingsManager } from './components/RecordingsManager';
import { RoutineEditor } from './components/RoutineEditor';
import { PlanEditor } from './components/PlanEditor';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { AudioVisualizer } from './components/AudioVisualizer';
import { PitchTracker } from './components/PitchTracker';
import { SessionHistory } from './components/SessionHistory';
import { GoalsWidget } from './components/GoalsWidget';
import { AchievementsWidget } from './components/AchievementsWidget';
import { CustomCalendar } from './components/CustomCalendar';
import { PreFlightCheck } from './components/PreFlightCheck';
import { SessionPlayer } from './components/SessionPlayer';
import { PostSessionModal } from './components/PostSessionModal';
import { VocalHealthChart } from './components/VocalHealthChart';
import { LevelProgressModal } from './components/LevelProgressModal';

import { 
  AppSettings, AppState, Recording, UserStats, TrainingSession, Goal, 
  PitchDataPoint, VocalHealthLog, ColorTheme 
} from './types';
import { 
  DEFAULT_SETTINGS, INITIAL_STATS, STORAGE_KEYS, ACHIEVEMENTS_LIST, 
  XP_PER_MINUTE, XP_PER_SESSION, XP_LEVEL_BASE, THEMES, DEFAULT_ROUTINE
} from './constants';
import { 
  loadFromStorage, saveToStorage, saveAudioBlob, deleteAudioBlob, clearAllAudioBlobs
} from './services/storage';
import { audioService, AudioService } from './services/audio';
import { calculateStreaks } from './services/stats';
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

// --- Color Picker Component (Defined outside to prevent re-render issues) ---
const ColorPickerInput = ({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) => (
  <div className="flex-1 space-y-1.5">
      <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{label}</label>
      <div className="relative h-10 w-full rounded-lg border border-white/10 bg-black/20 flex items-center px-3 gap-3 hover:border-white/20 transition-colors group cursor-pointer overflow-hidden">
          <div 
              className="w-5 h-5 rounded-full shadow-sm border border-white/20 shrink-0" 
              style={{ backgroundColor: value }}
          />
          <span className="text-xs font-mono text-text-muted group-hover:text-text transition-colors uppercase truncate">
              {value}
          </span>
          <input 
              type="color" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              value={value}
              onChange={(e) => onChange(e.target.value)}
          />
      </div>
  </div>
);

// --- Settings Form ---
const SettingsForm: React.FC<{ settings: AppSettings; stats: UserStats; onSave: (s: AppSettings) => void; onReset: () => void; appVersion: string }> = ({ settings, stats, onSave, onReset, appVersion }) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  useEffect(() => {
    AudioService.getDevices().then(setDevices);
  }, []);

  const toggleDay = (dayIndex: number) => {
    const current = localSettings.trainingDays;
    const next = current.includes(dayIndex) 
        ? current.filter(d => d !== dayIndex)
        : [...current, dayIndex].sort();
    setLocalSettings({...localSettings, trainingDays: next});
  };

  const toggleLevelingMode = () => {
      const newValue = !localSettings.disableLeveling;
      const msg = newValue 
        ? "Enable 'Unlock All' Mode?\n\nYou will unlock all themes instantly, but you will STOP earning XP and leveling up while this mode is active."
        : "Re-enable Leveling?\n\nXP earning will resume. Your theme will be reset if your level is not high enough.";
      
      if (confirm(msg)) {
          let nextSettings = {...localSettings, disableLeveling: newValue};
          
          if (!newValue) {
              const currentThemeDef = THEMES[nextSettings.colorTheme];
              const isGrandMasterTheme = nextSettings.colorTheme === 'custom';
              
              if (isGrandMasterTheme && stats.level < 50) {
                   nextSettings.colorTheme = 'violet';
              } else if (currentThemeDef && stats.level < currentThemeDef.unlockLevel) {
                   nextSettings.colorTheme = 'violet';
              }
          }
          
          setLocalSettings(nextSettings);
      }
  };

  const checkUpdates = async () => {
      setCheckingUpdate(true);
      try {
          if (!window.velopackApi) {
              alert("Update system not available in web mode.");
              return;
          }
          const update = await window.velopackApi.checkForUpdates();
          if (update) {
              if (confirm(`New version ${update.TargetFullRelease.Version} available. Download and install?`)) {
                  await window.velopackApi.downloadUpdates(update);
                  await window.velopackApi.applyUpdates(update);
              }
          } else {
              alert("You are on the latest version.");
          }
      } catch (e) {
          alert(`Update check failed: ${e}`);
      } finally {
          setCheckingUpdate(false);
      }
  };

  const handleDeleteAll = () => {
      if (confirm("WARNING: This will permanently delete ALL session history, recordings, goals, and settings.\n\nAre you absolutely sure you want to reset everything?")) {
          onReset();
      }
  };

  const handleSaveAll = () => {
      onSave(localSettings);
  };

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const isGrandMaster = stats.level >= 50 || localSettings.disableLeveling;

  return (
    <div className="space-y-8">
      {/* Theme Section */}
      <section>
        <h3 className="text-[15px] font-semibold text-text mb-3">Appearance</h3>
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <span className="text-[13px] text-text">Color mode</span>
                <Segmented
                    label="Color mode"
                    value={localSettings.theme}
                    onChange={(theme) => setLocalSettings({...localSettings, theme})}
                    options={[{ value: 'system', label: 'System' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]}
                />
            </div>

            <div>
                <label className="block text-xs font-bold text-text-muted mb-3 uppercase">Accent Color</label>
                <div className="flex flex-wrap gap-3">
                    {(Object.keys(THEMES) as ColorTheme[]).filter(k => k !== 'custom').map(themeKey => {
                        const theme = THEMES[themeKey];
                        const isLocked = !localSettings.disableLeveling && stats.level < theme.unlockLevel;
                        
                        return (
                            <button
                                key={themeKey}
                                onClick={() => !isLocked && setLocalSettings({...localSettings, colorTheme: themeKey})}
                                className={`w-8 h-8 rounded-full border-2 transition-all relative group flex items-center justify-center ${localSettings.colorTheme === themeKey ? 'border-text scale-110' : 'border-transparent'} ${isLocked ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:scale-110'}`}
                                style={{ backgroundColor: `oklch(from ${theme.primary} 0.6 min(c, 0.16) h)` }}
                                title={isLocked ? `Unlocks at Lvl ${theme.unlockLevel}` : theme.name}
                            >
                                {isLocked && <Lock size={12} className="text-white drop-shadow-md" />}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Grandmaster Custom Color Picker */}
            {isGrandMaster && (
                <div className="bg-surface p-4 rounded-xl border border-white/10 animate-in fade-in slide-in-from-top-2">
                    <h4 className="text-xs font-bold text-primary mb-3 flex items-center gap-2">
                        <Palette size={14} /> Grand Master Custom Theme
                    </h4>
                    <div className="flex gap-4">
                        <ColorPickerInput 
                            label="Primary Color" 
                            value={localSettings.customColors?.primary || '#ffffff'}
                            onChange={(val) => setLocalSettings(prev => ({
                                ...prev, 
                                colorTheme: 'custom',
                                customColors: { 
                                    primary: val, 
                                    secondary: prev.customColors?.secondary || '#ffffff' 
                                }
                            }))}
                        />
                        <ColorPickerInput 
                            label="Secondary Color" 
                            value={localSettings.customColors?.secondary || '#ffffff'}
                            onChange={(val) => setLocalSettings(prev => ({
                                ...prev, 
                                colorTheme: 'custom',
                                customColors: { 
                                    primary: prev.customColors?.primary || '#ffffff', 
                                    secondary: val
                                }
                            }))}
                        />
                    </div>
                </div>
            )}
        </div>
      </section>

      {/* Progression Section */}
      <section>
        <h3 className="text-[15px] font-semibold text-text mb-3">Progression</h3>
        <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-background/50">
             <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${localSettings.disableLeveling ? 'bg-yellow-500/20 text-yellow-500' : 'bg-surface text-text-muted'}`}>
                    {localSettings.disableLeveling ? <Unlock size={16} /> : <Lock size={16} />}
                </div>
                <div>
                    <div className="text-sm font-bold text-text">Unlock All Rewards</div>
                    <div className="text-[10px] text-text-muted">Disable XP gain to unlock all themes immediately.</div>
                </div>
             </div>
             <button 
               onClick={toggleLevelingMode}
               className={`w-10 h-5 rounded-full relative transition-colors ${localSettings.disableLeveling ? 'bg-yellow-500' : 'bg-border'}`}
             >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${localSettings.disableLeveling ? 'left-6' : 'left-1'}`} />
             </button>
        </div>
      </section>

      {/* Schedule Section */}
      <section>
        <h3 className="text-[15px] font-semibold text-text mb-3">Training Schedule</h3>
        <div className="p-4 rounded-xl border border-border bg-background/50">
            <p className="text-xs text-text-muted mb-3">Select your target training days. Off days will not break your streak.</p>
            <div className="flex justify-between gap-1">
                {DAYS.map((day, i) => {
                    const isActive = localSettings.trainingDays.includes(i);
                    return (
                        <button
                            key={day}
                            onClick={() => toggleDay(i)}
                            className={`flex-1 aspect-square rounded flex items-center justify-center text-xs font-bold transition-all ${isActive ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface border border-border text-text-muted hover:bg-white/5'}`}
                        >
                            {day[0]}
                        </button>
                    )
                })}
            </div>
        </div>
      </section>

      {/* Audio & Workflow Section */}
      <section>
        <h3 className="text-[15px] font-semibold text-text mb-3">Hardware & Workflow</h3>
        <div className="space-y-4 p-4 rounded-xl border border-border bg-background/50">
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-muted">Input Device</label>
            <select 
              className="w-full bg-surface border border-border rounded-lg p-2 text-sm outline-none focus:border-primary text-text"
              value={localSettings.inputDeviceId}
              onChange={(e) => setLocalSettings({...localSettings, inputDeviceId: e.target.value})}
            >
              <option value="default">System Default</option>
              {devices.map(d => (
                <option key={d.deviceId} value={d.deviceId}>{d.label || `Mic ${d.deviceId.slice(0,4)}...`}</option>
              ))}
            </select>
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-muted">Mic Gain: {localSettings.micGain.toFixed(1)}x</label>
            <input 
              type="range" min="0" max="2" step="0.1" 
              value={localSettings.micGain}
              onChange={(e) => setLocalSettings({...localSettings, micGain: parseFloat(e.target.value)})}
              className="w-full h-1 bg-border rounded-full appearance-none accent-primary cursor-pointer"
            />
          </div>

          <div className="space-y-1 pt-2 border-t border-border">
            <label className="text-xs font-medium text-text-muted flex items-center gap-2">
                <Volume2 size={12} /> Routine Beep Volume: {Math.round(localSettings.beepVolume * 100)}%
            </label>
            <input 
              type="range" min="0" max="1" step="0.1" 
              value={localSettings.beepVolume}
              onChange={(e) => setLocalSettings({...localSettings, beepVolume: parseFloat(e.target.value)})}
              className="w-full h-1 bg-border rounded-full appearance-none accent-primary cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
             <span className="text-sm text-text">Skip Pre-Flight Check</span>
             <button 
               onClick={() => setLocalSettings(s => ({...s, skipPreflight: !s.skipPreflight}))}
               className={`w-10 h-5 rounded-full relative transition-colors ${localSettings.skipPreflight ? 'bg-primary' : 'bg-border'}`}
             >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${localSettings.skipPreflight ? 'left-6' : 'left-1'}`} />
             </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
             <span className="text-sm text-text">Enable Recording</span>
             <button 
               onClick={() => setLocalSettings(s => ({...s, enableRecording: !s.enableRecording}))}
               className={`w-10 h-5 rounded-full relative transition-colors ${localSettings.enableRecording ? 'bg-primary' : 'bg-border'}`}
             >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${localSettings.enableRecording ? 'left-6' : 'left-1'}`} />
             </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
             <span className="text-sm text-text">Auto Update on Startup</span>
             <button 
               onClick={() => setLocalSettings(s => ({...s, checkUpdatesOnStartup: !s.checkUpdatesOnStartup}))}
               className={`w-10 h-5 rounded-full relative transition-colors ${localSettings.checkUpdatesOnStartup ? 'bg-primary' : 'bg-border'}`}
             >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${localSettings.checkUpdatesOnStartup ? 'left-6' : 'left-1'}`} />
             </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
             <div className="flex items-center gap-2">
                <span className="text-sm text-text">Sync Delete</span>
                <div className="group relative">
                    <Info size={14} className="text-text-muted cursor-help" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-surface border border-border rounded text-[10px] text-text-muted opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        Automatically delete the associated audio recording when you delete a session log.
                    </div>
                </div>
             </div>
             <button 
               onClick={() => setLocalSettings(s => ({...s, deleteSessionWithRecording: !s.deleteSessionWithRecording}))}
               className={`w-10 h-5 rounded-full relative transition-colors ${localSettings.deleteSessionWithRecording ? 'bg-danger' : 'bg-border'}`}
             >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${localSettings.deleteSessionWithRecording ? 'left-6' : 'left-1'}`} />
             </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
             <div className="flex items-center gap-2">
                <span className="text-sm text-text">Persist Analytics</span>
                <div className="group relative">
                    <Info size={14} className="text-text-muted cursor-help" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-surface border border-border rounded text-[10px] text-text-muted opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        Keep stats and health trends even if session logs are deleted.
                    </div>
                </div>
             </div>
             <button 
               onClick={() => setLocalSettings(s => ({...s, retainAnalytics: !s.retainAnalytics}))}
               className={`w-10 h-5 rounded-full relative transition-colors ${localSettings.retainAnalytics ? 'bg-primary' : 'bg-border'}`}
             >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${localSettings.retainAnalytics ? 'left-6' : 'left-1'}`} />
             </button>
          </div>
        </div>
      </section>

      {/* System Section */}
      <section>
          <h3 className="text-[15px] font-semibold text-text mb-3">System</h3>
          <div className="flex flex-col gap-3">
            <Button 
                variant="outline" 
                className="w-full justify-between" 
                onClick={checkUpdates}
                disabled={checkingUpdate}
            >
                <span className="flex items-center gap-2">
                    <RefreshCw size={16} className={checkingUpdate ? "animate-spin" : ""} />
                    {checkingUpdate ? "Checking..." : "Check for Updates"}
                </span>
                <span className="text-xs text-text-muted">v{appVersion}</span>
            </Button>

            <Button variant="danger" className="w-full" onClick={handleDeleteAll}>
                <Trash2 size={16} className="mr-2" /> Reset & Delete All Data
            </Button>
          </div>
      </section>

      <div className="pt-4 border-t border-border">
        <Button onClick={handleSaveAll} className="w-full">Save Configuration</Button>
      </div>
    </div>
  );
};

// --- Focus Block Component ---
const SessionFocusBlock: React.FC<{ focusText: string; onUpdate: (text: string) => void; isReadOnly?: boolean; compact?: boolean }> = ({ focusText, onUpdate, isReadOnly, compact }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempText, setTempText] = useState(focusText);

    const handleSave = () => {
        onUpdate(tempText);
        setIsEditing(false);
    };

    return (
        <section className="w-full">
            <div className="flex items-baseline justify-between mb-1.5">
                <h2 className="text-[13px] font-semibold text-text">Focus</h2>
                {!isEditing && !isReadOnly && (
                    <button
                        onClick={() => { setTempText(focusText); setIsEditing(true); }}
                        className="text-[12.5px] text-text-muted hover:text-text transition-colors"
                    >
                        Edit
                    </button>
                )}
            </div>

            {isEditing ? (
                <div className="flex flex-col gap-2 w-full">
                    <textarea
                        className="w-full min-h-[6rem] bg-surface rounded-lg px-3 py-2 text-[13.5px] leading-relaxed text-text outline-none resize-y border border-border-strong focus:border-primary transition-colors"
                        value={tempText}
                        onChange={(e) => setTempText(e.target.value)}
                        autoFocus
                    />
                    <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                        <Button size="sm" onClick={handleSave}>Save</Button>
                    </div>
                </div>
            ) : (
                <p className={`text-[13.5px] text-text-muted leading-relaxed whitespace-pre-wrap overflow-y-auto ${compact ? 'max-h-24' : 'max-h-40'}`}>
                    {focusText || "Write down what to keep in mind while you train."}
                </p>
            )}
        </section>
    );
};

// --- MAIN APP ---
const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  
  const [settings, setSettings] = useState<AppSettings>(() => {
    const loaded = loadFromStorage(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    return { 
        ...DEFAULT_SETTINGS, 
        ...loaded, 
        currentRoutine: loaded.currentRoutine?.blocks ? loaded.currentRoutine : DEFAULT_SETTINGS.currentRoutine,
        practicePrompts: [] // Ensure empty
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
  const [page, setPage] = useState<Page>('today');
  const [showWelcome, setShowWelcome] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);
  
  // Navigation State
  const [highlightedSessionId, setHighlightedSessionId] = useState<string | null>(null);
  const [highlightedRecordingId, setHighlightedRecordingId] = useState<string | null>(null);

  // Session State
  const [sessionDuration, setSessionDuration] = useState(0);
  const startTimeRef = useRef<number>(0);
  const endTimeRef = useRef<number>(0);
  // Refs (not state) so the 50ms pitch interval sees the live value
  const pausedRef = useRef(false);
  const pauseStartRef = useRef(0);
  const pausedTotalRef = useRef(0);
  const pitchDataRef = useRef<PitchDataPoint[]>([]);
  const pitchIntervalRef = useRef<number | null>(null);
  const [livePitchData, setLivePitchData] = useState<PitchDataPoint[]>([]);
  const [tempRecordingBlob, setTempRecordingBlob] = useState<Blob | null>(null);
  
  // Simple Mode Pause State
  const [simpleModePaused, setSimpleModePaused] = useState(false);

  // Status
  const [statusMessage, setStatusMessage] = useState("Ready");

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

    // Check Welcome
    const welcomeShown = localStorage.getItem(STORAGE_KEYS.WELCOME_SHOWN);
    if (!welcomeShown) {
        setShowWelcome(true);
        localStorage.setItem(STORAGE_KEYS.WELCOME_SHOWN, 'true');
    }
  }, []);

  // Persistence
  useEffect(() => { saveToStorage(STORAGE_KEYS.SETTINGS, settings); }, [settings]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.STATS, stats); }, [stats]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.RECORDINGS, recordings); }, [recordings]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.SESSIONS, sessions); }, [sessions]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.GOALS, goals); }, [goals]);

  // Recalc Streak on Load
  useEffect(() => {
    const { currentStreak } = calculateStreaks(
        Object.fromEntries(Object.keys(stats.history).map(k => [k, true])), 
        stats.sickDays,
        settings.trainingDays
    );
    if (currentStreak !== stats.currentStreak) {
      setStats(prev => ({ ...prev, currentStreak }));
    }
  }, [settings.trainingDays]);

  // --- XP & Level System ---
  const levelProgress = useMemo(() => {
    const xpForNextLevel = stats.level * XP_LEVEL_BASE;
    if (xpForNextLevel <= 0) return 0;
    return Math.min(100, (stats.xp / xpForNextLevel) * 100);
  }, [stats.xp, stats.level]);

  // --- Navigation Helpers ---
  const jumpToSession = (sessionId: string) => {
      setHighlightedSessionId(sessionId);
      setPage('progress');
  };

  const jumpToRecording = (recordingId: string) => {
      setHighlightedRecordingId(recordingId);
      setPage('progress');
  };

  // --- Session Flow ---

  const initiateSession = () => {
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
        setLivePitchData([]);
        setSimpleModePaused(false);
        setSessionDuration(0);

        if (settings.enableRecording) {
            audioService.startRecording();
        }

        if (pitchIntervalRef.current) clearInterval(pitchIntervalRef.current);
        pitchIntervalRef.current = window.setInterval(() => {
            if (pausedRef.current) return;
            const p = audioService.getPitch();
            // Active time (pauses excluded) so pitch data lines up with the paused recording
            const time = Date.now() - startTimeRef.current - pausedTotalRef.current;
            const newPoint = { time, pitch: p };
            pitchDataRef.current.push(newPoint);
            setLivePitchData(prev => [...prev, newPoint].filter(dp => (time - dp.time) < 60000));
        }, 50);

        setAppState(AppState.TRAINING);
        setStatusMessage("Training Active");
    } catch (e) {
        console.error("Failed to start session:", e);
        setStatusMessage("Audio Error - Restart App");
        setAppState(AppState.IDLE);
    }
  };

  // Dedicated effect for timer to handle pause state cleanly
  useEffect(() => {
      if (appState === AppState.TRAINING && settings.planMode === 'simple') {
          const interval = setInterval(() => {
              if (!simpleModePaused) {
                  setSessionDuration(prev => prev + 1);
              }
          }, 1000);
          return () => clearInterval(interval);
      }
  }, [appState, simpleModePaused, settings.planMode]);

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
    setSimpleModePaused(paused);
  };

  const finishWorkout = async () => {
    if (pitchIntervalRef.current) clearInterval(pitchIntervalRef.current);
    if (pausedRef.current) setPaused(false); // close the open pause so it's subtracted
    endTimeRef.current = Date.now();

    if (settings.enableRecording) {
        const blob = await audioService.stopRecording();
        setTempRecordingBlob(blob);
    }
    
    audioService.close();
    setAppState(AppState.POST_SESSION);
  };

  const saveSessionLog = async (healthLog: VocalHealthLog) => {
    // Measured at Stop, not at Save, and without paused time
    const endTime = endTimeRef.current;
    const duration = Math.round((endTime - startTimeRef.current - pausedTotalRef.current) / 1000);
    const todayStr = getLocalISODate();

    let recordingId: string | undefined;

    if (tempRecordingBlob && tempRecordingBlob.size > 0) {
        recordingId = crypto.randomUUID();
        const filename = `Session_${todayStr}_${stats.totalSessions + 1}`;
        const newRec: Recording = {
            id: recordingId,
            filename,
            date: endTime,
            duration,
            size: tempRecordingBlob.size,
            pitchData: pitchDataRef.current,
            targetPitch: settings.targetPitch
        };
        await saveAudioBlob(recordingId, tempRecordingBlob);
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

    if (newLevel > stats.level) {
        // Level Up Effect
        confetti({ 
            particleCount: 200, 
            spread: 100, 
            shapes: ['star'], 
            colors: ['#FFD700', '#FFA500', '#FFFFFF'] 
        });
        setStatusMessage(`LEVEL UP! ${newLevel}`);
    }

    // Append notes from healthLog to session notes if any
    // This allows the journal entry to appear in session history
    const sessionNotes = healthLog.notes ? healthLog.notes : undefined;

    const newSession: TrainingSession = {
        id: crypto.randomUUID(),
        startTime: startTimeRef.current,
        endTime,
        duration,
        recordingId,
        pitchData: pitchDataRef.current,
        targetPitch: settings.targetPitch,
        routineUsed: settings.planMode === 'structured' ? settings.currentRoutine.id : undefined,
        healthLog,
        notes: sessionNotes, // Save journal notes here
        mode: settings.planMode
    };

    const updatedSessions = [newSession, ...sessions];
    
    // Update Stats & Persistent History
    const tempHistory = { ...stats.history };
    tempHistory[todayStr] = (tempHistory[todayStr] || 0) + duration;
    
    // Update Session Counts (New Persistent Store)
    const tempSessionCounts = { ...stats.sessionCounts };
    tempSessionCounts[todayStr] = (tempSessionCounts[todayStr] || 0) + 1;

    // Update Health Trends (New Persistent Store)
    const newHealthTrend = { date: endTime, effort: healthLog.effort, duration };
    const tempHealthTrends = [...(stats.healthTrends || []), newHealthTrend];

    const streakMap: {[key:string]: boolean} = {};
    Object.keys(tempHistory).forEach(k => streakMap[k] = true);
    const { currentStreak } = calculateStreaks(streakMap, stats.sickDays, settings.trainingDays);

    if (currentStreak > stats.currentStreak) {
        confetti({ particleCount: 150, spread: 100 });
    }

    const tempStats: UserStats = {
        ...stats,
        totalSessions: stats.totalSessions + 1,
        totalTrainingTime: stats.totalTrainingTime + duration,
        currentStreak,
        lastTrainingDate: endTime,
        history: tempHistory,
        sessionCounts: tempSessionCounts,
        healthTrends: tempHealthTrends,
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
                confetti({ particleCount: 100, spread: 60 });
            }
        }
    });

    tempStats.unlockedAchievements = [...stats.unlockedAchievements, ...newUnlocks];

    setSessions(updatedSessions);
    setStats(tempStats);
    setRecordings(prev => prev); 

    setAppState(AppState.IDLE);
    setTempRecordingBlob(null);
    setStatusMessage(settings.disableLeveling ? "Session Saved" : `Session Saved (+${xpGained} XP)`);
  };

  const handleClaimGoal = (goalId: string) => {
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;

      // Confetti Effect
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.7 } });

      // Move to history
      const completedGoal = { ...goal, completedAt: Date.now() };
      const newHistory = [completedGoal, ...(stats.goalHistory || [])];
      
      setStats(prev => ({ ...prev, goalHistory: newHistory }));
      setGoals(prev => prev.filter(g => g.id !== goalId));
  };

  const handleDeleteHistoryEntry = (goalId: string) => {
      if (confirm("Remove this goal from history?")) {
          const newHistory = (stats.goalHistory || []).filter(g => g.id !== goalId);
          setStats(prev => ({ ...prev, goalHistory: newHistory }));
      }
  };

  const handleSaveSickDays = (days: string[]) => {
      const newSickDays: { [key: string]: boolean } = {};
      days.forEach(d => newSickDays[d] = true);
      setStats({...stats, sickDays: newSickDays});
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

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleUpdateClick = async () => {
      if (updateAvailable && window.velopackApi) {
          if (confirm(`New version ${updateAvailable.TargetFullRelease.Version} available. Update now?`)) {
              await window.velopackApi.downloadUpdates(updateAvailable);
              await window.velopackApi.applyUpdates(updateAvailable);
          }
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
  const isTraining = appState === AppState.TRAINING;
  const isStructured = settings.planMode === 'structured';
  const routineBlocks = settings.currentRoutine.blocks;
  const routineIsEmpty = isStructured && routineBlocks.length === 0;
  const routineMinutes =Math.round(routineBlocks.reduce((a, b) => a + b.duration, 0) / 60);
  const dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const titleStatus = isTraining ? 'Training' : (statusMessage === 'Ready' ? undefined : statusMessage);

  const navigate = (p: Page) => {
      setPage(p);
      setHighlightedSessionId(null);
      setHighlightedRecordingId(null);
  };

  const todayPage = (
    <PageFrame title="Today" aside={<span className="text-[13px] text-text-muted">{dateLabel}</span>}>
      <div className="flex items-center justify-between gap-6 py-5 border-y border-border">
        <div className="min-w-0">
          <div className="text-[17px] font-semibold tracking-[-0.01em] truncate">
            {isStructured ? settings.currentRoutine.name : 'Free session'}
          </div>
          <div className="text-[13px] text-text-muted mt-0.5">
            {!isStructured
              ? 'Stopwatch with live pitch and recording'
              : routineIsEmpty
                ? 'No exercises yet. Add some in Routines to start.'
                : <><span className="font-mono tabular-nums">{routineBlocks.length}</span> exercises · <span className="font-mono tabular-nums">{routineMinutes}</span> min</>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" onClick={() => navigate('routines')}>{routineIsEmpty ? 'Add exercises' : 'Change'}</Button>
          <Button size="lg" onClick={initiateSession} disabled={routineIsEmpty} className="min-w-[132px]">Start session</Button>
        </div>
      </div>

      {isStructured && routineBlocks.length > 0 && (
        <motion.ol
          className="mt-2"
          initial="hidden"
          animate="shown"
          variants={{ shown: { transition: { staggerChildren: 0.03 } } }}
        >
          {routineBlocks.map((b, i) => (
            <motion.li
              key={b.id}
              variants={{ hidden: { opacity: 0, y: 4 }, shown: { opacity: 1, y: 0, transition: { duration: 0.2, ease: EASE_OUT } } }}
              className="grid grid-cols-[1.75rem_1fr_auto] items-baseline gap-2 py-2.5 border-b border-border text-[13.5px]"
            >
              <span className="font-mono tabular-nums text-[12px] text-text-muted">{i + 1}</span>
              <span className="truncate">{b.title}</span>
              <span className="font-mono tabular-nums text-[12.5px] text-text-muted">
                {b.duration === 0 ? 'open' : formatTime(b.duration)}
              </span>
            </motion.li>
          ))}
        </motion.ol>
      )}

      <div className="mt-10">
        <SessionFocusBlock
          focusText={settings.sessionFocus}
          onUpdate={(txt) => setSettings(s => ({...s, sessionFocus: txt}))}
        />
      </div>
    </PageFrame>
  );

  const trainingView = (
    <div className="h-full flex flex-col gap-4 p-6">
      <div className="flex-1 min-h-0">
        {isStructured ? (
          <SessionPlayer 
              routine={settings.currentRoutine} 
              onComplete={finishWorkout} 
              onStop={finishWorkout} 
              onPauseChange={setPaused}
              beepVolume={settings.beepVolume}
          />
        ) : (
          <div className="h-full flex flex-col gap-4">
              <div className="flex justify-between items-baseline shrink-0">
                  <h1 className="text-[22px] font-semibold tracking-[-0.02em]">Free session</h1>
                  <div className="text-3xl font-mono tabular-nums">{formatTime(sessionDuration)}</div>
              </div>
              <div className="flex-1 min-h-0 rounded-2xl border border-border overflow-hidden">
                  <PlanEditor 
                      plan={settings.simplePlanText} 
                      fontSize={settings.planFontSize}
                      isTraining={true}
                      onSave={() => {}}
                      onFontSizeChange={(s) => setSettings(prev => ({...prev, planFontSize: s}))}
                  />
              </div>
              <div className="shrink-0 flex justify-center gap-3">
                  <Button variant="secondary" size="lg" onClick={() => setPaused(!simpleModePaused)} className="min-w-[110px]">
                      {simpleModePaused ? 'Resume' : 'Pause'}
                  </Button>
                  <Button variant="danger" size="lg" onClick={finishWorkout} className="min-w-[110px]">
                      End session
                  </Button>
              </div>
          </div>
        )}
      </div>
      <div className="h-[260px] shrink-0 grid grid-cols-2 gap-4">
        <PitchTracker 
            isActive={true} 
            targetPitch={settings.targetPitch} 
            onTargetChange={(val) => setSettings({...settings, targetPitch: val})} 
            livePitchData={livePitchData} 
        />
        <AudioVisualizer />
      </div>
    </div>
  );

  const progressPage = (
    <PageFrame title="Progress" wide>
      <Section title="Overview">
        <AnalyticsDashboard stats={stats} recordings={recordings} settings={settings} sessions={sessions} />
      </Section>
      <Section title="Voice health">
        <div className="h-52"><VocalHealthChart sessions={sessions} stats={stats} /></div>
      </Section>
      <Section title="Sessions">
        <SessionHistory 
            sessions={sessions} 
            onUpdateSession={(s) => setSessions(prev => prev.map(old => old.id === s.id ? s : old))} 
            onDeleteSession={handleDeleteSession} 
            onBulkDelete={handleBulkDeleteSessions}
            highlightedId={highlightedSessionId}
            onJumpToRecording={jumpToRecording}
        />
      </Section>
      <Section title="Recordings">
        <RecordingsManager 
            recordings={recordings} 
            onDelete={handleDeleteRecording} 
            highlightedId={highlightedRecordingId}
            onJumpToSession={jumpToSession}
            sessions={sessions}
        />
      </Section>
      <Section title="Goals and achievements">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="min-h-[300px]">
            <GoalsWidget 
                goals={goals} 
                onAddGoal={g => setGoals(p => [...p, g])} 
                onRemoveGoal={id => setGoals(p => p.filter(g => g.id !== id))} 
                onClaimGoal={handleClaimGoal}
                onDeleteHistoryEntry={handleDeleteHistoryEntry}
                stats={stats}
            />
          </div>
          <AchievementsWidget unlockedIds={stats.unlockedAchievements} />
        </div>
      </Section>
      <Section title="Rest days">
        <p className="text-[13.5px] text-text-muted mb-4 max-w-prose">Mark days you rested because you were ill or your voice was tired. Rest days never break your streak.</p>
        <div className="max-w-md">
          <CustomCalendar 
              initialSelectedDates={stats.sickDays} 
              onSave={(days) => { handleSaveSickDays(days); setStatusMessage('Rest days saved'); }} 
              onCancel={() => {}} 
          />
        </div>
      </Section>
    </PageFrame>
  );

  const routinesPage = (
    <PageFrame
      title="Routines"
      fill
      aside={
        <Segmented
          label="Session type"
          value={settings.planMode}
          onChange={(planMode) => setSettings(s => ({...s, planMode}))}
          options={[{ value: 'structured', label: 'Guided routine' }, { value: 'simple', label: 'Simple plan' }]}
        />
      }
    >
      <div className="h-full min-h-[360px] overflow-hidden">
        {isStructured ? (
          <RoutineEditor 
              routine={settings.currentRoutine} 
              onUpdate={(r) => setSettings(s => ({...s, currentRoutine: r}))} 
          />
        ) : (
          <PlanEditor 
              plan={settings.simplePlanText} 
              fontSize={settings.planFontSize}
              isTraining={false}
              onSave={(txt) => setSettings(s => ({...s, simplePlanText: txt}))}
              onFontSizeChange={(sz) => setSettings(s => ({...s, planFontSize: sz}))}
          />
        )}
      </div>
    </PageFrame>
  );

  const settingsPage = (
    <PageFrame title="Settings" narrow>
      <SettingsForm settings={settings} stats={stats} onSave={(s) => { setSettings(s); setStatusMessage('Settings saved'); }} onReset={handleResetApp} appVersion={appVersion} />
    </PageFrame>
  );

  const pages: Record<Page, React.ReactNode> = {
    today: todayPage,
    progress: progressPage,
    routines: routinesPage,
    settings: settingsPage,
  };

  return (
    <MotionConfig reducedMotion="user">
    {/* Nav layer (tinted Mica in Electron); the content pane below sits raised on it */}
    <div className="h-full flex flex-col text-text bg-sidebar">
      <TitleBar status={titleStatus} />

      <div className="flex-1 flex min-h-0">
        <Sidebar
          page={page}
          onNavigate={navigate}
          disabled={isTraining}
          streak={stats.currentStreak}
          level={stats.level}
          levelProgress={levelProgress}
          showLevel={!settings.disableLeveling}
          xpMultiplier={dailyXpBonus}
          onOpenLevel={() => setShowLevelModal(true)}
          updateVersion={updateAvailable?.TargetFullRelease.Version}
          onUpdate={handleUpdateClick}
        />

        {/* Content pane: one raised surface with a concentric top-left corner, like Windows Settings */}
        <main className="flex-1 min-w-0 relative bg-background rounded-tl-[10px] border-l border-t border-border overflow-hidden">
          <AnimatePresence initial={false}>
            <motion.div
              key={isTraining ? 'session' : page}
              className="absolute inset-0 overflow-y-auto"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.2, ease: EASE_OUT } }}
              exit={{ opacity: 0, transition: { duration: 0.16, ease: EASE_OUT } }}
            >
              {isTraining ? trainingView : pages[page]}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {appState === AppState.PRE_FLIGHT && (
        <PreFlightCheck 
            onReady={startWorkout} 
            onCancel={() => setAppState(AppState.IDLE)} 
            gain={settings.micGain}
            setGain={(g) => setSettings({...settings, micGain: g})}
            deviceId={settings.inputDeviceId}
        />
      )}

      {appState === AppState.POST_SESSION && (
        <PostSessionModal onSave={saveSessionLog} />
      )}

      <Modal isOpen={showWelcome} onClose={() => setShowWelcome(false)} title="Welcome to Resona" width="max-w-md">
        <div className="space-y-4 text-[13.5px] leading-relaxed">
            <p className="text-text">Start a session from <strong className="font-semibold">Today</strong> whenever you're ready to train.</p>
            <p className="text-text-muted">
                No training days are set yet, so every day counts toward your streak. Pick your days in <strong className="font-semibold text-text">Settings</strong> and rest days in between won't break it.
            </p>
            <p className="text-text-muted">
                Ill or your voice needs a break? Mark the day under <strong className="font-semibold text-text">Progress → Rest days</strong>.
            </p>
            <div className="flex justify-end pt-2">
                <Button onClick={() => setShowWelcome(false)}>Get started</Button>
            </div>
        </div>
      </Modal>

      <LevelProgressModal isOpen={showLevelModal} onClose={() => setShowLevelModal(false)} stats={stats} />
    </div>
    </MotionConfig>
  );
};

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

// Left-anchored next to the nav like Windows Settings; `fill` lets an editor take the pane's remaining height
const PageFrame: React.FC<{ title: string; aside?: React.ReactNode; wide?: boolean; narrow?: boolean; fill?: boolean; children: React.ReactNode }> = ({ title, aside, wide, narrow, fill, children }) => (
  <div className={`px-10 pt-7 ${fill ? 'h-full flex flex-col pb-6' : 'pb-16'} ${wide ? 'max-w-[1200px]' : narrow ? 'max-w-[760px]' : 'max-w-[1000px]'}`}>
    <header className="flex items-end justify-between gap-6 mb-7 min-h-9 shrink-0">
      <h1 className="text-[26px] font-semibold tracking-[-0.02em] leading-none">{title}</h1>
      {aside}
    </header>
    {fill ? <div className="flex-1 min-h-0">{children}</div> : children}
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="mt-10 first:mt-0 pt-8 first:pt-0 border-t first:border-t-0 border-border">
    <h2 className="text-[15px] font-semibold mb-4">{title}</h2>
    {children}
  </section>
);

export default App;
