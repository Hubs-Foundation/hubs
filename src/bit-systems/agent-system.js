import { defineQuery, entityExists, exitQuery, hasComponent } from "bitecs";
import { Agent } from "../bit-components";

let flag = true;
export function AgentSystem(world){

    const agentQuery = defineQuery([Agent]);

    agentQuery(world).forEach(eid =>{

        const sliceref = Agent.panelRef[eid];
        const modelref = Agent.modelRef[eid];

        const agentObj = world.eid2obj.get(eid);
        const modelObj = world.eid2obj.get(modelref);
        const panelObj = world.eid2obj.get(sliceref);

        if (flag){
            const axesHelper = new THREE.AxesHelper(5);
            const axesHelper1 = new THREE.AxesHelper(5);
            panelObj.add(axesHelper);
            modelObj.add(axesHelper1);
            flag = false;
        }

        var avatarPovObj = document.querySelector("#avatar-pov-node").object3D;
        const dist = agentObj.position.distanceTo(avatarPovObj.getWorldPosition(new THREE.Vector3()));
              

        if (dist > 5){
            APP.scene.emit("agent-toggle");
        }

        if (dist < 0.3) agentObj.visible = false;
        else agentObj.visible = true;
        modelObj.rotateOnAxis(new THREE.Vector3(0,1,0),-1.5707963268 );
    })
  }