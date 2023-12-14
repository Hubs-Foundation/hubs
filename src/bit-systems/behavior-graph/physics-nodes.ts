import { makeFlowNodeDefinition } from "@oveddan-behave-graph/core";
import { definitionListToMap } from "./utils";
import { EntityID, Owned, Rigidbody } from "../../bit-components";
import { HubsWorld } from "../../app";
import { findChildWithComponent } from "../../utils/bit-utils";
import { hasComponent } from "bitecs";
import { Type, getBodyFromRigidBody } from "../../inflators/rigid-body";

export const PhysicsNodes = definitionListToMap([
  makeFlowNodeDefinition({
    typeName: "physics/setRigidBodyActive",
    category: "Physics" as any,
    label: "Activate Rigid Body",
    in: () => [
      { key: "entity", valueType: "entity" },
      { key: "setActive", valueType: "flow" }
    ],
    initialState: undefined,
    out: { flow: "flow" },
    configuration: {
      networked: { valueType: "boolean" }
    },
    triggered: ({ read, commit, triggeringSocketName, graph, configuration }) => {
      const entity = read("entity") as EntityID;
      const world = graph.getDependency("world") as HubsWorld;

      const cmp = findChildWithComponent(world, Rigidbody, entity);
      if (cmp && hasComponent(world, Owned, cmp)) {
        if (triggeringSocketName === "setActive") {
          if (Rigidbody.type[cmp] === Type.DYNAMIC) {
            const physicsSystem = APP.scene?.systems["hubs-systems"].physicsSystem;
            const bodyId = Rigidbody.bodyId[cmp];
            physicsSystem.activateBody(bodyId);
            // This shouldn't be necessary but for some reason it doesn't activate the body if we don't update the body
            physicsSystem.updateRigidBody(cmp, getBodyFromRigidBody(cmp));
          }
        }
      }
      commit("flow");
    }
  })
]);
