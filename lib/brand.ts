export const BRAND_MARK_PATH =
  'M28 10H20C12.268 10 6 16.268 6 24s6.268 14 14 14h8';

let recordingMark: Path2D | undefined;
export function drawRecordingBrand(ctx: CanvasRenderingContext2D) {
  recordingMark ??= new Path2D(BRAND_MARK_PATH);
  ctx.save();
  ctx.translate(42, 22);
  ctx.scale(40 / 48, 40 / 48);
  ctx.strokeStyle = '#eef6fa';
  ctx.lineWidth = 8;
  ctx.lineJoin = 'round';
  ctx.stroke(recordingMark);
  ctx.fillStyle = '#d5ef78';
  ctx.fillRect(30, 4, 12, 12);
  ctx.restore();
  ctx.save();
  ctx.fillStyle = '#eef6fa';
  ctx.font = '600 26px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('how things click.', 96, 50);
  ctx.restore();
}
