import { addComponent } from "bitecs";
import { addObject3DComponent } from "../utils/jsx-entity";
import { SpotLightTag, LightTag } from "../bit-components";
import { SpotLight } from "three";
import { HubsWorld } from "../app";

export type SpotLightParams = {
  color?: string;
  intensity?: number;
  range?: number;
  decay?: number;
  innerConeAngle?: number;
  outerConeAngle?: number;
  castShadow?: boolean;
  shadowMapResolution?: [width: number, height: number];
  shadowBias?: number;
  shadowRadius?: number;
};

const DEFAULTS: Required<SpotLightParams> = {
  color: "#ffffff",
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
  const requiredParams = Object.assign({}, DEFAULTS, params) as Required<SpotLightParams>;
  const light = new SpotLight();
  light.position.set(0, 0, 0);
  light.target.position.set(0, 0, 1);
  light.add(light.target);
  light.color.set(requiredParams.color).convertSRGBToLinear();
  light.intensity = requiredParams.intensity;
  light.distance = requiredParams.range;
  light.decay = requiredParams.decay;
  light.angle = requiredParams.outerConeAngle;
  light.penumbra = 1.0 - requiredParams.innerConeAngle / requiredParams.outerConeAngle;
  light.castShadow = requiredParams.castShadow;
  light.shadow.mapSize.set(requiredParams.shadowMapResolution[0], requiredParams.shadowMapResolution[1]);
  light.shadow.bias = requiredParams.shadowBias;
  light.shadow.radius = requiredParams.shadowRadius;

  addObject3DComponent(world, eid, light);
  addComponent(world, LightTag, eid);
  addComponent(world, SpotLightTag, eid);
  return eid;
}
