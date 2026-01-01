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
  const planeProps: any = {};
  if (width !== undefined) planeProps.width = width;
  if (height !== undefined) planeProps.height = height;
  if (material !== undefined) planeProps.material = material;
  if (renderOrder !== undefined) planeProps.renderOrder = renderOrder;
  return <entity name={name} cursorRaycastable plane={planeProps} {...props} />;
}
