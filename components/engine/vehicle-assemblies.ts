import * as THREE from 'three';
import {
  VEHICLE_SYSTEMS,
  vehicleStage,
  type VehicleAssemblyOptions,
  type VehiclePart,
} from '../../lib/engine/vehicle-parts';

export type VehicleAssembly = { part: VehiclePart; group: THREE.Group };
export function vehiclePart(
  parent: THREE.Object3D,
  part: VehiclePart,
  parts: VehicleAssembly[],
  existing?: THREE.Group,
) {
  if (parts.some((p) => p.part.id === part.id))
    throw new Error(`Duplicate car assembly: ${part.id}`);
  const group = existing ?? new THREE.Group();
  group.name = part.id;
  group.userData.vehiclePartId = part.id;
  if (!existing) parent.add(group);
  parts.push({ part, group });
  return group;
}
export function createVehicleAssemblyController(
  root: THREE.Group,
  entries: VehicleAssembly[],
) {
  const ids = new Set<string>();
  const records = entries.map((entry) => {
    if (ids.has(entry.part.id))
      throw new Error(`Duplicate car assembly: ${entry.part.id}`);
    ids.add(entry.part.id);
    return {
      ...entry,
      base: entry.group.position.clone(),
      amount: 0,
      materials: [] as THREE.MeshStandardMaterial[],
    };
  });
  const byId = new Map(records.map((p) => [p.part.id, p]));
  const meshes: THREE.Mesh[] = [];
  // Materials are owned by each assembly, so highlighting one door or tire
  // cannot change the other three through a shared material reference.
  const clones = new Map<string, THREE.MeshStandardMaterial>();
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    let owner: THREE.Object3D | null = object;
    while (owner && !owner.userData.vehiclePartId) owner = owner.parent;
    if (!owner) return;
    const id = owner.userData.vehiclePartId as string,
      record = byId.get(id);
    if (!record) return;
    object.userData.vehiclePartId = id;
    const source = Array.isArray(object.material)
      ? object.material
      : [object.material];
    const owned = source.map((material) => {
      const key = id + material.uuid;
      let m = clones.get(key);
      if (!m) {
        m = material.clone() as THREE.MeshStandardMaterial;
        m.userData.baseColor = m.color?.clone();
        m.userData.baseEmissive = m.emissive?.clone();
        m.userData.baseEmissiveIntensity = m.emissiveIntensity;
        clones.set(key, m);
        record.materials.push(m);
      }
      return m;
    });
    object.material = Array.isArray(object.material) ? owned : owned[0];
    meshes.push(object);
  });
  let previous = '';
  function hasAncestor(group: THREE.Object3D, id: string) {
    let p: THREE.Object3D | null = group;
    while (p) {
      if (p.userData.vehiclePartId === id) return true;
      p = p.parent;
    }
    return false;
  }
  function update(
    options: VehicleAssemblyOptions,
    dt: number,
    instant = false,
  ) {
    let moving = false,
      maxAmount = 0;
    for (const r of records) {
      const target = options.returned?.includes(r.part.id)
        ? 0
        : options.removed.includes(r.part.id)
          ? 1
          : vehicleStage(options.explode, r.part.stage);
      r.amount = instant
        ? target
        : THREE.MathUtils.damp(r.amount, target, 5, dt);
      if (Math.abs(target - r.amount) < 0.0002) r.amount = target;
      moving ||= Math.abs(target - r.amount) > 0.001;
      maxAmount = Math.max(maxAmount, r.amount);
      r.group.position
        .copy(r.base)
        .addScaledVector(new THREE.Vector3(...r.part.offset), r.amount);
    }
    const key = JSON.stringify([
      options.selected,
      options.isolated,
      options.system,
      options.colors,
      options.inspection,
    ]);
    if (previous !== key) {
      previous = key;
      for (const r of records) {
        let showSelf =
          options.isolated && options.selected
            ? hasAncestor(r.group, options.selected)
            : options.system === 'all' || r.part.system === options.system;
        if (
          options.inspection === 'cabin' &&
          options.system === 'cabin' &&
          options.selected !== r.part.id &&
          [
            'car-headliner',
            'car-left-pillar-trim',
            'car-left-front-door-trim',
            'car-left-rear-door-trim',
            'car-left-sun-visor',
            'car-right-sun-visor',
            'car-overhead-console',
            'car-left-front-grab-handle',
            'car-right-front-grab-handle',
            'car-left-rear-grab-handle',
            'car-right-rear-grab-handle',
          ].includes(r.part.id)
        )
          showSelf = false;
        const neededParent =
          options.isolated && options.selected
            ? hasAncestor(byId.get(options.selected)?.group ?? root, r.part.id)
            : records.some(
                (child) =>
                  child.part.system === options.system &&
                  hasAncestor(child.group, r.part.id),
              );
        r.group.visible = showSelf || neededParent;
        for (const m of meshes)
          if (m.userData.vehiclePartId === r.part.id) m.visible = showSelf;
        for (const m of r.materials) {
          if (!m.color) continue;
          m.color.copy(m.userData.baseColor);
          const color = VEHICLE_SYSTEMS.find(
            (s) => s.id === r.part.system,
          )!.color;
          if (options.colors) m.color.lerp(new THREE.Color(color), 0.45);
          if (m.emissive) {
            m.emissive.copy(m.userData.baseEmissive);
            m.emissiveIntensity = m.userData.baseEmissiveIntensity;
            if (options.selected === r.part.id) {
              m.emissive.set('#77dcc5');
              m.emissiveIntensity = 0.25;
            }
          }
        }
      }
    }
    return { moving, maxAmount };
  }
  return {
    records,
    byId,
    meshes,
    materials: [...clones.values()],
    update,
    resetVisibility() {
      previous = '';
      records.forEach((r) => (r.group.visible = true));
      meshes.forEach((m) => (m.visible = true));
    },
    bounds(id: string) {
      const r = byId.get(id);
      return r ? new THREE.Box3().setFromObject(r.group) : null;
    },
  };
}
