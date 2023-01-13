import { addComponent } from "bitecs";
import { HubsWorld } from "../app";
import { Skybox } from "../bit-components";
import Sky from "../components/skybox";
import { addObject3DComponent } from "../utils/jsx-entity";

export interface SkyboxParams {
  turbidity: number;
  rayleigh: number;
  luminance: number;
  mieCoefficient: number;
  mieDirectionalG: number;
  inclination: number;
  azimuth: number;
  distance: number;
}

const DEFAULTS = {
  turbidity: 10,
  rayleigh: 2,
  luminance: 1,
  mieCoefficient: 0.005,
  mieDirectionalG: 0.8,
  inclination: 0,
  azimuth: 0.15,
  distance: 8000
} as const;

/**
 * @deprecated use `inflateEnvironmentSettings` with an `envMapTexture` and `backgroundTexture` instead
 */
export function inflateSkybox(world: HubsWorld, eid: number, props: SkyboxParams) {
  console.warn(
    "The `skybox` component is deprecated. Use the `envMapTexture` and `backgroundTexture` on `environment-settings` instead."
  );
  const sky = new Sky();
  Object.assign(sky, DEFAULTS, props);
  addObject3DComponent(world, eid, sky);
  addComponent(world, Skybox, eid);
}
