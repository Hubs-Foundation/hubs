import { addComponent } from "bitecs";
import { addObject3DComponent } from "../utils/jsx-entity";
import { AmbientLightTag, LightTag } from "../bit-components";
import { AmbientLight } from "three";
import { HubsWorld } from "../app";

export type AmbientLightParams = {
  color: string;
  intensity: number;
};

const DEFAULTS = {
  intensity: 1.0
};

export function inflateAmbientLight(world: HubsWorld, eid: number, params: AmbientLightParams) {
  params = Object.assign({}, DEFAULTS, params);
  const light = new AmbientLight();
  light.color.set(params.color).convertSRGBToLinear();
  light.intensity = params.intensity;

  addObject3DComponent(world, eid, light);
  addComponent(world, LightTag, eid);
  addComponent(world, AmbientLightTag, eid);
  return eid;
}
