import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
await mkdir('work/rocket-recovery', { recursive: true });
await build({
  entryPoints: ['lib/rocket-recovery/simulation.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'work/rocket-recovery/story.mjs',
});
const { shortShots } = await import(
  pathToFileURL(resolve('work/rocket-recovery/story.mjs')).href
);
const stamp = (t) =>
  String(Math.floor(t / 60)).padStart(2, '0') +
  ':' +
  String(t % 60).padStart(2, '0');
const script =
  'HOW THINGS CLICK — ROCKET RECOVERY\n60 seconds / 1080 × 1920 / 30 fps\n\n' +
  shortShots
    .map(
      (s) =>
        stamp(s.start) +
        ' → ' +
        stamp(s.end) +
        ' | ' +
        s.label +
        '\n' +
        s.voice,
    )
    .join('\n\n') +
  '\n';
const prompt =
  'Create an exact 60-second YouTube Short audio mix for How Things Click. Use the HELIO character/voice.\n\nVOICE: Curious, confident, conversational; precise consonants and a smile in the final invitation. Start the first word at 0.1 seconds. The opening should feel like witnessing an impossible feat, then pull the viewer into the engineering answer. Build tension before touchdown, briefly release it at the catch, and challenge the viewer at the end. Keep forward momentum without shouting, hype or a drawn-out intro. Say Falcon Nine, Super Heavy, and How Things Click dot com naturally.\n\nTIMING: Render each cue separately. Start at the indicated time and finish 0.25 seconds before its end. Do not read timestamps or titles. Leave intentional small breaths. Do not invent extra dialogue. The visual edit is fixed; do not shift cue boundaries. If necessary, reread the cue rather than aggressively time-stretching it.\n\nMUSIC: Original or commercially licensed instrumental cinematic electronic / aerospace pulse, 118–124 BPM. Deep restrained bass, light rhythmic ticks, airy synth texture, subtle rising energy before the catch. No vocals. No long intro, no huge trailer booms. Duck music clearly under speech (roughly 18–24 dB quieter than the voice). Use a restrained ignition swell near 8s, a short mechanical accent on leg deployment near 31s, and a low load-transfer impact near 43s. Briefly thin the music just before the catch; bring the pulse back for the failed-timing challenge. No cartoon sound effects. The atmosphere should feel cinematic and dramatic while every spoken word stays clear. End with a clean, short resolve at 60s.\n\nMIX: Aim near -16 LUFS integrated, true peak at or below -1 dBTP, clear voice, no clipping. Return 48kHz WAV voice stem, music stem and final 60-second mix; MP3 listening copy optional. Do not claim or promise virality. Optimize for clear explanations, curiosity and a satisfying payoff.\n\n' +
  script;
await mkdir('public/tours', { recursive: true });
await mkdir('docs/audio', { recursive: true });
await writeFile('public/tours/rocket-recovery-short-narration.txt', script);
await writeFile(
  'public/tours/rocket-recovery-short-voice-only.txt',
  shortShots.map((s) => s.voice).join('\n\n') + '\n',
);
await writeFile(
  'public/tours/rocket-recovery-short-cues.json',
  JSON.stringify({ duration: 60, fps: 30, cues: shortShots }, null, 2) + '\n',
);
await writeFile('public/tours/rocket-recovery-short-helio-prompt.txt', prompt);
await writeFile('docs/audio/rocket-recovery-short-helio-prompt.txt', prompt);
console.log('Generated 60-second narration, cue sheet and Helio/music prompt.');
