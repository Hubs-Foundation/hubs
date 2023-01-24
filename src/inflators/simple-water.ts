import { addComponent } from "bitecs";
import { addObject3DComponent } from "../utils/jsx-entity";
import { SimpleWater } from "../bit-components";
import { HubsWorld } from "../app";
import { SimpleWaterMesh } from "../objects/SimpleWaterMesh";

export type SimpleWaterParams = {
  opacity: number;
  color: string;
  tideHeight: number;
  tideScale: [number, number];
  tideSpeed: [number, number];
  waveHeight: number;
  waveScale: [number, number];
  waveSpeed: [number, number];
  ripplesScale: number;
  ripplesSpeed: number;
};

const DEFAULTS = {
  opacity: 1,
  color: "#0054df",
  tideHeight: 0.01,
  tideScale: [1, 1],
  tideSpeed: [0.5, 0.5],
  waveHeight: 0.1,
  waveScale: [1, 20],
  waveSpeed: [0.05, 6],
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
  simpleWater.tideScale.fromArray(params.tideScale);
  simpleWater.tideSpeed.fromArray(params.tideSpeed);
  simpleWater.waveHeight = params.waveHeight;
  simpleWater.waveScale.fromArray(params.waveScale);
  simpleWater.waveSpeed.fromArray(params.waveSpeed);
  simpleWater.ripplesScale = params.ripplesScale;
  simpleWater.ripplesSpeed = params.ripplesSpeed;

  addObject3DComponent(world, eid, simpleWater);
  addComponent(world, SimpleWater, eid);
}
