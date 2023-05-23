import { defineQuery, entityExists, exitQuery, hasComponent } from "bitecs";
import { Agent } from "../bit-components";
import { AGENT_FLAGS } from "../inflators/agent";

export function AgentSystem(world){

    const agentQuery = defineQuery([Agent]);

    agentQuery(world).forEach(eid =>{

        const agentObj = world.eid2obj.get(eid);
        var avatarPovObj = document.querySelector("#avatar-pov-node").object3D;
        var POVForward = avatarPovObj.getWorldDirection(new THREE.Vector3());
        const forward = new THREE.Vector3(-POVForward.x, 0, -POVForward.z).normalize();
        const dist = agentObj.position.distanceTo(avatarPovObj.getWorldPosition(new THREE.Vector3()));
        const wasFollowing = AGENT_FLAGS.FOLLOW & Agent.flags[eid];
        let follow = null;

        if (dist > 5){
            APP.scene.emit("agent-toggle");
        }

        // if (wasFollowing){
        //     if (dist > 1) agentObj.position.copy(avatarPovObj.getWorldPosition(new THREE.Vector3()).add(forward.multiplyScalar(dist)));
        //     else follow = false;
                
            
        // }
        // else{

        //     if (dist > 2.5){
        //         agentObj.position.copy(avatarPovObj.getWorldPosition(new THREE.Vector3()).add(forward.multiplyScalar(dist)));
        //         follow = true;
        //     }
        // }
        
        // if(follow!==null){

        //     follow |= AGENT_FLAGS.FOLLOW;
        //     Agent.flags[eid] = follow;
        // }
        

        
        agentObj.lookAt(avatarPovObj.getWorldPosition(new THREE.Vector3()));
        agentObj.rotateOnAxis(new THREE.Vector3(0,1,0),-1.5707963268 );
    })
  }