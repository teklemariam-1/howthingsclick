import type { Display, createStarlinkScene } from './scene';
import {
  durationFor,
  sampleTour,
  type Format,
} from '@/lib/starlink/simulation';
// Deterministic timestamps avoid compositor throttling and dropped real-time capture frames.
// https://www.w3.org/TR/webcodecs/ and the W3C AVC codec registration.
export async function renderProduction(
  scene: ReturnType<typeof createStarlinkScene>,
  format: Format,
  progress: (frame: number, total: number) => void,
  cancelled: () => boolean,
) {
  if (typeof VideoEncoder === 'undefined')
    throw Error('This browser does not support frame-by-frame encoding.');
  const portrait = format === 'short',
    width = portrait ? 1080 : 1920,
    height = portrait ? 1920 : 1080,
    total = durationFor(format) * 30;
  const config: VideoEncoderConfig = {
    codec: 'avc1.420029',
    width,
    height,
    framerate: 30,
    bitrate: 12000000,
    latencyMode: 'realtime',
    avc: { format: 'annexb' },
  };
  const support = await VideoEncoder.isConfigSupported(config);
  if (!support.supported)
    throw Error('H.264 frame encoding is unavailable on this device.');
  const chunks: BlobPart[] = [];
  let failure: Error | undefined;
  const encoder = new VideoEncoder({
    output(chunk) {
      const bytes = new Uint8Array(chunk.byteLength);
      chunk.copyTo(bytes);
      chunks.push(bytes);
    },
    error(error) {
      failure = error;
    },
  });
  const display = (i: number): Display => {
    const time = i / 30,
      s = sampleTour(time, format);
    return {
      view: s.shot.view,
      time,
      angle: s.angle,
      explode: s.explode,
      blocked: s.blocked,
      lasers: true,
      guided: true,
      title: s.shot.title,
      kicker: s.shot.kicker,
      progress: time / durationFor(format),
      shotId: s.shot.id,
      localTime: s.local,
      portrait,
    };
  };
  encoder.configure(config);
  const stream = scene.startCapture(display(0), format);
  stream.getTracks().forEach((t) => t.stop());
  try {
    for (let i = 0; i < total; i++) {
      if (cancelled()) throw Error('Production render cancelled.');
      if (failure) throw failure;
      while (encoder.encodeQueueSize > 6) {
        await new Promise((r) => setTimeout(r, 2));
        if (failure) throw failure;
        if (cancelled()) throw Error('Production render cancelled.');
      }
      scene.update(display(i), i === 0 ? 0 : 1 / 30);
      const frame = new VideoFrame(scene.frameCanvas(), {
        timestamp: Math.round((i * 1000000) / 30),
        duration: Math.round(1000000 / 30),
      });
      encoder.encode(frame, { keyFrame: i % 60 === 0 });
      frame.close();
      if (i % 15 === 0) {
        progress(i, total);
        await new Promise((r) => setTimeout(r, 0));
      }
    }
    await encoder.flush();
    if (failure) throw failure;
    progress(total, total);
    const body = new Blob(chunks, { type: 'video/h264' });
    const r = await fetch('http://127.0.0.1:4319/exports/' + format, {
      method: 'POST',
      headers: { 'Content-Type': body.type },
      body,
    });
    if (!r.ok)
      throw Error(
        'The local export helper could not save the rendered frames.',
      );
    return (await r.json()) as { path: string };
  } finally {
    if (encoder.state !== 'closed') encoder.close();
    scene.endCapture();
  }
}
