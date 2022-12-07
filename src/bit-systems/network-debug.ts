import { defineQuery, enterQuery, exitQuery, removeEntity } from "bitecs";
import { Material, Scene, Vector3 } from "three";
import { Text as TroikaText } from "troika-three-text";
import { HubsWorld } from "../app";
import { Networked } from "../bit-components";
import { NetworkDebugPrefab } from "../prefabs/network-debug";
import { formatComponentProps, formatObjectName } from "../react-components/debug-panel/ECSSidebar";
import { renderAsEntity } from "../utils/jsx-entity";
import { forEachMaterial } from "../utils/material-utils";
import { EntityID } from "../utils/networking-types";

const texts = new Map<EntityID, TroikaText>();
const networkedQuery = defineQuery([Networked]);
const enteredNetworkedQuery = enterQuery(networkedQuery);
const exitedNetworkedQuery = exitQuery(networkedQuery);
const _scale = new Vector3();
export function networkDebugSystem(world: HubsWorld, scene: Scene) {
  enteredNetworkedQuery(world).forEach(eid => {
    const textObj = world.eid2obj.get(renderAsEntity(world, NetworkDebugPrefab()))! as TroikaText;
    texts.set(eid, textObj);
    scene.add(textObj);
    textObj.renderOrder = 999;
    forEachMaterial(textObj, function (mat: Material) {
      mat.depthTest = false;
    });
  });

  exitedNetworkedQuery(world).forEach(eid => {
    removeEntity(world, texts.get(eid)!.eid!);
    texts.delete(eid);
  });

  networkedQuery(world).forEach(eid => {
    const networkedObj = world.eid2obj.get(eid)!;
    const textObj = texts.get(eid)!;

    networkedObj.updateMatrices();
    networkedObj.matrixWorld.decompose(textObj.position, textObj.quaternion, _scale);
    textObj.matrixNeedsUpdate = true;

    textObj.text = formatObjectName(networkedObj) + "\nNetworked " + formatComponentProps(eid, Networked);
    textObj.sync();
  });
}
