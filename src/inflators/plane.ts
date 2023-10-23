import { addObject3DComponent } from "../utils/jsx-entity";
import { HubsWorld } from "../app";
import { EntityID } from "../utils/networking-types";
import { Mesh, MeshBasicMaterial, PlaneGeometry } from "three";

const MATERIAL_DEFAULTS = {
  color: "#000000",
  opacity: 1,
  transparent: false
};

const PLANE_DEFAULTS = {
  width: 1,
  height: 1,
  material: MATERIAL_DEFAULTS
};

export interface MeshBasicMaterialParams {
  color?: string;
  opacity?: number;
  transparent?: boolean;
}

export interface PlaneParams {
  width?: number;
  height?: number;
  material?: MeshBasicMaterialParams;
}

export function inflatePlane(world: HubsWorld, eid: EntityID, params: PlaneParams) {
  params = Object.assign({}, PLANE_DEFAULTS, params);
  params.material = Object.assign({}, MATERIAL_DEFAULTS, params.material);
  const geometry = new PlaneGeometry(params.width, params.height);
  const material = new MeshBasicMaterial({ ...params.material });
  const obj = new Mesh(geometry, material);
  addObject3DComponent(world, eid, obj);
}
