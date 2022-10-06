import { create360ImageMesh, createImageMesh } from "../utils/create-image-mesh";
import { addObject3DComponent } from "../utils/jsx-entity";

export function inflateImage(world, eid, { texture, ratio, projection, alphaMode }) {
  const mesh =
    projection === "360-equirectangular"
      ? create360ImageMesh(texture, ratio, alphaMode)
      : createImageMesh(texture, ratio, alphaMode);
  addObject3DComponent(world, eid, mesh);
  return eid;
}
