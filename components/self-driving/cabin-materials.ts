import * as T from 'three';

export async function createCabinMaterials(): Promise<
  Record<string, T.Material>
> {
  const soft = (color: string, roughness: number) =>
    new T.MeshStandardMaterial({ color, roughness, side: T.DoubleSide });
  const display = new T.MeshBasicMaterial({
    color: typeof document === 'undefined' ? '#243840' : '#ffffff',
    side: T.DoubleSide,
  });
  if (typeof document !== 'undefined') {
    try {
      const texture = await new T.TextureLoader().loadAsync(
        '/models/cybercab-display.png',
      );
      texture.colorSpace = T.SRGBColorSpace;
      display.map = texture;
    } catch {
      display.color.set('#243840');
    }
  }
  return {
    upholstery: soft('#d8d1c2', 0.46),
    stitch: soft('#8b8272', 0.68),
    carpet: soft('#242322', 0.96),
    buckle: soft('#962d2d', 0.52),
    ambient: new T.MeshStandardMaterial({
      color: '#fff0cc',
      emissive: '#ffe9b6',
      emissiveIntensity: 0.6,
      side: T.DoubleSide,
    }),
    display,
  };
}
