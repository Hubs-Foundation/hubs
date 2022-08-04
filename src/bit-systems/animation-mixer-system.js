import { defineQuery, enterQuery } from "bitecs";
import { AnimationMixer } from "../bit-components";
const animationMixerQuery = defineQuery([AnimationMixer]);
const animationMixerEnterQuery = enterQuery(animationMixerQuery);

const mixers = new Map();

export function animationMixerSystem(world) {
  animationMixerEnterQuery(world).forEach(function (eid) {
    const mesh = world.eid2obj.get(eid);
    const mixer = new THREE.AnimationMixer(mesh);
    // TODO Obviously wrong
    const loadingScaleClip = mixer.clipAction(
      new THREE.AnimationClip(null, 1000, [
        new THREE.VectorKeyframeTrack(".scale", [0, 0.2], [0, 0, 0, mesh.scale.x, mesh.scale.y, mesh.scale.z])
      ])
    );
    loadingScaleClip.play();
    mixers.set(eid, mixer);
  });

  animationMixerQuery(world).forEach(function (eid) {
    mixers.get(eid).update(0.01); //TODO: dt
  });
}
