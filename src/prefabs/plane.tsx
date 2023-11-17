/** @jsx createElementEntity */
import { Attrs, createElementEntity } from "../utils/jsx-entity";

export interface PlaneParams extends Attrs {
  width?: number;
  height?: number;
  material?: MeshBasicMaterialParams;
}

export interface MeshBasicMaterialParams extends Attrs {
  color?: string;
  opacity?: number;
  transparent?: boolean;
  // TODO Add the rest of the material properties
}

export function Plane({ width, height, material, name = "Plane", ...props }: PlaneParams) {
  return <entity name={name} cursorRaycastable plane={{ width, height, material }} {...props} />;
}
