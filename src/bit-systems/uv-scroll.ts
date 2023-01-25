import { addComponent, defineQuery, hasComponent, removeComponent } from "bitecs";
import { Material, Mesh, MeshBasicMaterial } from "three";
import { HubsWorld } from "../app";
import { MaterialTag, Object3DTag, UVScroll } from "../bit-components";
import { mapMaterials } from "../utils/material-utils";

// We wanted uv-scroll to be a component on materials not objects. The original uv-scroll component predated
// the concept of "material components". Also in AFRAME, material components ended up being on objects anyway
// so it didn't make a practical difference. This corrects the behaviour to act how we want.
const uvScrollObjectsQuery = defineQuery([UVScroll, Object3DTag]);
function migrateLegacyComponents(world: HubsWorld) {
  uvScrollObjectsQuery(world).forEach(function (eid) {
    const obj = world.eid2obj.get(eid)!;
    const mat = (obj as Mesh).material;
    // TODO We will warn once we modify the Blender addon to put these components on materials instead
    // console.warn(
    //   "The uv-scroll component should be added directly to materials not objects, transferring to object's material"
    // );
    if (!mat) {
      console.error("uv-scroll component added to an object without a Material");
    } else {
      mapMaterials(obj, function (mat: Material) {
        if (hasComponent(world, UVScroll, mat.eid!)) {
          console.warn(
            "Multiple uv-scroll instances added to objects sharing a material, only the speed/increment from the first one will have any effect"
          );
        } else {
          addComponent(world, UVScroll, mat.eid!);
          UVScroll.speed[mat.eid!].set(UVScroll.speed[eid]);
          UVScroll.increment[mat.eid!].set(UVScroll.increment[eid]);
        }
      });
    }
    removeComponent(world, UVScroll, eid);
  });
}

const uvScrollQuery = defineQuery([UVScroll, MaterialTag]);
export function uvScrollSystem(world: HubsWorld) {
  migrateLegacyComponents(world);
  uvScrollQuery(world).forEach(function (eid) {
    const map = (world.eid2mat.get(eid)! as MeshBasicMaterial).map;
    if (!map) return; // This would not exactly be expected to happen but is not a "bug" either. There is just no work to do in this case.

    const offset = UVScroll.offset[eid];
    const speed = UVScroll.speed[eid];
    const scale = world.time.delta / 1000;
    offset[0] = (offset[0] + speed[0] * scale) % 1.0;
    offset[1] = (offset[1] + speed[1] * scale) % 1.0;

    const increment = UVScroll.increment[eid];
    map.offset.x = increment[0] ? offset[0] - (offset[0] % increment[0]) : offset[0];
    map.offset.y = increment[1] ? offset[1] - (offset[1] % increment[1]) : offset[1];
  });
}
