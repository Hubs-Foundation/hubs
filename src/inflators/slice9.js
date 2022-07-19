import { addComponent } from "bitecs";
import { addObject3DComponent } from "../utils/jsx-entity";
import { Slice9 } from "../bit-components";
import { updateSlice9Geometry } from "../update-slice9-geometry";

export function inflateSlice9(world, eid, { size, insets, texture }) {
  const geometry = new THREE.PlaneBufferGeometry(1, 1, 3, 3);
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, toneMapped: false });
  const obj = new THREE.Mesh(geometry, material);
  addObject3DComponent(world, eid, obj);

  addComponent(world, Slice9, eid);
  Slice9.insets[eid].set(insets);
  Slice9.size[eid].set(size);
  updateSlice9Geometry(world, eid);
}
