import { defineQuery, enterQuery, exitQuery } from "bitecs";
import { Agent, Interacted } from "../bit-components";
import { lowerIndex, raiseIndex } from "./agent-panel-system";
import { hasComponent } from "bitecs";

const agentQuery = defineQuery([Agent]);
const enterAgentQuery = enterQuery(agentQuery);
const exitAgentQuery = exitQuery(agentQuery);

function clicked(eid) {
  return hasComponent(APP.world, Interacted, eid);
}

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

    const dist = agentObj.position.distanceTo(avatarPovObj.getWorldPosition(new THREE.Vector3()));

    if (dist > 5) {
      APP.scene.emit("agent-toggle");
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
  });
}
