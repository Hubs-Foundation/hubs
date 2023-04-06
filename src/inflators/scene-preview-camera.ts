import { addComponent } from "bitecs";
import { ScenePreviewCamera } from "../bit-components";
import { HubsWorld } from "../app";

export const SCENE_PREVIEW_CAMERA_FLAGS = {
  POSITION_ONLY: 1 << 0
};

export type ScenePreviewCameraParams = {
  duration: number;
  positionOnly: boolean;
};

const DEFAULTS = {
  duration: 90,
  positionOnly: false
};

export function inflateScenePreviewCamera(world: HubsWorld, eid: number, params: ScenePreviewCameraParams): number {
  params = Object.assign({}, DEFAULTS, params);

  addComponent(world, ScenePreviewCamera, eid);
  ScenePreviewCamera.duration[eid] = params.duration;
  params.positionOnly && (ScenePreviewCamera.flags[eid] |= SCENE_PREVIEW_CAMERA_FLAGS.POSITION_ONLY);

  return eid;
}
