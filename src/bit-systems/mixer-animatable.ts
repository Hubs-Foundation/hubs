import { addComponent, defineQuery, enterQuery, entityExists, exitQuery, removeComponent } from "bitecs";
import { AnimationMixer } from "three";
import { MixerAnimatable, MixerAnimatableInitialize, MixerAnimatableData, Object3DTag } from "../bit-components";
import { HubsWorld } from "../app";

const initializeQuery = defineQuery([MixerAnimatableInitialize, Object3DTag]);
const initializeEnterQuery = enterQuery(initializeQuery);
const mixerQuery = defineQuery([MixerAnimatable, Object3DTag]);
const mixerExitQuery = exitQuery(mixerQuery);

export function mixerAnimatableSystem(world: HubsWorld): void {
  initializeEnterQuery(world).forEach(eid => {
    if (!entityExists(world, eid)) {
      console.warn("Skipping nonexistant entity."); // TODO Why does this happen?
      return;
    }
    addComponent(world, MixerAnimatable, eid);

    const object = world.eid2obj.get(eid)!;
    const mixer = new AnimationMixer(object);
    MixerAnimatableData.set(eid, mixer);

    removeComponent(world, MixerAnimatableInitialize, eid);
  });

  mixerQuery(world).forEach(eid => {
    const mixer = MixerAnimatableData.get(eid)!;
    mixer.update(world.time.delta / 1000.0);
  });

  mixerExitQuery(world).forEach(eid => {
    const mixer = MixerAnimatableData.get(eid)!;
    mixer.stopAllAction();
    mixer.uncacheRoot(mixer.getRoot());
    MixerAnimatableData.delete(eid);
  });
}
