import { addComponent } from "bitecs";
import { LoopAnimationInitialize, LoopAnimationInitializeData } from "../bit-components";
import { HubsWorld } from "../app";

export type LoopAnimationParams = {
  activeClipIndex?: number;
  // TODO: Do we need to keep supporting the following two params?
  //       Perhaps we should determine which one should be the
  //       the canonical presentation and then handle converting
  //       the others to that.
  // DEPRECATED: Use activeClipIndex instead since animation
  //             names are not unique
  clip?: string;
  // Support for Spoke->Hubs activeClipIndices struct
  activeClipIndices?: number[];
  paused?: boolean;
  startOffset?: number;
  timeScale?: number;
};

const DEFAULTS: Required<LoopAnimationParams> = {
  activeClipIndex: 0,
  clip: "",
  activeClipIndices: [],
  paused: false,
  startOffset: 0,
  timeScale: 1.0
};

export function inflateLoopAnimationInitialize(world: HubsWorld, eid: number, params: LoopAnimationParams): number {
  const requiredParams = Object.assign({}, DEFAULTS, params) as Required<LoopAnimationParams>;
  const activeClipIndices =
    requiredParams.activeClipIndices.length > 0 ? requiredParams.activeClipIndices : [requiredParams.activeClipIndex];
  addComponent(world, LoopAnimationInitialize, eid);
  LoopAnimationInitializeData.set(eid, {
    activeClipIndices,
    clip: APP.getSid(requiredParams.clip),
    paused: requiredParams.paused,
    startOffset: requiredParams.startOffset,
    timeScale: requiredParams.timeScale
  });
  return eid;
}
