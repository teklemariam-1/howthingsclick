import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createCybercab } from '../components/self-driving/geometry';
import { createRoadWheel, TIRE_WIDTH } from '../components/self-driving/wheel';
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
  let imported = 0,
    corePanels = 0;
  const details: { name: string; assembly: string }[] = [];
  asset.scene.traverse((o) => {
    if (o instanceof T.Mesh) {
      const target = car.group.getObjectByName(o.name);
      if (o.name.startsWith('body_')) {
        assert(
          target instanceof T.Mesh,
          'matching replaceable part: ' + o.name,
        );
        corePanels++;
      } else {
        assert(o.name.startsWith('detail_'), 'recognized detail: ' + o.name);
        assert(
          [
            'paint',
            'glass',
            'trim',
            'headlamp',
            'taillamp',
            'upholstery',
            'stitch',
            'carpet',
            'display',
            'ambient',
            'buckle',
          ].includes(o.userData.surface),
          'known surface material',
        );
        assert(
          o.userData.assembly === 'body' ||
            car.group.getObjectByName(o.userData.assembly) instanceof T.Group,
          'existing attachment assembly',
        );
        details.push({ name: o.name, assembly: o.userData.assembly });
      }
      const g = o.geometry.clone().applyMatrix4(o.matrixWorld);
      g.computeBoundingBox();
      assert(
        g.boundingBox!.max.y < 1.6 && g.boundingBox!.min.y > 0,
        'GLB is in metres and uses Y up',
      );
      if (o.name === 'body_rear')
        assert(
          g.boundingBox!.min.y > 0.42 && g.boundingBox!.max.y < 0.89,
          'shortened gold rear fascia preserves reference proportions',
        );
      for (const v of g.attributes.position.array) assert(Number.isFinite(v));
      imported++;
    }
  });
  assert.equal(
    corePanels,
    11,
    'all replaceable body, glass and fascia panels exported',
  );
  assert(
    details.length >= 30,
    'seals, liners, lights and pillar details exported',
  );
  for (const name of [
    'detail_window_seal_1',
    'detail_door_seal_-1',
    'detail_arch_lip_1.4_1',
    'detail_headlight',
    'detail_taillight',
    'detail_seat_back_1',
    'detail_seat_back_-1',
    'detail_cabin_display',
    'detail_door_inner_1',
    'detail_center_armrest',
  ])
    assert(
      details.some((d) => d.name === T.PropertyBinding.sanitizeNodeName(name)),
      'required detail is visible and exported: ' + name,
    );
  // Exercise the actual browser installation path using the parsed local asset.
  // oxlint-disable-next-line typescript/unbound-method -- Saved only for restoration; never called detached.
  const originalLoad = GLTFLoader.prototype.loadAsync;
  GLTFLoader.prototype.loadAsync = async () => asset;
  try {
    await car.loadDetailed();
  } finally {
    GLTFLoader.prototype.loadAsync = originalLoad;
  }
  for (const d of details) {
    const mesh = car.group.getObjectByName(d.name);
    assert(mesh instanceof T.Mesh, 'detail installed');
    assert.equal(
      (mesh.material as T.Material).side,
      T.DoubleSide,
      'thin trim and lighting visible from both sides',
    );
    assert.equal(
      mesh.parent,
      d.assembly === 'body' ? car.group : car.group.getObjectByName(d.assembly),
      'detail follows its correct assembly',
    );
  }
  const assembled = new T.Box3().setFromObject(car.group);
  car.reveal(1, 1);
  car.update(5, 0.2, 1);
  car.group.traverse((o) => {
    if (o.name === 'Detachable Cybercab aero cover')
      assert.equal(o.visible, false);
    if (o.name === 'Alloy rim barrel' || o.name === 'Ventilated brake rotor')
      assert.equal(o.visible, true, 'complete wheel remains in cutaway');
  });
  car.reveal(0, 0);
  car.update(0, 0, 0);
  assert(
    new T.Box3().setFromObject(car.group).equals(assembled),
    'refined assembly returns to exact closed pose',
  );
  const wheel = createRoadWheel(1, new T.MeshStandardMaterial());
  wheel.group.updateMatrixWorld(true);
  assert(
    Math.abs(
      new T.Box3().setFromObject(wheel.tire).getSize(new T.Vector3()).z -
        TIRE_WIDTH,
    ) < 1e-5,
    'full-width road tire',
  );
  const crown = wheel.profile.filter((p) => p[0] >= 0.38).map((p) => p[1]);
  assert(
    Math.max(...crown) - Math.min(...crown) > 0.16,
    'road tire has a broad flat crown',
  );
  car.brake(true);
  const lamp = car.group.getObjectByName('detail_taillight') as T.Mesh;
  assert.equal(
    (lamp.material as T.MeshStandardMaterial).emissiveIntensity,
    5,
    'refined rear lamp responds to braking',
  );
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
