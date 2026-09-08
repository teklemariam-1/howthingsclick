import { build } from 'esbuild';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
await mkdir('work', { recursive: true });
const outfile = resolve('work/self-driving-tour-data.mjs');
await build({
  entryPoints: ['lib/self-driving/tour.ts'],
  outfile,
  bundle: true,
  platform: 'node',
  format: 'esm',
});
const { TOUR, TOUR_DURATION } = await import(
  pathToFileURL(outfile).href + '?v=' + Date.now()
);
const timestamp = (s) =>
  Math.floor(s / 60) +
  ':' +
  Math.floor(s % 60)
    .toString()
    .padStart(2, '0');
const precise = (s) => timestamp(s) + '.' + Math.round((s % 1) * 10);
const cues = TOUR.map((s, i) => ({
  chapter: i + 1,
  title: s.title,
  at: s.at,
  end: s.end,
  voiceAt: Number((s.at + s.voiceAt).toFixed(1)),
  voiceEnd: Number((s.at + s.voiceEnd).toFixed(1)),
  words: s.narration.split(/\s+/).length,
  narration: s.narration,
}));
const direction = [
  'HOW THINGS CLICK — HOW DOES A SELF-DRIVING CAR WORK?',
  'MASTER TOUR: 4:30 / 1920 x 1080 / 13 shots',
  '',
  'VOICE DIRECTION',
  'Warm, curious and precise. Talk to one interested viewer. Let the opening questions breathe.',
  'Use conversational emphasis, not a trailer voice. Read only the narration paragraphs.',
  'Aim for roughly 130–145 words per minute within the marked windows. Leave the remaining space silent.',
  'Pronunciation: Cybercab = SY-ber-cab. Inference = IN-fer-ence. Trajectory = truh-JEK-tuh-ree.',
  'The colored lines and hardware placements are educational illustrations. Do not imply that this is Tesla source code or a validated autonomy system.',
  '',
  'TIMING',
  'Each VO window is an absolute position in the 4:30 timeline. Generate/read each chapter separately.',
  'Place that reading at its VO IN point in Shotcut or another editor. Leave the gaps as silence.',
  'If a reading exceeds its VO OUT, re-record slightly faster or tighten pauses. Do not silently truncate it.',
  'Export one exactly 4:30 WAV or MP3 master; upload it with Add narration in the lab.',
  'Pasting the entire voice-only text into TTS does NOT preserve these chapter timings by itself.',
  'No burned narration captions. The export retains branding and technical labels.',
  '',
].join('\n');
const timed =
  direction +
  cues
    .map(
      (s) =>
        '\n' +
        String(s.chapter).padStart(2, '0') +
        ' | ' +
        timestamp(s.at) +
        '–' +
        timestamp(s.end) +
        ' | ' +
        s.title +
        '\nVO ' +
        precise(s.voiceAt) +
        ' → ' +
        precise(s.voiceEnd) +
        ' (' +
        s.words +
        ' words)' +
        '\n' +
        s.narration +
        '\n',
    )
    .join('') +
  '\nGenerated from lib/self-driving/tour.ts. Regenerate after changing the tour.\n';
const chapters = TOUR.map((s) => timestamp(s.at) + ' ' + s.title).join('\n');
const production = `# Self-driving video production

Length: **4:30**, thirteen shots. Record at **1920 × 1080**. The browser requests 30 fps; actual smoothness depends on the computer.

## Title

How Does a Self-Driving Car Work? Inside the Cybercab in 3D

## Description

No steering wheel. No pedals. What makes a self-driving car move?

Open a Cybercab-inspired 3D model and follow the loop from camera images to computing, planning, steering and braking. Then try the experiments yourself:
https://www.howthingsclick.com/self-driving

Change the speed, reveal hidden hardware, and watch decisions change. Subscribe to How Things Click for the next interactive explanation.

This is an educational model. Hardware placement and driving behavior are simplified; it does not reproduce Tesla’s proprietary software.

#SelfDrivingCars #Cybercab #HowThingsWork

## YouTube chapters

${chapters}

## Narration and edit

- Use self-driving-narration.txt for the timed readings. self-driving-voice-only.txt contains only spoken text.
- self-driving-cues.json gives exact absolute voice-in/out times for editing.
- Generate each chapter in the same voice and style, then place it at the specified time. Fill the gaps with silence and export a 4:30 master.
- Keep narration clear and forward. If adding music, start around 20–26 dB quieter than the voice, then check audibility on speakers and headphones. Avoid music under the opening question if it weakens the hook.
- Do not burn narration captions into this export. Upload a correctly timed caption file to YouTube separately only after the final voice is approved.
- The last 22 seconds invite viewers to change the experiment on the site. Add optional YouTube end-screen elements in the final 5–8 seconds without covering the car or site address.

## Browser recording

1. Open /self-driving and wait for the 3D model to finish loading.
2. Expand Recording studio. Add the finished 4:30 narration file.
3. Click Record tour. It always begins at 0:00 with the correct opening camera.
4. Keep the tab visible. Play/Pause pauses or resumes the tour, audio and recorder together.
5. Switching away pauses capture. Return and press Play to resume. Hidden-tab time is excluded from the saved video.
6. The full tour stops automatically at 4:30. Save recording downloads the file; a preview appears below.
7. Stop and save before 4:30 creates a preview clip, not the complete video.
8. Check the opening, computer close-up, road sections, closing shot and audio sync before uploading.

The saved video contains the channel logo, website address and technical scene labels, but no narration captions. The browser chooses MP4 or WebM based on support. Shotcut can convert either to H.264 MP4 for delivery. The recorder saves locally; it does not upload to YouTube.

The two road chapters show the street and the car’s interpretation together, including visibility, route and physical response. These technical annotations use the same simulation frame as the scene. The narration script and all voice windows remain unchanged.

## Engineering references

- Tesla AI: https://www.tesla.com/AI
- Tesla butterfly-door operation: https://www.tesla.com/robotaxi/riderguides/cybercab/en_us/GUID-EF6607DD-3EEA-4733-8134-CF8C8D8FE859.html
- Typical EPS motor power stage: https://www.ti.com/solution/electric-power-steering-eps
- Tesla EV thermal-system maintenance: https://www.tesla.com/support/vehicle-maintenance
- Pedestrian asset and motion credits: /models/pedestrian-credits.md
- Feedback control design: https://autowarefoundation.gitlab.io/autoware.auto/AutowareAuto/controller-design.html
- Tesla Cybercab rider guide: https://www.tesla.com/robotaxi/riderguides/cybercab/en_us/GUID-669E83C2-E7DE-40F4-9DBD-C9A32E7F6DFF.html
- Tesla Cybercab emergency response guide: https://digitalassets.tesla.com/tesla-contents/image/upload/2026-cybercab-emergency-response-guide.pdf
- Autoware architecture (an example of a modular autonomy stack, not Tesla’s implementation): https://docs.autoware.org/1.5.0/design/autoware-architecture-v2/roadmap/autonomous-driving-stack-architecture/

The narration explains functions that an autonomy system must perform. It does not assert that Tesla implements them as separate software modules. Camera counts, hidden network architecture, measured latency and autonomous-driving performance are deliberately not invented.
`;
const files = {
  'self-driving-narration.txt': timed,
  'self-driving-voice-only.txt':
    TOUR.map((s) => s.narration).join('\n\n') + '\n',
  'self-driving-cues.json':
    JSON.stringify({ duration: TOUR_DURATION, cues }, null, 2) + '\n',
  'self-driving-production.md': production,
};
await mkdir('public/tours', { recursive: true });
for (const [name, content] of Object.entries(files)) {
  const path = 'public/tours/' + name;
  if (process.argv.includes('--check')) {
    if ((await readFile(path, 'utf8')).replaceAll('\r\n', '\n') !== content)
      throw new Error(
        path + ' is stale. Run node scripts/export-self-driving-narration.mjs',
      );
  } else await writeFile(path, content);
}
console.log(
  JSON.stringify({
    duration: TOUR_DURATION,
    chapters: TOUR.length,
    totalWords: cues.reduce((sum, s) => sum + s.words, 0),
    peakWpm: Math.round(
      Math.max(...cues.map((s) => (s.words / (s.voiceEnd - s.voiceAt)) * 60)),
    ),
    files: Object.keys(files),
    verified: process.argv.includes('--check'),
  }),
);
