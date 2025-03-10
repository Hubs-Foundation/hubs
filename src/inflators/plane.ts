import { addObject3DComponent } from "../utils/jsx-entity";
import { HubsWorld } from "../app";
import { EntityID } from "../utils/networking-types";
import { FrontSide, Mesh, MeshBasicMaterial, PlaneGeometry, Side } from "three";

const MATERIAL_DEFAULTS = {
  color: "#000000",
  opacity: 1,
  transparent: false,
  side: FrontSide
};

const PLANE_DEFAULTS = {
  width: 1,
  height: 1,
  material: MATERIAL_DEFAULTS,
  renderOrder: 0
};

export interface MeshBasicMaterialParams {
  color?: string;
  opacity?: number;
  transparent?: boolean;
  side?: Side;
}

export interface PlaneParams {
  width?: number;
  height?: number;
  material?: MeshBasicMaterialParams;
  renderOrder?: number;
}

export function inflatePlane(world: HubsWorld, eid: EntityID, params: PlaneParams) {
  const planeParams = Object.assign({}, PLANE_DEFAULTS, params);
  params.material = Object.assign({}, MATERIAL_DEFAULTS, params.material);
  const geometry = new PlaneGeometry(planeParams.width, planeParams.height);
  const material = new MeshBasicMaterial({ ...params.material });
  const obj = new Mesh(geometry, material);
  obj.renderOrder = planeParams.renderOrder;
  addObject3DComponent(world, eid, obj);
}
