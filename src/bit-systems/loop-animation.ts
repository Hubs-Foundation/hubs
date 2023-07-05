import { addComponent, defineQuery, enterQuery, exitQuery, removeComponent } from "bitecs";
import { AnimationClip, LoopRepeat } from "three";
import {
  MixerAnimatable,
  MixerAnimatableData,
  LoopAnimation,
  LoopAnimationData,
  LoopAnimationInitialize,
  LoopAnimationInitializeData,
  Object3DTag
} from "../bit-components";
import { HubsWorld } from "../app";
import { findAncestorWithComponent } from "../utils/bit-utils";

const loopAnimationInitializeQuery = defineQuery([LoopAnimationInitialize, Object3DTag]);
const loopAnimationInitializeEnterQuery = enterQuery(loopAnimationInitializeQuery);

const loopAnimationQuery = defineQuery([LoopAnimation, Object3DTag]);
const loopAnimationExitQuery = exitQuery(loopAnimationQuery);

// Question: Who should have AnimationMixer?
//           MixerAnimatable component or Scene/App?

const getActiveClips = (
  animations: Array<AnimationClip>,
  activeClipIndices: number[],
  clip: string
): AnimationClip[] => {
  if (clip !== "") {
    const activeClips = [];
    const clipNames = clip.split(",");
    for (let i = 0; i < clipNames.length; i++) {
      const clipName = clipNames[i];
      const foundClip = animations.find((clip: AnimationClip) => {
        return clip.name === clipName;
      });
      if (foundClip) {
        activeClips.push(foundClip);
      } else {
        console.warn(`Could not find animation names '${clipName}' in `, animations);
      }
    }
    return activeClips;
  } else {
    return activeClipIndices.map((index: number) => animations[index]);
  }
};

export function loopAnimationSystem(world: HubsWorld): void {
  loopAnimationInitializeEnterQuery(world).forEach((eid: number): void => {
    const object = world.eid2obj.get(eid)!;
    const mixerEid = findAncestorWithComponent(world, MixerAnimatable, eid)!;
    const mixer = MixerAnimatableData.get(mixerEid)!;
    const root = world.eid2obj.get(mixerEid)!;

    addComponent(world, LoopAnimation, eid);

    const params = LoopAnimationInitializeData.get(eid)!;
    const activeAnimations = [];

    // TODO: Consider where animations are stored.
    //       Currently they are stored in Object3D but
    //       it isn't aligned with the Three.js official API.
    //       Move to Component?
    const activeClips = getActiveClips(root.animations, params.activeClipIndices, APP.getString(params.clip)!);

    for (let j = 0; j < activeClips.length; j++) {
      const clip = activeClips[j];

      // Ignore if activeClipIndex is out of range from the animations
      if (!clip) {
        continue;
      }

      const action = mixer.clipAction(activeClips[j], object);
      action.enabled = true;
      action.paused = params.paused;
      action.time = params.startOffset;
      action.timeScale = params.timeScale;
      action.setLoop(LoopRepeat, Infinity);
      action.play();

      activeAnimations.push(action);
    }

    LoopAnimationData.set(eid, activeAnimations);

    removeComponent(world, LoopAnimationInitialize, eid);
    LoopAnimationInitializeData.delete(eid);
  });

  loopAnimationExitQuery(world).forEach((eid: number): void => {
    const mixerEid = findAncestorWithComponent(world, MixerAnimatable, eid);
    const mixer = MixerAnimatableData.get(mixerEid)!;
    const activeAnimations = LoopAnimationData.get(eid)!;
    for (let i = 0; i < activeAnimations.length; i++) {
      const action = activeAnimations[i];
      action.enabled = false;
      action.stop();
      if (mixer) {
        mixer.uncacheAction(action);
      }
    }
    LoopAnimationData.delete(eid);
  });
}
