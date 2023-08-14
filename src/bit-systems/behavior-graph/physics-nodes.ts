import { makeFlowNodeDefinition } from "@oveddan-behave-graph/core";
import { definitionListToMap } from "./utils";
import { EntityID, Owned, Rigidbody } from "../../bit-components";
import { HubsWorld } from "../../app";
import { findChildWithComponent } from "../../utils/bit-utils";
import { hasComponent } from "bitecs";
import { ArrayVec3 } from "../../utils/jsx-entity";
import { CONSTANTS } from "three-ammo";

export const PhysicsNodes = definitionListToMap([
  makeFlowNodeDefinition({
    typeName: "physics/setRigidBodyProperties",
    category: "Physics" as any,
    label: "Set Rigid Body Property",
    in: () => [
      { key: "entity", valueType: "entity" },
      { key: "setType", valueType: "flow" },
      { key: "type", valueType: "string", defaultValue: CONSTANTS.TYPE.KINEMATIC },
      { key: "setMass", valueType: "flow" },
      { key: "mass", valueType: "float", defaultValue: 1.0 },
      { key: "setGravity", valueType: "flow" },
      { key: "gravity", valueType: "vec3", defaultValue: { x: 0, y: -9.8, z: 0 } }
    ],
    initialState: undefined,
    out: { flow: "flow" },
    triggered: ({ read, commit, triggeringSocketName, graph }) => {
      const entity = read("entity") as EntityID;
      const world = graph.getDependency("world") as HubsWorld;

      const cmp = findChildWithComponent(world, Rigidbody, entity);
      if (cmp && hasComponent(world, Owned, cmp)) {
        if (triggeringSocketName === "setType") {
          const type = read("type") as string;
          const physicsSystem = APP.scene?.systems["hubs-systems"].physicsSystem;
          physicsSystem.updateRigidBody(cmp, {
            type
          });
          const bodyId = Rigidbody.bodyId[cmp];
          physicsSystem.activateBody(bodyId);
        } else if (triggeringSocketName === "setMass") {
          const physicsSystem = APP.scene?.systems["hubs-systems"].physicsSystem;
          physicsSystem.updateRigidBody(cmp, {
            mass: read("mass") as number
          });
        } else if (triggeringSocketName === "setGravity") {
          const gravity = read("gravity") as ArrayVec3;
          const physicsSystem = APP.scene?.systems["hubs-systems"].physicsSystem;
          physicsSystem.updateRigidBody(cmp, {
            gravity: { x: gravity[0], y: gravity[1], z: gravity[2] }
          });
        }
      }
      commit("flow");
    }
  })
]);
