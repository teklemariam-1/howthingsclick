import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createCybercab } from '../components/self-driving/geometry';
import { createAutonomyHardware } from '../components/self-driving/hardware';
import {
  engineeringTelemetry,
  steeringAt,
  stoppingExperiment,
  SYSTEMS,
} from '../lib/self-driving/engineering';
import {
  simulate,
  DEFAULT_SETTINGS,
  frameAt,
} from '../lib/self-driving/simulation';
import { TOUR } from '../lib/self-driving/tour';
async function run() {
  const f = frameAt(simulate(DEFAULT_SETTINGS), 5);
  const t = engineeringTelemetry(f, DEFAULT_SETTINGS);
  assert(
    !t.prediction.length || f.visible,
    'no object prediction without an observation',
  );
  assert.equal(steeringAt(-12, 'signal'), 0);
  assert(steeringAt(-9.5, 'roadworks') < 0);
  assert(steeringAt(-2.5, 'roadworks') > 0);
  assert(
    Math.abs(steeringAt(-6, 'roadworks')) < 0.001,
    'straight slope has zero curvature; heading is not steering angle',
  );
  const a = stoppingExperiment(36, 0, 5),
    b = stoppingExperiment(36, 500, 5),
    c = stoppingExperiment(72, 0, 5);
  assert.equal(a.braking, 10);
  assert.equal(b.total - a.total, 5);
  assert.equal(c.braking, 4 * a.braking);
  assert(
    stoppingExperiment(36, 500, 2).total > b.total,
    'weaker deceleration increases stopping distance',
  );
  const car = createCybercab(),
    hardware = createAutonomyHardware();
  const base = new T.Box3().setFromObject(car.group);
  for (const id of SYSTEMS.map((s) => s.id)) {
    for (const mode of ['assembled', 'cutaway', 'exploded'] as const)
      hardware.update(f, DEFAULT_SETTINGS, id, mode, 0.1);
  }
  assert(hardware.picks.length > 100, 'detailed selectable hardware');
  for (const id of ['compute', 'control', 'power', 'sensors'])
    assert(
      hardware.picks.some((p) => p.userData.system === id),
      'pickable ' + id,
    );
  let hardwareMeshes = 0;
  hardware.group.traverse((o) => {
    if (o instanceof T.Mesh) {
      hardwareMeshes++;
      for (const n of o.geometry.attributes.position.array)
        assert(Number.isFinite(n));
    }
  });
  car.reveal(1, 1);
  car.update(0, 0, 1);
  car.reveal(0, 0);
  car.update(0, 0, 0);
  assert(
    new T.Box3().setFromObject(car.group).equals(base),
    'assembled pose survives an exploded/cutaway round trip',
  );
  const buffer = readFileSync('public/models/cybercab-body.glb');
  const asset = await new GLTFLoader().parseAsync(
    buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    ),
    '',
  );
  asset.scene.updateMatrixWorld(true);
  let imported = 0;
  asset.scene.traverse((o) => {
    if (o instanceof T.Mesh) {
      const target = car.group.getObjectByName(o.name);
      assert(target instanceof T.Mesh, 'matching replaceable part: ' + o.name);
      const g = o.geometry.clone().applyMatrix4(o.matrixWorld);
      g.computeBoundingBox();
      assert(
        g.boundingBox!.max.y < 1.6 && g.boundingBox!.min.y > 0,
        'GLB is in metres and uses Y up',
      );
      for (const v of g.attributes.position.array) assert(Number.isFinite(v));
      imported++;
    }
  });
  assert.equal(imported, 11, 'all body, glass and fascia panels exported');
  assert(buffer.length < 4_000_000, 'body download budget');
  assert(
    TOUR.filter((s) => s.engineering).length >= 7,
    'tour prioritizes engineering',
  );
  console.log(
    JSON.stringify({
      hardwareMeshes,
      pickableHardware: hardware.picks.length,
      blenderPanels: imported,
      assetBytes: buffer.length,
      checks:
        'occlusion-aware prediction, curvature steering, delay/deceleration experiment, assembly round trip, GLB registration and units',
    }),
  );
}
run().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
