/** @jsx createElementEntity */
import { Side } from "three";
import { Attrs, createElementEntity } from "../utils/jsx-entity";

export interface PlaneParams extends Attrs {
  width?: number;
  height?: number;
  material?: MeshBasicMaterialParams;
  renderOrder?: number;
}

export interface MeshBasicMaterialParams extends Attrs {
  color?: string;
  opacity?: number;
  transparent?: boolean;
  side?: Side;
  // TODO Add the rest of the material properties
}

export function Plane({ width, height, material, name = "Plane", renderOrder, ...props }: PlaneParams) {
  return <entity name={name} cursorRaycastable plane={{ width, height, material, renderOrder }} {...props} />;
}
