
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
import { RoutineEditor } from './components/RoutineEditor';
import { PlanEditor } from './components/PlanEditor';
import { LevelProgressModal } from './components/LevelProgressModal';

import { 
  AppSettings, AppState, Recording, UserStats, TrainingSession, Goal, 
  PitchDataPoint, PitchRange, ColorTheme 
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
        practicePrompts: [], // Ensure empty
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
  const [page, setPage] = useState<Page>('today');
  const [showWelcome, setShowWelcome] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);
  
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
      setPage('progress');
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
        routineUsed: isRoutine ? settings.currentRoutine.id : undefined,
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
  const inSession = appState !== AppState.IDLE;
  const isStructured = settings.planMode === 'structured';
  const routineBlocks = settings.currentRoutine.blocks;
  const routineIsEmpty = routineBlocks.length === 0;
  const routineMinutes = Math.round(routineBlocks.reduce((a, b) => a + b.duration, 0) / 60);
  const dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const sessionTitle = sessionKind === 'routine' ? settings.currentRoutine.name : 'Free session';
  const titleStatus = inSession ? sessionTitle : (statusMessage === 'Ready' ? undefined : statusMessage);
  const setRange = (targetRange: PitchRange) => setSettings(s => ({ ...s, targetRange, targetPitch: rangeCenter(targetRange) }));

  // Median pitch of the last sessions, newest first, for the range band on Today
  const recentMedians = useMemo(() => sessions.slice(0, 10)
      .map(s => ({ id: s.id, stats: computePitchStats(s.pitchData, s.targetRange ?? settings.targetRange) }))
      .filter(x => x.stats.median !== null), [sessions, settings.targetRange]);
  const latest = recentMedians[0];

  const navigate = (p: Page) => {
      setPage(p);
      setHighlight(null);
  };

  const todayPage = (
    <PageFrame title="Today" aside={<span className="text-[13px] text-text-muted">{dateLabel}</span>}>
      <div className="flex items-center justify-between gap-6 py-5 border-y border-border">
        <div className="min-w-0">
          <div className="text-[17px] font-semibold tracking-[-0.01em] truncate">{settings.currentRoutine.name}</div>
          <div className="text-[13px] text-text-muted mt-0.5">
            {routineIsEmpty
              ? 'No exercises yet.'
              : <><span className="font-mono tabular-nums">{routineBlocks.length}</span> exercises · <span className="font-mono tabular-nums">{routineMinutes}</span> min</>}
            {' · '}
            <button onClick={() => navigate('routines')} className="underline decoration-border-strong underline-offset-[3px] hover:text-text transition-colors">
              {routineIsEmpty ? 'Add exercises' : 'Edit'}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" onClick={() => initiateSession('free')}>Free session</Button>
          <Button size="lg" onClick={() => initiateSession('routine')} disabled={routineIsEmpty} className="min-w-[132px]">Start session</Button>
        </div>
      </div>

      <section className="mt-8">
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
            ? <>Last session: median <span className="font-mono tabular-nums text-text">{latest.stats.median}</span>{' '}Hz, <span className="font-mono tabular-nums text-text">{latest.stats.inRangePct}%</span> in range.{recentMedians.length > 1 && ' Grey marks are the sessions before.'}</>
            : 'After your first session, your median pitch shows on this scale.'}
        </p>
      </section>

      {routineBlocks.length > 0 && (
        <section className="mt-10">
          <h2 className="text-[15px] font-semibold mb-2">Today’s routine</h2>
          <motion.ol
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
        </section>
      )}

      <div className="mt-10">
        <SessionFocusBlock
          focusText={settings.sessionFocus}
          onUpdate={(txt) => setSettings(s => ({...s, sessionFocus: txt}))}
        />
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
            routine={settings.currentRoutine}
            beepVolume={settings.beepVolume}
            dataRef={pitchDataRef}
            range={settings.targetRange}
            onRangeChange={setRange}
            onPauseChange={setPaused}
            onEnd={finishWorkout}
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
          <div className="max-w-[560px] px-12 pt-14">
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
      s.mode === 'simple' ? 'Free session' : s.routineUsed === settings.currentRoutine.id ? settings.currentRoutine.name : 'Routine';

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

  const progressPage = (
    <PageFrame title="Progress" wide>
      <Section title="Is your voice changing?">
        <PitchTrend points={trendPoints} range={settings.targetRange} onSelect={jumpToSession} />
      </Section>

      <Section title="Then and now">
        <CompareRecordings sessions={sessions} range={settings.targetRange} title={titleOf} />
      </Section>

      <Section title="Consistency">
        <p className="text-[15px] leading-relaxed text-text-muted mb-6 max-w-[68ch]">
          Current streak <Num unit={plural(stats.currentStreak, 'day')}>{stats.currentStreak}</Num>, longest <Num unit={plural(longestStreak, 'day')}>{longestStreak}</Num>.{' '}
          You trained on <Num unit={plural(Object.keys(stats.history).length, 'day')}>{Object.keys(stats.history).length}</Num> for{' '}
          {totalMinutes >= 60 && <><Num unit="h">{Math.floor(totalMinutes / 60)}</Num> </>}<Num unit="min">{totalMinutes % 60}</Num> across{' '}
          <Num unit={plural(stats.totalSessions, 'session')}>{stats.totalSessions}</Num>, with <Num unit="MB">{recordingMB.toFixed(1)}</Num> of recordings.
        </p>
        <ActivityCalendar
          minutesByDay={stats.history}
          restDays={stats.sickDays}
          trainingDays={settings.trainingDays}
          onToggleRest={toggleRestDay}
          onOpenDay={openDay}
        />
      </Section>

      <Section title="Sessions">
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
          <div className="mt-10">
            <h3 className="text-[15px] font-semibold mb-1">Recordings without a session</h3>
            <p className="text-[13px] text-text-muted mb-3">Kept when their session was deleted.</p>
            <OtherRecordings recordings={otherRecordings} onDelete={handleDeleteRecording} />
          </div>
        )}
      </Section>

      <Section title="Goals and achievements">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-10">
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

      <div className="flex-1 flex min-h-0 relative">
        <Sidebar
          page={page}
          onNavigate={navigate}
          disabled={inSession}
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
        <main className="flex-1 min-w-0 relative bg-background rounded-tl-[10px] border-l border-t border-border overflow-clip">
          <AnimatePresence initial={false}>
            <motion.div
              key={page}
              className="absolute inset-0 overflow-y-auto"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.2, ease: EASE_OUT } }}
              exit={{ opacity: 0, transition: { duration: 0.16, ease: EASE_OUT } }}
            >
              {pages[page]}
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
      </div>

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
// A measurement: mono number, text unit, never split across lines
const Num: React.FC<{ children: React.ReactNode; unit?: string }> = ({ children, unit }) =>
  <span className="whitespace-nowrap"><span className="font-mono tabular-nums text-text">{children}</span>{unit && ` ${unit}`}</span>;
const plural = (n: number, word: string) => (n === 1 ? word : `${word}s`);
const MIN_SAVED_SECONDS = 30; // shorter sessions are treated as accidental until "Save anyway"

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
