import { addComponent } from "bitecs";
import { Image } from "../bit-components";
import { create360ImageMesh, createImageMesh } from "../utils/create-image-mesh";
import { addObject3DComponent, ProjectionMode } from "../utils/jsx-entity";

export function inflateImage(world, eid, { texture, ratio, projection, alphaMode, cacheKey }) {
  const mesh =
    projection === ProjectionMode.SPHERE_EQUIRECTANGULAR
      ? create360ImageMesh(texture, ratio, alphaMode)
      : createImageMesh(texture, ratio, alphaMode);
  addObject3DComponent(world, eid, mesh);
  addComponent(world, Image, eid);
  Image.cacheKey[eid] = APP.getSid(cacheKey);
  return eid;
}
