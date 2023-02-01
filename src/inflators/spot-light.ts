import { addComponent } from "bitecs";
import { addObject3DComponent } from "../utils/jsx-entity";
import { SpotLightTag, LightTag } from "../bit-components";
import { SpotLight } from "three";
import { HubsWorld } from "../app";

export type SpotLightParams = {
  color: string;
  intensity: number;
  range: number;
  decay: number;
  innerConeAngle: number;
  outerConeAngle: number;
  castShadow: boolean;
  shadowMapResolution: [number, number];
  shadowBias: number;
  shadowRadius: number;
};

const DEFAULTS = {
  intensity: 1.0,
  range: 0,
  decay: 2.0,
  innerConeAngle: 0,
  outerConeAngle: Math.PI / 4.0,
  castShadow: true,
  shadowMapResolution: [512, 512],
  shadowBias: 0,
  shadowRadius: 1.0
};

export function inflateSpotLight(world: HubsWorld, eid: number, params: SpotLightParams) {
  params = Object.assign({}, DEFAULTS, params);
  const light = new SpotLight();
  light.position.set(0, 0, 0);
  light.target.position.set(0, 0, 1);
  light.add(light.target);
  light.color.set(params.color).convertSRGBToLinear();
  light.intensity = params.intensity;
  light.distance = params.range;
  light.decay = params.decay;
  light.angle = params.outerConeAngle;
  light.penumbra = 1.0 - params.innerConeAngle / params.outerConeAngle;
  light.castShadow = params.castShadow;
  light.shadow.mapSize.set(params.shadowMapResolution[0], params.shadowMapResolution[1]);
  light.shadow.bias = params.shadowBias;
  light.shadow.radius = params.shadowRadius;

  addObject3DComponent(world, eid, light);
  addComponent(world, LightTag, eid);
  addComponent(world, SpotLightTag, eid);
  return eid;
}
