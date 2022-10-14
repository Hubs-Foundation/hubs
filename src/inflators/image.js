import { create360ImageMesh, createImageMesh } from "../utils/create-image-mesh";
import { addObject3DComponent, ProjectionMode } from "../utils/jsx-entity";

export function inflateImage(world, eid, { texture, ratio, projection, alphaMode }) {
  const mesh =
    projection === ProjectionMode.SPHERE_EQUIRECTANGULAR
      ? create360ImageMesh(texture, ratio, alphaMode)
      : createImageMesh(texture, ratio, alphaMode);
  addObject3DComponent(world, eid, mesh);
  return eid;
}
