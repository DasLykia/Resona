import { getAudioBlob } from './storage';
import { blobToWav } from './wav';

export interface ExportItem { recordingId: string; name: string }

const wavOf = async (recordingId: string) => {
  const blob = await getAudioBlob(recordingId);
  if (!blob) throw new Error('Recording not found');
  return blobToWav(blob);
};

// Browser download; inside Electron this opens the Save dialog
const download = (data: ArrayBuffer, name: string) => {
  const url = URL.createObjectURL(new Blob([data], { type: 'audio/wav' }));
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
};

export const exportRecording = async ({ recordingId, name }: ExportItem) => download(await wavOf(recordingId), name);

// All into one folder the user picks. Returns how many were written, or null if the folder dialog was cancelled.
export const exportAll = async (items: ExportItem[], onProgress: (done: number, total: number) => void): Promise<{ written: number; failed: number } | null> => {
  const files = window.resonaFiles;
  if (files && !(await files.chooseExportFolder())) return null;
  let written = 0, failed = 0;
  for (const [i, item] of items.entries()) {
    onProgress(i, items.length);
    try {
      const wav = await wavOf(item.recordingId);
      if (files) await files.writeExport(item.name, wav);
      else download(wav, item.name); // shortcut: the browser preview has no folder picker, so it downloads one by one
      written++;
    } catch (e) {
      console.error('Export failed for', item.name, e);
      failed++;
    }
  }
  return { written, failed };
};
