import { MediaLoaderParams } from "../inflators/media-loader";
import { CameraPrefab, CubeMediaFramePrefab } from "../prefabs/camera-tool";
import { MediaPrefab } from "../prefabs/media";
import { EntityDef } from "../utils/jsx-entity";

export type CubeInitialData = undefined;
export type CameraInitialData = undefined;
export type InitialData = CameraInitialData | CubeInitialData | MediaLoaderParams;
export type PermissionName = "spawn_camera";
export type PrefabName = "camera" | "cube" | "media";
export type PrefabDefinition = {
  permission?: PermissionName;
  template: (params: InitialData) => EntityDef;
};
export const prefabs: Map<PrefabName, PrefabDefinition> = new Map([
  ["camera", { permission: "spawn_camera", template: CameraPrefab }],
  ["cube", { template: CubeMediaFramePrefab }],
  ["media", { template: MediaPrefab }]
]);
