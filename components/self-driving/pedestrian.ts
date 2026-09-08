import * as T from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { pedestrianMotionAt } from '@/lib/self-driving/pedestrian-motion';

/** Apply both clips from absolute time, so pausing and scrubbing never change the gait. */
export function installPedestrian(asset: GLTF) {
  const group = new T.Group();
  group.name = 'Animated pedestrian';
  group.add(asset.scene);
  const mixer = new T.AnimationMixer(asset.scene);
  const walkClip = T.AnimationClip.findByName(asset.animations, 'Walk');
  const idleClip = T.AnimationClip.findByName(asset.animations, 'Idle');
  if (!walkClip || !idleClip)
    throw new Error('Pedestrian motion clips missing');
  const walk = mixer.clipAction(walkClip).play();
  const idle = mixer.clipAction(idleClip).play();
  asset.scene.traverse((o) => {
    if (o instanceof T.Mesh) {
      o.castShadow = true;
      o.receiveShadow = true;
      o.frustumCulled = false;
      const materials = Array.isArray(o.material) ? o.material : [o.material];
      materials.forEach((m) => {
        if (m instanceof T.MeshStandardMaterial) {
          m.envMapIntensity = 0.32;
          if (m.name.includes('opacity')) {
            m.transparent = false;
            m.alphaTest = 0.4;
            m.side = T.DoubleSide;
            m.depthWrite = true;
          }
        }
      });
    }
  });
  return {
    group,
    update(time: number, delay: number) {
      const pose = pedestrianMotionAt(time, delay);
      walk.time = pose.cycle * walkClip.duration;
      idle.time =
        ((time % idleClip.duration) + idleClip.duration) % idleClip.duration;
      walk.setEffectiveWeight(pose.weight);
      idle.setEffectiveWeight(1 - pose.weight);
      mixer.update(0);
      group.updateMatrixWorld(true);
    },
    dispose() {
      mixer.stopAllAction();
      mixer.uncacheRoot(asset.scene);
      const textures = new Set<T.Texture>();
      asset.scene.traverse((o) => {
        if (o instanceof T.SkinnedMesh) o.skeleton.dispose();
        if (o instanceof T.Mesh) {
          o.geometry.dispose();
          (Array.isArray(o.material) ? o.material : [o.material]).forEach(
            (m) => {
              for (const value of Object.values(m))
                if (value instanceof T.Texture) textures.add(value);
              m.dispose();
            },
          );
        }
      });
      textures.forEach((t) => t.dispose());
      group.removeFromParent();
    },
  };
}
export function createPedestrian(isCancelled: () => boolean) {
  const group = new T.Group();
  let model: ReturnType<typeof installPedestrian> | undefined;
  const ready = new GLTFLoader()
    .loadAsync('/models/pedestrian.glb')
    .then((asset) => {
      const person = installPedestrian(asset);
      if (isCancelled()) {
        person.dispose();
        return;
      }
      model = person;
      group.add(model.group);
    });
  return {
    group,
    ready,
    update(time: number, delay: number) {
      model?.update(time, delay);
    },
    dispose() {
      model?.dispose();
      group.removeFromParent();
    },
  };
}
