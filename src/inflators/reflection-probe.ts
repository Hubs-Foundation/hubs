import { addComponent } from "bitecs";
import { Texture } from "three";
import { HubsWorld } from "../app";
import { ReflectionProbe } from "../bit-components";
import { addObject3DComponent } from "../utils/jsx-entity";

export interface ReflectionProbeParams {
  size: number;
  envMapTexture?: Texture;
}

const DEFAULTS = {
  size: 1,
  envMapTexture: null
};

export function inflateReflectionProbe(world: HubsWorld, eid: number, componentProps: ReflectionProbeParams) {
  const { envMapTexture, size } = Object.assign({}, DEFAULTS, componentProps) as ReflectionProbeParams;
  envMapTexture!.flipY = true;
  envMapTexture!.mapping = THREE.EquirectangularReflectionMapping;
  const box = new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(), new THREE.Vector3().setScalar(size * 2));

  addComponent(world, ReflectionProbe, eid);
  // TODO: Add ReflectionProbe to three.js type defs
  const probe = new (THREE as any).ReflectionProbe(box, envMapTexture);
  addObject3DComponent(world, eid, probe);

  if (AFRAME.scenes[0].systems["hubs-systems"].environmentSystem.debugMode) {
    const debugBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(),
      new THREE.Vector3().setScalar(size * 2)
    );
    probe.add(new THREE.Box3Helper(debugBox, new THREE.Color(Math.random(), Math.random(), Math.random())));
  }
}
