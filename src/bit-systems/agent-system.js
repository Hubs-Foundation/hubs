import { defineQuery, enterQuery, exitQuery } from "bitecs";
import { Agent, Interacted } from "../bit-components";
import { FromatNewText, UpdateTextSystem, lowerIndex, raiseIndex } from "./agent-slideshow-system";
import { hasComponent } from "bitecs";
import { paradigms } from "./text-paradigms";

const agentQuery = defineQuery([Agent]);
const enterAgentQuery = enterQuery(agentQuery);
const exitAgentQuery = exitQuery(agentQuery);

function clicked(eid) {
  return hasComponent(APP.world, Interacted, eid);
}

export function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function hideArrows(world, prevArrowEid, nextArrowEid) {
  world.eid2obj.get(prevArrowEid).visible = false;
  world.eid2obj.get(nextArrowEid).visible = false;
}

function showArrows(world, prevArrowEid, nextArrowEid) {
  world.eid2obj.get(prevArrowEid).visible = true;
  world.eid2obj.get(nextArrowEid).visible = true;
}
let init = true;
export function AgentSystem(world) {
  enterAgentQuery(world).forEach(eid => {
    const sliceref = Agent.panelRef[eid];
    const panelObj = world.eid2obj.get(sliceref);
    const axesHelper = new THREE.AxesHelper(5);
    panelObj.add(axesHelper);
  });

  agentQuery(world).forEach(eid => {
    const modelref = Agent.modelRef[eid];
    const agentObj = world.eid2obj.get(eid);
    const modelObj = world.eid2obj.get(modelref);
    var avatarPovObj = document.querySelector("#avatar-pov-node").object3D;

    const agentPos = agentObj.getWorldPosition(new THREE.Vector3());
    const avatarPos = avatarPovObj.getWorldPosition(new THREE.Vector3());

    const dist = agentPos.distanceTo(avatarPos);

    if (init || dist > 2) {
      const dir = new THREE.Vector3().subVectors(avatarPos, agentPos).normalize();
      const newPos = new THREE.Vector3().copy(avatarPos.sub(dir.multiplyScalar(2)));
      agentObj.position.copy(newPos);
      init = false;
    }

    if (dist < 0.3) agentObj.visible = false;
    else agentObj.visible = true;
    modelObj.rotateOnAxis(new THREE.Vector3(0, 1, 0), -1.5707963268);

    if (clicked(Agent.nextRef[eid])) {
      raiseIndex();
    }

    if (clicked(Agent.prevRef[eid])) {
      lowerIndex();
    }
    if (clicked(Agent.micRef[eid])) {
      let newText = paradigms[getRandomInt(paradigms.length)];

      const renderArrows = UpdateTextSystem(world, FromatNewText(newText));

      if (renderArrows) {
        hideArrows(world, Agent.prevRef[eid], Agent.nextRef[eid]);
      } else showArrows(world, Agent.prevRef[eid], Agent.nextRef[eid]);
    }
  });
}
