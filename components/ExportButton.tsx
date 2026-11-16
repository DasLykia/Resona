import React, { useState } from 'react';
import { exportRecording, ExportItem } from '../services/exportRecordings';
import { Button } from './Button';

// Saves one recording as WAV; the label says so when it fails
export const ExportButton: React.FC<ExportItem> = (item) => {
  const [state, setState] = useState<'idle' | 'busy' | 'failed'>('idle');
  const run = async () => {
    setState('busy');
    try { await exportRecording(item); setState('idle'); }
    catch (e) { console.error('Export failed', e); setState('failed'); }
  };
  return (
    <Button variant="ghost" size="sm" onClick={run} isLoading={state === 'busy'} title="Save this recording as a WAV file">
      {state === 'failed' ? 'Export failed, try again' : 'Export'}
    </Button>
  );
};
