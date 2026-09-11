import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
await mkdir('work/starlink', { recursive: true });
await build({
  entryPoints: ['lib/starlink/simulation.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'work/starlink/story.mjs',
});
const { shotsFor, durationFor, timecode } = await import(
  pathToFileURL(resolve('work/starlink/story.mjs')).href + '?' + Date.now()
);
await mkdir('public/tours', { recursive: true });
for (const format of ['full', 'short']) {
  let start = 0;
  const cues = shotsFor(format).map((s, i) => {
    const cue = {
      chapter: i + 1,
      id: s.id,
      start,
      end: start + s.duration,
      title: s.title,
      narration: s.narration,
    };
    start += s.duration;
    return cue;
  });
  const header =
    'HOW THINGS CLICK — HOW STARLINK ACTUALLY WORKS\n' +
    (format === 'short'
      ? '60 seconds / portrait 1080 × 1920'
      : '150 seconds / landscape 1920 × 1080') +
    '\n\nVOICE DIRECTION: Curious, confident and conversational. Keep the energy moving; do not rush the explanations. Record each chapter separately. Place it at the exact start below, finishing at least 0.4 seconds before the next chapter. These are edit cues, not automatically aligned speech. No narration captions are burned into the recording.\n\n';
  await writeFile(
    'public/tours/starlink-' + format + '-narration.txt',
    header +
      cues
        .map(
          (c) =>
            timecode(c.start) +
            ' → ' +
            timecode(c.end) +
            ' | ' +
            c.title +
            '\n' +
            c.narration,
        )
        .join('\n\n') +
      '\n',
  );
  await writeFile(
    'public/tours/starlink-' + format + '-voice-only.txt',
    cues.map((c) => c.narration).join('\n\n') + '\n',
  );
  await writeFile(
    'public/tours/starlink-' + format + '-cues.json',
    JSON.stringify(
      {
        format,
        duration: durationFor(format),
        resolution: format === 'short' ? [1080, 1920] : [1920, 1080],
        captions: false,
        chapters: cues,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(
    format,
    durationFor(format) + ' seconds',
    cues.reduce((n, c) => n + c.narration.split(/\s+/).length, 0) + ' words',
  );
}
