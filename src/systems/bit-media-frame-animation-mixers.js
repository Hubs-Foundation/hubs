import { defineQuery } from "bitecs";
import { MediaFrame } from "../bit-components";

// TODO: Animation mixers should be handled in a system about animation mixers...
//       They should have nothing to do with media frames!!
const mediaFramesQuery = defineQuery([MediaFrame]);
export function mediaFrameAnimationMixerSystem(world) {
  const mediaFrames = mediaFramesQuery(world);
  for (let i = 0; i < mediaFrames.length; i++) {
    const frameEid = mediaFrames[i];
    const previewEid = MediaFrame.preview[frameEid];
    // We need to get the child because the animation mixer is not on the parent object
    const mixer = previewEid && world.eid2obj.get(previewEid).children[0].mixer;
    if (mixer) {
      // TODO use dt, not a random number
      mixer.update(10 / 1000);
    }
  }
}
