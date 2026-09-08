import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { installPedestrian } from '../components/self-driving/pedestrian';
import { pedestrianMotionAt } from '../lib/self-driving/pedestrian-motion';
async function run() {
  const bytes = readFileSync('public/models/pedestrian.glb');
  assert(
    bytes.length < 3_000_000,
    'complete person + motion + textures download budget',
  );
  const jsonLength = bytes.readUInt32LE(12);
  const json = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString());
  assert(json.skins[0].joints.length >= 60, 'articulated human skeleton');
  assert(
    json.images.length >= 3 &&
      json.images.every(
        (i: { bufferView?: number }) => i.bufferView !== undefined,
      ),
    'textures embedded for offline use',
  );
  const loader = new GLTFLoader();
  loader.register(() => ({
    name: 'TEST_OMIT_TEXTURE_DECODE',
    loadTexture: () => Promise.resolve(new T.Texture()),
  }));
  const asset = await loader.parseAsync(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length),
    '',
  );
  const person = installPedestrian(asset);
  function bounds() {
    const box = new T.Box3();
    person.group.traverse((o) => {
      if (o instanceof T.SkinnedMesh) {
        for (let i = 0; i < o.geometry.attributes.position.count; i++)
          box.expandByPoint(
            o.getVertexPosition(i, new T.Vector3()).applyMatrix4(o.matrixWorld),
          );
      }
    });
    return box;
  }
  let maxHeight = 0;
  for (const t of [0, 2.8, 3, 3.3, 3.6, 4, 4.6, 5.1, 8, 12, 15, 20]) {
    person.update(t, 3);
    const box = bounds(),
      size = box.getSize(new T.Vector3());
    for (const v of [...box.min.toArray(), ...box.max.toArray()])
      assert(Number.isFinite(v));
    assert(
      box.min.y > -0.055 && box.min.y < 0.07,
      'feet stay on the ground: ' + t + ' / ' + box.min.y,
    );
    assert(size.y > 1.5 && size.y < 1.9, 'adult scale, intact pose: ' + size.y);
    assert(
      size.x < 1.2 && size.z < 1.5,
      'no detached limbs or residual root motion',
    );
    maxHeight = Math.max(maxHeight, size.y);
  }
  person.update(5, 3);
  const first = bounds();
  person.update(0, 3);
  person.update(12, 3);
  person.update(5, 3);
  assert(bounds().equals(first), 'seeking returns the exact same skinned pose');
  assert.equal(pedestrianMotionAt(2, 3).weight, 0, 'waiting uses idle');
  assert.equal(pedestrianMotionAt(18, 3).weight, 0, 'arrival uses idle');
  assert.equal(pedestrianMotionAt(5, 3).weight, 1, 'crossing uses walk');
  person.dispose();
  console.log(
    JSON.stringify({
      pedestrianBytes: bytes.length,
      clips: asset.animations.map((c) => c.name),
      maxHeight,
      checks:
        'rig, scale, embedded textures, ground contact and deterministic gait',
    }),
  );
}
run().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
