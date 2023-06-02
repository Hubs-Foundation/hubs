import { addComponent } from "bitecs";
import { Color, Texture } from "three";
import { HubsWorld } from "../app";
import { EnvironmentSettings } from "../bit-components";
import Sky from "../components/skybox";

export interface EnvironmentSettingsParams {
  toneMapping?: string; // TODO use enum
  outputEncoding?: string; // TODO use enum
  toneMappingExposure?: number;
  physicallyCorrectLights?: boolean;
  envMapTexture?: Texture;

  skybox?: Sky;
  backgroundTexture?: Texture;
  backgroundColor?: Color;

  fogType?: "linear" | "exponential";
  fogColor?: Color;
  fogDensity?: number;
  fogFar?: number;
  fogNear?: number;

  enableHDRPipeline?: boolean;
  enableBloom?: boolean;
  bloom?: {
    threshold?: number;
    intensity?: number;
    radius?: number;
    smoothing?: number;
  };
}

export function inflateEnvironmentSettings(world: HubsWorld, eid: number, props: EnvironmentSettingsParams) {
  addComponent(world, EnvironmentSettings, eid);
  const map = (EnvironmentSettings as any).map as Map<number, EnvironmentSettingsParams>;
  if (props.backgroundColor) {
    props.backgroundColor = new Color(props.backgroundColor);
  }
  const settings = Object.assign(map.get(eid) || {}, props);
  map.set(eid, settings);
}

export interface FogParams {
  type?: "linear" | "exponential";
  color?: string;
  near?: number;
  far?: number;
  density?: number;
}

/**
 * @deprecated use inflateEnvironmentSettings instead
 */
export function inflateFog(world: HubsWorld, eid: number, props: FogParams) {
  console.warn(
    "The `fog` component is deprecated. Use the `fogX` properties on the `environment-settings` component instead."
  );
  inflateEnvironmentSettings(world, eid, {
    fogType: props.type,
    fogColor: new Color(props.color),
    fogNear: props.near,
    fogFar: props.far,
    fogDensity: props.density
  });
}

export interface BackgroundParams {
  backgroundColor: string;
}

/**
 * @deprecated use inflateEnvironmentSettings instead
 */
export function inflateBackground(world: HubsWorld, eid: number, props: BackgroundParams) {
  console.warn(
    "The `background` component is deprecated. Use the `backgroundColor` on the `environment-settings` component instead."
  );
  inflateEnvironmentSettings(world, eid, {
    backgroundColor: new Color(props.backgroundColor)
  });
}
