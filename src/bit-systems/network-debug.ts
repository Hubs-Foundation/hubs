import { addComponent, defineQuery, enterQuery, exitQuery, removeEntity } from "bitecs";
import { Material, Scene, Vector3 } from "three";
import { Text as TroikaText } from "troika-three-text";
import { HubsWorld } from "../app";
import { NetworkDebugRef, Networked } from "../bit-components";
import { NetworkDebugPrefab } from "../prefabs/network-debug";
import { formatComponentProps, formatObjectName } from "../react-components/debug-panel/ECSSidebar";
import { renderAsEntity } from "../utils/jsx-entity";
import { forEachMaterial } from "../utils/material-utils";

const networkedQuery = defineQuery([Networked]);
const enteredNetworkedQuery = enterQuery(networkedQuery);
const exitedNetworkedQuery = exitQuery(networkedQuery);
const _scale = new Vector3();
export function networkDebugSystem(world: HubsWorld, scene: Scene) {
  enteredNetworkedQuery(world).forEach(eid => {
    addComponent(world, NetworkDebugRef, eid);
    NetworkDebugRef.ref[eid] = renderAsEntity(world, NetworkDebugPrefab());
    const textObj = world.eid2obj.get(NetworkDebugRef.ref[eid])! as TroikaText;
    scene.add(textObj);
    textObj.renderOrder = 999;
    forEachMaterial(textObj, function (mat: Material) {
      mat.depthTest = false;
    });
  });

  exitedNetworkedQuery(world).forEach(eid => {
    removeEntity(world, NetworkDebugRef.ref[eid]);
  });

  networkedQuery(world).forEach(eid => {
    const networkedObj = world.eid2obj.get(eid)!;
    const textObj = world.eid2obj.get(NetworkDebugRef.ref[eid])! as TroikaText;

    networkedObj.updateMatrices();
    networkedObj.matrixWorld.decompose(textObj.position, textObj.quaternion, _scale);
    textObj.matrixNeedsUpdate = true;

    textObj.text = formatObjectName(networkedObj) + "\nNetworked " + formatComponentProps(eid, Networked);
  });
}
