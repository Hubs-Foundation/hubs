import { addComponent } from "bitecs";
import { addObject3DComponent } from "../utils/jsx-entity";
import { SimpleWater } from "../bit-components";
import { HubsWorld } from "../app";
import { SimpleWaterMesh } from "../objects/SimpleWaterMesh";

export type SimpleWaterParams = {
  opacity: number;
  color: string;
  tideHeight: number;
  tideScale: {
    x: number;
    y: number;
  };
  tideSpeed: {
    x: number;
    y: number;
  };
  waveHeight: number;
  waveScale: {
    x: number;
    y: number;
  };
  waveSpeed: {
    x: number;
    y: number;
  };
  ripplesScale: number;
  ripplesSpeed: number;
};

const DEFAULTS = {
  opacity: 1,
  color: "#0054df",
  tideHeight: 0.01,
  tideScale: { x: 1, y: 1 },
  tideSpeed: { x: 0.5, y: 0.5 },
  waveHeight: 0.1,
  waveScale: { x: 1, y: 20 },
  waveSpeed: { x: 0.05, y: 6 },
  ripplesScale: 1,
  ripplesSpeed: 0.25
};

export function inflateSimpleWater(world: HubsWorld, eid: number, params: SimpleWaterParams) {
  params = Object.assign({}, DEFAULTS, params);
  const lowQuality = APP.store.state.preferences.materialQualitySetting !== "high";
  const simpleWater = new SimpleWaterMesh({ lowQuality });
  simpleWater.opacity = params.opacity;
  simpleWater.color.set(params.color);
  simpleWater.tideHeight = params.tideHeight;
  simpleWater.tideScale.set(params.tideScale.x, params.tideScale.y);
  simpleWater.tideSpeed.set(params.tideSpeed.x, params.tideSpeed.y);
  simpleWater.waveHeight = params.waveHeight;
  simpleWater.waveScale.set(params.waveScale.x, params.waveScale.y);
  simpleWater.waveSpeed.set(params.waveSpeed.x, params.waveSpeed.y);
  simpleWater.ripplesScale = params.ripplesScale;
  simpleWater.ripplesSpeed = params.ripplesSpeed;

  addObject3DComponent(world, eid, simpleWater);
  addComponent(world, SimpleWater, eid);
}
