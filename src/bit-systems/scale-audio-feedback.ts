import { defineQuery, enterQuery, exitQuery } from "bitecs";
import { MathUtils } from "three";
import { HubsWorld } from "../app";
import { NetworkAudioAnalyser, NetworkedAvatar, ScaleAudioFeedback } from "../bit-components";
import { findAncestorWithComponent, findChildWithComponent } from "../utils/bit-utils";

const eid2analyserEid = new Map<number, number>();

const scaleAudioFeedbackQuery = defineQuery([ScaleAudioFeedback]);
const scaleAudioFeedbackEnterQuery = enterQuery(scaleAudioFeedbackQuery);
const scaleAudioFeedbackExitQuery = exitQuery(scaleAudioFeedbackQuery);
export function scaleAudioFeedbackSystem(world: HubsWorld) {
  scaleAudioFeedbackEnterQuery(world).forEach(eid => {
    const networkedAvatarEid = findAncestorWithComponent(world, NetworkedAvatar, eid)!;
    const networkedAudioAnalyserEid = findChildWithComponent(world, NetworkAudioAnalyser, networkedAvatarEid)!;
    eid2analyserEid.set(eid, networkedAudioAnalyserEid);
  });
  scaleAudioFeedbackExitQuery(world).forEach(eid => eid2analyserEid.delete(eid));
  scaleAudioFeedbackQuery(world).forEach(eid => {
    if (eid2analyserEid.has(eid)) {
      const networkedAudioAnalyserEid = eid2analyserEid.get(eid)!;
      const obj = world.eid2obj.get(eid)!;
      obj.scale.setScalar(
        MathUtils.mapLinear(
          NetworkAudioAnalyser.volume[networkedAudioAnalyserEid] || 0,
          0,
          1,
          ScaleAudioFeedback.minScale[eid],
          ScaleAudioFeedback.maxScale[eid]
        )
      );
      obj.matrixNeedsUpdate = true;
    }
  });
}
