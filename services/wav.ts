// Recordings are stored as WebM/Opus; exports are 16-bit mono WAV so they open in any player or editor.

// Mono 16-bit PCM WAV from samples in [-1, 1]
export const encodeWav = (samples: Float32Array, sampleRate: number): ArrayBuffer => {
  const buf = new ArrayBuffer(44 + samples.length * 2);
  const v = new DataView(buf);
  const str = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); v.setUint32(4, 36 + samples.length * 2, true); str(8, 'WAVE');
  str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  str(36, 'data'); v.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buf;
};

// Decode the stored blob and mix it down to mono
export const blobToWav = async (blob: Blob): Promise<ArrayBuffer> => {
  const ctx = new AudioContext();
  try {
    const audio = await ctx.decodeAudioData(await blob.arrayBuffer());
    const mono = new Float32Array(audio.length);
    for (let c = 0; c < audio.numberOfChannels; c++) {
      const ch = audio.getChannelData(c);
      for (let i = 0; i < ch.length; i++) mono[i] += ch[i] / audio.numberOfChannels;
    }
    return encodeWav(mono, audio.sampleRate);
  } finally {
    ctx.close();
  }
};

// "Resona 2026-11-16 18-05 Feminization basics.wav": sorts by date in any folder
export const exportName = (time: number, title: string) => {
  const d = new Date(time), p = (n: number) => String(n).padStart(2, '0');
  const clean = title.replace(/[<>:"/\\|?*\x00-\x1f]/g, '').trim();
  return `Resona ${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}-${p(d.getMinutes())}${clean ? ` ${clean}` : ''}.wav`;
};
