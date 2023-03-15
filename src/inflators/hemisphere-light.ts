import { addComponent } from "bitecs";
import { addObject3DComponent } from "../utils/jsx-entity";
import { HemisphereLightTag, LightTag } from "../bit-components";
import { HemisphereLight } from "three";
import { HubsWorld } from "../app";

export type HemisphereLightParams = {
  skyColor?: string;
  groundColor?: string;
  intensity?: number;
};

const DEFAULTS: Required<HemisphereLightParams> = {
  skyColor: "#ffffff",
  groundColor: "#ffffff",
  intensity: 1.0
};

export function inflateHemisphereLight(world: HubsWorld, eid: number, params: HemisphereLightParams) {
  const requiredParams = Object.assign({}, DEFAULTS, params) as Required<HemisphereLightParams>;
  const light = new HemisphereLight();
  light.position.set(0, 0, 0);
  light.color.set(requiredParams.skyColor).convertSRGBToLinear();
  light.groundColor.set(requiredParams.groundColor).convertSRGBToLinear();
  light.intensity = requiredParams.intensity;

  addObject3DComponent(world, eid, light);
  addComponent(world, LightTag, eid);
  addComponent(world, HemisphereLight, eid);
  return eid;
}
