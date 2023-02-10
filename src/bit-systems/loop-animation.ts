import { addComponent, defineQuery, enterQuery, exitQuery, hasComponent, removeComponent } from "bitecs";
import { AnimationAction, AnimationClip, AnimationMixer, LoopRepeat } from "three";
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

const loopAnimationInitializeQuery = defineQuery([LoopAnimationInitialize, MixerAnimatable, Object3DTag]);
const loopAnimationInitializeEnterQuery = enterQuery(loopAnimationInitializeQuery);

const loopAnimationQuery = defineQuery([LoopAnimation, MixerAnimatable, Object3DTag]);
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
    const mixer = MixerAnimatableData.get(eid)!;

    addComponent(world, LoopAnimation, eid);

    const params = LoopAnimationInitializeData.get(eid)!;
    const activeAnimations = [];

    for (let i = 0; i < params.length; i++) {
      const p = params[i];
      // TODO: Consider where animations are stored.
      //       Currently they are stored in Object3D but
      //       it isn't aligned with the Three.js official API.
      //       Move to Component?
      const activeClips = getActiveClips(object.animations, p.activeClipIndices, APP.getString(p.clip)!);

      for (let j = 0; j < activeClips.length; j++) {
        const clip = activeClips[j];

        // Ignore if activeClipIndex is out of range from the animations
        if (!clip) {
          continue;
        }

        const action = mixer.clipAction(activeClips[j], object);
        action.enabled = true;
        action.paused = p.paused;
        action.time = p.startOffset;
        action.timeScale = p.timeScale;
        action.setLoop(LoopRepeat, Infinity);
        action.play();

        activeAnimations.push(action);
      }
    }

    LoopAnimationData.set(eid, activeAnimations);

    removeComponent(world, LoopAnimationInitialize, eid);
    LoopAnimationInitializeData.delete(eid);
  });

  loopAnimationExitQuery(world).forEach((eid: number): void => {
    const mixer = hasComponent(world, MixerAnimatable, eid) ? MixerAnimatableData.get(eid)! : null;
    const activeAnimations = LoopAnimationData.get(eid)!;
    for (let i = 0; i < activeAnimations.length; i++) {
      const action = activeAnimations[i];
      action.enabled = false;
      action.stop();
      if (mixer !== null) {
        mixer.uncacheAction(action);
      }
    }
    LoopAnimationData.delete(eid);
  });
}
