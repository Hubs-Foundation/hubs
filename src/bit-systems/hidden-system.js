import { defineQuery, enterQuery, exitQuery } from "bitecs";
import { Hidden } from "../bit-components";
import { FromatNewText, UpdateTextSystem } from "./agent-slideshow-system";
import { greetingPhrases } from "./text-paradigms";
import { getRandomInt } from "./agent-system";

const hiddenQuery = defineQuery([Hidden]);
const enterhiddenQuery = enterQuery(hiddenQuery);
const exithiddenQuery = exitQuery(hiddenQuery);

export function HiddenSystem(world) {
  enterhiddenQuery(world).forEach(eid => {
    const agentObj = world.eid2obj.get(eid);
    agentObj.visible = false;
  });

  exithiddenQuery(world).forEach(eid => {
    const avatarPov = document.querySelector("#avatar-pov-node").object3D;
    const POVForward = avatarPov.getWorldDirection(new THREE.Vector3());
    const POVPos = avatarPov.getWorldPosition(new THREE.Vector3());
    const forward = new THREE.Vector3(-POVForward.x, 0, -POVForward.z).normalize();

    const agentObj = world.eid2obj.get(eid);
    agentObj.position.copy(POVPos.add(forward));
    agentObj.updateMatrix();
    // UpdateTextSystem(world, FromatNewText(greetingPhrases[getRandomInt(greetingPhrases.length)]));
    //UpdateTextSystem(world, greetingPhrases[getRandomInt(greetingPhrases.length)]);
    agentObj.visible = true;

    // const agentObj = world.eid2obj.get(eid);
    // agentObj.visible = true;
  });
}
