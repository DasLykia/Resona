import React, { useEffect, useRef, useState } from 'react';
import type { UpdateInfo } from 'velopack';
import type { AppSettings, ColorTheme, UserStats } from '../../types';
import { THEMES } from '../../constants';
import { AudioService } from '../../services/audio';
import { Button } from '../Button';
import { ConfirmButton } from '../ConfirmButton';
import { Popover } from '../Popover';
import { Segmented } from '../Segmented';
import { Switch } from '../Switch';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const FULL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_INDEX = [1, 2, 3, 4, 5, 6, 0]; // Monday first; stored as JS getDay() (0 = Sunday)

// Each settings page shows one group; the page title names it, so only extra groups (Reset) get a heading
const Group: React.FC<{ title?: string; show: boolean; children: React.ReactNode }> = ({ title, show, children }) => show ? (
  <section className="mt-10 first:mt-0">
    {title && <h2 className="text-[15px] font-semibold mb-2">{title}</h2>}
    <div className="border-t border-border">{children}</div>
  </section>
) : null;

export type SettingsPageId = 'appearance' | 'training' | 'microphone' | 'data' | 'updates';

// One setting: what it is on the left, its control on the right
const Row: React.FC<{ label: string; hint?: React.ReactNode; children: React.ReactNode; htmlFor?: string }> = ({ label, hint, children, htmlFor }) => (
  <div className="flex items-center justify-between gap-8 py-3.5 border-b border-border">
    <div className="min-w-0">
      <label htmlFor={htmlFor} className="block text-[13.5px] text-text">{label}</label>
      {hint && <p className="mt-0.5 text-[12.5px] leading-snug text-text-muted max-w-[52ch]">{hint}</p>}
    </div>
    <div className="shrink-0 flex items-center gap-3">{children}</div>
  </div>
);

const Slider: React.FC<{ id: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; display: string }> = ({ id, value, min, max, step, onChange, display }) => (
  <>
    <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} className="w-44" />
    <span className="font-mono tabular-nums text-[12.5px] text-text-muted w-10 text-right">{display}</span>
  </>
);

interface SettingsViewProps {
  settings: AppSettings;
  update: (patch: Partial<AppSettings>) => void;
  stats: UserStats;
  appVersion: string;
  onReset: () => void;
  onInstallUpdate: (u: UpdateInfo) => void;
  page: SettingsPageId;
  onShowHintsAgain: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, update, stats, appVersion, onReset, onInstallUpdate, page, onShowHintsAgain }) => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  useEffect(() => { AudioService.getDevices().then(setDevices).catch(() => setDevices([])); }, []);

  const unlockedAll = settings.disableLeveling;
  const canUse = (t: ColorTheme) => unlockedAll || stats.level >= THEMES[t].unlockLevel;

  return (
    <div>
      <Group show={page === 'appearance'}>
        <Row label="Color mode" hint="System follows your Windows light or dark setting.">
          <Segmented label="Color mode" value={settings.theme} onChange={theme => update({ theme })}
            options={[{ value: 'system', label: 'System' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} />
        </Row>
        <Row label="Accent color" hint={unlockedAll ? 'All colors are unlocked.' : 'More colors unlock as you level up.'}>
          <div role="radiogroup" aria-label="Accent color" className="flex gap-2">
            {(Object.keys(THEMES) as ColorTheme[]).filter(t => t !== 'custom').map(t => {
              const ok = canUse(t), on = settings.colorTheme === t;
              return (
                <button key={t} role="radio" aria-checked={on} disabled={!ok} onClick={() => update({ colorTheme: t })}
                  title={ok ? THEMES[t].name : `${THEMES[t].name}: unlocks at level ${THEMES[t].unlockLevel}`}
                  aria-label={ok ? THEMES[t].name : `${THEMES[t].name}, unlocks at level ${THEMES[t].unlockLevel}`}
                  className={`relative w-6 h-6 rounded-full border-2 transition-[transform,box-shadow] duration-150 active:scale-[0.97] before:absolute before:-inset-1 before:content-[''] disabled:cursor-not-allowed
                    ${on ? 'ring-2 ring-offset-2 ring-offset-background ring-text' : ''}`}
                  // Locked colors are an empty ring in their color, so they never read as a pastel option
                  style={{ borderColor: `oklch(from ${THEMES[t].primary} 0.6 min(c, 0.16) h)`, backgroundColor: ok ? `oklch(from ${THEMES[t].primary} 0.6 min(c, 0.16) h)` : 'transparent' }} />
              );
            })}
          </div>
        </Row>
        {(unlockedAll || stats.level >= 50) && (
          <Row label="Custom colors" hint="Your own accent pair, unlocked at level 50.">
            {(['primary', 'secondary'] as const).map(k => (
              <label key={k} className="flex items-center gap-2 text-[12.5px] text-text-muted cursor-pointer">
                <input type="color" aria-label={k === 'primary' ? 'Custom accent' : 'Custom second color'}
                  value={settings.customColors?.[k] ?? '#8b5cf6'}
                  onChange={e => update({ colorTheme: 'custom', customColors: { primary: settings.customColors?.primary ?? '#8b5cf6', secondary: settings.customColors?.secondary ?? '#10b981', [k]: e.target.value } })}
                  className="w-7 h-7 rounded-md border border-border-strong bg-transparent p-0.5 cursor-pointer" />
                {k === 'primary' ? 'Accent' : 'Second'}
              </label>
            ))}
          </Row>
        )}
        <Row label="Page hints" hint="The one-line explanations shown the first time you open each page.">
          <Button variant="secondary" size="sm" onClick={onShowHintsAgain}>Show them again</Button>
        </Row>
      </Group>

      <Group show={page === 'training'}>
        <Row label="Training days" hint="Days you don’t train on, and rest days, never break your streak. With no days picked, every day counts.">
          <TrainingDaysPicker days={settings.trainingDays} onChange={trainingDays => update({ trainingDays })} />
        </Row>
        <Row label="Beep between exercises" htmlFor="beep" hint="Plays when a timed exercise ends.">
          <Slider id="beep" value={settings.beepVolume} min={0} max={1} step={0.1} onChange={v => update({ beepVolume: v })}
            display={settings.beepVolume === 0 ? 'Off' : `${Math.round(settings.beepVolume * 100)}%`} />
        </Row>
        <Row label="Check the microphone before each session">
          <Switch label="Check the microphone before each session" checked={!settings.skipPreflight} onChange={v => update({ skipPreflight: !v })} />
        </Row>
      </Group>

      <Group show={page === 'microphone'}>
        <Row label="Input device" htmlFor="mic">
          <select id="mic" value={settings.inputDeviceId} onChange={e => update({ inputDeviceId: e.target.value })}
            className="h-8 w-64 rounded-lg border border-border-strong bg-surface px-2.5 text-[13px] outline-none focus:border-primary transition-colors">
            <option value="default">System default</option>
            {devices.filter(d => d.deviceId && d.deviceId !== 'default').map(d => (
              <option key={d.deviceId} value={d.deviceId}>{d.label || `Microphone ${d.deviceId.slice(0, 4)}`}</option>
            ))}
          </select>
        </Row>
        <Row label="Input gain" htmlFor="gain" hint="Raise it if Resona often shows Listening while you speak.">
          <Slider id="gain" value={settings.micGain} min={0} max={2} step={0.1} onChange={v => update({ micGain: v })} display={`${settings.micGain.toFixed(1)}×`} />
        </Row>
        <Row label="Record sessions" hint="Recordings stay on this computer.">
          <Switch label="Record sessions" checked={settings.enableRecording} onChange={v => update({ enableRecording: v })} />
        </Row>
      </Group>

      <Group show={page === 'data'}>
        <Row label="Unlock all rewards" hint="All accent colors right away, but you stop earning XP and levels while this is on.">
          <LevelingSwitch settings={settings} stats={stats} update={update} />
        </Row>
        <Row label="Delete recordings with their session" hint="When you delete a session, its recording goes too.">
          <Switch label="Delete recordings with their session" checked={settings.deleteSessionWithRecording} onChange={v => update({ deleteSessionWithRecording: v })} />
        </Row>
        <Row label="Keep strain history" hint="Strain from deleted sessions stays on the Progress chart.">
          <Switch label="Keep strain history" checked={settings.retainAnalytics} onChange={v => update({ retainAnalytics: v })} />
        </Row>
      </Group>

      <Group show={page === 'updates'}>
        <Row label="Check for updates when Resona starts">
          <Switch label="Check for updates when Resona starts" checked={settings.checkUpdatesOnStartup} onChange={v => update({ checkUpdatesOnStartup: v })} />
        </Row>
        <UpdateRow appVersion={appVersion} onInstall={onInstallUpdate} />
      </Group>

      <Group title="Reset" show={page === 'data'}>
        <Row label="Delete all data" hint="Removes every session, recording, goal and setting from this computer.">
          <ConfirmButton variant="danger" confirmLabel="Delete everything"
            message="Delete all sessions, recordings, goals and settings? Resona restarts empty. This can’t be undone."
            onConfirm={onReset}>
            Delete all data
          </ConfirmButton>
        </Row>
      </Group>
    </div>
  );
};

// Turning leveling off or back on has consequences, so the switch asks first, from itself
const LevelingSwitch: React.FC<{ settings: AppSettings; stats: UserStats; update: (p: Partial<AppSettings>) => void }> = ({ settings, stats, update }) => {
  const anchor = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const next = !settings.disableLeveling;
  const apply = () => {
    const patch: Partial<AppSettings> = { disableLeveling: next };
    // Back to leveling: fall back to Violet if the chosen accent isn't earned yet
    if (!next && stats.level < (THEMES[settings.colorTheme]?.unlockLevel ?? 1)) patch.colorTheme = 'violet';
    update(patch);
    setOpen(false);
  };
  return (
    <>
      <Switch ref={anchor} label="Unlock all rewards" checked={settings.disableLeveling} onChange={() => setOpen(true)} />
      <Popover open={open} onClose={() => setOpen(false)} anchor={anchor} label="Unlock all rewards">
        <div className="w-72">
          <p className="text-[13.5px] leading-relaxed">
            {next ? 'Unlock every accent color now? You stop earning XP and levels until you turn this off.'
              : 'Earn XP and levels again? If your accent color isn’t unlocked at your level yet, it switches back to Violet.'}
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)} autoFocus>Cancel</Button>
            <Button size="sm" onClick={apply}>{next ? 'Unlock all' : 'Turn leveling on'}</Button>
          </div>
        </div>
      </Popover>
    </>
  );
};

const UpdateRow: React.FC<{ appVersion: string; onInstall: (u: UpdateInfo) => void }> = ({ appVersion, onInstall }) => {
  const [state, setState] = useState<{ kind: 'idle' | 'checking' | 'latest' | 'error' | 'web' } | { kind: 'found'; update: UpdateInfo }>({ kind: 'idle' });
  const check = async () => {
    if (!window.velopackApi) { setState({ kind: 'web' }); return; }
    setState({ kind: 'checking' });
    try {
      const u = await window.velopackApi.checkForUpdates();
      setState(u ? { kind: 'found', update: u } : { kind: 'latest' });
    } catch { setState({ kind: 'error' }); }
  };
  const hint = {
    idle: null,
    checking: 'Checking…',
    latest: 'You’re on the latest version.',
    error: 'Couldn’t reach the update server. Check your internet connection and try again.',
    web: 'Updates only work in the installed app.',
    found: state.kind === 'found' ? `Version ${state.update.TargetFullRelease.Version} is available.` : null,
  }[state.kind];
  return (
    <Row label="Version" hint={<><span className="font-mono tabular-nums">{appVersion}</span>{hint && <> · {hint}</>}</>}>
      {state.kind === 'found'
        ? <Button size="sm" onClick={() => onInstall(state.update)}>Install and restart</Button>
        : <Button variant="secondary" size="sm" onClick={check} isLoading={state.kind === 'checking'}>Check for updates</Button>}
    </Row>
  );
};

// Monday-first day toggles; also used by first-launch setup
export const TrainingDaysPicker: React.FC<{ days: number[]; onChange: (days: number[]) => void }> = ({ days, onChange }) => (
  <div role="group" aria-label="Training days" className="flex gap-1">
    {DAYS.map((d, i) => {
      const on = days.includes(DAY_INDEX[i]);
      return (
        <button key={d} aria-pressed={on} aria-label={FULL_DAYS[i]}
          onClick={() => onChange(on ? days.filter(x => x !== DAY_INDEX[i]) : [...days, DAY_INDEX[i]].sort())}
          className={`relative w-9 h-8 rounded-lg text-[12.5px] transition-[background-color,color,transform] duration-150 active:scale-[0.97] before:absolute before:-inset-0.5 before:content-['']
            ${on ? 'bg-primary text-on-primary' : 'bg-text/[0.05] text-text-muted hover:text-text hover:bg-text/[0.09]'}`}>
          {d.slice(0, 2)}
        </button>
      );
    })}
  </div>
);
