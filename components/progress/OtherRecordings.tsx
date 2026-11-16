import React, { useState } from 'react';
import type { Recording } from '../../types';
import { Button } from '../Button';
import { ConfirmButton } from '../ConfirmButton';
import { StoredRecording } from '../RecordingPlayer';
import { ExportButton } from '../ExportButton';
import { exportName } from '../../services/wav';

// Recordings no session points to any more (their session was deleted while recordings were kept)
export const OtherRecordings: React.FC<{ recordings: Recording[]; onDelete: (id: string) => void }> = ({ recordings, onDelete }) => {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <ul>
      {recordings.map(r => (
        <li key={r.id} className="border-b border-border py-3">
          <div className="flex items-center gap-4 text-[13.5px]">
            <span className="font-mono tabular-nums text-[12.5px] w-40">
              {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="flex-1 truncate text-text-muted">
              <span className="font-mono tabular-nums">{Math.round(r.duration / 60)}</span> min · <span className="font-mono tabular-nums">{(r.size / 1e6).toFixed(1)}</span> MB
            </span>
            <Button variant="ghost" size="sm" onClick={() => setOpenId(openId === r.id ? null : r.id)}>{openId === r.id ? 'Close' : 'Play'}</Button>
            <ExportButton recordingId={r.id} name={exportName(r.date, 'Recording')} />
            <ConfirmButton confirmLabel="Delete" message="Delete this recording?" onConfirm={() => onDelete(r.id)}>Delete</ConfirmButton>
          </div>
          {openId === r.id && <div className="mt-3"><StoredRecording id={r.id} fallbackLength={r.duration} /></div>}
        </li>
      ))}
    </ul>
  );
};
