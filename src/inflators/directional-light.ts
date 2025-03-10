import { addComponent } from "bitecs";
import { addObject3DComponent } from "../utils/jsx-entity";
import { DirectionalLight, LightTag } from "../bit-components";
import { DirectionalLight as DL } from "three";
import { HubsWorld } from "../app";

export type DirectionalLightParams = {
  color: string;
  intensity: number;
  castShadow: boolean;
  shadowMapResolution: [number, number];
  shadowBias: number;
  shadowRadius: number;
};

export function inflateDirectionalLight(world: HubsWorld, eid: number, params: DirectionalLightParams) {
  const light = new DL();
  light.position.set(0, 0, 0);
  light.target.position.set(0, 0, 1);
  light.add(light.target);
  light.color.set(params.color).convertSRGBToLinear();
  light.intensity = params.intensity;
  light.castShadow = params.castShadow;
  light.shadow.bias = params.shadowBias;
  light.shadow.radius = params.shadowRadius;
  light.shadow.mapSize.set(params.shadowMapResolution[0], params.shadowMapResolution[1]);

  addObject3DComponent(world, eid, light);
  addComponent(world, LightTag, eid);
  addComponent(world, DirectionalLight, eid);
  return eid;
}
