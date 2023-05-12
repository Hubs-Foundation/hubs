import { addComponent } from "bitecs";
import { LoopAnimationInitialize, LoopAnimationInitializeData } from "../bit-components";
import { HubsWorld } from "../app";

type ElementParams = {
  activeClipIndex?: number;
  // TODO: Do we need to keep supporting the following two params?
  //       Perhaps we should detemine which one should be the
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

export type LoopAnimationParams = ElementParams[];

const ELEMENT_DEFAULTS: Required<ElementParams> = {
  activeClipIndex: 0,
  clip: "",
  activeClipIndices: [],
  paused: false,
  startOffset: 0,
  timeScale: 1.0
};

const DEFAULTS: Required<LoopAnimationParams> = [ELEMENT_DEFAULTS];

export function inflateLoopAnimationInitialize(
  world: HubsWorld,
  eid: number,
  params: LoopAnimationParams = []
): number {
  if (params.length === 0) {
    params = DEFAULTS;
  }

  const componentParams = [];
  for (let i = 0; i < params.length; i++) {
    const requiredParams = Object.assign({}, ELEMENT_DEFAULTS, params[i]) as Required<ElementParams>;
    const activeClipIndices =
      requiredParams.activeClipIndices.length > 0 ? requiredParams.activeClipIndices : [requiredParams.activeClipIndex];
    componentParams.push({
      activeClipIndices,
      clip: APP.getSid(requiredParams.clip),
      paused: requiredParams.paused,
      startOffset: requiredParams.startOffset,
      timeScale: requiredParams.timeScale
    });
  }

  addComponent(world, LoopAnimationInitialize, eid);
  LoopAnimationInitializeData.set(eid, componentParams);
  return eid;
}
